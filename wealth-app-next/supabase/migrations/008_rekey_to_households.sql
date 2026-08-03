-- ════════════════════════════════════════════════════════════════════
-- Re-key the working tables onto households.
--
-- 006 built the tenancy model but deliberately left feed_connections,
-- order_connections, order_tickets and audit_events keyed on user_id.
-- This migration moves them, and it is the one that carries real risk:
--
--   *** ORDER IDEMPOTENCY ***
--   idx_order_tickets_idem is unique (user_id, ticket_id) and is the ONLY
--   thing preventing a double placement. That is correct today solely
--   because a login has exactly one client. The moment two advisors share
--   a household they get SEPARATE namespaces — both press BUY on the same
--   proposal, the two rows do not collide, and TWO LIVE ORDERS reach the
--   OMS. Re-keying it is the whole reason this migration exists, and it
--   must land before any UI lets two advisors onto one household.
--
-- HOW THIS SHIPS WITHOUT BREAKING THE RUNNING APP.
-- The routes currently insert with user_id and no household. Making the
-- new columns NOT NULL would break every one of them on deploy. Instead a
-- BEFORE INSERT trigger derives household_id and org_id from the actor
-- when they are not supplied — but ONLY when that actor has exactly one
-- household. With two or more it raises, because silently picking one
-- would book a custodian feed or an order against the wrong client. So:
--   • today (one household per login) every existing insert keeps working
--   • as soon as an advisor has a second client, unqualified inserts fail
--     loudly and the routes must pass household_id explicitly
-- That is the correct order of failure: noisy now, never silent later.
-- ════════════════════════════════════════════════════════════════════

-- ─── Helper: the actor's household, when it is unambiguous ──────────
create or replace function public.resolve_default_household(p_user uuid)
returns uuid
language plpgsql stable security definer set search_path = public
as $$
declare
  n int;
  hh uuid;
begin
  -- Postgres has no min() aggregate for uuid, so count and fetch separately
  -- rather than trying to do both in one pass.
  select count(*) into n
    from public.households h
    join public.org_members m on m.org_id = h.org_id
   where m.user_id = p_user and h.archived_at is null;

  if n = 1 then
    select h.id into hh
      from public.households h
      join public.org_members m on m.org_id = h.org_id
     where m.user_id = p_user and h.archived_at is null
     limit 1;
    return hh;
  elsif n = 0 then
    raise exception 'user % has no household; create one first', p_user
      using errcode = 'foreign_key_violation';
  else
    raise exception 'user % advises % households — household_id must be given explicitly', p_user, n
      using errcode = 'not_null_violation';
  end if;
end $$;

create or replace function public.tg_fill_household() returns trigger as $$
declare
  hh uuid;
begin
  if new.household_id is null then
    hh := public.resolve_default_household(new.user_id);
    new.household_id := hh;
  end if;
  if new.org_id is null then
    select org_id into new.org_id from public.households where id = new.household_id;
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public;

-- ─── feed_connections ───────────────────────────────────────────────
alter table public.feed_connections
  add column if not exists household_id uuid references public.households(id) on delete cascade,
  add column if not exists org_id       uuid references public.organizations(id) on delete cascade;

update public.feed_connections f
   set household_id = h.id, org_id = h.org_id
  from public.households h
  join public.org_members m on m.org_id = h.org_id
 where m.user_id = f.user_id and f.household_id is null;

alter table public.feed_connections
  alter column household_id set not null,
  alter column org_id       set not null;

create index if not exists idx_feed_connections_household
  on public.feed_connections(household_id, created_at desc);

drop trigger if exists trg_feed_connections_household on public.feed_connections;
create trigger trg_feed_connections_household
  before insert on public.feed_connections
  for each row execute function public.tg_fill_household();

-- ─── order_connections ──────────────────────────────────────────────
alter table public.order_connections
  add column if not exists household_id uuid references public.households(id) on delete cascade,
  add column if not exists org_id       uuid references public.organizations(id) on delete cascade;

update public.order_connections o
   set household_id = h.id, org_id = h.org_id
  from public.households h
  join public.org_members m on m.org_id = h.org_id
 where m.user_id = o.user_id and o.household_id is null;

alter table public.order_connections
  alter column household_id set not null,
  alter column org_id       set not null;

create index if not exists idx_order_connections_household
  on public.order_connections(household_id, created_at desc);

