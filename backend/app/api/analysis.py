"""
POST /analysis/run   - Instagram'dan analiz çek, şifreli olarak sakla
GET  /analysis/latest - Son analizin sonuçlarını getir
"""
import json
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends, status
import structlog

from app.api.auth import get_current_user_id
from app.config import get_settings
from app.core.instagram import login_with_session, fetch_analysis_data
from app.core.security import (
    decrypt_instagram_session,
    encrypt_instagram_session,
    safe_user_id,
)
from app.db.supabase import get_supabase
from app.models.schemas import AnalysisResponse, ProfileData, StalkerItem, MutedItem, UnfollowerItem

router = APIRouter(prefix="/analysis", tags=["analysis"])
log = structlog.get_logger()
settings = get_settings()


def _encrypt_list(data: list) -> str:
    return encrypt_instagram_session(json.dumps(data))


def _decrypt_list(encrypted: str | None) -> list:
    if not encrypted:
        return []
    raw = decrypt_instagram_session(encrypted)
    return json.loads(raw)


# ── POST /analysis/run ────────────────────────────────────────

@router.post("/run", response_model=AnalysisResponse, response_model_by_alias=True, status_code=200)
async def run_analysis(user_id: str = Depends(get_current_user_id)):
    """
    Günde 1 analiz hakkı. Rate limit DB'de kontrol edilir.
    Instagram session şifreli olarak saklanır — hiçbir zaman plain text dışarı çıkmaz.
    """
    db = get_supabase()

    # Kullanıcıyı çek
    user_row = (
        db.table("users")
        .select("id, ig_session_encrypted, last_analysis_at, analysis_count")
        .eq("id", user_id)
        .eq("is_deleted", False)
        .single()
        .execute()
    )

    if not user_row.data:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    user = user_row.data

    # Günlük limit kontrolü
    if user.get("last_analysis_at"):
        last_dt = datetime.fromisoformat(user["last_analysis_at"].replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        hours_since = (now - last_dt).total_seconds() / 3600
        if hours_since < 24:
            remaining_hours = int(24 - hours_since)
            raise HTTPException(
                status_code=429,
                detail=f"Günlük analiz limitine ulaştın. {remaining_hours} saat sonra tekrar dene.",
            )

    # Session çöz ve Instagram'a bağlan
    if not user.get("ig_session_encrypted"):
        raise HTTPException(status_code=401, detail="Instagram oturumu bulunamadı. Yeniden giriş yap.")

    try:
        session_json = decrypt_instagram_session(user["ig_session_encrypted"])
    except Exception:
        raise HTTPException(status_code=401, detail="Oturum geçersiz. Yeniden giriş yap.")

    try:
        cl = await login_with_session(session_json)
    except ValueError as e:
        # Session süresi dolmuş — DB'den sil
        db.table("users").update({"ig_session_encrypted": None}).eq("id", user_id).execute()
        raise HTTPException(status_code=401, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    finally:
        session_json = "0" * len(session_json)  # temizle
        del session_json

    # Analiz verilerini çek
    try:
        data = await fetch_analysis_data(cl)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    profile = data["profile"]
    stalkers = data["stalkers"]
    muted = data["muted"]
    unfollowers = data["unfollowers"]

    # Sonuçları şifreli olarak DB'ye kaydet
    now_iso = datetime.now(timezone.utc).isoformat()
    analysis_row = (
        db.table("analyses")
        .insert({
            "user_id": user_id,
            "ghost_score": profile["ghost_score"],
            "followers_count": profile["followers"],
            "following_count": profile["following"],
            "posts_count": profile["posts"],
            "visibility_score": profile["visibility_score"],
            "stalkers_count": len(stalkers),
            "muted_count": len(muted),
            "unfollowers_count": len(unfollowers),
            "stalkers_encrypted": _encrypt_list(stalkers),
            "muted_encrypted": _encrypt_list(muted),
            "unfollowers_encrypted": _encrypt_list(unfollowers),
        })
        .execute()
    )

    analysis_id = analysis_row.data[0]["id"]
    created_at = analysis_row.data[0]["created_at"]

    # Kullanıcı son analiz zamanını güncelle
    db.table("users").update({
        "last_analysis_at": now_iso,
        "analysis_count": (user.get("analysis_count") or 0) + 1,
    }).eq("id", user_id).execute()

    # Audit log
    db.table("audit_log").insert({
        "user_id_hash": safe_user_id(user_id),
        "action": "analysis",
    }).execute()

    log.info("analysis_complete", user_hash=safe_user_id(user_id))

    return AnalysisResponse(
        profile=ProfileData(**profile),
        stalkers=[StalkerItem(**s) for s in stalkers],
        muted=[MutedItem(**m) for m in muted],
        unfollowers=[UnfollowerItem(**u) for u in unfollowers],
        analysis_id=analysis_id,
        created_at=created_at,
    )


# ── GET /analysis/latest ──────────────────────────────────────

@router.get("/latest", response_model=AnalysisResponse, response_model_by_alias=True)
async def get_latest_analysis(user_id: str = Depends(get_current_user_id)):
    """Son analiz sonucunu döndürür. Veri şifreli saklanır, burada çözülür."""
    db = get_supabase()

    row = (
        db.table("analyses")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not row.data:
        raise HTTPException(status_code=404, detail="Henüz analiz yapılmamış")

    analysis = row.data[0]

    stalkers = _decrypt_list(analysis.get("stalkers_encrypted"))
    muted = _decrypt_list(analysis.get("muted_encrypted"))
    unfollowers = _decrypt_list(analysis.get("unfollowers_encrypted"))

    return AnalysisResponse(
        profile=ProfileData(
            username="",  # profil adı şifresiz saklanmıyor — privacy öncelikli
            followers=analysis["followers_count"] or 0,
            following=analysis["following_count"] or 0,
            posts=analysis["posts_count"] or 0,
            ghost_score=analysis["ghost_score"] or 0,
            visibility_score=analysis["visibility_score"] or 0,
        ),
        stalkers=[StalkerItem(**s) for s in stalkers],
        muted=[MutedItem(**m) for m in muted],
        unfollowers=[UnfollowerItem(**u) for u in unfollowers],
        analysis_id=analysis["id"],
        created_at=analysis["created_at"],
    )
