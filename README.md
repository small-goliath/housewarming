# 집들이 초대 홈페이지

호스트 **도토리**의 내집마련 집들이 행사 소개 및 초대 손님 참여·관리·방명록 서비스.

- 기반 문서: [`docs/prd_v3.md`](docs/prd_v3.md)
- 아키텍처: **Next.js 15 (App Router)** 프론트 + **FastAPI** 백엔드 + **Supabase**(Auth/DB/Storage)
- 프론트는 DB에 직접 접근하지 않고 항상 FastAPI를 경유한다. Supabase RLS는 활성화 + deny-all(안전망), FastAPI는 Service Role로 접근한다.

## 기술 스택

| 영역 | 스택 |
|------|------|
| 프론트 | Next.js 15 · TypeScript · Tailwind CSS v4 · shadcn/ui(Base UI) · React Hook Form + Zod · Lucide |
| 인증 | `@supabase/ssr` (카카오 OAuth) |
| 백엔드 | FastAPI · uvicorn · supabase-py(Service Role) · httpx · Pydantic v2 |
| 인프라 | Supabase(PostgreSQL·Auth·Storage) · Vercel(프론트) · Docker(백엔드) |

> **Next.js 버전 정책**: Next.js 15 고정. `middleware.ts` 정식 API 사용. (16+ 업그레이드 시 `proxy.ts`로 전환 필요 — MVP 범위 밖)

## 최초 1회 환경 구성

```bash
# 1. Node 의존성
npm install

# 2. Python 가상환경 + 백엔드 의존성 (Python 3.12)
python3.12 -m venv backend/.venv
source backend/.venv/bin/activate      # Windows: backend\.venv\Scripts\activate
pip install -r backend/requirements.txt

# 3. 환경변수 파일 작성
cp .env.local.example .env.local       # Next.js
cp backend/.env.example backend/.env   # FastAPI
```

`.env.local`, `backend/.env`에 Supabase 프로젝트 키와 관리자 카카오 ID를 채운다.

## 개발 서버 실행

```bash
npm run dev
```

`concurrently`로 다음 두 서버가 동시에 실행된다.

- 프론트(Next.js): http://localhost:3000
- 백엔드(FastAPI): http://localhost:8000 (`/docs`에서 OpenAPI 문서 확인)

개별 실행이 필요하면 `npm run dev:frontend` / `npm run dev:backend`.

## 디렉토리 구조

```
/
├── app/                  ← Next.js App Router 페이지
├── components/           ← UI 컴포넌트 (components/ui = shadcn)
├── lib/                  ← apiFetch 래퍼, supabase 클라이언트, utils
├── public/banner.mp4     ← 메인 배너 동영상
├── middleware.ts         ← 인증 보호 라우팅 (Next.js 15)
├── backend/              ← FastAPI
│   ├── main.py · config.py
│   ├── routers/ · dependencies/ · schemas/
│   ├── Dockerfile · .dockerignore
│   └── requirements.txt · .env.example
└── docs/                 ← PRD 등 문서
```

## 빌드 / 검증

```bash
npm run build     # 프론트 프로덕션 빌드 + 타입 체크
npm run lint      # ESLint
```
