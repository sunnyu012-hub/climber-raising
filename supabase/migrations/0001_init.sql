-- 《클라이머 키우기》 초기 스키마
-- 적용:  supabase db push   또는  Supabase 대시보드 SQL Editor 에 붙여넣기
--
-- 원칙
--  1. 모든 사용자 데이터 테이블은 RLS 활성화 + auth.uid() = user_id 강제
--  2. service_role 키는 클라이언트에 두지 않는다 (anon key만 노출)
--  3. 시간·보상·랭킹 점수는 서버에서 계산한다 (아래 server_now / submit_attempt 참고)

-- ---------------------------------------------------------------- 확장
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- 프로필
create table if not exists public.profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  nickname     text not null check (char_length(nickname) between 1 and 20),
  crew_id      uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------- 세이브 슬롯
-- MVP는 게임 상태 전체를 jsonb 한 덩어리로 저장한다.
-- 랭킹/검증에 필요한 값만 생성 컬럼으로 꺼내 인덱싱한다.
create table if not exists public.save_slots (
  user_id      uuid not null references auth.users(id) on delete cascade,
  slot         smallint not null default 1,
  version      integer not null,
  state        jsonb not null,
  level        integer generated always as ((state->'climber'->>'level')::int) stored,
  money        bigint  generated always as ((state->'climber'->>'money')::bigint) stored,
  updated_at   timestamptz not null default now(),
  primary key (user_id, slot)
);
create index if not exists save_slots_level_idx on public.save_slots (level desc);

-- ---------------------------------------------------------------- 등반 기록
-- SERVER-AUTHORITY: 클라이언트가 직접 insert 하지 못한다.
-- 아래 RLS 정책은 select 만 허용하고, insert 는 security definer 함수를 통해서만 한다.
create table if not exists public.attempts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  problem_id   text not null,
  gym_id       text not null,
  grade        smallint not null,
  cleared      boolean not null,
  onsight      boolean not null default false,
  steps_taken  smallint not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists attempts_user_idx on public.attempts (user_id, created_at desc);
create index if not exists attempts_problem_idx on public.attempts (problem_id, cleared);

-- ---------------------------------------------------------------- 인벤토리 / NPC 관계
create table if not exists public.inventory_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  item_id      text not null,
  quantity     integer not null default 1 check (quantity >= 0),
  equipped     boolean not null default false,
  acquired_at  timestamptz not null default now(),
  unique (user_id, item_id)
);

create table if not exists public.npc_relationships (
  user_id      uuid not null references auth.users(id) on delete cascade,
  npc_id       text not null,
  friendship   integer not null default 0 check (friendship between 0 and 100),
  updated_at   timestamptz not null default now(),
  primary key (user_id, npc_id)
);

-- ---------------------------------------------------------------- 크루
create table if not exists public.crews (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique check (char_length(name) between 2 and 20),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  region_id    text not null default 'busan',
  created_at   timestamptz not null default now()
);

create table if not exists public.crew_members (
  crew_id      uuid not null references public.crews(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'member' check (role in ('owner', 'member')),
  joined_at    timestamptz not null default now(),
  primary key (crew_id, user_id)
);

-- ---------------------------------------------------------------- 랭킹
-- SERVER-AUTHORITY: score 는 반드시 서버에서 계산해 기록한다.
create table if not exists public.ranking_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  season       text not null,
  category     text not null,   -- 'growth' | 'max_grade' | 'onsight' | 'reach' | 'social' | ...
  score        numeric not null,
  updated_at   timestamptz not null default now(),
  unique (user_id, season, category)
);
create index if not exists ranking_lookup_idx on public.ranking_entries (season, category, score desc);

-- ---------------------------------------------------------------- 서버 시간
-- 기기 로컬 시간 조작으로 오프라인 보상을 부풀리지 못하게 한다.
create or replace function public.server_now()
returns timestamptz
language sql
stable
as $$ select now() $$;

grant execute on function public.server_now() to anon, authenticated;

-- ---------------------------------------------------------------- RLS
alter table public.profiles           enable row level security;
alter table public.save_slots         enable row level security;
alter table public.attempts           enable row level security;
alter table public.inventory_items    enable row level security;
alter table public.npc_relationships  enable row level security;
alter table public.crews              enable row level security;
alter table public.crew_members       enable row level security;
alter table public.ranking_entries    enable row level security;

-- 본인 데이터만 읽고 쓴다
create policy "own profile"     on public.profiles          for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own save"        on public.save_slots        for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own inventory"   on public.inventory_items   for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own npc"         on public.npc_relationships for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 등반 기록: 읽기는 본인만, 쓰기는 서버 함수만 (insert 정책 없음 = 클라이언트 insert 차단)
create policy "read own attempts" on public.attempts for select
  using (auth.uid() = user_id);

-- 랭킹: 누구나 읽고, 쓰기는 서버 함수만
create policy "read rankings"   on public.ranking_entries   for select
  using (true);

-- 크루: 멤버는 읽을 수 있고, 만든 사람만 수정한다
create policy "read crews"      on public.crews             for select using (true);
create policy "own crew write"  on public.crews             for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "read crew members" on public.crew_members    for select using (true);
create policy "join self"       on public.crew_members      for insert
  with check (auth.uid() = user_id);
create policy "leave self"      on public.crew_members      for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------- 다음 단계 (미구현)
-- create function public.submit_attempt(...) security definer  -- 완등 판정 서버 재계산
-- create function public.advance_schedule(...) security definer -- 오프라인 진행 서버 재계산
-- create function public.recompute_ranking(season text) security definer
--
-- 이 세 함수를 만들기 전까지는 로컬 계산이 임시로 신뢰된다.
-- 랭킹을 실제로 오픈하기 전에 반드시 서버 재계산으로 전환할 것.
