-- ════════════════════════════════════════════════════════════════════
-- Wealth Analyzer — Stage 1 schema
-- One row per user. Plan stored as JSONB for fast iteration.
-- Row-level security ensures users can only read/write their own row.
-- ════════════════════════════════════════════════════════════════════

-- ─── profiles table ────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  plan          jsonb not null default '{}'::jsonb,
  -- Stage 2 will flip this when Stripe webhook confirms a paid subscription
  is_paid       boolean not null default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text,        -- 'active' | 'trialing' | 'canceled' | etc.
  -- audit
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Update timestamp trigger
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- ─── simulations table ─────────────────────────────────────────────
-- Cache of computed simulation runs so we don't recompute on every load.
-- Each plan change invalidates by input_hash mismatch.
create table if not exists public.simulations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  input_hash    text not null,                -- matches SimulationResult.inputHash
  result        jsonb not null,               -- full SimulationResult JSON
  created_at    timestamptz not null default now()
);

create index if not exists idx_simulations_user_hash
  on public.simulations(user_id, input_hash);

-- ─── Row-level security ────────────────────────────────────────────
alter table public.profiles    enable row level security;
alter table public.simulations enable row level security;

-- profiles policies — only the owner can read/write their row
drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self_insert" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

-- simulations policies — same pattern
drop policy if exists "simulations_self_select" on public.simulations;
create policy "simulations_self_select" on public.simulations
  for select using (auth.uid() = user_id);

drop policy if exists "simulations_self_insert" on public.simulations;
create policy "simulations_self_insert" on public.simulations
  for insert with check (auth.uid() = user_id);

drop policy if exists "simulations_self_delete" on public.simulations;
create policy "simulations_self_delete" on public.simulations
  for delete using (auth.uid() = user_id);

-- ─── Auto-create profile row on signup ─────────────────────────────
-- When a new user signs up via Supabase Auth, automatically create
-- their corresponding profiles row.
create or replace function public.tg_on_auth_user_created()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end $$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.tg_on_auth_user_created();
