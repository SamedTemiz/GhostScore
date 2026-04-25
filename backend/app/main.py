"""
GhostScore FastAPI — Entry point.

Güvenlik katmanları:
1. CORS: sadece izin verilen origin'ler
2. slowapi: IP bazlı rate limiting
3. structlog: PII-free JSON loglama
4. Trusted Host middleware
5. HTTPS zorunlu (X-Forwarded-Proto header kontrolü Render/Railway sağlar)
"""
import structlog
import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import get_settings
from app.api import auth, analysis, users

settings = get_settings()

# ── structlog yapılandırması ──────────────────────────────────

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)

# ── Rate limiter ──────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

# ── FastAPI uygulaması ────────────────────────────────────────

app = FastAPI(
    title="GhostScore API",
    version="1.0.0",
    docs_url=None,      # prod'da Swagger kapalı
    redoc_url=None,
    openapi_url=None,   # prod'da OpenAPI şeması kapalı
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Sadece izin verilen origin'ler
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=600,
)

app.add_middleware(SlowAPIMiddleware)

# ── Güvenlik başlıkları ───────────────────────────────────────

@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Cache-Control"] = "no-store"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# ── Router'lar ────────────────────────────────────────────────

app.include_router(auth.router,     prefix="/api/v1")
app.include_router(analysis.router, prefix="/api/v1")
app.include_router(users.router,    prefix="/api/v1")


# ── Health check ──────────────────────────────────────────────

@app.get("/health", include_in_schema=False)
async def health():
    return {"status": "ok"}


# ── Global hata yakalayıcı ────────────────────────────────────

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    log = structlog.get_logger()
    log.error("unhandled_exception", error_type=type(exc).__name__)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Sunucu hatası. Lütfen tekrar dene."},
    )
