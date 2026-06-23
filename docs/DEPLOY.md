# 배포 가이드

집들이 초대 홈페이지는 **프론트(Vercel)** 와 **백엔드(Docker 기반 FastAPI)** 를 분리 배포한다.
Supabase(DB/Auth/Storage)는 이미 운영 중인 클라우드 프로젝트를 사용한다.

```
[브라우저] → Vercel(Next.js) → FastAPI(Fly/Railway/Render) → Supabase
                  └ Supabase Auth(카카오 OAuth)
```

## 0. 배포 전 체크리스트

- [ ] Supabase 프로젝트 생성 + 마이그레이션 적용 (`supabase/README.md` 참고)
- [ ] 카카오 OAuth Provider 연결 + Redirect URL 에 운영 도메인 추가
- [ ] 백엔드 먼저 배포 → 백엔드 URL 확보 → 프론트 `NEXT_PUBLIC_API_URL` 에 주입
- [ ] 백엔드 `ALLOWED_ORIGINS` 에 Vercel 운영/프리뷰 도메인 추가

## 1. 백엔드 배포 (FastAPI / Docker)

`backend/Dockerfile` 로 컨테이너를 빌드한다. 컨텍스트는 **저장소 루트**여야 한다
(`COPY backend ...` 경로 기준).

### 공통 환경변수 (운영)

```
SUPABASE_URL=https://<프로젝트>.supabase.co
SUPABASE_ANON_KEY=<anon>
SUPABASE_SERVICE_ROLE_KEY=<service_role>   # 절대 외부 노출 금지
ADMIN_KAKAO_IDS=<관리자 카카오 ID, 쉼표구분>
ALLOWED_ORIGINS=https://<vercel-운영도메인>,https://<vercel-프리뷰패턴>
```

### Fly.io (권장)

```bash
# 최초
fly launch --no-deploy --dockerfile backend/Dockerfile   # 또는 backend/fly.toml.example 참고
fly secrets set SUPABASE_URL=... SUPABASE_ANON_KEY=... \
  SUPABASE_SERVICE_ROLE_KEY=... ADMIN_KAKAO_IDS=... \
  ALLOWED_ORIGINS=https://<vercel-도메인>
# 배포
fly deploy --config backend/fly.toml --dockerfile backend/Dockerfile
```

### Railway / Render

- 새 서비스 → 이 저장소 연결 → **Root Directory = 저장소 루트**, **Dockerfile path = `backend/Dockerfile`**
- 위 환경변수 등록
- 포트: 컨테이너는 `$PORT`(없으면 8000)로 listen 하므로 플랫폼 자동 주입과 호환됨

배포 후 `https://<백엔드도메인>/health` 가 `{"status":"ok"}` 를 반환하는지 확인한다.

## 2. 프론트 배포 (Vercel)

- Vercel 프로젝트 → 이 저장소 연결. **Framework: Next.js**, Root Directory: 저장소 루트.
- `.vercelignore` 로 `backend/`, `supabase/`, `docs/` 는 빌드에서 제외된다.
- 환경변수:

```
NEXT_PUBLIC_SUPABASE_URL=https://<프로젝트>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>
NEXT_PUBLIC_API_URL=https://<백엔드도메인>     # 1단계에서 배포한 백엔드 URL
```

> `NEXT_PUBLIC_*` 만 클라이언트에 노출된다. Service Role 키는 절대 프론트 환경변수에 넣지 않는다.

## 3. 배포 후 연동 확인

1. Vercel 도메인을 백엔드 `ALLOWED_ORIGINS` 에 추가했는지 재확인 (CORS, Issue H5)
2. Supabase Auth → URL Configuration → Redirect URLs 에 `https://<vercel-도메인>/auth/callback` 추가
3. 카카오 개발자 콘솔 Redirect URI 에 `https://<프로젝트>.supabase.co/auth/v1/callback` 확인
4. 로그인 → 집들이 목록/상세/참여/방명록/(관리자) 전 흐름 스모크 테스트

## 4. 트러블슈팅

| 증상 | 원인/해결 |
|------|-----------|
| 로그인 후 CORS 에러 | 백엔드 `ALLOWED_ORIGINS` 에 Vercel 도메인 누락 |
| 401 반복 | `NEXT_PUBLIC_API_URL` 오타 / 백엔드 다운 / 토큰 갱신 실패 |
| 목록 이미지 안 보임 | Storage 버킷 public 여부, `next.config.ts` remotePatterns 도메인 |
| 관리자 진입 불가 | `ADMIN_KAKAO_IDS` 에 본인 `profiles.kakao_id` 등록 여부 |
