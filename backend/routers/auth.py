"""인증 관련 라우터.

POST /api/auth/profile — OAuth 콜백 후 profiles upsert.
PRD 'POST /api/auth/profile — kakao_id 추출 명세' 기준.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status

from backend.config import settings
from backend.dependencies.auth import CurrentUser
from backend.dependencies.supabase import get_supabase
from backend.schemas.profile import MeResponse, ProfileResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _extract_kakao_id(identities: list[dict], meta: dict) -> str | None:
    """kakao_id 추출: identities(provider=kakao).identity_data['id'] 1순위,
    raw_user_meta_data['provider_id'] fallback."""
    for identity in identities or []:
        if identity.get("provider") == "kakao":
            data = identity.get("identity_data") or {}
            kid = data.get("id")
            if kid is not None:
                return str(kid)
    provider_id = meta.get("provider_id")
    return str(provider_id) if provider_id is not None else None


def _first(meta: dict, *keys: str) -> str | None:
    for key in keys:
        val = meta.get(key)
        if val:
            return str(val)
    return None


@router.post("/profile", response_model=ProfileResponse)
async def upsert_profile(user: CurrentUser) -> ProfileResponse:
    """검증된 JWT 사용자 메타데이터에서 카카오 정보를 추출해 profiles upsert.

    user 는 require_auth(GET /auth/v1/user 응답)로 이미 검증되었으며
    identities 와 user_metadata 를 포함한다.
    """
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    identities = user.get("identities") or []
    meta = user.get("user_metadata") or {}

    kakao_id = _extract_kakao_id(identities, meta)
    if kakao_id is None:
        # 두 경로 모두 None → 식별 불가, 가입 차단
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="카카오 사용자 식별 정보(kakao_id)를 찾을 수 없습니다.",
        )

    nickname = _first(meta, "name", "nickname")
    profile_image_url = _first(meta, "picture", "avatar_url")

    now_iso = datetime.now(timezone.utc).isoformat()
    payload = {
        "id": user_id,
        "kakao_id": kakao_id,
        "nickname": nickname,
        "profile_image_url": profile_image_url,
        "updated_at": now_iso,
    }

    supabase = get_supabase()
    res = supabase.table("profiles").upsert(payload, on_conflict="id").execute()

    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="프로필 저장에 실패했습니다.",
        )
    return ProfileResponse(**res.data[0])


@router.get("/me", response_model=MeResponse)
async def get_me(user: CurrentUser) -> MeResponse:
    """현재 로그인 사용자 프로필 + 관리자 여부 반환.

    profiles 미등록(콜백 upsert 이전)이면 404 — 클라이언트는 재로그인/콜백 유도.
    """
    user_id = user.get("id")
    supabase = get_supabase()
    res = (
        supabase.table("profiles")
        .select("id, kakao_id, nickname, profile_image_url")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    if not res or not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="프로필이 없습니다.")

    profile = res.data
    is_admin = bool(profile.get("kakao_id")) and profile["kakao_id"] in settings.admin_kakao_ids_list
    return MeResponse(**profile, is_admin=is_admin)
