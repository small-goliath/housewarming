# 집들이 초대 홈페이지 MVP PRD v3

> 작성일: 2026-06-23 · 기반 문서: prd_v2.md + prd-validator 기술 검증 결과 (Critical 2 / High 5 / Medium 5 / Low 4 반영)
> 입주 예정: 2027년 10월 · 호스트: 도토리

---

## 변경 이력

| 버전 | 날짜 | 주요 변경 |
|------|------|-----------|
| v1 | 2026-06-19 | 최초 작성 (Next.js + Supabase 직접 접근) |
| v2 | 2026-06-23 | FastAPI 백엔드 레이어 추가 · 기술 검증 이슈 6개 반영 |
| v3 | 2026-06-23 | **보안 검증 반영**: RLS deny-all 전환 · JWT 검증 방식 교체 · 토큰 갱신/이미지 업로드/CORS 흐름 명세 |

### v3 이슈 반영 요약

| 심각도 | Issue | v2 문제 | v3 해결 방법 |
|--------|-------|---------|-------------|
| **Critical** | C1 RLS 비활성화 | RLS 끄면 anon key로 누구나 직접 DB 접근 | **RLS 활성화 + 정책 없음(deny-all)**. Service Role은 자동 우회 |
| **Critical** | C2 JWT 로컬 HS256 검증 | Supabase가 "강력히 비권장"하는 방식 | **Auth 서버 직접 호출** (`GET /auth/v1/user`) |
| High | H2 PUT 변경 원자성 엣지케이스 | 미참여자 PUT 시 0 rows → 200 오반환 | affected rows == 0 → **404 반환** 명세 |
| High | H3 이미지 업로드 흐름 | 업로드 경로 미명세 | **FastAPI multipart 경유 업로드** 엔드포인트 명세 |
| High | H4 토큰 만료 처리 | Access Token 만료 시 흐름 없음 | **401 → refreshSession → 재시도** 클라이언트 래퍼 명세 |
| High | H5 운영 CORS | localhost만 명세 | 운영 도메인 `ALLOWED_ORIGINS` 명세 추가 |
| Medium | M1~M5 | venv/공개EP/중복/Storage/타임존 미명세 | 각 항목 명세 추가 |
| Low | L1~L4 | updated_at/Dockerfile/LIMIT 등 | 명세 또는 MVP 이후 명시 |

> **Next.js 버전 정책**: 본 문서는 **Next.js 15**를 고정한다. Next.js 15에서 `middleware.ts`는 정식 API이므로 그대로 사용한다. (Next.js 16+에서는 `proxy.ts`로 변경되었으나 본 MVP 범위 밖이다. 향후 16+ 업그레이드 시 `npx @next/codemod middleware-to-proxy .` 적용.)

---

## 핵심 정보

**목적**: 호스트 도토리의 내집마련 집들이 행사를 소개하고, 초대 손님이 집들이를 선택해 참여 신청·관리·방명록 작성을 한 곳에서 처리할 수 있도록 한다.
**사용자**: 도토리가 초대한 지인(카카오 계정 보유자) 및 호스트 도토리(관리자)

---

## 시스템 아키텍처

```
┌──────────────────────────────────────────────────────────┐
│                     클라이언트 (브라우저)                  │
│              Next.js 15 (App Router, SSR/CSR)            │
│   - apiFetch() 래퍼: 401 시 refreshSession 후 1회 재시도   │
└──────────────┬───────────────────────────────────────────┘
               │ HTTP (REST)                  │ Supabase Auth
               │ Authorization: Bearer <JWT>  │ (카카오 OAuth)
               ▼                              ▼
┌──────────────────────────┐    ┌─────────────────────────┐
│   FastAPI (Python)       │    │   Supabase Auth         │
│   Port: 8000             │    │   (JWT 발급 / user 검증) │
│                          │    └─────────────────────────┘
│  - JWT 검증 (Auth 서버)   │              ▲
│  - 비즈니스 로직           │  GET /auth/v1/user         │
│  - 관리자 권한 판별        │──────────────┘
│  - 응답 스키마 제어        │
│  - 이미지 업로드 중계       │
└──────────────┬───────────┘
               │ Service Role (RLS 우회)
               ▼
┌──────────────────────────┐
│   Supabase PostgreSQL    │
│   (RLS 활성화, deny-all)  │
│   + Storage (이미지)      │
└──────────────────────────┘
```

### 아키텍처 원칙

- **Next.js**: UI 렌더링 + Supabase OAuth 흐름 처리. DB에 직접 접근하지 않음. FastAPI 호출은 `apiFetch()` 래퍼를 경유(토큰 자동 갱신 포함).
- **FastAPI**: 모든 보호된 비즈니스 로직 담당. Supabase JWT를 검증해 사용자 식별. Service Role로 DB 접근. 이미지 업로드도 중계.
- **Supabase**: 카카오 OAuth 인증(JWT 발급) + PostgreSQL DB + Storage. **RLS는 활성화하되 anon/authenticated 정책을 두지 않아 직접 접근을 차단**(Service Role은 자동 우회).
- **JWT 흐름**: 카카오 OAuth → Supabase Access Token 발급 → 클라이언트가 FastAPI 요청 시 `Authorization: Bearer <token>` 헤더에 포함 → **FastAPI가 Supabase Auth 서버(`GET /auth/v1/user`)로 토큰 검증**.

