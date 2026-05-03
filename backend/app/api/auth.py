"""
Auth endpoint'leri:
POST /auth/login          - Instagram kullanıcı adı + şifre ile giriş
POST /auth/webview-login  - WebView üzerinden Instagram ile giriş (şifresiz)
POST /auth/verify-2fa    - İki faktörlü doğrulama
POST /auth/refresh       - Access token yenile
DELETE /auth/logout      - Oturumu kapat, token'ı iptal et
"""
import hashlib
import json
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

import structlog

from app.config import get_settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    encrypt_instagram_session,
    safe_user_id,
)
from app.core.instagram import login_with_password, verify_2fa, login_with_sessionid, fetch_analysis_data
from app.db.supabase import get_supabase
from app.models.schemas import (
    InstagramLoginRequest,
    TwoFactorRequest,
    RefreshTokenRequest,
    TokenResponse,
    WebViewLoginRequest,
    WebViewLoginResponse,
    SessionLoginRequest,
    AnalysisResponse,
    ProfileData,
    UnfollowerItem,
)

router = APIRouter(prefix="/auth", tags=["auth"])
log = structlog.get_logger()
settings = get_settings()
security = HTTPBearer()


def _hash_ip(ip: str) -> str:
    return hashlib.sha256(ip.encode()).hexdigest()[:12]


def _compute_ghost_score(followers: int, following: int, posts: int) -> int:
    if followers == 0:
        return 0
    ratio_score = min(40, int((followers / max(following, 1)) * 20))
    post_score  = min(30, int((posts / 50) * 30))
    return min(100, ratio_score + post_score)


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """JWT'den user_id çıkarır. Geçersizse 401."""
    user_id = decode_token(credentials.credentials, expected_type="access")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz veya süresi dolmuş token",
        )
    return user_id


# ── Background: analiz çalıştır, DB'ye kaydet ────────────────

async def _do_session_analysis(user_id: str, cl, analysis_count: int):
    """
    session_login'den sonra arka planda çalışır.
    fetch_analysis_data (~40-55s) burada bloke eder — HTTP yanıtı zaten gönderildi.
    """
    db = get_supabase()
    try:
        data = await fetch_analysis_data(cl)
    except Exception as e:
        log.error("session_bg_analysis_failed", user_hash=safe_user_id(user_id), err=str(e)[:80])
        return

    profile         = data["profile"]
    stalkers        = data["stalkers"]
    ghost_followers = data["ghost_followers"]
    unfollowers     = data["unfollowers"]

    now_iso = datetime.now(timezone.utc).isoformat()
    db.table("analyses").insert({
        "user_id":            user_id,
        "ghost_score":        profile["ghost_score"],
        "followers_count":    profile["followers"],
        "following_count":    profile["following"],
        "posts_count":        profile["posts"],
        "visibility_score":   profile["visibility_score"],
        "stalkers_count":     len(stalkers),
        "muted_count":        len(ghost_followers),
        "unfollowers_count":  len(unfollowers),
        "stalkers_encrypted":    encrypt_instagram_session(json.dumps(stalkers)),
        "muted_encrypted":       encrypt_instagram_session(json.dumps(ghost_followers)),
        "unfollowers_encrypted": encrypt_instagram_session(json.dumps(unfollowers)),
    }).execute()

    db.table("users").update({
        "last_analysis_at": now_iso,
        "analysis_count":   analysis_count + 1,
        "ig_profile_pic":   profile.get("profile_pic", ""),
        "ig_username":      profile.get("username", ""),
    }).eq("id", user_id).execute()

    log.info("session_bg_analysis_complete", user_hash=safe_user_id(user_id))


# ── POST /auth/session-login ─────────────────────────────────

