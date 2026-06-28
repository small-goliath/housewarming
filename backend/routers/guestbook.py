"""방명록 라우터.

GET /api/guestbook  — created_at DESC, 최신 100건. user_id 미포함(스키마 레벨 차단).
POST /api/guestbook — JWT 로 user_id 추출 후 저장. 동일 사용자 다중 작성 허용(Issue M3).
POST/DELETE /api/guestbook/{id}/like — 방명록 좋아요 토글 (1인 1좋아요).
"""

from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from postgrest.exceptions import APIError

from dependencies.auth import CurrentUser
from dependencies.supabase import get_supabase
from schemas.guestbook import (
    GuestbookCreate,
    GuestbookEntry,
    GuestbookListResponse,
    LikeResponse,
)

router = APIRouter(prefix="/api/guestbook", tags=["guestbook"])

_LIMIT = 100
_UNIQUE_VIOLATION = "23505"
_FK_VIOLATION = "23503"


@router.get("", response_model=GuestbookListResponse)
async def list_guestbook(user: CurrentUser) -> GuestbookListResponse:
    """방명록 목록 (최신 100건). content, created_at, 좋아요 수/여부 반환."""
    supabase = get_supabase()
    res = (
        supabase.table("guestbook")
        .select("id, content, created_at")  # user_id 조회 안 함
        .order("created_at", desc=True)
        .limit(_LIMIT)
        .execute()
    )
    rows = res.data or []
    ids = [row["id"] for row in rows]

    # 좋아요 집계: 대상 방명록들의 좋아요만 조회 후 그룹화
    like_counts: dict[str, int] = {}
    liked_ids: set[str] = set()
    if ids:
        likes_res = (
            supabase.table("guestbook_likes")
            .select("guestbook_id, user_id")
            .in_("guestbook_id", ids)
            .execute()
        )
        for like in likes_res.data or []:
            gid = str(like["guestbook_id"])
            like_counts[gid] = like_counts.get(gid, 0) + 1
            if str(like["user_id"]) == str(user["id"]):
                liked_ids.add(gid)

    entries = [
        GuestbookEntry(
            id=row["id"],
            content=row["content"],
            created_at=row["created_at"],
            like_count=like_counts.get(str(row["id"]), 0),
            liked=str(row["id"]) in liked_ids,
        )
        for row in rows
    ]
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
    # 응답은 GuestbookEntry 스키마로 직렬화 → user_id 자동 제외 (신규 글은 좋아요 0)
    return GuestbookEntry(**res.data[0])


def _count_likes(supabase, guestbook_id: str) -> int:
    res = (
        supabase.table("guestbook_likes")
        .select("id", count="exact")
        .eq("guestbook_id", guestbook_id)
        .execute()
    )
    return res.count or 0


@router.post("/{guestbook_id}/like", response_model=LikeResponse)
async def like_guestbook(guestbook_id: UUID, user: CurrentUser) -> LikeResponse:
    """좋아요. 이미 눌렀으면 멱등 처리(현재 상태 반환)."""
    supabase = get_supabase()
    gid = str(guestbook_id)
    try:
        supabase.table("guestbook_likes").insert(
            {"guestbook_id": gid, "user_id": user["id"]}
        ).execute()
    except APIError as exc:
        if exc.code == _UNIQUE_VIOLATION:
            # 이미 좋아요 상태 — 멱등
            return LikeResponse(liked=True, like_count=_count_likes(supabase, gid))
        if exc.code == _FK_VIOLATION:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="방명록을 찾을 수 없습니다."
            ) from exc
        raise
    return LikeResponse(liked=True, like_count=_count_likes(supabase, gid))


@router.delete("/{guestbook_id}/like", response_model=LikeResponse)
async def unlike_guestbook(guestbook_id: UUID, user: CurrentUser) -> LikeResponse:
    """좋아요 취소. 누른 적 없어도 멱등 처리."""
    supabase = get_supabase()
    gid = str(guestbook_id)
    supabase.table("guestbook_likes").delete().eq("guestbook_id", gid).eq(
        "user_id", user["id"]
    ).execute()
    return LikeResponse(liked=False, like_count=_count_likes(supabase, gid))
