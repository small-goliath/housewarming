"""프로필 관련 Pydantic 스키마."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ProfileResponse(BaseModel):
    id: UUID
    kakao_id: str
    nickname: str | None = None
    profile_image_url: str | None = None
    created_at: datetime
    updated_at: datetime


class MeResponse(BaseModel):
    """현재 로그인 사용자 정보 + 관리자 여부 (헤더/관리자 페이지용)."""

    id: UUID
    kakao_id: str
    nickname: str | None = None
    profile_image_url: str | None = None
    is_admin: bool
