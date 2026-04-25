from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache
import base64


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────
    APP_NAME: str = "GhostScore API"
    ENV: str = "development"          # development | production
    DEBUG: bool = False

    # ── JWT (RS256 — asimetrik, sadece backend sign eder) ─
    JWT_PRIVATE_KEY: str              # PEM formatı, env'den gelir
    JWT_PUBLIC_KEY: str               # PEM formatı, env'den gelir
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_ALGORITHM: str = "RS256"

    # ── AES-256-GCM (Instagram session şifreleme) ─────────
    # 32 byte = 256 bit, base64 encoded
    SESSION_ENCRYPTION_KEY: str       # openssl rand -base64 32

    # ── Supabase ─────────────────────────────────────────
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str         # service_role key (backend only)
    SUPABASE_JWT_SECRET: str = ""     # Supabase JWT doğrulama (opsiyonel)

    # ── Redis (rate limiting) ─────────────────────────────
    REDIS_URL: str = "redis://localhost:6379"

    # ── CORS ─────────────────────────────────────────────
    # Sadece uygulamamızın domain'i — wildcard YASAK
    ALLOWED_ORIGINS: str = ""

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v):
        if isinstance(v, list):
            return ",".join(v)
        return v

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    # ── Rate Limits ───────────────────────────────────────
    ANALYSIS_PER_DAY_LIMIT: int = 1   # kullanıcı başına günlük analiz
    LOGIN_RATE_LIMIT: str = "5/minute"

    @property
    def encryption_key_bytes(self) -> bytes:
        return base64.b64decode(self.SESSION_ENCRYPTION_KEY)

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