---

## 보안 설계 (v3 신규)

### JWT 검증 방식 (Issue C2 반영)

> **원칙**: 공유 비밀(HS256) 로컬 검증을 사용하지 않는다. Supabase 공식 권고에 따라 **Auth 서버 직접 호출** 방식을 사용한다. (JWKS/ES256 방식은 트래픽 증가 시 전환 옵션으로 예비.)

**방식 B — Auth 서버 직접 호출 (채택)**

```python
# backend/dependencies/auth.py
import httpx
from fastapi import HTTPException

async def verify_token(token: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": SUPABASE_ANON_KEY,
            },
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid token")
    return r.json()  # id = auth.users.id (= sub)
```

> **채택 근거**: Supabase 프로젝트의 JWT 서명 알고리즘(HS256/ES256) 설정에 무관하게 동작한다. JWKS 키 회전·캐시 관리가 불필요하고 코드가 단순하다. 매 인증 요청마다 Supabase Auth 서버로 1홉이 추가되지만, MVP 규모(소수 초대 손님)에서 실질적 지연은 무시할 수 있는 수준이다.

> **방식 A(JWKS/ES256)** 는 참고용으로만 남긴다. 트래픽이 늘어 Auth 서버 호출 비용이 문제가 될 경우 그때 전환한다.

### 토큰 만료 처리 (Issue H4 반영)

> Supabase Access Token 기본 만료는 1시간. 클라이언트는 `apiFetch()` 래퍼에서 401 수신 시 자동 갱신 후 1회 재시도한다.

```typescript
// lib/api.ts
import { createClient } from "@/lib/supabase/client";

export async function apiFetch(path: string, init: RequestInit = {}) {
  const supabase = createClient();
  let { data: { session } } = await supabase.auth.getSession();

  const call = (token?: string) =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  let res = await call(session?.access_token);

  if (res.status === 401) {
    // 토큰 만료 추정 → 갱신 후 1회 재시도
    const { data } = await supabase.auth.refreshSession();
    session = data.session;
    if (!session) {
      window.location.href = "/login";
      throw new Error("Session expired");
    }
    res = await call(session.access_token);
  }
  return res;
}
```

---

## 개발 환경 설정 (concurrently)

`npm run dev` 한 번으로 프론트엔드(Next.js)와 백엔드(FastAPI)를 동시에 실행한다.

### 사전 준비 (Issue M1 반영)

> **최초 1회 환경 구성** (README에 명시, 신규 개발자 온보딩용)

```bash
# 1. Node 의존성
npm install

# 2. Python 가상환경 + 백엔드 의존성
python3.12 -m venv backend/.venv
source backend/.venv/bin/activate      # Windows: backend\.venv\Scripts\activate
pip install -r backend/requirements.txt

# 3. 환경변수 파일 작성
cp .env.local.example .env.local       # Next.js
cp backend/.env.example backend/.env   # FastAPI
```

`package.json`의 `dev:backend`는 venv의 uvicorn을 사용하도록 경로를 고정한다.

### 디렉토리 구조

```
/                          ← 프로젝트 루트
├── app/                   ← Next.js App Router
├── components/
├── lib/
│   ├── api.ts             ← apiFetch() 래퍼 (토큰 갱신 포함)
│   └── supabase/          ← @supabase/ssr 클라이언트
├── public/
│   └── banner.mp4
├── middleware.ts          ← 인증 보호 라우팅 (Next.js 15 정식 API)
├── backend/               ← FastAPI 루트
│   ├── main.py
│   ├── .venv/             ← Python 가상환경 (gitignore)
│   ├── routers/
│   │   ├── auth.py
│   │   ├── housewarmings.py
│   │   ├── guestbook.py
│   │   └── admin.py
│   ├── dependencies/
│   │   ├── auth.py        ← JWT 검증(Auth 서버 호출) + require_auth/require_admin
│   │   └── supabase.py    ← Supabase Service Role 클라이언트
│   ├── schemas/           ← Pydantic 스키마
│   ├── Dockerfile         ← 운영 배포용 (Issue L3 반영)
│   ├── .dockerignore
│   ├── .env.example
│   └── requirements.txt
├── package.json
├── next.config.ts
└── .env.local
```

### package.json 스크립트

```json
{
  "scripts": {
    "dev": "concurrently \"next dev --turbopack\" \"npm:dev:backend\"",
    "dev:frontend": "next dev --turbopack",
    "dev:backend": "backend/.venv/bin/uvicorn backend.main:app --reload --port 8000",
    "build": "next build",
    "start": "next start"
  },
  "devDependencies": {
    "concurrently": "^9.x"
  }
}
```

### FastAPI 의존성 (backend/requirements.txt)

