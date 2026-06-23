"""FastAPI 진입점.

- CORS 미들웨어 (ALLOWED_ORIGINS 환경변수 기반)
- 라우터 등록은 Task #3 이후 단계에서 채워진다.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import admin, auth, guestbook, housewarmings

app = FastAPI(title="집들이 초대 홈페이지 API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(housewarmings.router)
app.include_router(guestbook.router)
app.include_router(admin.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
