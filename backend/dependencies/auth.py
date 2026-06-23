"""인증/인가 의존성.

- verify_token: Supabase Auth 서버 직접 호출(GET /auth/v1/user)로 JWT 검증 (Issue C2).
  HS256 로컬 검증은 사용하지 않는다.
- require_auth: 인증 필수 엔드포인트용. 검증된 사용자 정보(dict) 반환.
- require_admin: 관리자 전용. profiles.kakao_id 를 ADMIN_KAKAO_IDS 와 대조 (Issue #3).
"""

from typing import Annotated

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import settings
from dependencies.supabase import get_supabase

_bearer = HTTPBearer(auto_error=True)


async def verify_token(token: str) -> dict:
    """Supabase Auth 서버로 토큰을 검증하고 user payload 를 반환한다.

    검증 실패(만료/위조 등) 시 401. payload['id'] == auth.users.id (= JWT sub).
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": settings.supabase_anon_key,
                },
            )
        except httpx.HTTPError as exc:  # 네트워크 오류 등
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Auth 서버 호출 실패",
            ) from exc

    if r.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return r.json()


async def require_auth(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> dict:
    """인증 필수. 검증된 사용자(dict)를 반환한다. (id = sub)"""
    return await verify_token(credentials.credentials)


# require_auth 로 검증된 사용자 dict 타입 별칭
CurrentUser = Annotated[dict, Depends(require_auth)]


async def require_admin(user: CurrentUser) -> dict:
    """관리자 전용.

    1. require_auth 로 JWT 검증 → id(sub) 확보
    2. profiles 에서 kakao_id 조회 (Service Role)
    3. ADMIN_KAKAO_IDS 와 대조, 미일치 시 403
    """
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    supabase = get_supabase()
    res = (
        supabase.table("profiles")
        .select("kakao_id")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    kakao_id = (res.data or {}).get("kakao_id") if res and res.data else None

    if not kakao_id or kakao_id not in settings.admin_kakao_ids_list:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다.",
        )
    return user


# require_admin 으로 검증된 관리자 dict 타입 별칭
AdminUser = Annotated[dict, Depends(require_admin)]
