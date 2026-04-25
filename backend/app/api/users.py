"""
DELETE /users/me  - Hesabı ve tüm verileri sil (GDPR Art. 17 — Silinme Hakkı)
GET    /users/me  - Kullanıcı bilgilerini getir
"""
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import structlog

from app.api.auth import get_current_user_id
from app.core.security import safe_user_id
from app.db.supabase import get_supabase

router = APIRouter(prefix="/users", tags=["users"])
log = structlog.get_logger()


class UserInfo(BaseModel):
    analysis_count: int
    last_analysis_at: str | None
    created_at: str
    can_analyze: bool


# ── GET /users/me ─────────────────────────────────────────────

@router.get("/me", response_model=UserInfo)
async def get_me(user_id: str = Depends(get_current_user_id)):
    db = get_supabase()

    row = (
        db.table("users")
        .select("analysis_count, last_analysis_at, created_at")
        .eq("id", user_id)
        .eq("is_deleted", False)
        .single()
        .execute()
    )

    if not row.data:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    user = row.data

    can_analyze = True
    if user.get("last_analysis_at"):
        last_dt = datetime.fromisoformat(user["last_analysis_at"].replace("Z", "+00:00"))
        hours_since = (datetime.now(timezone.utc) - last_dt).total_seconds() / 3600
        can_analyze = hours_since >= 24

    return UserInfo(
        analysis_count=user.get("analysis_count") or 0,
        last_analysis_at=user.get("last_analysis_at"),
        created_at=user["created_at"],
        can_analyze=can_analyze,
    )


# ── DELETE /users/me ──────────────────────────────────────────

@router.delete("/me", status_code=204)
async def delete_account(user_id: str = Depends(get_current_user_id)):
    """
    GDPR Art. 17 — Kullanıcı verilerini siler.
    Soft delete: ig_username ve session silinir, satır 30 gün sonra fiziksel silinir.
    Analizler cascade ile silinir (referanssal bütünlük).
    """
    db = get_supabase()

    now_iso = datetime.now(timezone.utc).isoformat()

    # Kullanıcı mevcut mu?
    row = (
        db.table("users")
        .select("id")
        .eq("id", user_id)
        .eq("is_deleted", False)
        .execute()
    )
    if not row.data:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    # Hassas verileri hemen temizle (soft delete)
    db.table("users").update({
        "ig_session_encrypted": None,
        "ig_username": f"deleted_{user_id[:8]}",  # kullanıcı adını anonim yap
        "is_deleted": True,
        "deleted_at": now_iso,
    }).eq("id", user_id).execute()

    # Analizler CASCADE ile silinir — ek işlem gerekmez

    # Audit log (kim sildi, ne zaman — PII yok)
    db.table("audit_log").insert({
        "user_id_hash": safe_user_id(user_id),
        "action": "account_deleted",
    }).execute()

    log.info("account_deleted", user_hash=safe_user_id(user_id))
