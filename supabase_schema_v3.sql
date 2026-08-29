-- Drop existing tables to ensure clean slate if needed
drop table if exists public.global_state cascade;
drop table if exists public.teams cascade;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. TEAMS TABLE (Flat structure for realtime leaderboard)
create table public.teams (
  team_id uuid primary key default uuid_generate_v4(),
  team_code text unique not null,
  tokens_used integer default 0 not null,
  final_report text,
  bias_type_found text,
  finished_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

-- 2. GLOBAL STATE TABLE (For the synchronized countdown timer)
create table public.global_state (
  id integer primary key default 1,
  timer_started_at timestamp with time zone,
  -- Ensure only one row ever exists (id = 1)
  constraint single_row check (id = 1)
);

-- Insert the default empty global state row
insert into public.global_state (id, timer_started_at) values (1, null);

-- Enable Realtime for both tables
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table global_state;

-- RLS Policies (Allow public access for the event)
alter table public.teams enable row level security;
alter table public.global_state enable row level security;

create policy "Allow public all on teams" on public.teams for all using (true) with check (true);
create policy "Allow public all on global_state" on public.global_state for all using (true) with check (true);

-- RPC Function: Deduct Tokens
create or replace function use_token(team_id_input text)
returns boolean
language plpgsql
security definer
as $$
declare
  current_tokens integer;
begin
  select tokens_used into current_tokens from public.teams where team_code = team_id_input;
  if current_tokens >= 15 then
    return false;
  end if;
  update public.teams set tokens_used = tokens_used + 1 where team_code = team_id_input;
  return true;
end;
$$;

-- RPC Function: Delete Team (For Admin Leaderboard)
create or replace function delete_team(team_code_input text)
returns void
language plpgsql
security definer
as $$
begin
  delete from public.teams where team_code = team_code_input;
end;
$$;
