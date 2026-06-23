"""관리자 라우터 (모두 require_admin).

- 집들이 CRUD
- 이미지 업로드 중계 (multipart → Supabase Storage → public URL) (Issue H3)
PRD '관리자' 엔드포인트 명세 기준.
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from backend.dependencies.auth import AdminUser
from backend.dependencies.supabase import get_supabase
from backend.schemas.admin import (
    HousewarmingCreate,
    HousewarmingUpdate,
    ImageUploadResponse,
)
from backend.schemas.housewarming import HousewarmingResponse

router = APIRouter(prefix="/api/admin/housewarmings", tags=["admin"])

_BUCKET = "housewarming-images"
_ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
_EXT_BY_TYPE = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
_MAX_SIZE = 5 * 1024 * 1024  # 5MB


@router.get("", response_model=list[HousewarmingResponse])
async def admin_list(admin: AdminUser) -> list[HousewarmingResponse]:
    supabase = get_supabase()
    res = (
        supabase.table("housewarmings")
        .select("*")
        .order("event_at", desc=False)
        .execute()
    )
    return [HousewarmingResponse(**row) for row in (res.data or [])]


@router.post("", response_model=HousewarmingResponse, status_code=status.HTTP_201_CREATED)
async def admin_create(payload: HousewarmingCreate, admin: AdminUser) -> HousewarmingResponse:
    supabase = get_supabase()
    data = payload.model_dump(mode="json", exclude_none=True)
    res = supabase.table("housewarmings").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="집들이 등록에 실패했습니다.")
    return HousewarmingResponse(**res.data[0])


@router.put("/{housewarming_id}", response_model=HousewarmingResponse)
async def admin_update(
    housewarming_id: uuid.UUID, payload: HousewarmingUpdate, admin: AdminUser
) -> HousewarmingResponse:
    supabase = get_supabase()
    data = payload.model_dump(mode="json", exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="수정할 필드가 없습니다.")
    res = (
        supabase.table("housewarmings")
        .update(data)
        .eq("id", str(housewarming_id))
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="집들이를 찾을 수 없습니다.")
    return HousewarmingResponse(**res.data[0])


@router.delete("/{housewarming_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete(housewarming_id: uuid.UUID, admin: AdminUser) -> None:
    supabase = get_supabase()
    res = (
        supabase.table("housewarmings")
        .delete()
        .eq("id", str(housewarming_id))
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="집들이를 찾을 수 없습니다.")
    return None


@router.post("/image", response_model=ImageUploadResponse)
async def upload_image(
    admin: AdminUser, file: UploadFile = File(...)
) -> ImageUploadResponse:
    """이미지 업로드 → Storage 저장 후 public URL 반환.

    검증: content-type ∈ {jpeg, png, webp}, size ≤ 5MB.
    클라이언트는 반환된 URL 을 등록/수정 폼의 image_url 로 사용한다.
    """
    if file.content_type not in _ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="허용되지 않는 이미지 형식입니다. (jpeg/png/webp)",
        )

    contents = await file.read()
    if len(contents) > _MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="이미지 크기는 5MB 이하여야 합니다.",
        )

    ext = _EXT_BY_TYPE[file.content_type]
    object_name = f"{uuid.uuid4()}.{ext}"

    supabase = get_supabase()
    bucket = supabase.storage.from_(_BUCKET)
    try:
        bucket.upload(
            object_name,
            contents,
            file_options={"content-type": file.content_type, "cache-control": "3600"},
        )
    except Exception as exc:  # storage 오류
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="이미지 업로드에 실패했습니다.",
        ) from exc

    public_url = bucket.get_public_url(object_name)
    return ImageUploadResponse(image_url=public_url)
