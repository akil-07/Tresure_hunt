-- Drop the old tables if they exist to clean up
drop table if exists public.queries cascade;
drop table if exists public.sessions cascade;
drop table if exists public.teams cascade;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create the single, flat TEAMS table needed for the real-time leaderboard
create table public.teams (
  team_id uuid primary key default uuid_generate_v4(),
  team_code text unique not null,
  tokens_used integer default 0 not null,
  final_report text,
  bias_type_found text,
  finished_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

-- Enable Realtime for the teams table so the Leaderboard updates instantly
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table teams;

-- Basic RLS (Row Level Security) - allow anon read/write/upsert for the event
alter table public.teams enable row level security;

create policy "Allow public all on teams" 
on public.teams 
for all 
using (true) 
with check (true);

-- Create the secure RPC function to deduct tokens safely
create or replace function use_token(team_id_input text)
returns boolean
language plpgsql
security definer
as $$
declare
  current_tokens integer;
begin
  -- Get current tokens
  select tokens_used into current_tokens from public.teams where team_code = team_id_input;
  
  -- Check if they have reached the limit (15)
  if current_tokens >= 15 then
    return false; -- Out of tokens
  end if;

  -- Increment the used token count
  update public.teams 
  set tokens_used = tokens_used + 1 
  where team_code = team_id_input;
  
  return true;
end;
$$;
