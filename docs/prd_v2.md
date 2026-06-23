# 집들이 초대 홈페이지 MVP PRD v2

> 작성일: 2026-06-23 · 기반 문서: prd_v1.md + 기술 검증 결과 (6개 이슈 반영)
> 입주 예정: 2027년 10월 · 호스트: 도토리

---

## 변경 이력

| 버전 | 날짜 | 주요 변경 |
|------|------|-----------|
| v1 | 2026-06-19 | 최초 작성 (Next.js + Supabase 직접 접근) |
| v2 | 2026-06-23 | **FastAPI 백엔드 레이어 추가** · 기술 검증 이슈 6개 반영 |

### v2 이슈 반영 요약

| Issue | 내용 | v2 해결 방법 |
|-------|------|-------------|
| #1 kakao_id 추출 | 추출 방법 미명세 | FastAPI 콜백 엔드포인트에서 `identities` 테이블로 추출 명세화 |
| #2 Next.js 버전 | 미고정 | **Next.js 15** 고정 명시 |
| #3 housewarmings RLS | 환경변수 기반 관리자 RLS 구현 불가 | FastAPI가 Service Role로 DB 접근, 관리자 판별은 서버 코드에서 처리 |
| #4 participations 변경 원자성 | DELETE+INSERT 비원자 문제 | FastAPI에서 `housewarming_id UPDATE` 단일 쿼리로 확정 |
| #5 guestbook 컬럼 익명성 | RLS는 행 단위라 컬럼 차단 불가 | FastAPI 응답 스키마에서 `user_id` 필드 제거로 구조적 차단 |
| #6 profiles SELECT 차단 | "본인만" RLS → 참여자 목록 불가 | FastAPI Service Role 클라이언트가 JOIN 쿼리로 조회, RLS 제약 무관 |

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
└──────────────┬───────────────────────────────────────────┘
               │ HTTP (REST)                  │ Supabase Auth
               │ Authorization: Bearer <JWT>  │ (카카오 OAuth)
               ▼                              ▼
┌──────────────────────────┐    ┌─────────────────────────┐
│   FastAPI (Python)       │    │   Supabase Auth         │
│   Port: 8000             │    │   (JWT 발급)             │
│                          │    └─────────────────────────┘
│  - JWT 검증               │
│  - 비즈니스 로직           │
│  - 관리자 권한 판별        │
│  - 응답 스키마 제어        │
└──────────────┬───────────┘
               │ Service Role (RLS 우회)
               ▼
