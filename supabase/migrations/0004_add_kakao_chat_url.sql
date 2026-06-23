-- 집들이에 카카오톡 오픈채팅방 URL 컬럼 추가
alter table public.housewarmings
  add column if not exists kakao_open_chat_url text;
