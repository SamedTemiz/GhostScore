-- ════════════════════════════════════════════════════════════
-- GhostScore — Supabase Migration 001
-- Güvenlik: RLS aktif, her tablo kullanıcı bazlı izole
-- ════════════════════════════════════════════════════════════

-- UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ── Kullanıcılar ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ig_username          TEXT NOT NULL,
    ig_session_encrypted TEXT,              -- AES-256-GCM şifreli session
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_analysis_at     TIMESTAMPTZ,
    analysis_count       INTEGER NOT NULL DEFAULT 0,
    is_deleted           BOOLEAN NOT NULL DEFAULT FALSE,  -- soft delete (GDPR)
    deleted_at           TIMESTAMPTZ
);

-- ig_username büyük/küçük harf duyarsız index
CREATE UNIQUE INDEX idx_users_ig_username
    ON public.users (LOWER(ig_username))
    WHERE is_deleted = FALSE;

-- RLS aktif et
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Kullanıcı sadece kendi satırını görür
CREATE POLICY "users_self_only"
    ON public.users
    FOR ALL
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Backend service role için bypass (FastAPI kullanır)
CREATE POLICY "service_role_bypass"
    ON public.users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);


-- ── Analizler ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analyses (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Profil özeti (ham sayılar, hassas değil)
    ghost_score       INTEGER CHECK (ghost_score BETWEEN 0 AND 100),
    followers_count   INTEGER,
    following_count   INTEGER,
    posts_count       INTEGER,
    visibility_score  INTEGER,

    -- Liste boyutları (sayı olarak sakla, detay için şifreli JSON)
    stalkers_count    INTEGER DEFAULT 0,
    muted_count       INTEGER DEFAULT 0,
    unfollowers_count INTEGER DEFAULT 0,

    -- Detay verileri — şifreli JSON (AES-256-GCM)
    -- Çözme sadece API katmanında, DB'de okunabilir değil
    stalkers_encrypted    TEXT,
    muted_encrypted       TEXT,
    unfollowers_encrypted TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kullanıcı bazlı index
CREATE INDEX idx_analyses_user_id ON public.analyses (user_id);
CREATE INDEX idx_analyses_created_at ON public.analyses (created_at);

-- RLS
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analyses_owner_only"
    ON public.analyses
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "analyses_service_role"
    ON public.analyses
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);


-- ── Refresh Token Blacklist ───────────────────────────────────
-- Logout sonrası tokenları geçersiz kılar
CREATE TABLE IF NOT EXISTS public.revoked_tokens (
    jti        TEXT PRIMARY KEY,  -- JWT ID
    user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL  -- TTL için, süresi dolunca silinebilir
);

CREATE INDEX idx_revoked_tokens_expires ON public.revoked_tokens (expires_at);

-- Süresi dolmuş tokenları otomatik sil (pg_cron ile)
-- SELECT cron.schedule('clean-revoked-tokens', '0 3 * * *',
--   'DELETE FROM public.revoked_tokens WHERE expires_at < NOW()');


-- ── Eski Analizleri Otomatik Sil (30 gün) ───────────────────
-- SELECT cron.schedule('clean-old-analyses', '0 4 * * *',
--   'DELETE FROM public.analyses WHERE created_at < NOW() - INTERVAL ''30 days''');


-- ── Audit Log (PII olmadan) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
    id          BIGSERIAL PRIMARY KEY,
    user_id_hash TEXT NOT NULL,  -- sha256(user_id)[:8] — tam ID yok
    action      TEXT NOT NULL,   -- 'login' | 'analysis' | 'logout' | 'delete'
    ip_hash     TEXT,            -- sha256(ip) — ham IP yok
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_created_at ON public.audit_log (created_at);

-- Audit log 90 gün tutulur
-- SELECT cron.schedule('clean-audit-log', '0 5 * * *',
--   'DELETE FROM public.audit_log WHERE created_at < NOW() - INTERVAL ''90 days''');
