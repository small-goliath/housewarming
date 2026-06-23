-- =====================================================================
-- 0002_rls.sql — RLS 활성화 + deny-all (Issue C1)
-- PRD v3 'RLS 정책' 섹션 기준
--
-- 핵심: RLS 를 끄지 않는다. 활성화하되 anon/authenticated 정책을
-- 두지 않아 직접 접근을 차단한다. Service Role(FastAPI)은 RLS 를
-- 자동 우회하므로 백엔드 동작에는 영향이 없다.
-- =====================================================================

-- 모든 테이블 RLS 활성화 (정책 없음 = anon/authenticated deny-all)
alter table public.profiles       enable row level security;
alter table public.participations enable row level security;
alter table public.guestbook      enable row level security;
alter table public.housewarmings  enable row level security;

-- housewarmings 만 공개 읽기 허용 (목록 페이지 비로그인 열람)
drop policy if exists "public read housewarmings" on public.housewarmings;
create policy "public read housewarmings"
  on public.housewarmings
  for select
  to anon, authenticated
  using (true);

-- housewarmings INSERT/UPDATE/DELETE 정책 없음 → 직접 쓰기 불가 (FastAPI Service Role 전용)
-- profiles / participations / guestbook 정책 없음 → 직접 접근 전면 차단
