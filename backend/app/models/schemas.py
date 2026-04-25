from pydantic import BaseModel, Field, ConfigDict, field_validator
from pydantic.alias_generators import to_camel
import re

_camel = ConfigDict(alias_generator=to_camel, populate_by_name=True)


# ── Request Modelleri ─────────────────────────────────────────

class InstagramLoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=30)
    password: str = Field(..., min_length=1, max_length=128)

    @field_validator("username")
    @classmethod
    def clean_username(cls, v: str) -> str:
        v = v.strip().lstrip("@").lower()
        if not re.match(r"^[a-z0-9._]+$", v):
            raise ValueError("Geçersiz kullanıcı adı formatı")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v.strip()) == 0:
            raise ValueError("Şifre boş olamaz")
        return v


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


class MutedItem(BaseModel):
    model_config = _camel
    id: str
    username: str
    profile_pic: str
    rank_delta: int
    last_seen: str


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
    muted: list[MutedItem]
    unfollowers: list[UnfollowerItem]
    analysis_id: str
    created_at: str


class ErrorResponse(BaseModel):
    detail: str
    code: str = "error"