@router.post("/session-login", response_model=TokenResponse, status_code=200)
async def session_login(request: Request, body: SessionLoginRequest, background_tasks: BackgroundTasks):
    """
    WebView'dan alınan sessionid cookie ile hızlı giriş.
    JWT hemen döner; ağır analiz arka planda çalışır.
    Frontend polling ile GET /analysis/latest'i izler.
    """
    client_ip = request.client.host if request.client else "unknown"
    log.info("session_login_attempt", ip_hash=_hash_ip(client_ip))

    try:
        cl = await login_with_sessionid(body.session_id, device_info=body.device_info)
    except (ValueError, RuntimeError) as e:
        raise HTTPException(status_code=401, detail=str(e))

    username          = (cl.username or "").strip()
    session_data      = cl.get_settings()
    encrypted_session = encrypt_instagram_session(json.dumps(session_data))

    db = get_supabase()
    existing = (
        db.table("users")
        .select("id, analysis_count")
        .eq("ig_username", username)
        .eq("is_deleted", False)
        .execute()
    )

    if existing.data:
        user_id        = existing.data[0]["id"]
        analysis_count = existing.data[0].get("analysis_count") or 0
        db.table("users").update({"ig_session_encrypted": encrypted_session}).eq("id", user_id).execute()
    else:
        new_user = (
            db.table("users")
            .insert({"ig_username": username, "ig_session_encrypted": encrypted_session})
            .execute()
        )
        user_id        = new_user.data[0]["id"]
        analysis_count = 0

    db.table("audit_log").insert({
        "user_id_hash": safe_user_id(user_id),
        "action": "session_login",
        "ip_hash": _hash_ip(client_ip),
    }).execute()

    background_tasks.add_task(_do_session_analysis, user_id, cl, analysis_count)

    log.info("session_login_fast_ok", user_hash=safe_user_id(user_id))

    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


# ── POST /auth/webview-login ──────────────────────────────────

@router.post("/webview-login", response_model=WebViewLoginResponse, response_model_by_alias=True, status_code=200)
async def webview_login(request: Request, body: WebViewLoginRequest):
    """
    WebView üzerinden Instagram ile giriş.
    Şifre hiç alınmaz — veri doğrudan Instagram web API'sinden gelir.
    """
    client_ip = request.client.host if request.client else "unknown"
    log.info("webview_login_attempt", ip_hash=_hash_ip(client_ip))

    username = body.profile.username.strip().lstrip("@").lower()
    db = get_supabase()

    existing = (
        db.table("users")
        .select("id")
        .eq("ig_username", username)
        .eq("is_deleted", False)
        .execute()
    )

    if existing.data:
        user_id = existing.data[0]["id"]
    else:
        new_user = (
            db.table("users")
            .insert({"ig_username": username})
            .execute()
        )
        user_id = new_user.data[0]["id"]

    follower_ids  = {u.id for u in body.followers}
    following_map = {u.id: u for u in body.following}
    unfollower_ids = set(following_map.keys()) - follower_ids

    unfollowers = [
        {
            "id": uid,
            "username": following_map[uid].username,
            "profile_pic": following_map[uid].profile_pic,
            "unfollowed_at": "Yakın zamanda",
            "was_followed_back": False,
        }
        for uid in list(unfollower_ids)[:20]
    ]

    followers_count = body.profile.followers
    following_count = body.profile.following
    posts_count     = body.profile.posts
    ghost_score     = _compute_ghost_score(followers_count, following_count, posts_count)
    visibility_score = min(100, ghost_score + 13)

    now_iso = datetime.now(timezone.utc).isoformat()
    analysis_row = (
        db.table("analyses")
        .insert({
            "user_id": user_id,
            "ghost_score": ghost_score,
            "followers_count": followers_count,
            "following_count": following_count,
            "posts_count": posts_count,
            "visibility_score": visibility_score,
            "stalkers_count": 0,
            "muted_count": 0,
            "unfollowers_count": len(unfollowers),
            "stalkers_encrypted":   encrypt_instagram_session(json.dumps([])),
            "muted_encrypted":      encrypt_instagram_session(json.dumps([])),
            "unfollowers_encrypted": encrypt_instagram_session(json.dumps(unfollowers)),
        })
        .execute()
    )

    analysis_id = analysis_row.data[0]["id"]
    created_at  = analysis_row.data[0]["created_at"]

    db.table("users").update({
        "last_analysis_at": now_iso,
        "analysis_count": (existing.data[0].get("analysis_count") or 0) + 1 if existing.data else 1,
    }).eq("id", user_id).execute()

    db.table("audit_log").insert({
        "user_id_hash": safe_user_id(user_id),
        "action": "webview_login",
        "ip_hash": _hash_ip(client_ip),
    }).execute()

    log.info("webview_login_success", user_hash=safe_user_id(user_id), unfollowers=len(unfollowers))

    return WebViewLoginResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
        analysis=AnalysisResponse(
            profile=ProfileData(
                username=username,
                followers=followers_count,
                following=following_count,
                posts=posts_count,
                ghost_score=ghost_score,
                visibility_score=visibility_score,
            ),
            stalkers=[],
            ghost_followers=[],
            unfollowers=[UnfollowerItem(**u) for u in unfollowers],
            analysis_id=analysis_id,
            created_at=created_at,
        ),
    )


