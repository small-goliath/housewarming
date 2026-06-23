"""관리자 집들이 CRUD 입력 스키마."""

from datetime import datetime

from pydantic import BaseModel, Field


class HousewarmingCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    event_at: datetime  # UTC
    organization: str | None = None
    image_url: str | None = None  # 사전 업로드된 Storage public URL
    dress_code: str | None = None
    note: str | None = None
    description: str | None = None


class HousewarmingUpdate(BaseModel):
    # 부분 수정 허용 — 전달된 필드만 갱신
    name: str | None = Field(default=None, min_length=1, max_length=200)
    event_at: datetime | None = None
    organization: str | None = None
    image_url: str | None = None
    dress_code: str | None = None
    note: str | None = None
    description: str | None = None


class ImageUploadResponse(BaseModel):
    image_url: str
