-- =====================================================================
-- 0001_init_schema.sql — 테이블 스키마
-- PRD v3 '데이터베이스 스키마' 섹션 기준
-- =====================================================================

-- profiles (사용자 프로필) ------------------------------------------------
-- id 는 auth.users.id 를 그대로 사용한다 (기본값 없음, 앱에서 sub 주입).
create table if not exists public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  kakao_id           text,
  nickname           text,
  profile_image_url  text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()  -- 재로그인 upsert 시 갱신 (Issue L1)
);

-- housewarmings (집들이 이벤트) ------------------------------------------
create table if not exists public.housewarmings (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,                 -- 집들이명 (예: 그린나래)
  organization text,                          -- 편성 (예: 21대 총학생회)
  event_at     timestamptz not null,          -- 행사 일시 (UTC 저장, KST 표시)
  image_url    text,                          -- 대표 이미지 (Storage public URL)
  dress_code   text,
  note         text,                          -- 비고
  description  text,                          -- 상세 설명 (nullable)
  created_at   timestamptz not null default now()
);

-- participations (참여 기록) --------------------------------------------
-- user_id UNIQUE → 1인 1집들이 보장.
create table if not exists public.participations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references public.profiles (id) on delete cascade,
  housewarming_id uuid not null references public.housewarmings (id) on delete cascade,
  created_at      timestamptz not null default now()
);

create index if not exists idx_participations_housewarming
  on public.participations (housewarming_id);

-- guestbook (방명록) -----------------------------------------------------
-- user_id 는 추적용으로만 저장하고 API 응답에서는 항상 제외한다.
create table if not exists public.guestbook (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

-- 최신 100건 정렬 조회 최적화
create index if not exists idx_guestbook_created_at
  on public.guestbook (created_at desc);
