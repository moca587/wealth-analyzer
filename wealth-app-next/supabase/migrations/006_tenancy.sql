-- ════════════════════════════════════════════════════════════════════
-- Tenancy — organisations, advisors, client households, versioned plans.
--
-- WHY THIS EXISTS. `profiles.id` IS `auth.users(id)`, and the client's
-- whole financial position lives in `profiles.plan` on that identity row.
-- So a login IS a household: an advisor cannot hold a second client, a
-- firm cannot put two advisors on one client, and there is no tenant to
-- bill, suspend or audit against. That is not something a WHERE clause
-- fixes.
--
-- THIS MIGRATION IS ADDITIVE AND SAFE TO SHIP ALONE. It creates the new
-- tables, the access helpers, the policies, and backfills every existing
-- profile into a personal organisation so no data is stranded. It does
-- NOT yet re-point feed_connections, order_connections, order_tickets or
-- audit_events — the app keeps working exactly as it does today. That
-- re-keying is migration 007, and it is where the dangerous change
-- lives (see the ORDER IDEMPOTENCY note at the foot of this file).
--
-- RLS AT SCALE. The obvious policy — `exists (select 1 from org_members
-- where user_id = auth.uid() and org_id = t.org_id)` — runs a correlated
-- subquery PER ROW. Instead every tenant table carries a denormalised
-- `org_id`, and policies compare it against a STABLE SECURITY DEFINER
-- helper that Postgres evaluates once per statement. That keeps the
-- predicate a plain indexable equality.
-- ════════════════════════════════════════════════════════════════════