drop trigger if exists trg_order_connections_household on public.order_connections;
create trigger trg_order_connections_household
  before insert on public.order_connections
  for each row execute function public.tg_fill_household();

-- A firm-level ceiling the advisor cannot raise. order_connections carries
-- its own max_ticket_amount, but the advisor creates that row — so the
-- organisation's value, when set, is the binding one.
create or replace function public.tg_clamp_ticket_ceiling() returns trigger as $$
declare
  org_cap numeric(20,2);
begin
  select max_ticket_amount into org_cap from public.organizations where id = new.org_id;
  if org_cap is not null and (new.max_ticket_amount is null or new.max_ticket_amount > org_cap) then
    new.max_ticket_amount := org_cap;
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_order_connections_clamp on public.order_connections;
create trigger trg_order_connections_clamp
  before insert or update on public.order_connections
  for each row execute function public.tg_clamp_ticket_ceiling();

-- ─── order_tickets — THE IDEMPOTENCY RE-KEY ─────────────────────────
alter table public.order_tickets
  add column if not exists household_id uuid references public.households(id) on delete restrict,
  add column if not exists org_id       uuid references public.organizations(id) on delete restrict;

-- Prefer the connection's household (authoritative — it is where the order
-- actually booked), and fall back to the owner's single household for any
-- row whose connection has since been deleted.
update public.order_tickets t
   set household_id = c.household_id, org_id = c.org_id
  from public.order_connections c
 where c.id = t.connection_id and t.household_id is null;

update public.order_tickets t
   set household_id = h.id, org_id = h.org_id
  from public.households h
  join public.org_members m on m.org_id = h.org_id
 where m.user_id = t.user_id and t.household_id is null;

alter table public.order_tickets
  alter column household_id set not null,
  alter column org_id       set not null;

drop trigger if exists trg_order_tickets_household on public.order_tickets;
create trigger trg_order_tickets_household
  before insert on public.order_tickets
  for each row execute function public.tg_fill_household();

-- The re-key itself. Create the new index BEFORE dropping the old one so
-- there is never a window without a uniqueness guarantee on this table.
create unique index if not exists idx_order_tickets_idem_household
  on public.order_tickets(household_id, ticket_id);

drop index if exists public.idx_order_tickets_idem;

create index if not exists idx_order_tickets_household
  on public.order_tickets(household_id, created_at desc);

-- ─── audit_events — actor vs subject ────────────────────────────────
-- user_id has meant both "who did this" and "whose money this is". A
-- compliance review asks the second question; RLS could only answer the
-- first. 005 already made the actor nullable so an erasure keeps the
-- event, which is exactly why the subject needs its own column.
alter table public.audit_events
  add column if not exists household_id uuid references public.households(id) on delete cascade,
  add column if not exists org_id       uuid references public.organizations(id) on delete cascade;

update public.audit_events a
   set household_id = h.id, org_id = h.org_id
  from public.households h
  join public.org_members m on m.org_id = h.org_id
 where m.user_id = a.user_id and a.household_id is null;

-- Deliberately NOT NOT NULL: rows whose actor was erased before this
-- migration have no household to recover, and dropping them would violate
-- the append-only guarantee. They stay, unreadable through the API,
-- reachable by an operator for a regulator.
create index if not exists idx_audit_events_household
  on public.audit_events(household_id, created_at desc);
create index if not exists idx_audit_events_org
  on public.audit_events(org_id, created_at desc);

drop trigger if exists trg_audit_events_household on public.audit_events;
create trigger trg_audit_events_household
  before insert on public.audit_events
  for each row execute function public.tg_fill_household();

-- The append-only trigger must not treat the backfill's new columns as
-- tampering, and must keep allowing exactly the erasure update.
create or replace function public.tg_audit_events_append_only() returns trigger as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'audit_events is append-only: DELETE is not permitted';
  end if;
  if new.user_id is not null
  or new.action           is distinct from old.action
  or new.source           is distinct from old.source
  or new.summary          is distinct from old.summary
  or new.changes          is distinct from old.changes
  or new.net_worth_before is distinct from old.net_worth_before
  or new.net_worth_after  is distinct from old.net_worth_after
  or new.currency         is distinct from old.currency
  or new.hash_before      is distinct from old.hash_before
  or new.hash_after       is distinct from old.hash_after
  or new.detail           is distinct from old.detail
  or new.ref_type         is distinct from old.ref_type
  or new.ref_id           is distinct from old.ref_id
  or new.household_id     is distinct from old.household_id
  or new.org_id           is distinct from old.org_id
  or new.created_at       is distinct from old.created_at then
    raise exception 'audit_events is append-only: only actor erasure may modify a row';
  end if;
  return new;
