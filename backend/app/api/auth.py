"""
Auth endpoint'leri:
POST /auth/login         - Instagram kullanıcı adı + şifre ile giriş
POST /auth/verify-2fa   - İki faktörlü doğrulama
POST /auth/refresh      - Access token yenile
DELETE /auth/logout     - Oturumu kapat, token'ı iptal et
"""
import hashlib
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

import structlog

from app.config import get_settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decrypt_instagram_session,
    decode_token,
    encrypt_instagram_session,
    safe_user_id,
)
from app.core.instagram import login_with_password, verify_2fa
from app.db.supabase import get_supabase
from app.models.schemas import (
    InstagramLoginRequest,
    TwoFactorRequest,
    RefreshTokenRequest,
    TokenResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])
log = structlog.get_logger()
settings = get_settings()
security = HTTPBearer()


def _hash_ip(ip: str) -> str:
    return hashlib.sha256(ip.encode()).hexdigest()[:12]


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
        log.info("login_mock_mode", username=body.username)
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
