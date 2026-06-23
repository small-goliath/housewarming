"""Supabase Service Role 클라이언트.

Service Role 키는 RLS 를 자동 우회한다. 모든 DB/Storage 접근은 이 클라이언트로 수행한다.
절대 클라이언트(프론트)에 노출하지 않는다.
"""

from functools import lru_cache

from supabase import Client, create_client

from config import settings


@lru_cache
def get_supabase() -> Client:
    """Service Role 클라이언트 싱글턴."""
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError(
            "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다. backend/.env 확인."
        )
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
