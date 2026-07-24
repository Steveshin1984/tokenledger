-- Supabase SQL 편집기(SQL Editor)에서 실행하세요.
create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- 이 테이블은 서버(Service Role Key)에서만 쓰기 때문에,
-- RLS(Row Level Security)를 켜고 별도 정책을 추가하지 않으면 기본적으로 모든 클라이언트 접근이 막힙니다.
alter table waitlist enable row level security;
