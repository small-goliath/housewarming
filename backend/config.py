"""애플리케이션 설정 (pydantic-settings).

backend/.env 파일에서 환경변수를 로드한다.
"""

from functools import cached_property
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/.env (config.py 위치 기준). 로컬에서 사용하고, 운영(Docker/Vercel)에서는
# 파일이 없어도 무방하다 — 플랫폼 OS 환경변수에서 직접 읽는다.
_ENV_FILE = Path(__file__).resolve().parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # 관리자 허용 카카오 ID (쉼표 구분)
    admin_kakao_ids: str = ""

    # CORS 허용 오리진 (쉼표 구분)
    allowed_origins: str = "http://localhost:3000"

    @cached_property
    def admin_kakao_ids_list(self) -> list[str]:
        return [s.strip() for s in self.admin_kakao_ids.split(",") if s.strip()]

    @cached_property
    def allowed_origins_list(self) -> list[str]:
        return [s.strip() for s in self.allowed_origins.split(",") if s.strip()]


settings = Settings()
