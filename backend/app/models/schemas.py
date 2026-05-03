from pydantic import BaseModel, Field, ConfigDict
from pydantic.alias_generators import to_camel

_camel = ConfigDict(alias_generator=to_camel, populate_by_name=True)


# ── Request Modelleri ─────────────────────────────────────────

class InstagramLoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=30)
    password: str = Field(..., min_length=1, max_length=128)


class WebViewUserProfile(BaseModel):
    username: str
    full_name: str = ""
    followers: int = 0
    following: int = 0
    posts: int = 0
    profile_pic: str = ""


class WebViewUserItem(BaseModel):
    id: str
    username: str
    profile_pic: str = ""


class WebViewLoginRequest(BaseModel):
    profile: WebViewUserProfile
    followers: list[WebViewUserItem] = []
    following: list[WebViewUserItem] = []


class DeviceInfo(BaseModel):
    manufacturer: str = "samsung"
    model: str = "SM-A546B"
    android_version: int = 31
    android_release: str = "12"
    dpi: str = "420dpi"
    resolution: str = "1080x2400"


class SessionLoginRequest(BaseModel):
    session_id: str
    device_info: DeviceInfo | None = None


class TwoFactorRequest(BaseModel):
    username: str
    code: str = Field(..., min_length=6, max_length=8)
    identifier: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ── Response Modelleri ────────────────────────────────────────

# TokenResponse intentionally stays snake_case — api.js uses access_token / refresh_token
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class ProfileData(BaseModel):
    model_config = _camel
    username: str
    profile_pic: str = ""
    followers: int
    following: int
    posts: int
    ghost_score: int
    visibility_score: int


class StalkerItem(BaseModel):
    model_config = _camel
    id: str
    username: str
    profile_pic: str
    viewed_stories: int
    is_following: bool


class GhostFollowerItem(BaseModel):
    model_config = _camel
    id: str
    username: str
    profile_pic: str
    posts_liked: int  # analiz edilen postlardan kaç tanesini beğendi


class UnfollowerItem(BaseModel):
    model_config = _camel
    id: str
    username: str
    profile_pic: str
    unfollowed_at: str
    was_followed_back: bool


class AnalysisResponse(BaseModel):
    model_config = _camel
    profile: ProfileData
    stalkers: list[StalkerItem]
    ghost_followers: list[GhostFollowerItem]
    unfollowers: list[UnfollowerItem]
    analysis_id: str
    created_at: str


class WebViewLoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    analysis: AnalysisResponse


class ErrorResponse(BaseModel):
    detail: str
    code: str = "error"
