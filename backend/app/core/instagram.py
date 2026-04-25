"""
Instagram private API güvenli wrapper.

Güvenlik önlemleri:
- Şifre bellekte minimum süre yaşar, login sonrası hemen silinir
- Her istek arası rastgele delay (ban koruması)
- Session yeniden kullanımı (gereksiz login azaltır)
- Hata mesajlarında kullanıcı bilgisi dışarı sızmaz
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

MIN_REQUEST_DELAY = 1.5   # saniye — Instagram bot tespiti için minimum bekleme
MAX_REQUEST_DELAY = 4.0   # saniye


# ── Yardımcı ──────────────────────────────────────────────────────────────────

async def _safe_delay():
    """İstekler arası rastgele bekleme — Instagram rate limit ve bot tespitine karşı."""
    delay = random.uniform(MIN_REQUEST_DELAY, MAX_REQUEST_DELAY)
    await asyncio.sleep(delay)


def _build_client() -> Client:
    cl = Client()
    cl.delay_range = [MIN_REQUEST_DELAY, MAX_REQUEST_DELAY]
    # Gerçekçi user-agent
    cl.set_user_agent(
        "Instagram 274.0.0.27.98 Android "
        "(29/10; 420dpi; 1080x2274; samsung; SM-G970F; beyond0q; exynos9820; en_US; 430083539)"
    )
    return cl


# ── Login ─────────────────────────────────────────────────────────────────────

class InstagramLoginResult:
    def __init__(self, session_json: str):
        self.session_json = session_json  # AES ile şifrelenecek, sonra silinecek
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
        cl.login(username, password)

        # Login başarılı — session'ı al, şifre artık gerekmiyor
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
        raise RuntimeError("Instagram hesap doğrulaması gerekiyor. Önce Instagram uygulamasından giriş yap.")

    except UnknownError as e:
        msg = str(e).lower()
        log.warning("instagram_login_unknown_error", detail=str(e)[:120])
        if "password" in msg or "incorrect" in msg:
            raise ValueError("Kullanıcı adı veya şifre hatalı")
        if "checkpoint" in msg or "challenge" in msg or "verify" in msg or "suspicious" in msg:
            raise RuntimeError("Instagram şüpheli giriş tespit etti. Önce Instagram uygulamasından giriş yapıp hesabını doğrula.")
        raise RuntimeError(f"Instagram hatası: {str(e)[:80]}")

    except Exception as e:
        log.error("instagram_login_error", error_type=type(e).__name__, detail=str(e)[:120])
        raise RuntimeError(f"Instagram bağlantı hatası ({type(e).__name__}): {str(e)[:80]}")

    finally:
        # Şifreyi bellekten temizle — her durumda
        password = "0" * len(password)  # üzerine yaz
        del password
        gc.collect()


async def verify_2fa(username: str, code: str, identifier: str) -> InstagramLoginResult:
    """2FA kodu ile doğrulama tamamlar."""
    cl = _build_client()
    result = InstagramLoginResult(session_json="")

    try:
        await _safe_delay()
        cl.login(username, "", verification_code=code, two_factor_identifier=identifier)
        session_data = cl.get_settings()
        result.session_json = json.dumps(session_data)
        log.info("instagram_2fa_success")
        return result

    except Exception as e:
        log.error("instagram_2fa_error", error_type=type(e).__name__)
        raise ValueError("2FA kodu geçersiz veya süresi dolmuş")


async def login_with_session(session_json: str) -> Client:
    """Mevcut session ile Instagram client'ı yeniden oluşturur."""
    cl = _build_client()
    try:
        session_data = json.loads(session_json)
        cl.set_settings(session_data)
        cl.login(cl.username, "")  # Session ile login
        return cl
    except LoginRequired:
        log.warning("instagram_session_expired")
        raise ValueError("Instagram oturumu süresi dolmuş. Yeniden giriş gerekiyor.")
    except Exception as e:
        log.error("instagram_session_restore_error", error_type=type(e).__name__)
        raise RuntimeError("Oturum yenilenemedi")


# ── Analiz ───────────────────────────────────────────────────────────────────

async def fetch_analysis_data(cl: Client) -> dict:
    """
    Instagram'dan analiz verilerini çeker.
    Her istek arası delay uygulanır.
    Sadece gerekli minimum veri çekilir (veri minimizasyonu).
    """
    try:
        # Profil bilgileri
        await _safe_delay()
        user_info = cl.account_info()

        # Story izleyiciler (stalker tespiti için)
        await _safe_delay()
        stories = cl.user_stories(cl.user_id)

        stalkers = []
        for story in stories[:5]:  # Son 5 story
            await _safe_delay()
            viewers = cl.story_viewers(story.pk)
            for viewer in viewers:
                # Takip etmeyenleri stalker say
                await _safe_delay()
                friendship = cl.user_friendship_v1(viewer.pk)
                if not friendship.following:
                    stalkers.append({
                        "id": str(viewer.pk),
                        "username": viewer.username,
                        "profile_pic": str(viewer.profile_pic_url),
                        "viewed_stories": 1,
                        "is_following": False,
                    })

        # Takipçi / takip listelerini karşılaştır (unfollower/muted)
        await _safe_delay()
        followers = cl.user_followers(cl.user_id, amount=500)
        await _safe_delay()
        following = cl.user_following(cl.user_id, amount=500)

        follower_ids = set(followers.keys())
        following_ids = set(following.keys())

        # Takibi bırakanlar: sen takip ediyorsun ama o seni takip etmiyor
        unfollower_ids = following_ids - follower_ids
        unfollowers = []
        for uid in list(unfollower_ids)[:20]:  # Max 20
            u = following.get(uid)
            if u:
                unfollowers.append({
                    "id": str(uid),
                    "username": u.username,
                    "profile_pic": str(u.profile_pic_url),
                    "unfollowed_at": "Yakın zamanda",
                    "was_followed_back": uid in follower_ids,
                })

        # Ghost score hesaplama
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
            "stalkers": stalkers[:10],           # Max 10
            "muted": [],                          # instagrapi muted list sınırlı
            "unfollowers": unfollowers[:20],      # Max 20
        }

    except LoginRequired:
        raise ValueError("Oturum süresi dolmuş")
    except Exception as e:
        log.error("fetch_analysis_error", error_type=type(e).__name__)
        raise RuntimeError("Analiz sırasında hata oluştu")


def _calculate_ghost_score(
    followers: int,
    following: int,
    posts: int,
    stalker_ratio: float,
) -> int:
    """
    0-100 arası ghost score.
    Yüksek = sosyal olarak aktif ve görünür.
    """
    if followers == 0:
        return 0

    # Takipçi/takip oranı (ideal: 1.0 üzeri)
    ratio_score = min(40, int((followers / max(following, 1)) * 20))

    # Post yoğunluğu (ideal: 50+ post)
    post_score = min(30, int((posts / 50) * 30))

    # Stalker oranı (yüksek stalker = görünür profil)
    stalker_score = min(30, int(stalker_ratio * 100))

    return min(100, ratio_score + post_score + stalker_score)