```
fastapi>=0.115
uvicorn[standard]>=0.32
supabase>=2.10                   # Supabase Python Client (Service Role)
pydantic>=2.9
pydantic-settings>=2.6
httpx>=0.27                      # Auth 서버 호출 (GET /auth/v1/user)
python-multipart>=0.0.12         # 이미지 업로드 (multipart/form-data)
```

---

## 사용자 여정

```
1. 메인 페이지 (비로그인)
   - 배너 동영상 + 집들이 소개 섹션 + "집들이 참여하기" CTA 버튼 확인

   ↓ CTA 버튼 클릭 or 내비게이션 "집들이 참여하기" 탭 클릭

2. 집들이 목록 페이지 (비로그인 열람 가능)
   - FastAPI GET /api/housewarmings 호출 (인증 없이) → 집들이 카드 목록 열람

   ↓ 카드 이미지 클릭 or 카드 내 "참여하기" 버튼 클릭

   [비로그인] → 로그인 페이지 이동 → 카카오 OAuth → /auth/callback
             → FastAPI POST /api/auth/profile (profiles upsert)
             → 집들이 상세 복귀
   [로그인]   → 집들이 상세 페이지 직접 진입

3. 집들이 상세 페이지 (로그인 필수)
   - apiFetch GET /api/housewarmings/{id} → 상세 정보 확인
   - apiFetch GET /api/housewarmings/{id}/participants → 참여자 목록 확인

   ↓

   [미참여]           → "참여하기" 버튼  → POST   /api/housewarmings/{id}/participate
   [현재 집들이 참여]  → "취소하기" 버튼  → DELETE /api/housewarmings/{id}/participate
   [다른 집들이 참여]  → "변경하기" 버튼  → PUT    /api/housewarmings/{id}/participate

4. 방명록 페이지 (로그인 필수)
   - apiFetch GET /api/guestbook → 메시지 목록 조회 (user_id 미포함, 최신 100건)
   - apiFetch POST /api/guestbook → 메시지 작성 (서버에서 user_id 저장)

5. 관리자 페이지 (관리자 전용)
   - apiFetch CRUD /api/admin/housewarmings
   - 이미지 업로드: apiFetch POST /api/admin/housewarmings/image (multipart)
   - 관리자 판별: FastAPI에서 JWT → profiles.kakao_id → ADMIN_KAKAO_IDS 환경변수 대조
```

---

## 기능 명세

### 1. MVP 핵심 기능

| ID | 기능명 | 설명 | 관련 엔드포인트 |
|----|--------|------|----------------|
| **F001** | 카카오 OAuth 로그인 | 카카오 계정으로 로그인, 닉네임·프로필 이미지 저장/표시, 로그아웃 | Supabase Auth (Next.js 처리) |
| **F002** | 메인 배너 동영상 | banner.mp4 자동재생·무음·루프·playsInline, 모바일 대응 | - (정적 파일) |
| **F003** | 집들이 소개 섹션 | 메인 페이지 행사 전반 소개 텍스트/이미지 | - (정적 콘텐츠) |
| **F004** | 집들이 목록 조회 | 집들이 카드 목록 (대표 이미지·명·편성·KST 일시), 비로그인 열람 허용 | `GET /api/housewarmings` |
| **F005** | 집들이 상세 조회 | 상세 정보 (이미지·명·편성·KST 일시·드레스코드·비고), 로그인 필수 | `GET /api/housewarmings/{id}` |
| **F006** | 참여 신청/취소/변경 | 1인 1집들이, 신청/취소/변경, 원자적 UPDATE 처리 + 미참여자 PUT 404 처리 | `POST/PUT/DELETE /api/housewarmings/{id}/participate` |
| **F007** | 참여자 목록 표시 | 닉네임·프로필 이미지 전체 표시, 페이지네이션 없음 | `GET /api/housewarmings/{id}/participants` |
| **F008** | 방명록 작성·열람 | 익명 작성(화면), user_id 저장(DB), 최신글 상단, 최신 100건 | `GET/POST /api/guestbook` |
| **F009** | 집들이 관리(CRUD) | 관리자 전용 등록·수정·삭제 | `GET/POST/PUT/DELETE /api/admin/housewarmings` |

### 2. MVP 필수 지원 기능

| ID | 기능명 | 설명 | 관련 위치 |
|----|--------|------|-----------|
| **F010** | 사용자 프로필 저장 | OAuth 콜백 후 kakao_id·닉네임·이미지 upsert (updated_at 갱신) | `POST /api/auth/profile` |
| **F011** | 인증 보호 라우팅 | Next.js 15 `middleware.ts`에서 보호 경로 세션 검사 | `middleware.ts` |
| **F012** | 관리자 접근 제어 | FastAPI에서 `ADMIN_KAKAO_IDS`와 profiles.kakao_id 대조 | FastAPI `dependencies/auth.py` |
| **F013** | 참여하기 CTA 진입점 | 메인 CTA 버튼 + 전역 내비게이션 탭 | 메인 페이지, 헤더 |
| **F014** | 이미지 업로드 중계 | 관리자 이미지를 FastAPI 경유로 Supabase Storage 업로드 (Issue H3) | `POST /api/admin/housewarmings/image` |
| **F015** | 토큰 자동 갱신 | 401 응답 시 refreshSession 후 1회 재시도 (Issue H4) | `lib/api.ts` |

