"""방명록 Pydantic 스키마.

user_id 는 응답 스키마에 포함하지 않아 구조적으로 익명을 보장한다 (Issue #5).
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class GuestbookEntry(BaseModel):
    id: UUID
    content: str
    created_at: datetime  # UTC, 클라이언트에서 KST 변환
    like_count: int = 0
    liked: bool = False  # 현재 사용자의 좋아요 여부
    # user_id 필드 없음 — 구조적 익명 보장


class GuestbookListResponse(BaseModel):
    entries: list[GuestbookEntry]  # created_at DESC, LIMIT 100


class GuestbookCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class LikeResponse(BaseModel):
    liked: bool
    like_count: int