end;
$$ language plpgsql;

-- ─── RLS: from "my rows" to "my clients' rows" ──────────────────────
-- Every policy below compares a denormalised column against a STABLE
-- SECURITY DEFINER helper, so the predicate stays an indexable equality
-- rather than a per-row subquery.

drop policy if exists "feed_connections_self_select" on public.feed_connections;
drop policy if exists "feed_connections_self_insert" on public.feed_connections;
drop policy if exists "feed_connections_self_update" on public.feed_connections;
drop policy if exists "feed_connections_self_delete" on public.feed_connections;

create policy "feed_connections_household_select" on public.feed_connections
  for select using (household_id = any(public.auth_household_ids()));
create policy "feed_connections_household_insert" on public.feed_connections
  for insert with check (household_id = any(public.auth_write_household_ids()));
create policy "feed_connections_household_update" on public.feed_connections
  for update using (household_id = any(public.auth_write_household_ids()))
  with check (household_id = any(public.auth_write_household_ids()));
create policy "feed_connections_household_delete" on public.feed_connections
  for delete using (household_id = any(public.auth_write_household_ids()));

drop policy if exists "order_connections_self_select" on public.order_connections;
drop policy if exists "order_connections_self_insert" on public.order_connections;
drop policy if exists "order_connections_self_update" on public.order_connections;
drop policy if exists "order_connections_self_delete" on public.order_connections;

create policy "order_connections_household_select" on public.order_connections
  for select using (household_id = any(public.auth_household_ids()));
create policy "order_connections_household_insert" on public.order_connections
  for insert with check (household_id = any(public.auth_write_household_ids()));
create policy "order_connections_household_update" on public.order_connections
  for update using (household_id = any(public.auth_write_household_ids()))
  with check (household_id = any(public.auth_write_household_ids()));
create policy "order_connections_household_delete" on public.order_connections
  for delete using (household_id = any(public.auth_write_household_ids()));

drop policy if exists "order_tickets_self_select" on public.order_tickets;
drop policy if exists "order_tickets_self_insert" on public.order_tickets;
drop policy if exists "order_tickets_self_update" on public.order_tickets;

-- Compliance reads every ticket in the org; only a writer may place one.
create policy "order_tickets_household_select" on public.order_tickets
  for select using (household_id = any(public.auth_household_ids()));
create policy "order_tickets_household_insert" on public.order_tickets
  for insert with check (household_id = any(public.auth_write_household_ids()));
create policy "order_tickets_household_update" on public.order_tickets
  for update using (household_id = any(public.auth_write_household_ids()) and status = 'sending')
  with check (household_id = any(public.auth_write_household_ids()));

drop policy if exists "audit_events_self_select" on public.audit_events;
drop policy if exists "audit_events_self_insert" on public.audit_events;

-- This is the point of separating actor from subject: a compliance officer
-- sees what happened to every household in their organisation, including
-- actions taken by other advisors — and nothing outside it.
create policy "audit_events_household_select" on public.audit_events
  for select using (household_id = any(public.auth_household_ids()));
create policy "audit_events_household_insert" on public.audit_events
  for insert with check (household_id = any(public.auth_write_household_ids()));

-- simulations is a cache, not a record; scope it the same way so a shared
-- household does not recompute per advisor.
alter table public.simulations
  add column if not exists household_id uuid references public.households(id) on delete cascade;

update public.simulations s
   set household_id = h.id
  from public.households h
  join public.org_members m on m.org_id = h.org_id
 where m.user_id = s.user_id and s.household_id is null;

create index if not exists idx_simulations_household_hash
  on public.simulations(household_id, input_hash);

drop policy if exists "simulations_self_select" on public.simulations;
drop policy if exists "simulations_self_insert" on public.simulations;
drop policy if exists "simulations_self_delete" on public.simulations;

create policy "simulations_household_select" on public.simulations
  for select using (household_id = any(public.auth_household_ids()));
create policy "simulations_household_insert" on public.simulations
  for insert with check (household_id = any(public.auth_write_household_ids()));
create policy "simulations_household_delete" on public.simulations
  for delete using (household_id = any(public.auth_write_household_ids()));

-- Grants stay as 007 left them; 007's revokes were table-level and are not
-- undone by anything above.
