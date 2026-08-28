-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Teams Table (Stores the access codes for the 15 teams)
create table public.teams (
  id uuid primary key default uuid_generate_v4(),
  access_code text unique not null,
  assigned_domain text not null -- e.g., 'hospital', 'credit', 'school', 'shopping', 'cinema'
);

-- 2. Sessions Table (The cheat-proof timer and token state)
create table public.sessions (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references public.teams(id) not null,
  start_time timestamp with time zone default now() not null,
  completed_at timestamp with time zone,
  tokens_remaining integer default 15 not null,
  domain_hypothesis text,
  bias_flag text,
  safety_patch text,
  status text default 'active' -- 'active', 'completed', 'timeout'
);

-- 3. Queries Table (Audit log for Round 2 & 3)
create table public.queries (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.sessions(id) not null,
  input_text text not null,
  output_text text not null,
  created_at timestamp with time zone default now() not null
);

-- Enable Realtime for the sessions table so the UI (timer & tokens) updates instantly across laptops
begin;
  -- remove the supabase_realtime publication
  drop publication if exists supabase_realtime;
  -- re-create it
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table sessions;

-- Basic RLS (Row Level Security) - allow anon read/write for the event
alter table public.teams enable row level security;
alter table public.sessions enable row level security;
alter table public.queries enable row level security;

create policy "Allow public read teams" on public.teams for select using (true);
create policy "Allow public all sessions" on public.sessions for all using (true) with check (true);
create policy "Allow public all queries" on public.queries for all using (true) with check (true);

-- Insert a test team so we can login with 'ALPHA-99'
insert into public.teams (access_code, assigned_domain) values ('ALPHA-99', 'hospital');