-- ─── Organisations ──────────────────────────────────────────────────
create table if not exists public.organizations (
  id                uuid primary key default gen_random_uuid(),
  name              text not null check (length(trim(name)) between 1 and 200),
  -- 'personal' is the one-advisor-one-firm case every existing user is
  -- backfilled into; 'institution' is a real firm with multiple seats.
  kind              text not null default 'institution'
                      check (kind in ('personal','institution')),
  -- Entitlement lives HERE, not on profiles. 005 had to revoke the
  -- billing columns from `authenticated` precisely because they sat on a
  -- row the user could UPDATE; this table has no UPDATE policy for
  -- clients at all, so the same mistake cannot recur.
  is_paid           boolean not null default false,
  seats             integer not null default 1 check (seats > 0),
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text,
  -- Firm-level ceiling on any single order ticket. order_connections
  -- carries its own limit, but an advisor creates those — so the firm
  -- needs a bound the advisor cannot raise. Enforced in 007.
  max_ticket_amount numeric(20,2) check (max_ticket_amount is null or max_ticket_amount > 0),
  -- Narrows (never widens) the ORDERS_HOST_ALLOWLIST env var, so one
  -- institution cannot point a connection at another's custodian.
  order_host_allowlist text[],
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists trg_organizations_updated_at on public.organizations;
create trigger trg_organizations_updated_at
  before update on public.organizations
  for each row execute function public.tg_set_updated_at();

-- ─── Membership ─────────────────────────────────────────────────────
-- role:
--   owner      — billing + members + everything below
--   admin      — members + every household in the org
--   compliance — READ every household in the org; never writes a plan
--   advisor    — only households explicitly assigned to them
create table if not exists public.org_members (
  org_id     uuid not null references public.organizations(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'advisor'
               check (role in ('owner','admin','compliance','advisor')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index if not exists idx_org_members_user on public.org_members(user_id);

-- ─── Client households ──────────────────────────────────────────────
-- The client being advised. This is the thing an advisor has many of,
-- and the thing a plan, a feed, an order and an audit event belong to.
create table if not exists public.households (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null check (length(trim(name)) between 1 and 200),
  reference   text,                          -- the firm's own client number
  currency    text not null default 'CHF' check (length(currency) = 3),
  archived_at timestamptz,                   -- soft close; never hard-deleted
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_households_org on public.households(org_id, created_at desc);
create unique index if not exists idx_households_org_ref
  on public.households(org_id, reference) where reference is not null;

drop trigger if exists trg_households_updated_at on public.households;
create trigger trg_households_updated_at
  before update on public.households
  for each row execute function public.tg_set_updated_at();

-- Which advisors may touch which households. Admin/compliance/owner see
-- the whole org and do not need a row here.
create table if not exists public.household_advisors (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  org_id       uuid not null references public.organizations(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index if not exists idx_household_advisors_user
  on public.household_advisors(user_id, org_id);

-- ─── Versioned plans ────────────────────────────────────────────────
-- One row per SAVE, not one row per household.
--
-- This is what fixes the lost-update race in /api/plan: today the route
-- SELECTs the old plan, UPSERTs the new one, then diffs — so two tabs
-- (or a feed-apply racing a manual save) silently lose one save AND
-- write an audit diff describing a change that never happened. With
-- versions the client sends the version it edited, the insert carries
-- version+1, and the unique index turns a concurrent save into a 409
-- the UI can resolve instead of a silent overwrite.
create table if not exists public.plans (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  org_id       uuid not null references public.organizations(id) on delete cascade,
  version      integer not null check (version > 0),
  plan         jsonb not null check (jsonb_typeof(plan) = 'object'),
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (household_id, version)
);

-- "the current plan for this household" is the hot read.
create index if not exists idx_plans_household_current
  on public.plans(household_id, version desc);

-- ─── Access helpers ─────────────────────────────────────────────────
-- STABLE + SECURITY DEFINER so Postgres evaluates them once per
-- statement rather than once per row, and so they can read org_members
-- without the caller needing a policy on it (which would recurse).
--
-- search_path is pinned: a SECURITY DEFINER function that resolves
-- unqualified names through the caller's search_path is a privilege
-- escalation waiting to happen.

create or replace function public.auth_org_ids()
returns uuid[]
language sql stable security definer set search_path = public
as $$
  select coalesce(array_agg(org_id), '{}')::uuid[]
  from public.org_members
  where user_id = auth.uid();
$$;

/** Orgs where the caller may WRITE (everything except compliance). */
create or replace function public.auth_write_org_ids()
returns uuid[]
language sql stable security definer set search_path = public
as $$
  select coalesce(array_agg(org_id), '{}')::uuid[]
  from public.org_members
  where user_id = auth.uid() and role in ('owner','admin','advisor');
$$;

/** Orgs where the caller sees EVERY household, not just assigned ones. */
create or replace function public.auth_org_wide_ids()
returns uuid[]
language sql stable security definer set search_path = public
as $$
  select coalesce(array_agg(org_id), '{}')::uuid[]
  from public.org_members
  where user_id = auth.uid() and role in ('owner','admin','compliance');
$$;

/** Households the caller may read: org-wide by role, or assigned. */
create or replace function public.auth_household_ids()
returns uuid[]
language sql stable security definer set search_path = public
as $$
  select coalesce(array_agg(id), '{}')::uuid[] from (
    select h.id
      from public.households h
     where h.org_id = any(public.auth_org_wide_ids())
    union
    select ha.household_id
      from public.household_advisors ha
     where ha.user_id = auth.uid()
  ) s;
$$;

/** Households the caller may WRITE — the same, minus compliance-only orgs. */
create or replace function public.auth_write_household_ids()
returns uuid[]
language sql stable security definer set search_path = public
as $$
  select coalesce(array_agg(id), '{}')::uuid[] from (
    select h.id
      from public.households h
      join public.org_members m
        on m.org_id = h.org_id and m.user_id = auth.uid()
     where m.role in ('owner','admin')
    union
    select ha.household_id
      from public.household_advisors ha
      join public.org_members m
        on m.org_id = ha.org_id and m.user_id = auth.uid()
     where ha.user_id = auth.uid() and m.role in ('owner','admin','advisor')
  ) s;
$$;

-- ─── Row-level security ─────────────────────────────────────────────
alter table public.organizations      enable row level security;
alter table public.org_members        enable row level security;
alter table public.households         enable row level security;
alter table public.household_advisors enable row level security;
alter table public.plans              enable row level security;

-- Organisations: members read; nobody writes through the client. Creation
-- and billing go through the service role, so a user cannot mint an org
-- with is_paid = true — the exact hole 005 had to close on profiles.
drop policy if exists "organizations_member_select" on public.organizations;
create policy "organizations_member_select" on public.organizations
  for select using (id = any(public.auth_org_ids()));

-- Membership: you can see the roster of any org you belong to. Changing
-- it is an admin action performed server-side, deliberately not exposed
-- as a client-writable policy — otherwise self-promotion to 'owner' is
-- one UPDATE away.
drop policy if exists "org_members_self_select" on public.org_members;
create policy "org_members_self_select" on public.org_members
  for select using (org_id = any(public.auth_org_ids()));

-- Households
drop policy if exists "households_select" on public.households;
create policy "households_select" on public.households
  for select using (id = any(public.auth_household_ids()));

drop policy if exists "households_insert" on public.households;
create policy "households_insert" on public.households
  for insert with check (org_id = any(public.auth_write_org_ids()));

drop policy if exists "households_update" on public.households;
create policy "households_update" on public.households
  for update using (id = any(public.auth_write_household_ids()))
  with check (id = any(public.auth_write_household_ids()));

-- No delete policy: households are archived, never removed. A deleted
-- household would orphan its audit trail and its order history.

-- Assignment
drop policy if exists "household_advisors_select" on public.household_advisors;
create policy "household_advisors_select" on public.household_advisors
  for select using (org_id = any(public.auth_org_ids()));

-- Plans: read what you may see; append what you may write. No UPDATE and
-- no DELETE policy at all — a plan version is immutable once written,
-- which is what makes the audit trail's before/after hashes meaningful.
drop policy if exists "plans_select" on public.plans;
create policy "plans_select" on public.plans
  for select using (household_id = any(public.auth_household_ids()));

drop policy if exists "plans_insert" on public.plans;
create policy "plans_insert" on public.plans
  for insert with check (household_id = any(public.auth_write_household_ids()));

-- ─── Backfill ───────────────────────────────────────────────────────
-- Every existing user becomes a one-person organisation owning one
-- household holding their current plan as version 1. Nothing is
-- stranded, and the existing profiles.plan column is left untouched so
-- the running app keeps working until 007 re-points the routes.
do $$
declare
  p record;
  new_org uuid;
  new_hh  uuid;
begin
  for p in
    select pr.id, pr.display_name, pr.plan, pr.is_paid,
           pr.stripe_customer_id, pr.stripe_subscription_id, pr.subscription_status
      from public.profiles pr
     where not exists (select 1 from public.org_members m where m.user_id = pr.id)
  loop
    insert into public.organizations (name, kind, is_paid, seats,
                                      stripe_customer_id, stripe_subscription_id, subscription_status)
    values (coalesce(nullif(trim(p.display_name), ''), 'My practice'), 'personal', p.is_paid, 1,
            p.stripe_customer_id, p.stripe_subscription_id, p.subscription_status)
    returning id into new_org;

    insert into public.org_members (org_id, user_id, role)
    values (new_org, p.id, 'owner');

    insert into public.households (org_id, name, currency, created_by)
    values (new_org,
            coalesce(nullif(trim(p.display_name), ''), 'My household'),
            coalesce(nullif(p.plan->>'currency', ''), 'CHF'),
            p.id)
    returning id into new_hh;

    insert into public.household_advisors (household_id, user_id, org_id)
    values (new_hh, p.id, new_org);

    -- Only a plan with actual content becomes version 1. A fresh signup
    -- row ({}) gets a household and no plan, which is the correct
    -- starting state rather than an empty version nobody wrote.
    if p.plan is not null and jsonb_typeof(p.plan) = 'object'
       and p.plan <> '{}'::jsonb then
      insert into public.plans (household_id, org_id, version, plan, created_by)
      values (new_hh, new_org, 1, p.plan, p.id);
    end if;
  end loop;
end $$;

-- New signups need the same shape. The existing trigger creates the
-- profiles row; this extends it to create the personal org, membership
-- and first household in the same transaction.
create or replace function public.tg_on_auth_user_created()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_org uuid;
  new_hh  uuid;
  nm      text;
begin
  nm := coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1));

  insert into public.profiles (id, display_name) values (new.id, nm);

  insert into public.organizations (name, kind) values (coalesce(nullif(trim(nm), ''), 'My practice'), 'personal')
  returning id into new_org;

  insert into public.org_members (org_id, user_id, role) values (new_org, new.id, 'owner');

  insert into public.households (org_id, name, created_by)
  values (new_org, coalesce(nullif(trim(nm), ''), 'My household'), new.id)
  returning id into new_hh;

  insert into public.household_advisors (household_id, user_id, org_id)
  values (new_hh, new.id, new_org);

  return new;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- NEXT: 007 re-keys the existing tables onto households. The dangerous
-- one is ORDER IDEMPOTENCY.
--
-- `idx_order_tickets_idem` is currently `unique (user_id, ticket_id)`,
-- and it is the ONLY thing preventing a double placement. That is
-- correct today only because a login has exactly one client. The moment
-- two advisors share a household they get separate namespaces — both
-- press BUY on the same proposal and the two tickets DO NOT COLLIDE, so
-- two live orders reach the OMS.
--
-- 007 must therefore re-key it to `unique (household_id, ticket_id)` in
-- the same migration that introduces shared households, never after.
-- ════════════════════════════════════════════════════════════════════
