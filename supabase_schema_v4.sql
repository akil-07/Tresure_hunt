-- V4 Schema: Ultimate Competition Upgrade (Scores, Bounties, Sabotage)

-- Drop existing tables to ensure clean slate
drop table if exists public.sabotages cascade;
drop table if exists public.global_state cascade;
drop table if exists public.teams cascade;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. TEAMS TABLE
create table public.teams (
  team_id uuid primary key default uuid_generate_v4(),
  team_code text unique not null,
  tokens_used integer default 0 not null,
  score integer default 0 not null,
  final_report text,
  bias_type_found text,
  finished_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

-- 2. GLOBAL STATE TABLE (Timer + Bounties)
create table public.global_state (
  id integer primary key default 1,
  timer_started_at timestamp with time zone,
  
  -- The 5 Global Bounties (Stores the team_code of who claimed it)
  hospital_patched_by text,
  credit_patched_by text,
  school_patched_by text,
  ecommerce_patched_by text,
  cinema_patched_by text,

  constraint single_row check (id = 1)
);

-- Insert the default empty global state row
insert into public.global_state (id) values (1);

-- 3. SABOTAGES TABLE
create table public.sabotages (
  id uuid primary key default uuid_generate_v4(),
  attacker_code text not null references public.teams(team_code) on delete cascade,
  target_code text not null references public.teams(team_code) on delete cascade,
  created_at timestamp with time zone default now() not null
);

-- Enable Realtime
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table global_state;
alter publication supabase_realtime add table sabotages;

-- RLS Policies
alter table public.teams enable row level security;
alter table public.global_state enable row level security;
alter table public.sabotages enable row level security;

create policy "Allow public all on teams" on public.teams for all using (true) with check (true);
create policy "Allow public all on global_state" on public.global_state for all using (true) with check (true);
create policy "Allow public all on sabotages" on public.sabotages for all using (true) with check (true);

-- RPC: Deduct Tokens (Now accepts amount for Sabotage costs)
create or replace function use_tokens(team_code_input text, amount integer)
returns boolean
language plpgsql
security definer
as $$
declare
  current_tokens integer;
begin
  select tokens_used into current_tokens from public.teams where team_code = team_code_input;
  if current_tokens + amount > 15 then
    return false;
  end if;
  update public.teams set tokens_used = tokens_used + amount where team_code = team_code_input;
  return true;
end;
$$;

-- Alias for standard 1-token use
create or replace function use_token(team_id_input text)
returns boolean
language plpgsql
security definer
as $$
begin
  return use_tokens(team_id_input, 1);
end;
$$;

-- RPC: Claim Bounty
create or replace function claim_bounty(team_code_input text, domain_input text, report text, bias text, calculated_score integer)
returns boolean
language plpgsql
security definer
as $$
declare
  is_claimed text;
begin
  -- Check if already claimed based on domain
  if domain_input = 'Hospital Triage' then
    select hospital_patched_by into is_claimed from public.global_state where id = 1;
    if is_claimed is not null then return false; end if;
    update public.global_state set hospital_patched_by = team_code_input where id = 1;
  elsif domain_input = 'Credit Scoring' then
    select credit_patched_by into is_claimed from public.global_state where id = 1;
    if is_claimed is not null then return false; end if;
    update public.global_state set credit_patched_by = team_code_input where id = 1;
  elsif domain_input = 'School Admissions' then
    select school_patched_by into is_claimed from public.global_state where id = 1;
    if is_claimed is not null then return false; end if;
    update public.global_state set school_patched_by = team_code_input where id = 1;
  elsif domain_input = 'E-commerce Fraud' then
    select ecommerce_patched_by into is_claimed from public.global_state where id = 1;
    if is_claimed is not null then return false; end if;
    update public.global_state set ecommerce_patched_by = team_code_input where id = 1;
  elsif domain_input = 'Cinema Recommendations' then
    select cinema_patched_by into is_claimed from public.global_state where id = 1;
    if is_claimed is not null then return false; end if;
    update public.global_state set cinema_patched_by = team_code_input where id = 1;
  end if;

  -- Update Team Score
  update public.teams 
  set 
    score = calculated_score,
    final_report = report,
    bias_type_found = bias,
    finished_at = now()
  where team_code = team_code_input;

  return true;
end;
$$;

-- RPC: Delete Team
create or replace function delete_team(team_code_input text)
returns void
language plpgsql
security definer
as $$
begin
  delete from public.teams where team_code = team_code_input;
end;
$$;
