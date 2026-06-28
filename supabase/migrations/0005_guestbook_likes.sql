-- =====================================================================
-- 0005_guestbook_likes.sql — 방명록 좋아요
-- 1인 1좋아요 (UNIQUE), 익명 집계.
-- =====================================================================

create table if not exists public.guestbook_likes (
  id           uuid primary key default gen_random_uuid(),
  guestbook_id uuid not null references public.guestbook (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (guestbook_id, user_id)
);

create index if not exists idx_guestbook_likes_guestbook
  on public.guestbook_likes (guestbook_id);

-- RLS 활성화 + 정책 없음 (deny-all). Service Role(FastAPI)만 접근.
alter table public.guestbook_likes enable row level security;
