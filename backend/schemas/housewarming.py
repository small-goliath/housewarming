"""집들이 관련 Pydantic 스키마."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class HousewarmingResponse(BaseModel):
    id: UUID
    name: str
    organization: str | None = None
    event_at: datetime  # UTC, 클라이언트에서 KST 변환
    image_url: str | None = None
    dress_code: str | None = None
    note: str | None = None
    description: str | None = None
    kakao_open_chat_url: str | None = None
    created_at: datetime


class ParticipantResponse(BaseModel):
    # PRD: 참여자 목록은 nickname, profile_image_url 만 반환
    nickname: str | None = None
    profile_image_url: str | None = None


class ParticipationResponse(BaseModel):
    id: UUID
    user_id: UUID
    housewarming_id: UUID
    created_at: datetime


class MyParticipationResponse(BaseModel):
    # 현재 사용자가 참여 중인 집들이 id (없으면 None). 상세 페이지 버튼 분기용.
    housewarming_id: UUID | None = None
