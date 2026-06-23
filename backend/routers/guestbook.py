"""방명록 라우터.

GET /api/guestbook  — created_at DESC, 최신 100건. user_id 미포함(스키마 레벨 차단).
POST /api/guestbook — JWT 로 user_id 추출 후 저장. 동일 사용자 다중 작성 허용(Issue M3).
"""

from fastapi import APIRouter, HTTPException, status

from dependencies.auth import CurrentUser
from dependencies.supabase import get_supabase
from schemas.guestbook import (
    GuestbookCreate,
    GuestbookEntry,
    GuestbookListResponse,
)

router = APIRouter(prefix="/api/guestbook", tags=["guestbook"])

_LIMIT = 100


@router.get("", response_model=GuestbookListResponse)
async def list_guestbook(user: CurrentUser) -> GuestbookListResponse:
    """방명록 목록 (최신 100건). content, created_at 만 반환."""
    supabase = get_supabase()
    res = (
        supabase.table("guestbook")
        .select("id, content, created_at")  # user_id 조회 안 함
        .order("created_at", desc=True)
        .limit(_LIMIT)
        .execute()
    )
    entries = [GuestbookEntry(**row) for row in (res.data or [])]
    return GuestbookListResponse(entries=entries)


@router.post("", response_model=GuestbookEntry, status_code=status.HTTP_201_CREATED)
async def create_guestbook(payload: GuestbookCreate, user: CurrentUser) -> GuestbookEntry:
    """메시지 작성. user_id 는 JWT 에서 추출해 DB 에만 저장하고 응답에는 포함하지 않는다."""
    supabase = get_supabase()
    res = (
        supabase.table("guestbook")
        .insert({"user_id": user["id"], "content": payload.content})
        .execute()
    )
    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="방명록 저장에 실패했습니다.",
        )
    # 응답은 GuestbookEntry 스키마로 직렬화 → user_id 자동 제외
    return GuestbookEntry(**res.data[0])
