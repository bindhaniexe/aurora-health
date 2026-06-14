-- Initial Supabase Schema for Aurora Health Companion App
-- migration: 001_initial_schema.sql

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- =========================================================================
-- 1. PROFILES TABLE
-- =========================================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  avatar_url text,
  water_goal_ml integer not null default 2500,
  sleep_goal_hrs numeric not null default 8,
  goals text[] not null default '{}',
  memory_notes text,
  onboarding_done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================================
-- 2. HYDRATION LOGS TABLE
-- =========================================================================
create table if not exists public.hydration_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount_ml integer not null,
  logged_at timestamptz not null default now()
);

-- =========================================================================
-- 3. SLEEP LOGS TABLE
-- =========================================================================
create table if not exists public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  hours numeric not null,
  quality text constraint chk_sleep_quality check (quality in ('poor', 'fair', 'good', 'great')),
  sleep_date date not null,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- 4. HABITS TABLE
-- =========================================================================
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  frequency text not null constraint chk_habit_frequency check (frequency in ('daily', 'weekly')),
  created_at timestamptz not null default now(),
  is_active boolean not null default true
);

-- =========================================================================
-- 5. HABIT COMPLETIONS TABLE
-- =========================================================================
create table if not exists public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references public.habits(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  completed_date date not null,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- 6. INSIGHTS CACHE TABLE
-- =========================================================================
create table if not exists public.insights_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  insight_text text not null,
  generated_date date not null,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- =========================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.hydration_logs enable row level security;
alter table public.sleep_logs enable row level security;
alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;
alter table public.insights_cache enable row level security;

-- ── Profiles Policies ───────────────────────────────────────────────────
create policy "Users can select own profile" on public.profiles
  for select using (id = auth.uid());

create policy "Users can insert own profile" on public.profiles
  for insert with check (id = auth.uid());

create policy "Users can update own profile" on public.profiles
  for update using (id = auth.uid());

create policy "Users can delete own profile" on public.profiles
  for delete using (id = auth.uid());

-- ── Hydration Logs Policies ──────────────────────────────────────────────
create policy "Users can select own hydration logs" on public.hydration_logs
  for select using (user_id = auth.uid());

create policy "Users can insert own hydration logs" on public.hydration_logs
  for insert with check (user_id = auth.uid());

create policy "Users can update own hydration logs" on public.hydration_logs
  for update using (user_id = auth.uid());

create policy "Users can delete own hydration logs" on public.hydration_logs
  for delete using (user_id = auth.uid());

-- ── Sleep Logs Policies ──────────────────────────────────────────────────
create policy "Users can select own sleep logs" on public.sleep_logs
  for select using (user_id = auth.uid());

create policy "Users can insert own sleep logs" on public.sleep_logs
  for insert with check (user_id = auth.uid());

create policy "Users can update own sleep logs" on public.sleep_logs
  for update using (user_id = auth.uid());

create policy "Users can delete own sleep logs" on public.sleep_logs
  for delete using (user_id = auth.uid());

-- ── Habits Policies ─────────────────────────────────────────────────────
create policy "Users can select own habits" on public.habits
  for select using (user_id = auth.uid());

create policy "Users can insert own habits" on public.habits
  for insert with check (user_id = auth.uid());

create policy "Users can update own habits" on public.habits
  for update using (user_id = auth.uid());

create policy "Users can delete own habits" on public.habits
  for delete using (user_id = auth.uid());

-- ── Habit Completions Policies ──────────────────────────────────────────
create policy "Users can select own habit completions" on public.habit_completions
  for select using (user_id = auth.uid());

create policy "Users can insert own habit completions" on public.habit_completions
  for insert with check (user_id = auth.uid());

create policy "Users can update own habit completions" on public.habit_completions
  for update using (user_id = auth.uid());

create policy "Users can delete own habit completions" on public.habit_completions
  for delete using (user_id = auth.uid());

-- ── Insights Cache Policies ─────────────────────────────────────────────
create policy "Users can select own insights cache" on public.insights_cache
  for select using (user_id = auth.uid());

create policy "Users can insert own insights cache" on public.insights_cache
  for insert with check (user_id = auth.uid());

create policy "Users can update own insights cache" on public.insights_cache
  for update using (user_id = auth.uid());

create policy "Users can delete own insights cache" on public.insights_cache
  for delete using (user_id = auth.uid());

-- =========================================================================
-- TRIGGER: AUTO-CREATE PROFILE ON SIGNUP
-- =========================================================================

-- Create function to handle auto-creation
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into public.profiles (id, name, avatar_url, onboarding_done)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1),
      'User'
    ),
    new.raw_user_meta_data->>'avatar_url',
    false
  );
  return new;
end;
$$;

-- Create the trigger
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