┌──────────────────────────┐
│   Supabase PostgreSQL    │
│   (DB 전용)              │
└──────────────────────────┘
```

### 아키텍처 원칙

- **Next.js**: UI 렌더링 + Supabase OAuth 흐름 처리. DB에 직접 접근하지 않음.
- **FastAPI**: 모든 보호된 비즈니스 로직 담당. Supabase JWT를 검증해 사용자 식별. Service Role로 DB 접근.
- **Supabase**: 카카오 OAuth 인증(JWT 발급) + PostgreSQL DB. RLS는 최소화.
- **JWT 흐름**: 카카오 OAuth → Supabase Access Token 발급 → 클라이언트가 FastAPI 요청 시 `Authorization: Bearer <token>` 헤더에 포함 → FastAPI가 Supabase JWT Secret으로 검증.

---

## 개발 환경 설정 (concurrently)

`npm run dev` 한 번으로 프론트엔드(Next.js)와 백엔드(FastAPI)를 동시에 실행한다.

### 디렉토리 구조

```
/                          ← 프로젝트 루트
├── app/                   ← Next.js App Router
├── components/
├── lib/
├── public/
│   └── banner.mp4
├── backend/               ← FastAPI 루트
│   ├── main.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── housewarmings.py
│   │   ├── guestbook.py
│   │   └── admin.py
│   ├── dependencies/
│   │   ├── auth.py        ← JWT 검증 의존성
│   │   └── supabase.py    ← Supabase 클라이언트
│   ├── schemas/           ← Pydantic 스키마
│   └── requirements.txt
├── package.json
├── next.config.ts
└── .env.local
```

### package.json 스크립트

```json
{
  "scripts": {
    "dev": "concurrently \"next dev --turbopack\" \"uvicorn backend.main:app --reload --port 8000\"",
    "dev:frontend": "next dev --turbopack",
    "dev:backend": "uvicorn backend.main:app --reload --port 8000",
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
python-jose[cryptography]>=3.3   # JWT 검증
supabase>=2.10                   # Supabase Python Client
pydantic>=2.9
pydantic-settings>=2.6
httpx>=0.27
python-multipart>=0.0.12
```

---

## 사용자 여정

```
1. 메인 페이지 (비로그인)
   - 배너 동영상 + 집들이 소개 섹션 + "집들이 참여하기" CTA 버튼 확인

   ↓ CTA 버튼 클릭 or 내비게이션 "집들이 참여하기" 탭 클릭

2. 집들이 목록 페이지 (비로그인 열람 가능)
   - FastAPI GET /api/housewarmings 호출 → 집들이 카드 목록 열람

   ↓ 카드 이미지 클릭 or 카드 내 "참여하기" 버튼 클릭

   [비로그인] → 로그인 페이지 이동 → 카카오 OAuth → /auth/callback
             → FastAPI POST /api/auth/profile (profiles upsert)
             → 집들이 상세 복귀
   [로그인]   → 집들이 상세 페이지 직접 진입

3. 집들이 상세 페이지 (로그인 필수)
   - FastAPI GET /api/housewarmings/{id} → 상세 정보 확인
   - FastAPI GET /api/housewarmings/{id}/participants → 참여자 목록 확인

   ↓

   [미참여]           → "참여하기" 버튼  → FastAPI POST /api/housewarmings/{id}/participate
   [현재 집들이 참여]  → "취소하기" 버튼  → FastAPI DELETE /api/housewarmings/{id}/participate
   [다른 집들이 참여]  → "변경하기" 버튼  → FastAPI PUT /api/housewarmings/{id}/participate

4. 방명록 페이지 (로그인 필수)
   - FastAPI GET /api/guestbook → 메시지 목록 조회 (user_id 미포함)
   - FastAPI POST /api/guestbook → 메시지 작성 (서버에서 user_id 저장)

5. 관리자 페이지 (관리자 전용)
   - FastAPI CRUD /api/admin/housewarmings
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
| **F006** | 참여 신청/취소/변경 | 1인 1집들이, 신청/취소/변경, 원자적 UPDATE 처리 | `POST/PUT/DELETE /api/housewarmings/{id}/participate` |
| **F007** | 참여자 목록 표시 | 닉네임·프로필 이미지 전체 표시, 페이지네이션 없음 | `GET /api/housewarmings/{id}/participants` |
| **F008** | 방명록 작성·열람 | 익명 작성(화면), user_id 저장(DB), 최신글 상단 | `GET/POST /api/guestbook` |
| **F009** | 집들이 관리(CRUD) | 관리자 전용 등록·수정·삭제 | `GET/POST/PUT/DELETE /api/admin/housewarmings` |

### 2. MVP 필수 지원 기능

| ID | 기능명 | 설명 | 관련 위치 |
|----|--------|------|-----------|
| **F010** | 사용자 프로필 저장 | OAuth 콜백 후 kakao_id·닉네임·이미지 upsert | `POST /api/auth/profile` |
| **F011** | 인증 보호 라우팅 | Next.js 15 `middleware.ts`에서 보호 경로 세션 검사 | `middleware.ts` |
| **F012** | 관리자 접근 제어 | FastAPI에서 `ADMIN_KAKAO_IDS`와 profiles.kakao_id 대조 | FastAPI `dependencies/auth.py` |
| **F013** | 참여하기 CTA 진입점 | 메인 CTA 버튼 + 전역 내비게이션 탭 | 메인 페이지, 헤더 |

---

## FastAPI 엔드포인트 명세

> Base URL: `http://localhost:8000` (개발) / `https://api.{domain}` (운영)
> 인증: `Authorization: Bearer <supabase_access_token>` 헤더 (공개 엔드포인트 제외)

### 인증

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| `POST` | `/api/auth/profile` | 필수 | OAuth 콜백 후 profiles upsert. kakao_id는 `auth.identities` 테이블에서 추출 |

**POST /api/auth/profile — kakao_id 추출 명세 (Issue #1 반영)**

```
1. FastAPI가 Authorization 헤더의 JWT를 Supabase JWT Secret으로 검증
2. JWT payload에서 sub(= auth.users.id) 추출
3. Supabase Service Role로 auth.users 조회:
   SELECT raw_user_meta_data FROM auth.users WHERE id = {sub}
   - kakao_id: raw_user_meta_data['provider_id'] 또는
               identities 테이블의 identity_data->>'id' (provider = 'kakao')
   - nickname: raw_user_meta_data['name'] 또는 ['nickname']
   - profile_image_url: raw_user_meta_data['picture'] 또는 ['avatar_url']
4. profiles 테이블에 upsert (id = sub 기준)
```

### 집들이

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| `GET` | `/api/housewarmings` | 불필요 | 집들이 목록 조회 (전체 공개) |
| `GET` | `/api/housewarmings/{id}` | 필수 | 집들이 상세 조회 |
| `GET` | `/api/housewarmings/{id}/participants` | 필수 | 참여자 목록 (nickname, profile_image_url만 반환) |
| `POST` | `/api/housewarmings/{id}/participate` | 필수 | 집들이 참여 신청 |
| `PUT` | `/api/housewarmings/{id}/participate` | 필수 | 다른 집들이로 변경 **(단일 UPDATE, 원자적)** |
| `DELETE` | `/api/housewarmings/{id}/participate` | 필수 | 참여 취소 |

**PUT /api/housewarmings/{id}/participate — 원자적 변경 (Issue #4 반영)**

```sql
-- FastAPI에서 실행하는 단일 UPDATE 쿼리 (원자성 보장)
UPDATE participations
SET housewarming_id = {new_id}, created_at = NOW()
WHERE user_id = {current_user_id};
```

### 방명록

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| `GET` | `/api/guestbook` | 필수 | 방명록 목록 조회 (content, created_at만 반환 — user_id 미포함) |
| `POST` | `/api/guestbook` | 필수 | 메시지 작성 (FastAPI에서 JWT로 user_id 추출 후 DB 저장) |

**GET /api/guestbook 응답 스키마 (Issue #5 반영)**

```python
class GuestbookEntry(BaseModel):
    id: UUID
    content: str
    created_at: datetime
    # user_id 필드 없음 — 구조적 익명 보장

class GuestbookListResponse(BaseModel):
    entries: list[GuestbookEntry]
```

### 관리자

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| `GET` | `/api/admin/housewarmings` | 관리자 | 집들이 목록 (관리용) |
| `POST` | `/api/admin/housewarmings` | 관리자 | 집들이 등록 |
| `PUT` | `/api/admin/housewarmings/{id}` | 관리자 | 집들이 수정 |
| `DELETE` | `/api/admin/housewarmings/{id}` | 관리자 | 집들이 삭제 |

**관리자 판별 흐름 (Issue #3 반영)**

```
FastAPI Dependency: require_admin()
  1. JWT 검증 → sub 추출
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

> **기능:** F004, F013 | **인증:** 불필요 | **API:** `GET /api/housewarmings`

| 항목 | 내용 |
|------|------|
| **주요 기능** | • 집들이 카드 목록 (대표 이미지, 집들이명, 편성, KST 일시)<br>• 카드 대표 이미지 클릭 → 집들이 상세 이동<br>• 카드 내 **"참여하기"** 버튼 클릭 → 집들이 상세 이동<br>• 비로그인 상태 목록 열람 가능 (상세 진입 시 로그인 유도) |

---

### 집들이 상세 페이지

> **기능:** F005, F006, F007, F011 | **인증:** 필수 (비로그인 차단)
> **API:** `GET /api/housewarmings/{id}`, `GET /api/housewarmings/{id}/participants`, `POST/PUT/DELETE /api/housewarmings/{id}/participate`

| 항목 | 내용 |
|------|------|
| **주요 기능** | • 상세 정보: 대표 이미지, 집들이명, 편성, KST 일시(`YYYY.MM.DD (요일) HH:mm KST`), 드레스코드, 비고<br>• **참여 상태별 버튼 분기:**<br>&nbsp;&nbsp;- 미참여 → **"참여하기"** → `POST /api/housewarmings/{id}/participate`<br>&nbsp;&nbsp;- 현재 집들이 참여 중 → **"취소하기"** → `DELETE /api/.../participate`<br>&nbsp;&nbsp;- 다른 집들이 참여 중 → **"변경하기"** → `PUT /api/.../participate` (UPDATE 원자 처리)<br>• 참여자 목록 전체: 닉네임 + 프로필 이미지 (페이지네이션 없음) |

---

### 방명록 페이지

> **기능:** F008, F011 | **인증:** 필수
> **API:** `GET /api/guestbook`, `POST /api/guestbook`

| 항목 | 내용 |
|------|------|
| **주요 기능** | • 페이지 제목: **"도토리에게 하고싶은 말"**<br>• 메시지 작성 폼 (로그인 사용자만 노출)<br>• 작성 버튼 → `POST /api/guestbook` (FastAPI가 JWT로 user_id 추출 저장)<br>• 작성 폼 아래 게시글 목록: content·created_at만 표시, **작성자 정보 완전 익명**<br>• 정렬: 최신글 상단(created_at DESC)<br>• **user_id는 API 응답에서 구조적으로 제외** (Pydantic 스키마 레벨 차단) |

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
| **주요 기능** | • Supabase Auth 코드 교환 → Access Token(JWT) 발급<br>• `POST /api/auth/profile` 호출 → kakao_id 추출 + profiles upsert<br>&nbsp;&nbsp;- kakao_id 추출: `auth.identities` 테이블의 `identity_data->>'id'` (provider='kakao')<br>&nbsp;&nbsp;- nickname: `raw_user_meta_data['name']` 또는 `['nickname']`<br>&nbsp;&nbsp;- profile_image_url: `raw_user_meta_data['picture']` 또는 `['avatar_url']`<br>• 처리 완료 후 저장된 복귀 경로 또는 메인 페이지로 리디렉션 |

---

### 관리자 페이지

> **기능:** F009, F011, F012 | **인증:** 필수 (관리자 전용)
> **API:** `GET/POST/PUT/DELETE /api/admin/housewarmings`

| 항목 | 내용 |
|------|------|
| **주요 기능** | • 집들이 목록 테이블 (관리용)<br>• **"집들이 등록"** → 등록 폼 (이미지·명·편성·일시·드레스코드·비고·상세설명)<br>• 집들이별 **"수정"** / **"삭제"** 버튼<br>• 이미지 업로드: Supabase Storage<br>• 관리자 판별: FastAPI `require_admin()` 의존성 (`ADMIN_KAKAO_IDS` vs `profiles.kakao_id`)<br>• 비관리자 접근 시 HTTP 403 + 메인 페이지 리디렉션 |

---

## 데이터베이스 스키마

### profiles (사용자 프로필)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | `auth.users.id` 참조 |
| kakao_id | text | 카카오 고유 ID (`auth.identities.identity_data->>'id'`) |
| nickname | text | 카카오 닉네임 |
| profile_image_url | text | 카카오 프로필 이미지 URL |
| created_at | timestamptz | 최초 가입 시각 |

### housewarmings (집들이 이벤트)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | |
| name | text | 집들이명 (예: 그린나래) |
| organization | text | 편성 (예: 21대 총학생회) |
| event_at | timestamptz | 행사 일시 (UTC 저장, KST 표시) |
| image_url | text | 대표 이미지 URL (Supabase Storage) |
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

> **변경 처리**: `UPDATE participations SET housewarming_id = {new_id} WHERE user_id = {uid}` 단일 쿼리 사용. DELETE+INSERT 방식 사용 금지(원자성 문제).

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

## RLS 정책 (간소화 — FastAPI Service Role 사용)

FastAPI는 Service Role 클라이언트를 사용하므로 RLS를 우회한다.
RLS는 직접 DB 접근 시 최소 안전망으로만 유지한다.

| 테이블 | RLS 정책 | 비고 |
|--------|----------|------|
| profiles | **비활성화** (Service Role만 접근) | FastAPI가 Service Role로 모든 조회/수정 처리 |
| housewarmings | SELECT: 전체 허용 / INSERT·UPDATE·DELETE: 비활성화 | FastAPI Service Role로 관리자 CRUD 처리 |
| participations | **비활성화** (Service Role만 접근) | FastAPI가 원자적 UPDATE 처리 |
| guestbook | **비활성화** (Service Role만 접근) | FastAPI 응답 스키마에서 user_id 구조적 제외 |

> **참고**: Next.js 클라이언트에서 Supabase anon key로 직접 DB에 접근하는 코드를 작성하지 않는다. 모든 데이터 접근은 FastAPI를 통한다.

---

## 기술 스택

### 프론트엔드

| 항목 | 버전/기술 | 비고 |
|------|----------|------|
| 프레임워크 | **Next.js 15** (App Router) | 버전 고정 — middleware.ts 사용 |
| 언어 | TypeScript 5.6+ | |
| 스타일링 | Tailwind CSS v4 + shadcn/ui | `tw-animate-css` 사용 (`tailwindcss-animate` 대체) |
| 아이콘 | Lucide React | |
| 폼 | React Hook Form 7 + Zod | 관리자 등록/수정 폼 |
| 인증 클라이언트 | `@supabase/ssr` | OAuth 흐름, 세션 관리 |

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
| 언어 | Python 3.12+ | |
| JWT 검증 | `python-jose[cryptography]` | Supabase JWT Secret으로 검증 |
| DB 클라이언트 | `supabase-py` 2.10+ | Service Role 클라이언트 |
| 스키마 검증 | Pydantic v2 | 응답 스키마로 user_id 구조적 제외 |

### 인프라

| 항목 | 기술 | 비고 |
|------|------|------|
| DB / Auth / Storage | **Supabase** | PostgreSQL · 카카오 OAuth · 이미지 스토리지 |
| 프론트 배포 | Vercel | |
| 백엔드 배포 | Fly.io / Railway / Render (권장) | Docker 기반 FastAPI 배포 |
| 동시 실행 | concurrently | 개발 환경에서 npm run dev 한 번에 both 실행 |

---

## 환경변수

### .env.local (Next.js)

```
# Supabase (공개 — 클라이언트에서 OAuth 흐름에만 사용)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# FastAPI URL (클라이언트 → FastAPI 호출)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### backend/.env (FastAPI)

```
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Service Role — 절대 클라이언트 노출 금지
SUPABASE_JWT_SECRET=your-jwt-secret  # JWT 검증용 (Supabase 대시보드 > Settings > API)

# 관리자 허용 목록 (카카오 ID, 쉼표 구분)
ADMIN_KAKAO_IDS=12345678,87654321

# 서버 설정
ALLOWED_ORIGINS=http://localhost:3000  # CORS (운영 시 도메인으로 변경)
```

> `SUPABASE_SERVICE_ROLE_KEY`는 FastAPI Server 코드에서만 사용. `NEXT_PUBLIC_` 접두사 절대 금지.

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
- 방명록 본인 글 수정/삭제
- 알림(이메일/카카오 알림톡)
- 다국어, 검색/필터
- FastAPI 백그라운드 태스크 (통계 등)

---

## 요구사항 반영 체크리스트

| # | 원본 요구사항 | PRD v2 반영 위치 |
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
| 6.1 | 1인 1집들이 (UNIQUE 제약) | F006 / participations.user_id UNIQUE + FastAPI |
| 7 | 방명록 익명 표시 + DB 작성자 추적 | F008 / `POST /api/guestbook` (user_id 저장) / Pydantic 스키마 제외 |
| 7.1 | 작성란 아래 시간순 목록 (최신글 상단) | F008 / `GET /api/guestbook` (created_at DESC) |