---

## FastAPI 엔드포인트 명세

> Base URL: `http://localhost:8000` (개발) / `https://api.{domain}` (운영)
> 인증: `Authorization: Bearer <supabase_access_token>` 헤더 (공개 엔드포인트 제외)
> **인증 의존성 규칙 (Issue M2)**: "불필요" 엔드포인트는 `require_auth` 의존성을 **부착하지 않는다**. Authorization 헤더가 있어도 무시하고 공개 응답을 반환한다.

### 인증

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| `POST` | `/api/auth/profile` | 필수 | OAuth 콜백 후 profiles upsert. kakao_id는 `auth.identities`에서 추출 |

**POST /api/auth/profile — kakao_id 추출 명세 (Issue #1 반영)**

```
1. FastAPI가 Authorization 헤더의 JWT로 Supabase Auth 서버(`GET /auth/v1/user`) 호출해 검증
2. JWT payload에서 sub(= auth.users.id) 추출
3. Supabase Service Role로 사용자 메타데이터 조회 (supabase.auth.admin.get_user(sub)):
   - kakao_id: identities[provider='kakao'].identity_data['id']  (1순위)
               또는 raw_user_meta_data['provider_id']            (fallback)
   - nickname: raw_user_meta_data['name'] 또는 ['nickname']
   - profile_image_url: raw_user_meta_data['picture'] 또는 ['avatar_url']
4. kakao_id가 두 경로 모두 None이면 422 반환 (식별 불가 — 가입 차단)
5. profiles 테이블에 upsert (id = sub 기준), updated_at = NOW()
```

> **카카오 메타데이터 주의**: 위 키들은 카카오 API 응답에 의존하므로 fallback과 None 처리를 반드시 구현한다.

### 집들이

| Method | Path | 인증 | 설명 | 에러 응답 |
|--------|------|------|------|-----------|
| `GET` | `/api/housewarmings` | 불필요 | 집들이 목록 조회 (전체 공개) | - |
| `GET` | `/api/housewarmings/{id}` | 필수 | 집들이 상세 조회 | 404 (없는 id) |
| `GET` | `/api/housewarmings/{id}/participants` | 필수 | 참여자 목록 (nickname, profile_image_url만 반환) | 404 |
| `POST` | `/api/housewarmings/{id}/participate` | 필수 | 집들이 참여 신청 | 409 (이미 참여 중) |
| `PUT` | `/api/housewarmings/{id}/participate` | 필수 | 다른 집들이로 변경 **(단일 UPDATE, 원자적)** | **404 (미참여 상태)** |
| `DELETE` | `/api/housewarmings/{id}/participate` | 필수 | 참여 취소 | 404 (미참여 상태) |

**POST /api/housewarmings/{id}/participate — 신청 (Issue H2 관련)**

```
INSERT INTO participations (user_id, housewarming_id) VALUES ({uid}, {id});
- UNIQUE(user_id) 위반 시 → 409 Conflict 반환 ("이미 다른 집들이에 참여 중")
```

**PUT /api/housewarmings/{id}/participate — 원자적 변경 (Issue #4 + H2 반영)**

```sql
-- FastAPI에서 실행하는 단일 UPDATE 쿼리 (원자성 보장)
UPDATE participations
SET housewarming_id = {new_id}, created_at = NOW()
WHERE user_id = {current_user_id}
RETURNING id;
```

```
- RETURNING 결과가 0건(미참여 상태에서 PUT 요청) → 404 Not Found 반환
  (변경할 기존 참여 기록이 없음. 클라이언트는 POST로 유도)
- 1건 → 200 OK
```

### 방명록

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| `GET` | `/api/guestbook` | 필수 | 방명록 목록 조회 (content, created_at만 반환 — user_id 미포함, **최신 100건 LIMIT**) |
| `POST` | `/api/guestbook` | 필수 | 메시지 작성 (FastAPI에서 JWT로 user_id 추출 후 DB 저장) |

> **중복 작성 정책 (Issue M3)**: 동일 사용자의 방명록 다중 작성을 **허용**한다 (UNIQUE 제약 없음). 본인 글 수정/삭제는 MVP 이후.

**GET /api/guestbook 응답 스키마 (Issue #5 반영)**

```python
class GuestbookEntry(BaseModel):
    id: UUID
    content: str
    created_at: datetime  # UTC, 클라이언트에서 KST 변환
    # user_id 필드 없음 — 구조적 익명 보장

class GuestbookListResponse(BaseModel):
    entries: list[GuestbookEntry]  # created_at DESC, LIMIT 100
```

### 관리자

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| `GET` | `/api/admin/housewarmings` | 관리자 | 집들이 목록 (관리용) |
| `POST` | `/api/admin/housewarmings` | 관리자 | 집들이 등록 (image_url 포함, 사전 업로드된 URL) |
| `PUT` | `/api/admin/housewarmings/{id}` | 관리자 | 집들이 수정 |
| `DELETE` | `/api/admin/housewarmings/{id}` | 관리자 | 집들이 삭제 |
| `POST` | `/api/admin/housewarmings/image` | 관리자 | **이미지 업로드 (multipart/form-data) → Storage 저장 후 public URL 반환** |

**POST /api/admin/housewarmings/image — 이미지 업로드 흐름 (Issue H3 반영)**

```
1. require_admin() 통과
2. UploadFile 수신 (multipart/form-data, 필드명 'file')
3. 검증: content-type in [image/jpeg, image/png, image/webp], size <= 5MB
4. Service Role로 Supabase Storage 'housewarming-images' 버킷에 업로드
   - 파일명: {uuid4}.{ext}
5. public URL 반환: { "image_url": "https://.../storage/v1/object/public/housewarming-images/{name}" }
```

> 클라이언트는 이 URL을 받아 등록/수정 폼의 `image_url` 필드에 넣어 POST/PUT 한다. **클라이언트가 Storage에 직접 업로드하지 않는다.**

**관리자 판별 흐름 (Issue #3 반영)**

```
FastAPI Dependency: require_admin()
  1. Auth 서버 직접 호출로 JWT 검증 → id(sub) 추출
  2. profiles 테이블에서 kakao_id 조회 (Service Role 사용)
  3. ADMIN_KAKAO_IDS 환경변수(쉼표 구분) 파싱
  4. kakao_id가 허용 목록에 없으면 HTTP 403 반환
```

---

## 메뉴 구조

```
집들이 초대 홈페이지 내비게이션

[헤더 - 공통]
├── 로고/사이트명
├── 집들이 참여하기 (탭) — /housewarmings
├── 방명록 — /guestbook
└── [비로그인] 로그인 버튼
    [로그인]   닉네임 + 프로필 이미지
               └── 로그아웃

[관리자 전용 메뉴] (관리자 로그인 시에만 표시)
└── 관리자 — /admin
```

---

## 페이지별 상세 기능

### 메인 페이지

> **기능:** F002, F003, F013 | **인증:** 불필요

| 항목 | 내용 |
|------|------|
| **주요 기능** | • `banner.mp4` 히어로 영역 자동재생·무음·루프·playsInline (모바일 대응)<br>• 집들이 행사 전반 소개 텍스트/이미지 섹션<br>• **"집들이 참여하기"** CTA 버튼 → `/housewarmings` 이동<br>• 헤더에 "집들이 참여하기" 탭 표시 |

---

### 집들이 목록 페이지

> **기능:** F004, F013 | **인증:** 불필요 | **API:** `GET /api/housewarmings` (인증 의존성 없음)

| 항목 | 내용 |
|------|------|
| **주요 기능** | • 집들이 카드 목록 (대표 이미지, 집들이명, 편성, KST 일시)<br>• 카드 대표 이미지 클릭 → 집들이 상세 이동<br>• 카드 내 **"참여하기"** 버튼 클릭 → 집들이 상세 이동<br>• 비로그인 상태 목록 열람 가능 (상세 진입 시 로그인 유도)<br>• 대표 이미지는 Storage public URL 직접 표시 (공개 버킷) |

---

### 집들이 상세 페이지

> **기능:** F005, F006, F007, F011 | **인증:** 필수 (비로그인 차단)
> **API:** `GET /api/housewarmings/{id}`, `GET /api/housewarmings/{id}/participants`, `POST/PUT/DELETE /api/housewarmings/{id}/participate`

| 항목 | 내용 |
|------|------|
| **주요 기능** | • 상세 정보: 대표 이미지, 집들이명, 편성, KST 일시(`YYYY.MM.DD (요일) HH:mm KST`), 드레스코드, 비고<br>• **참여 상태별 버튼 분기:**<br>&nbsp;&nbsp;- 미참여 → **"참여하기"** → `POST` (409 시 "이미 참여 중" 안내)<br>&nbsp;&nbsp;- 현재 집들이 참여 중 → **"취소하기"** → `DELETE`<br>&nbsp;&nbsp;- 다른 집들이 참여 중 → **"변경하기"** → `PUT` (UPDATE 원자 처리, 404 시 POST로 fallback)<br>• 참여자 목록 전체: 닉네임 + 프로필 이미지 (페이지네이션 없음)<br>• 일시는 UTC 저장값을 클라이언트에서 KST 변환 표시 |

---

### 방명록 페이지

> **기능:** F008, F011 | **인증:** 필수
> **API:** `GET /api/guestbook`, `POST /api/guestbook`

| 항목 | 내용 |
|------|------|
| **주요 기능** | • 페이지 제목: **"도토리에게 하고싶은 말"**<br>• 메시지 작성 폼 (로그인 사용자만 노출)<br>• 작성 버튼 → `POST /api/guestbook` (FastAPI가 JWT로 user_id 추출 저장)<br>• 작성 폼 아래 게시글 목록: content·created_at만 표시, **작성자 정보 완전 익명**<br>• 정렬: 최신글 상단(created_at DESC), **최신 100건**<br>• **user_id는 API 응답에서 구조적으로 제외** (Pydantic 스키마 레벨 차단)<br>• created_at은 KST 변환 표시 |

---

### 로그인 페이지

> **기능:** F001 | **인증:** 불필요

| 항목 | 내용 |
|------|------|
| **주요 기능** | • **"카카오로 로그인"** 버튼 → Supabase Auth 카카오 OAuth 시작<br>• 원래 접근하려던 경로를 `redirectTo` 쿼리 파라미터로 보존 |

---

### 인증 콜백 페이지

> **기능:** F001, F010 | **인증:** 불필요 (OAuth 콜백 처리)

| 항목 | 내용 |
|------|------|
| **주요 기능** | • Supabase Auth 코드 교환 → Access Token(JWT) 발급<br>• `POST /api/auth/profile` 호출 → kakao_id 추출 + profiles upsert<br>&nbsp;&nbsp;- kakao_id 추출: `auth.identities`의 `identity_data['id']` (provider='kakao') / fallback `provider_id`<br>&nbsp;&nbsp;- nickname: `raw_user_meta_data['name']` 또는 `['nickname']`<br>&nbsp;&nbsp;- profile_image_url: `raw_user_meta_data['picture']` 또는 `['avatar_url']`<br>• 처리 완료 후 저장된 복귀 경로 또는 메인 페이지로 리디렉션 |

---

### 관리자 페이지

> **기능:** F009, F011, F012, F014 | **인증:** 필수 (관리자 전용)
> **API:** `GET/POST/PUT/DELETE /api/admin/housewarmings`, `POST /api/admin/housewarmings/image`

| 항목 | 내용 |
|------|------|
| **주요 기능** | • 집들이 목록 테이블 (관리용)<br>• **"집들이 등록"** → 등록 폼 (이미지·명·편성·일시·드레스코드·비고·상세설명)<br>• 이미지 업로드: 폼에서 파일 선택 → `POST /api/admin/housewarmings/image` (multipart) → 반환된 URL을 image_url로 사용<br>• 집들이별 **"수정"** / **"삭제"** 버튼<br>• 관리자 판별: FastAPI `require_admin()` 의존성 (`ADMIN_KAKAO_IDS` vs `profiles.kakao_id`)<br>• 비관리자 접근 시 HTTP 403 + 메인 페이지 리디렉션 |

---

## 데이터베이스 스키마

### profiles (사용자 프로필)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | `auth.users.id` 참조 |
| kakao_id | text | 카카오 고유 ID (`auth.identities.identity_data['id']`) |
| nickname | text | 카카오 닉네임 |
| profile_image_url | text | 카카오 프로필 이미지 URL |
| created_at | timestamptz | 최초 가입 시각 |
| updated_at | timestamptz | 마지막 프로필 갱신 시각 (재로그인 upsert 시 갱신, Issue L1) |

### housewarmings (집들이 이벤트)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | |
| name | text | 집들이명 (예: 그린나래) |
| organization | text | 편성 (예: 21대 총학생회) |
| event_at | timestamptz | 행사 일시 (UTC 저장, KST 표시) |
| image_url | text | 대표 이미지 URL (Supabase Storage public URL) |
| dress_code | text | 드레스코드 |
| note | text | 비고 |
| description | text (nullable) | 상세 설명 |
| created_at | timestamptz | |

### participations (참여 기록)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | |
| user_id | UUID → profiles.id | **UNIQUE** 제약 — 1인 1집들이 보장 |
| housewarming_id | UUID → housewarmings.id | |
| created_at | timestamptz | |

> **변경 처리**: `UPDATE participations SET housewarming_id = {new_id} WHERE user_id = {uid} RETURNING id` 단일 쿼리 사용. RETURNING 0건이면 404. DELETE+INSERT 방식 사용 금지(원자성 문제).
> **신청 처리**: INSERT 시 UNIQUE 위반(이미 참여 중) → 409.

### guestbook (방명록)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | |
| user_id | UUID → profiles.id | 작성자 추적용 (API 응답에서 항상 제외) |
| content | text | 메시지 내용 |
| created_at | timestamptz | 작성 시각 |

> 관리자 추적 쿼리:
> ```sql
> SELECT g.created_at, p.nickname, p.kakao_id, g.content
> FROM guestbook g
> JOIN profiles p ON p.id = g.user_id
> ORDER BY g.created_at DESC;
> ```

---

## RLS 정책 (Issue C1 반영 — 비활성화 → 활성화 + deny-all)

> **핵심 변경**: RLS를 **비활성화하지 않는다.** RLS를 **활성화**하되 anon/authenticated 역할에 정책을 부여하지 않아 직접 접근을 차단한다. Service Role은 RLS를 자동 우회하므로 FastAPI 동작에는 영향이 없다. 이로써 노출된 anon key로 PostgREST에 직접 접근해도 데이터가 보호된다.

```sql
-- 모든 테이블 RLS 활성화 (정책 없음 = anon/authenticated deny-all)
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE participations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook       ENABLE ROW LEVEL SECURITY;
ALTER TABLE housewarmings   ENABLE ROW LEVEL SECURITY;

-- housewarmings만 공개 읽기 허용 (목록 페이지 비로그인 열람)
CREATE POLICY "public read housewarmings"
  ON housewarmings FOR SELECT
  TO anon, authenticated
  USING (true);
-- INSERT/UPDATE/DELETE 정책 없음 → 직접 쓰기 불가 (FastAPI Service Role만)
```

| 테이블 | anon/authenticated 정책 | FastAPI(Service Role) |
|--------|------------------------|----------------------|
| profiles | **없음 (deny-all)** | 전체 조회/수정 (RLS 우회) |
| housewarmings | SELECT만 허용 / 쓰기 없음 | CRUD 전체 (RLS 우회) |
| participations | **없음 (deny-all)** | 원자적 UPDATE 등 (RLS 우회) |
| guestbook | **없음 (deny-all)** | 조회/삽입 (응답 스키마에서 user_id 제외) |

> **참고**: Next.js 클라이언트에서 Supabase anon key로 직접 DB에 접근하는 코드를 작성하지 않는다. 모든 데이터 접근은 FastAPI를 통한다. RLS deny-all은 이를 강제하는 안전망이다.

### Storage 버킷 정책 (Issue M4 반영)

| 항목 | 설정 |
|------|------|
| 버킷명 | `housewarming-images` |
| 공개 여부 | **Public** (비로그인 목록 페이지에서 이미지 표시 필요) |
| 업로드 권한 | Service Role만 (FastAPI 경유). 클라이언트 직접 업로드 정책 없음 |
| URL 방식 | public URL (`/storage/v1/object/public/...`) |

---

## 기술 스택

### 프론트엔드

| 항목 | 버전/기술 | 비고 |
|------|----------|------|
| 프레임워크 | **Next.js 15** (App Router) | 버전 고정 — `middleware.ts` 정식 사용 |
| 언어 | TypeScript 5.6+ | |
| 스타일링 | Tailwind CSS v4 + shadcn/ui | `tw-animate-css` 사용 (`tailwindcss-animate` 대체) |
| 아이콘 | Lucide React | |
| 폼 | React Hook Form 7 + Zod | 관리자 등록/수정 폼 |
| 인증 클라이언트 | `@supabase/ssr` | OAuth 흐름, 세션 관리, 자동 갱신 |
| API 호출 | `lib/api.ts` (apiFetch 래퍼) | 401 시 토큰 갱신 후 재시도 |

> **Next.js 15 비동기 params 패턴 (필수)**
> ```typescript
> // /app/housewarmings/[id]/page.tsx
> export default async function Page({ params }: { params: Promise<{ id: string }> }) {
>   const { id } = await params;  // await 필수
> }
> ```

### 백엔드

| 항목 | 버전/기술 | 비고 |
|------|----------|------|
| 프레임워크 | **FastAPI** 0.115+ | |
| 런타임 | uvicorn (ASGI) | `--reload` 플래그로 개발 중 핫리로드 |
| 언어 | Python 3.12+ | venv 권장 |
| JWT 검증 | `httpx` | **Supabase Auth 서버 직접 호출** (`GET /auth/v1/user`) — HS256 로컬 검증 금지 |
| DB 클라이언트 | `supabase-py` 2.10+ | Service Role 클라이언트 |
| 스키마 검증 | Pydantic v2 | 응답 스키마로 user_id 구조적 제외 |

### 인프라

| 항목 | 기술 | 비고 |
|------|------|------|
| DB / Auth / Storage | **Supabase** | PostgreSQL · 카카오 OAuth · 이미지 스토리지 |
| 프론트 배포 | Vercel | |
| 백엔드 배포 | Fly.io / Railway / Render (권장) | `backend/Dockerfile` 기반 FastAPI 배포 |
| 동시 실행 | concurrently | 개발 환경에서 npm run dev 한 번에 both 실행 |

---

## 환경변수

### .env.local (Next.js)

```
# Supabase (공개 — 클라이언트에서 OAuth 흐름에만 사용)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# FastAPI URL (클라이언트 → FastAPI 호출)
# 개발: http://localhost:8000 / 운영: https://api.{domain}
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### backend/.env (FastAPI)

```
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...                 # Auth 서버 호출 시 apikey 헤더용
SUPABASE_SERVICE_ROLE_KEY=eyJ...         # Service Role — 절대 클라이언트 노출 금지
# JWT 검증은 Auth 서버 직접 호출 사용 (SUPABASE_JWT_SECRET 불필요)

# 관리자 허용 목록 (카카오 ID, 쉼표 구분)
ADMIN_KAKAO_IDS=12345678,87654321

# CORS (Issue H5 — 개발/운영 모두 명세)
# 개발
ALLOWED_ORIGINS=http://localhost:3000
# 운영 예시 (Vercel 도메인 + Preview 패턴 포함)
# ALLOWED_ORIGINS=https://housewarming.vercel.app,https://www.도토리집들이.com
```

> `SUPABASE_SERVICE_ROLE_KEY`는 FastAPI Server 코드에서만 사용. `NEXT_PUBLIC_` 접두사 절대 금지.
> **HS256 JWT Secret은 v3에서 사용하지 않는다** (Auth 서버 직접 호출로 전환).

---

## 페이지 라우팅 (Next.js)

| 경로 | 페이지 | 로그인 필요 |
|------|--------|------------|
| `/` | 메인(배너 + 소개 + CTA) | ❌ |
| `/housewarmings` | 집들이 목록 | ❌ |
| `/housewarmings/[id]` | 집들이 상세 + 참여/참여자 목록 | ✅ |
| `/guestbook` | 방명록 | ✅ |
| `/login` | 카카오 로그인 | ❌ |
| `/auth/callback` | OAuth 콜백 + FastAPI profile upsert | ❌ |
| `/admin` | 관리자 집들이 CRUD | ✅ (관리자만) |

---

## MVP 이후 기능 (이번 릴리스 제외)

- 참여 정원/마감 로직
- 방명록 본인 글 수정/삭제, 페이지네이션(100건 초과 시)
- 관리자 권한 DB화 (`profiles.is_admin` 컬럼 — Issue L2, 현재는 `ADMIN_KAKAO_IDS` 환경변수)
- 알림(이메일/카카오 알림톡)
- 다국어, 검색/필터
- FastAPI 백그라운드 태스크 (통계 등)

---

## 요구사항 반영 체크리스트

| # | 원본 요구사항 | PRD v3 반영 위치 |
|---|-------------|----------------|
| 0 | 카카오 로그인 (닉네임·프로필 이미지) | F001, F010 / 인증 콜백 페이지 / `POST /api/auth/profile` |
| 1 | 메인 배너 동영상 (banner.mp4) | F002 / 메인 페이지 |
| 2 | 집들이 소개 섹션 | F003 / 메인 페이지 |
| 3 | "집들이 참여하기" CTA 버튼·탭 | F013 / 메인 페이지, 헤더 |
| 4 | 집들이 목록 (이미지·명·편성·KST 일시) | F004 / `GET /api/housewarmings` |
| 5 | 대표이미지·버튼 클릭 → 상세 진입 | F004, F005 |
| 5.1 | 상세 항목 (이미지·명·편성·일시·드레스코드·비고) | F005 / `GET /api/housewarmings/{id}` |
| 5.2 | 상세 진입부터 로그인 필수 | F011 / `middleware.ts` |
| 6 | 참여자 목록 (페이지네이션 없음) | F007 / `GET /api/housewarmings/{id}/participants` |
| 6.1 | 1인 1집들이 (UNIQUE 제약) | F006 / participations.user_id UNIQUE + FastAPI (POST 409 / PUT 404) |
| 7 | 방명록 익명 표시 + DB 작성자 추적 | F008 / `POST /api/guestbook` (user_id 저장) / Pydantic 스키마 제외 |
| 7.1 | 작성란 아래 시간순 목록 (최신글 상단) | F008 / `GET /api/guestbook` (created_at DESC, LIMIT 100) |

---

## v3 검증 이슈 대응 체크리스트

| 심각도 | ID | 대응 위치 |
|--------|----|-----------|
| Critical | C1 RLS deny-all | "RLS 정책" 섹션 — ENABLE + 정책 없음 |
| Critical | C2 Auth 서버 JWT 검증 | "보안 설계" 섹션 — 방식 B 채택, requirements |
| High | H1 Next.js 버전 정책 | 변경 이력 주석 — 15 고정, middleware.ts 유지 |
| High | H2 PUT 404 처리 | 집들이 엔드포인트 — RETURNING 0건 404 |
| High | H3 이미지 업로드 | `POST /api/admin/housewarmings/image` (F014) |
| High | H4 토큰 갱신 | "보안 설계" — apiFetch 래퍼 (F015) |
| High | H5 운영 CORS | 환경변수 — 운영 ALLOWED_ORIGINS |
| Medium | M1 venv 절차 | "사전 준비" 섹션 |
| Medium | M2 공개 EP 인증 | 엔드포인트 명세 인증 의존성 규칙 |
| Medium | M3 방명록 중복 | 방명록 섹션 — 다중 작성 허용 |
| Medium | M4 Storage 정책 | "Storage 버킷 정책" 섹션 |
| Medium | M5 타임존 | 각 페이지 — KST 변환 명시 |
| Low | L1 updated_at | profiles 스키마 |
| Low | L2 is_admin | MVP 이후 기능 |
| Low | L3 Dockerfile | 디렉토리 구조 |
| Low | L4 방명록 LIMIT | 방명록 — 최신 100건 |
