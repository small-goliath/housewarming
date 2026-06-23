-- =====================================================================
-- 0003_storage.sql — Storage 버킷 (Issue M4)
-- PRD v3 'Storage 버킷 정책' 섹션 기준
--
-- housewarming-images : Public 버킷.
--   - 비로그인 목록 페이지에서 대표 이미지 표시가 필요하므로 public.
--   - 업로드는 Service Role(FastAPI 경유)만. 클라이언트 직접 업로드 정책 없음.
--   - URL 방식: public URL (/storage/v1/object/public/...)
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('housewarming-images', 'housewarming-images', true)
on conflict (id) do update set public = excluded.public;

-- storage.objects 에 anon/authenticated INSERT/UPDATE/DELETE 정책을 만들지 않는다.
-- → 클라이언트 직접 업로드 차단. Service Role 은 RLS 를 우회하므로 FastAPI 업로드는 정상 동작.
-- public 버킷이므로 읽기(다운로드)는 정책 없이도 public URL 로 가능.