# ── POST /auth/login ──────────────────────────────────────────

@router.post("/login", response_model=TokenResponse, status_code=200)
async def login(request: Request, body: InstagramLoginRequest):
    """
    Instagram'a bağlan, JWT token döndür.
    Şifre bu fonksiyon sonunda bellekten silinir.
    INSTAGRAM_MOCK=true ise herhangi bir kullanıcı adı/şifre kabul edilir.
    """
    client_ip = request.client.host if request.client else "unknown"
    log.info("login_attempt", ip_hash=_hash_ip(client_ip))

    # ── MOCK MOD ─────────────────────────────────────────────────
    if settings.INSTAGRAM_MOCK:
        log.info("login_mock_mode")
        mock_user_id = f"mock-{body.username}"
        return TokenResponse(
            access_token=create_access_token(mock_user_id),
            refresh_token=create_refresh_token(mock_user_id),
        )

    db = get_supabase()

    try:
        result = await login_with_password(body.username, body.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # 2FA gerekiyorsa identifier dön
    if result.requires_2fa:
        raise HTTPException(
            status_code=202,
            detail="2FA gerekiyor",
            headers={"X-2FA-Identifier": result.two_fa_identifier or ""},
        )

    # Session'ı şifrele
    encrypted_session = encrypt_instagram_session(result.session_json)
    result.session_json = ""  # orijinali temizle

    # Kullanıcıyı DB'de bul veya oluştur
    existing = (
        db.table("users")
        .select("id")
        .eq("ig_username", body.username)
        .eq("is_deleted", False)
        .execute()
    )

    if existing.data:
        user_id = existing.data[0]["id"]
        db.table("users").update({
            "ig_session_encrypted": encrypted_session,
        }).eq("id", user_id).execute()
    else:
        new_user = (
            db.table("users")
            .insert({"ig_username": body.username, "ig_session_encrypted": encrypted_session})
            .execute()
        )
        user_id = new_user.data[0]["id"]

    # Audit log (PII yok)
    db.table("audit_log").insert({
        "user_id_hash": safe_user_id(user_id),
        "action": "login",
        "ip_hash": _hash_ip(client_ip),
    }).execute()

    log.info("login_success", user_hash=safe_user_id(user_id))

    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


# ── POST /auth/verify-2fa ─────────────────────────────────────

@router.post("/verify-2fa", response_model=TokenResponse)
async def verify_two_factor(body: TwoFactorRequest):
    db = get_supabase()

    try:
        result = await verify_2fa(body.username, body.code, body.identifier)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    encrypted_session = encrypt_instagram_session(result.session_json)
    result.session_json = ""

    existing = (
        db.table("users")
        .select("id")
        .eq("ig_username", body.username)
        .eq("is_deleted", False)
        .execute()
    )

    if existing.data:
        user_id = existing.data[0]["id"]
        db.table("users").update({"ig_session_encrypted": encrypted_session}).eq("id", user_id).execute()
    else:
        res = db.table("users").insert({"ig_username": body.username, "ig_session_encrypted": encrypted_session}).execute()
        user_id = res.data[0]["id"]

    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


# ── POST /auth/refresh ────────────────────────────────────────

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshTokenRequest):
    user_id = decode_token(body.refresh_token, expected_type="refresh")
    if not user_id:
        raise HTTPException(status_code=401, detail="Geçersiz refresh token")

    # Kullanıcı hâlâ aktif mi?
    db = get_supabase()
    user = db.table("users").select("id").eq("id", user_id).eq("is_deleted", False).execute()
    if not user.data:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")

    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


# ── DELETE /auth/logout ───────────────────────────────────────

@router.delete("/logout", status_code=204)
async def logout(user_id: str = Depends(get_current_user_id)):
    db = get_supabase()

    # Session'ı sil — kullanıcı isterse yeniden login yapmalı
    db.table("users").update({"ig_session_encrypted": None}).eq("id", user_id).execute()

    db.table("audit_log").insert({
        "user_id_hash": safe_user_id(user_id),
        "action": "logout",
    }).execute()

    log.info("logout", user_hash=safe_user_id(user_id))
