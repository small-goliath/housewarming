# Supabase 설정 가이드

PRD v3 기준 Supabase 프로젝트 초기 설정 절차. SQL 마이그레이션은 코드로 제공하고,
대시보드에서만 가능한 작업(카카오 OAuth 등)은 체크리스트로 안내한다.

## 1. 프로젝트 생성

1. https://supabase.com 에서 새 프로젝트 생성 (리전: `Northeast Asia (Seoul)` 권장)
2. 생성 후 **Project Settings → API** 에서 아래 값 확보:
   - `Project URL` → `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` 키 → `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` 키 → `SUPABASE_SERVICE_ROLE_KEY` (**백엔드 전용, 클라이언트 노출 금지**)

## 2. DB 스키마 · RLS · Storage 적용

**SQL Editor** 에서 아래 순서대로 실행한다. (또는 Supabase CLI `supabase db push`)

1. `migrations/0001_init_schema.sql` — 테이블 생성
2. `migrations/0002_rls.sql` — RLS 활성화 + deny-all (housewarmings만 공개 읽기)
3. `migrations/0003_storage.sql` — `housewarming-images` public 버킷 생성

> RLS 는 **끄지 않는다.** 활성화 + 정책 없음(deny-all)이 의도된 설계다.
> 모든 데이터 접근은 FastAPI(Service Role)를 경유하며, deny-all 은 노출된 anon key
> 직접 접근을 막는 안전망이다.

### 적용 확인

- **Table Editor**: profiles / housewarmings / participations / guestbook 4개 테이블 존재
- **Authentication → Policies**: 4개 테이블 모두 "RLS enabled", housewarmings 에 `public read housewarmings` SELECT 정책 1개
- **Storage**: `housewarming-images` 버킷이 `Public` 상태

## 3. 카카오 OAuth Provider 설정 (대시보드 수동)

### 3-1. 카카오 개발자 콘솔 (https://developers.kakao.com)

1. **내 애플리케이션 → 애플리케이션 추가**
2. **앱 키 → REST API 키** 확보 → Supabase 의 `Client ID` 로 사용
3. **카카오 로그인 → 활성화 ON**
4. **카카오 로그인 → Redirect URI** 등록:
   ```
   https://<프로젝트>.supabase.co/auth/v1/callback
   ```
5. **카카오 로그인 → 보안 → Client Secret** 생성·활성화 → Supabase 의 `Client Secret` 으로 사용
6. **카카오 로그인 → 동의 항목**: 닉네임(`profile_nickname`), 프로필 사진(`profile_image`) 동의 ON
   - 닉네임/이미지가 `raw_user_meta_data` 에 채워지려면 필수

### 3-2. Supabase 대시보드

1. **Authentication → Providers → Kakao** 활성화
2. `Client ID` (REST API 키), `Client Secret` 입력 후 저장
3. **Authentication → URL Configuration → Redirect URLs** 에 프론트 콜백 추가:
   ```
   http://localhost:3000/auth/callback
   https://<운영도메인>/auth/callback
   ```

### 3-3. 카카오 메타데이터 주의

PRD 명세대로 FastAPI 의 `POST /api/auth/profile` 은 아래 경로에서 값을 추출하며
fallback 과 None 처리를 한다. 카카오 응답 키는 환경에 따라 달라질 수 있다.

| 필드 | 1순위 | fallback |
|------|-------|----------|
| kakao_id | `identities[provider=kakao].identity_data['id']` | `raw_user_meta_data['provider_id']` |
| nickname | `raw_user_meta_data['name']` | `raw_user_meta_data['nickname']` |
| profile_image_url | `raw_user_meta_data['picture']` | `raw_user_meta_data['avatar_url']` |

## 4. 관리자 지정

로그인 후 `profiles.kakao_id` 값을 확인하여, 관리자로 둘 카카오 ID 를
`backend/.env` 의 `ADMIN_KAKAO_IDS`(쉼표 구분)에 등록한다.

```
ADMIN_KAKAO_IDS=12345678,87654321
```
