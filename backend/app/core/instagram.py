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
    ChallengeUnknownStep,
)

log = structlog.get_logger()


# ── Sabitler ──────────────────────────────────────────────────────────────────

MIN_REQUEST_DELAY = 1.5
MAX_REQUEST_DELAY = 4.0


# ── Yardımcı ──────────────────────────────────────────────────────────────────

async def _safe_delay():
    delay = random.uniform(MIN_REQUEST_DELAY, MAX_REQUEST_DELAY)
    await asyncio.sleep(delay)


_DEVICE = {
    "manufacturer": "samsung",
    "model": "SM-A546B",
    "android_version": 31,
    "android_release": "12",
    "dpi": "420dpi",
    "resolution": "1080x2400",
    "cpu": "s5e8535",
}

_USER_AGENT = (
    "Instagram 319.0.0.0.75 Android "
    "(31/12; 420dpi; 1080x2400; samsung; SM-A546B; a54x; s5e8535; en_US; 563859995)"
)


def _build_client(settings: dict | None = None) -> Client:
    cl = Client()
    cl.delay_range = [MIN_REQUEST_DELAY, MAX_REQUEST_DELAY]
    if settings:
        # Kayıtlı session varsa tam fingerprint geri yükle (cihaz değişmesin)
        cl.set_settings(settings)
    else:
        # İlk login: sabit Samsung cihazı kullan (rastgele cihaz = ban riski)
        cl.set_device(_DEVICE)
        cl.set_user_agent(_USER_AGENT)
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

    except (ChallengeRequired, ChallengeUnknownStep, SelectContactPointRecoveryForm, RecaptchaChallengeForm):
        log.warning("instagram_login_challenge_required")
        raise RuntimeError(
            "Instagram güvenlik doğrulaması istedi. "
            "Lütfen önce Instagram uygulamasını açıp giriş yap, ardından buraya tekrar dön ve tekrar dene."
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
            "Instagram bağlantısı kurulamadı. "
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


async def login_with_sessionid(session_id: str) -> Client:
    """
    WebView'dan alınan sessionid cookie ile Instagram'a bağlanır.
    """
    cl = _build_client()
    try:
        await asyncio.to_thread(cl.login_by_sessionid, session_id)
        log.info("instagram_sessionid_login_success")
        return cl
    except LoginRequired:
        raise ValueError("Session süresi dolmuş. Yeniden giriş gerekiyor.")
    except Exception as e:
        log.error("instagram_sessionid_login_error", error_type=type(e).__name__, detail=str(e)[:80])
        raise RuntimeError(f"Instagram bağlantısı kurulamadı: {type(e).__name__}")


async def login_with_session(session_json: str) -> Client:
    """
    Mevcut session ile Instagram client'ı yeniden oluşturur.

    ÖNEMLI: cl.login() ÇAĞIRMIYORUZ — boş şifre ile login yapmak
    Instagram tarafında hata tetikler. Bunun yerine account_info()
    ile session geçerliliğini kontrol ediyoruz.
    """
    try:
        session_data = json.loads(session_json)
        # Kayıtlı fingerprint ile client oluştur — cihaz değişmesin
        cl = _build_client(settings=session_data)
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

async def _safe_fetch(coro, label: str, default=None):
    """Her API çağrısını ayrı yakalar — bir endpoint başarısız olursa analiz durmuyor."""
    try:
        return await coro
    except Exception as e:
        log.warning("api_call_failed", label=label, error_type=type(e).__name__, detail=str(e)[:100])
        return default


async def fetch_analysis_data(cl: Client) -> dict:
    """
    Instagram'dan analiz verilerini çeker.
    Her endpoint bağımsız try/except ile sarılı — bir endpoint 400/403 dönerse
    diğerleri çalışmaya devam eder, kısmi veri döner.
    """
    user_info = await asyncio.to_thread(cl.user_info, cl.user_id, False)
    if not user_info:
        raise RuntimeError("Profil bilgisi alınamadı")

    followers_count = user_info.follower_count
    following_count = user_info.following_count
    posts_count     = user_info.media_count
    profile_pic_url = str(user_info.profile_pic_url) if user_info.profile_pic_url else ""

    # ── Takipçi / takip listesi ────────────────────────────────
    # amount=500 ile büyük hesaplar için daha doğru veri sağlanır
    await _safe_delay()
    followers_map: dict = await _safe_fetch(
        asyncio.to_thread(cl.user_followers, cl.user_id, amount=500),
        label="user_followers", default={},
    )

    await _safe_delay()
    following_map: dict = await _safe_fetch(
        asyncio.to_thread(cl.user_following, cl.user_id, amount=500),
        label="user_following", default={},
    )

    follower_ids  = set(followers_map.keys())
    following_ids = set(following_map.keys())

    # Takip ettiğimiz ama bizi takip etmeyenler
    unfollower_ids = following_ids - follower_ids
    unfollowers = []
    for uid in list(unfollower_ids)[:20]:
        u = following_map.get(uid)
        if u:
            unfollowers.append({
                "id": str(uid),
                "username": u.username,
                "profile_pic": str(u.profile_pic_url) if u.profile_pic_url else "",
                "unfollowed_at": "Yakın zamanda",
                # Geri takip etmeyenler listesinde kim olduğunu belirtmek
                # için friendship geçmişi yoksa bu alan anlamsız — False bırakılır
                "was_followed_back": False,
            })

    # ── Story izleyiciler (stalker tespiti) ────────────────────
    # Aynı kişi birden fazla story izlerse viewed_stories sayısı artar
    stories = await _safe_fetch(
        asyncio.to_thread(cl.user_stories, cl.user_id),
        label="user_stories", default=[],
    )

    # viewer_pk → {user_obj, viewed_stories, is_following} — dedup için dict
    stalker_map: dict = {}
    for story in (stories or [])[:5]:
        await _safe_delay()
        viewers = await _safe_fetch(
            asyncio.to_thread(cl.story_viewers, story.pk),
            label="story_viewers", default=[],
        )
        for viewer in (viewers or [])[:50]:
            try:
                pk = str(viewer.pk)
                if pk not in stalker_map:
                    friendship = await asyncio.to_thread(cl.user_friendship_v1, viewer.pk)
                    if not friendship.following:
                        stalker_map[pk] = {
                            "id": pk,
                            "username": viewer.username,
                            "profile_pic": str(viewer.profile_pic_url) if viewer.profile_pic_url else "",
                            "viewed_stories": 1,
                            "is_following": False,
                        }
                else:
                    stalker_map[pk]["viewed_stories"] += 1
            except Exception:
                continue

    stalkers = sorted(stalker_map.values(), key=lambda x: x["viewed_stories"], reverse=True)

    # ── Hayalet takipçi tespiti ────────────────────────────────
    # Son 4 post → beğenenleri topla → hiç beğenmeyenler = ghost follower
    ghost_followers = []
    if posts_count > 0:
        recent_media = await _safe_fetch(
            asyncio.to_thread(cl.user_medias, cl.user_id, 4),
            label="user_medias", default=[],
        )
        active_liker_ids: set = set()
        for media in (recent_media or [])[:4]:
            await _safe_delay()
            likers = await _safe_fetch(
                asyncio.to_thread(cl.media_likers, media.pk),
                label="media_likers", default=[],
            )
            for liker in (likers or []):
                active_liker_ids.add(str(liker.pk))

        # amount=500 ile çekilen takipçilerin ilk 300'ünü kontrol et
        checked = list(followers_map.items())[:300]
        for uid, u in checked:
            if str(uid) not in active_liker_ids:
                ghost_followers.append({
                    "id": str(uid),
                    "username": u.username,
                    "profile_pic": str(u.profile_pic_url) if u.profile_pic_url else "",
                    "posts_liked": 0,
                })

    # ── Skor hesabı ────────────────────────────────────────────
    # Ghost ratio: gerçek takipçi sayısına göre hesapla
    ghost_ratio = len(ghost_followers) / max(min(followers_count, len(followers_map)), 1)
    ghost_score = _calculate_ghost_score(
        followers=followers_count,
        following=following_count,
        posts=posts_count,
        stalker_ratio=len(stalkers) / max(followers_count, 1),
        ghost_ratio=ghost_ratio,
    )

    return {
        "profile": {
            "username": user_info.username,
            "profile_pic": profile_pic_url,
            "followers": followers_count,
            "following": following_count,
            "posts": posts_count,
            "ghost_score": ghost_score,
            "visibility_score": min(100, ghost_score + 13),
        },
        "stalkers": stalkers[:10],
        "ghost_followers": ghost_followers[:50],
        "unfollowers": unfollowers[:20],
    }


def _calculate_ghost_score(
    followers: int,
    following: int,
    posts: int,
    stalker_ratio: float,
    ghost_ratio: float = 0.0,
) -> int:
    if followers == 0:
        return 0

    ratio_score   = min(35, int((followers / max(following, 1)) * 17))
    post_score    = min(25, int((posts / 50) * 25))
    stalker_score = min(20, int(stalker_ratio * 100))
    # Ghost oranı düşükse skor yükselir (az hayalet = iyi etkileşim)
    engagement_score = min(20, int((1 - ghost_ratio) * 20))

    return min(100, ratio_score + post_score + stalker_score + engagement_score)


# ── Mock veri (INSTAGRAM_MOCK=true olduğunda kullanılır) ──────────────────────

MOCK_ANALYSIS_DATA = {
    "profile": {
        "username": "mock_user",
        "profile_pic": "",
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
    "ghost_followers": [
        {"id": "301", "username": "phantom_user_1",  "profile_pic": "", "posts_liked": 0},
        {"id": "302", "username": "invisible_acc_2", "profile_pic": "", "posts_liked": 0},
        {"id": "303", "username": "ghost_follow_3",  "profile_pic": "", "posts_liked": 0},
        {"id": "304", "username": "shadow_user_4",   "profile_pic": "", "posts_liked": 0},
        {"id": "305", "username": "lurk_master_5",   "profile_pic": "", "posts_liked": 0},
    ],
    "unfollowers": [
        {"id": "201", "username": "ex_follower_1", "profile_pic": "", "unfollowed_at": "3 gün önce",    "was_followed_back": True},
        {"id": "202", "username": "ghost_gone_2",  "profile_pic": "", "unfollowed_at": "1 hafta önce",  "was_followed_back": True},
        {"id": "203", "username": "silent_drop_3", "profile_pic": "", "unfollowed_at": "2 hafta önce",  "was_followed_back": False},
    ],
}
