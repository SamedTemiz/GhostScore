"""
Güvenlik katmanı:
- JWT RS256 token üretimi ve doğrulaması
- AES-256-GCM ile Instagram session şifreleme/şifre çözme
- Token blacklist (logout)
"""
import os
import base64
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from jose import JWTError, jwt
import structlog

from app.config import get_settings

log = structlog.get_logger()
settings = get_settings()


# ── JWT ──────────────────────────────────────────────────────────────────────

def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": user_id,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    return jwt.encode(payload, settings.JWT_PRIVATE_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload = {
        "sub": user_id,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh",
    }
    return jwt.encode(payload, settings.JWT_PRIVATE_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str, expected_type: str = "access") -> Optional[str]:
    """
    Token'ı doğrular ve user_id döner.
    Hatalı/expire token → None döner, exception fırlatmaz.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_PUBLIC_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        if payload.get("type") != expected_type:
            return None
        user_id: str = payload.get("sub")
        if not user_id:
            return None
        return user_id
    except JWTError:
        return None


# ── AES-256-GCM Session Şifreleme ────────────────────────────────────────────

def encrypt_instagram_session(session_json: str) -> str:
    """
    Instagram session'ını AES-256-GCM ile şifreler.
    Her şifreleme için yeni rastgele nonce kullanılır.
    Dönen string: base64(nonce + ciphertext + tag)
    """
    key = settings.encryption_key_bytes
    nonce = os.urandom(12)  # 96-bit GCM nonce — her seferinde yeni

    aesgcm = AESGCM(key)
    ciphertext_with_tag = aesgcm.encrypt(nonce, session_json.encode("utf-8"), None)

    # nonce + ciphertext + auth_tag birleşik → base64
    encrypted = base64.b64encode(nonce + ciphertext_with_tag).decode("utf-8")

    # Keyi bellekten temizle
    del key
    return encrypted


def decrypt_instagram_session(encrypted: str) -> str:
    """
    Şifrelenmiş Instagram session'ını çözer.
    Authentication tag otomatik doğrulanır — değiştirilmişse exception.
    """
    key = settings.encryption_key_bytes
    try:
        raw = base64.b64decode(encrypted.encode("utf-8"))
        nonce = raw[:12]
        ciphertext_with_tag = raw[12:]

        aesgcm = AESGCM(key)
        plaintext = aesgcm.decrypt(nonce, ciphertext_with_tag, None)
        return plaintext.decode("utf-8")
    except Exception:
        log.error("session_decryption_failed")
        raise ValueError("Session verisi bozuk veya geçersiz")
    finally:
        del key


# ── Güvenli user_id hash (loglar için) ───────────────────────────────────────

def safe_user_id(user_id: str) -> str:
    """Log dosyalarına tam user_id yazılmaz, hash'in ilk 8 karakteri yazılır."""
    return hashlib.sha256(user_id.encode()).hexdigest()[:8]
