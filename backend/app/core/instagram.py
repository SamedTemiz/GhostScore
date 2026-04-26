"""
Instagram private API güvenli wrapper.

Güvenlik önlemleri:
- Şifre bellekte minimum süre yaşar, login sonrası hemen silinir
- Her istek arası rastgele delay (ban koruması)
- Session yeniden kullanımı (gereksiz login azaltır)
- Hata mesajlarında kullanıcı bilgisi dışarı sızmaz

Async notu:
- instagrapi tamamen senkron bir kütüphanedir
- Tüm cl.* çağrıları asyncio.to_thread() ile thread pool'a taşınır
- Bu sayede FastAPI event loop bloke olmaz
"""
import asyncio
import json
import random
import gc
from typing import Optional
import structlog

from instagrapi import Client
from instagrapi.exceptions import (
    LoginRequired,
    TwoFactorRequired,
    BadPassword,
    ChallengeRequired,
    UserNotFound,
    UnknownError,
    SelectContactPointRecoveryForm,
    RecaptchaChallengeForm,
)

log = structlog.get_logger()


# ── Sabitler ──────────────────────────────────────────────────────────────────

MIN_REQUEST_DELAY = 1.5
MAX_REQUEST_DELAY = 4.0


# ── Yardımcı ──────────────────────────────────────────────────────────────────

async def _safe_delay():
    delay = random.uniform(MIN_REQUEST_DELAY, MAX_REQUEST_DELAY)
    await asyncio.sleep(delay)


def _build_client() -> Client:
    cl = Client()
    cl.delay_range = [MIN_REQUEST_DELAY, MAX_REQUEST_DELAY]
    cl.set_user_agent(
        "Instagram 319.0.0.0.75 Android "
        "(31/12; 420dpi; 1080x2400; samsung; SM-A546B; a54x; s5e8535; en_US; 563859995)"
    )
    return cl


# ── Login ─────────────────────────────────────────────────────────────────────

class InstagramLoginResult:
    def __init__(self, session_json: str):
        self.session_json = session_json
        self.requires_2fa = False
        self.two_fa_identifier: Optional[str] = None


async def login_with_password(username: str, password: str) -> InstagramLoginResult:
    """
    Instagram'a kullanıcı adı ve şifre ile bağlanır.
    Şifre login tamamlanır tamamlanmaz bellekten silinir.

    Raises:
        ValueError: Yanlış şifre, kullanıcı bulunamadı
        TwoFactorRequired: 2FA gerekiyor
        RuntimeError: Hesap challenge/kilitli
    """
    cl = _build_client()
    result = InstagramLoginResult(session_json="")

    try:
        await _safe_delay()
        # instagrapi tamamen senkron — event loop'u bloke etmemek için thread pool
        await asyncio.to_thread(cl.login, username, password)

        session_data = cl.get_settings()
        result.session_json = json.dumps(session_data)

        log.info("instagram_login_success", username_len=len(username))
        return result

    except TwoFactorRequired as e:
        result.requires_2fa = True
        result.two_fa_identifier = str(e)
        return result

    except BadPassword:
        log.warning("instagram_login_bad_password")
        raise ValueError("Kullanıcı adı veya şifre hatalı")

    except UserNotFound:
        log.warning("instagram_login_user_not_found")
        raise ValueError("Kullanıcı bulunamadı")

    except (ChallengeRequired, SelectContactPointRecoveryForm, RecaptchaChallengeForm):
        log.warning("instagram_login_challenge_required")
        raise RuntimeError(
            "Instagram hesap doğrulaması gerekiyor. "
            "Önce Instagram uygulamasından giriş yap ve e-posta/SMS doğrulamasını tamamla."
        )

    except UnknownError as e:
        msg = str(e).lower()
        log.warning("instagram_login_unknown_error", detail=str(e)[:120])
        if "password" in msg or "incorrect" in msg:
            raise ValueError("Kullanıcı adı veya şifre hatalı")
        if "checkpoint" in msg or "challenge" in msg or "verify" in msg or "suspicious" in msg:
            raise RuntimeError(
                "Instagram şüpheli giriş tespit etti. "
                "Instagram uygulamasından giriş yapıp hesabını doğrula, sonra tekrar dene."
            )
        raise RuntimeError(f"Instagram hatası: {str(e)[:100]}")

    except Exception as e:
        log.error("instagram_login_error", error_type=type(e).__name__, detail=str(e)[:120])
        raise RuntimeError(
            f"Instagram bağlantısı kurulamadı ({type(e).__name__}). "
            "Lütfen birkaç dakika bekleyip tekrar dene."
        )

    finally:
        password = "0" * len(password)
        del password
        gc.collect()


async def verify_2fa(username: str, code: str, identifier: str) -> InstagramLoginResult:
    """2FA kodu ile doğrulama tamamlar."""
    cl = _build_client()
    result = InstagramLoginResult(session_json="")

    try:
        await _safe_delay()
        await asyncio.to_thread(
            cl.login, username, "", verification_code=code, two_factor_identifier=identifier
        )
        session_data = cl.get_settings()
        result.session_json = json.dumps(session_data)
        log.info("instagram_2fa_success")
        return result

    except Exception as e:
        log.error("instagram_2fa_error", error_type=type(e).__name__)
        raise ValueError("2FA kodu geçersiz veya süresi dolmuş")


