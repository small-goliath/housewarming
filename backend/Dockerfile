# 운영 배포용 FastAPI 이미지 (Fly.io / Railway / Render)
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# 의존성 먼저 설치 (레이어 캐시 활용)
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# 애플리케이션 코드 복사
COPY backend ./backend

EXPOSE 8000

# 운영에서는 --reload 미사용. 플랫폼이 주는 $PORT 우선.
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
