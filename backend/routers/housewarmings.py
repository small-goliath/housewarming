"""집들이 조회·참여 라우터.

PRD '집들이' 엔드포인트 명세 + participations 처리 규칙(POST 409 / PUT 404 / DELETE 404) 기준.
참여 변경은 단일 원자적 UPDATE 를 사용한다 (DELETE+INSERT 금지).
"""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from postgrest.exceptions import APIError

from dependencies.auth import CurrentUser
from dependencies.supabase import get_supabase
from schemas.housewarming import (
    HousewarmingResponse,
    MyParticipationResponse,
    ParticipantResponse,
    ParticipationResponse,
)

router = APIRouter(prefix="/api/housewarmings", tags=["housewarmings"])

_UNIQUE_VIOLATION = "23505"
_FK_VIOLATION = "23503"


def _ensure_housewarming_exists(supabase, housewarming_id: str) -> None:
    res = (
        supabase.table("housewarmings")
        .select("id")
        .eq("id", housewarming_id)
        .maybe_single()
        .execute()
    )
    if not res or not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="집들이를 찾을 수 없습니다.")


# ---------------------------------------------------------------------------
# 조회
# ---------------------------------------------------------------------------
@router.get("", response_model=list[HousewarmingResponse])
async def list_housewarmings() -> list[HousewarmingResponse]:
    """집들이 목록 (전체 공개, 인증 불필요)."""
    supabase = get_supabase()
    res = (
        supabase.table("housewarmings")
        .select("*")
        .order("event_at", desc=False)
        .execute()
    )
    return [HousewarmingResponse(**row) for row in (res.data or [])]


@router.get("/me/participation", response_model=MyParticipationResponse)
async def my_participation(user: CurrentUser) -> MyParticipationResponse:
    """현재 사용자가 참여 중인 집들이 id 반환 (미참여면 None). 상세 페이지 버튼 분기용."""
    supabase = get_supabase()
    res = (
        supabase.table("participations")
        .select("housewarming_id")
        .eq("user_id", user["id"])
        .maybe_single()
        .execute()
    )
    hw_id = (res.data or {}).get("housewarming_id") if res and res.data else None
    return MyParticipationResponse(housewarming_id=hw_id)


@router.get("/{housewarming_id}", response_model=HousewarmingResponse)
async def get_housewarming(housewarming_id: UUID, user: CurrentUser) -> HousewarmingResponse:
    """집들이 상세 (로그인 필수)."""
    supabase = get_supabase()
    res = (
        supabase.table("housewarmings")
        .select("*")
        .eq("id", str(housewarming_id))
        .maybe_single()
        .execute()
    )
    if not res or not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="집들이를 찾을 수 없습니다.")
    return HousewarmingResponse(**res.data)


@router.get("/{housewarming_id}/participants", response_model=list[ParticipantResponse])
async def list_participants(
    housewarming_id: UUID, user: CurrentUser
) -> list[ParticipantResponse]:
    """참여자 목록 (nickname, profile_image_url 만, 페이지네이션 없음)."""
    supabase = get_supabase()
    _ensure_housewarming_exists(supabase, str(housewarming_id))

    res = (
        supabase.table("participations")
        .select("profiles(nickname, profile_image_url)")
        .eq("housewarming_id", str(housewarming_id))
        .execute()
    )
    participants: list[ParticipantResponse] = []
    for row in res.data or []:
        profile = row.get("profiles") or {}
        participants.append(ParticipantResponse(**profile))
    return participants


# ---------------------------------------------------------------------------
# 참여 신청 / 변경 / 취소
# ---------------------------------------------------------------------------
@router.post("/{housewarming_id}/participate", response_model=ParticipationResponse,
             status_code=status.HTTP_201_CREATED)
async def participate(housewarming_id: UUID, user: CurrentUser) -> ParticipationResponse:
    """참여 신청. UNIQUE(user_id) 위반 시 409 (이미 다른 집들이 참여 중)."""
    supabase = get_supabase()
    _ensure_housewarming_exists(supabase, str(housewarming_id))

    try:
        res = (
            supabase.table("participations")
            .insert({"user_id": user["id"], "housewarming_id": str(housewarming_id)})
            .execute()
        )
    except APIError as exc:
        if exc.code == _UNIQUE_VIOLATION:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="이미 다른 집들이에 참여 중입니다.",
            ) from exc
        raise
    return ParticipationResponse(**res.data[0])


@router.put("/{housewarming_id}/participate", response_model=ParticipationResponse)
async def change_participation(
    housewarming_id: UUID, user: CurrentUser
) -> ParticipationResponse:
    """다른 집들이로 변경 (단일 UPDATE, 원자적). 미참여 상태에서 호출 시 404."""
    supabase = get_supabase()
    _ensure_housewarming_exists(supabase, str(housewarming_id))

    now_iso = datetime.now(timezone.utc).isoformat()
    res = (
        supabase.table("participations")
        .update({"housewarming_id": str(housewarming_id), "created_at": now_iso})
        .eq("user_id", user["id"])
        .execute()
    )
    # RETURNING 0건 → 변경할 기존 참여 기록 없음 → 404 (클라이언트는 POST 로 유도)
    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="참여 기록이 없습니다. 먼저 참여 신청이 필요합니다.",
        )
    return ParticipationResponse(**res.data[0])


@router.delete("/{housewarming_id}/participate", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_participation(housewarming_id: UUID, user: CurrentUser) -> None:
    """참여 취소. 해당 집들이에 참여 중이 아니면 404."""
    supabase = get_supabase()
    res = (
        supabase.table("participations")
        .delete()
        .eq("user_id", user["id"])
        .eq("housewarming_id", str(housewarming_id))
        .execute()
    )
    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 집들이에 참여 중이 아닙니다.",
        )
    return None