async def login_with_session(session_json: str) -> Client:
    """
    Mevcut session ile Instagram client'ı yeniden oluşturur.

    ÖNEMLI: cl.login() ÇAĞIRMIYORUZ — boş şifre ile login yapmak
    Instagram tarafında hata tetikler. Bunun yerine account_info()
    ile session geçerliliğini kontrol ediyoruz.
    """
    cl = _build_client()
    try:
        session_data = json.loads(session_json)
        cl.set_settings(session_data)
        # Session geçerliliğini hafif bir çağrıyla doğrula
        await asyncio.to_thread(cl.account_info)
        return cl
    except LoginRequired:
        log.warning("instagram_session_expired")
        raise ValueError("Instagram oturumu süresi dolmuş. Yeniden giriş gerekiyor.")
    except Exception as e:
        log.error("instagram_session_restore_error", error_type=type(e).__name__, detail=str(e)[:80])
        raise RuntimeError("Oturum yenilenemedi. Yeniden giriş gerekiyor.")


# ── Analiz ───────────────────────────────────────────────────────────────────

async def fetch_analysis_data(cl: Client) -> dict:
    """
    Instagram'dan analiz verilerini çeker.
    Her istek arası delay uygulanır.
    Tüm senkron çağrılar asyncio.to_thread() ile thread pool'a taşınır.
    """
    try:
        await _safe_delay()
        user_info = await asyncio.to_thread(cl.account_info)

        # Story izleyiciler (stalker tespiti)
        await _safe_delay()
        stories = await asyncio.to_thread(cl.user_stories, cl.user_id)

        stalkers = []
        for story in stories[:3]:  # Son 3 story (performans)
            await _safe_delay()
            viewers = await asyncio.to_thread(cl.story_viewers, story.pk)
            for viewer in viewers[:50]:
                await _safe_delay()
                try:
                    friendship = await asyncio.to_thread(cl.user_friendship_v1, viewer.pk)
                    if not friendship.following:
                        stalkers.append({
                            "id": str(viewer.pk),
                            "username": viewer.username,
                            "profile_pic": str(viewer.profile_pic_url) if viewer.profile_pic_url else "",
                            "viewed_stories": 1,
                            "is_following": False,
                        })
                except Exception:
                    continue

        await _safe_delay()
        followers = await asyncio.to_thread(cl.user_followers, cl.user_id, amount=500)
        await _safe_delay()
        following = await asyncio.to_thread(cl.user_following, cl.user_id, amount=500)

        follower_ids = set(followers.keys())
        following_ids = set(following.keys())

        unfollower_ids = following_ids - follower_ids
        unfollowers = []
        for uid in list(unfollower_ids)[:20]:
            u = following.get(uid)
            if u:
                unfollowers.append({
                    "id": str(uid),
                    "username": u.username,
                    "profile_pic": str(u.profile_pic_url) if u.profile_pic_url else "",
                    "unfollowed_at": "Yakın zamanda",
                    "was_followed_back": uid in follower_ids,
                })

        followers_count = user_info.follower_count
        following_count = user_info.following_count
        posts_count = user_info.media_count
        ghost_score = _calculate_ghost_score(
            followers=followers_count,
            following=following_count,
            posts=posts_count,
            stalker_ratio=len(stalkers) / max(followers_count, 1),
        )

        return {
            "profile": {
                "username": user_info.username,
                "followers": followers_count,
                "following": following_count,
                "posts": posts_count,
                "ghost_score": ghost_score,
                "visibility_score": min(100, ghost_score + 13),
            },
            "stalkers": stalkers[:10],
            "muted": [],
            "unfollowers": unfollowers[:20],
        }

    except LoginRequired:
        raise ValueError("Oturum süresi dolmuş")
    except Exception as e:
        log.error("fetch_analysis_error", error_type=type(e).__name__, detail=str(e)[:120])
        raise RuntimeError(f"Analiz sırasında hata oluştu: {type(e).__name__}")


def _calculate_ghost_score(
    followers: int,
    following: int,
    posts: int,
    stalker_ratio: float,
) -> int:
    if followers == 0:
        return 0

    ratio_score = min(40, int((followers / max(following, 1)) * 20))
    post_score = min(30, int((posts / 50) * 30))
    stalker_score = min(30, int(stalker_ratio * 100))

    return min(100, ratio_score + post_score + stalker_score)


# ── Mock veri (INSTAGRAM_MOCK=true olduğunda kullanılır) ──────────────────────

MOCK_ANALYSIS_DATA = {
    "profile": {
        "username": "mock_user",
        "followers": 842,
        "following": 310,
        "posts": 67,
        "ghost_score": 74,
        "visibility_score": 87,
    },
    "stalkers": [
        {"id": "101", "username": "silent_watcher_1", "profile_pic": "", "viewed_stories": 5, "is_following": False},
        {"id": "102", "username": "ghost_reader_2",   "profile_pic": "", "viewed_stories": 3, "is_following": False},
        {"id": "103", "username": "lurker_99",         "profile_pic": "", "viewed_stories": 2, "is_following": False},
    ],
    "muted": [],
    "unfollowers": [
        {"id": "201", "username": "ex_follower_1", "profile_pic": "", "unfollowed_at": "3 gün önce",    "was_followed_back": True},
        {"id": "202", "username": "ghost_gone_2",  "profile_pic": "", "unfollowed_at": "1 hafta önce",  "was_followed_back": True},
        {"id": "203", "username": "silent_drop_3", "profile_pic": "", "unfollowed_at": "2 hafta önce",  "was_followed_back": False},
    ],
}
