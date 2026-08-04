-- ════════════════════════════════════════════════════════════════════
-- Deleting a person must not delete the firm's records.
--
-- 005 fixed this for `audit_events` and stopped there. Everywhere else
-- `user_id` is still `on delete cascade` from `auth.users`, and `user_id`
-- on those tables means "who configured / sent this", not "whose money
-- this is" — 008 moved ownership to `household_id`. So today, deleting
-- ONE departing advisor's login silently takes with it:
--
--   • order_tickets      — the instruction of record for every order they
--                          ever placed. RLS grants no DELETE and 007
--                          revokes the privilege, but an FK cascade obeys
--                          neither, and `trg_order_tickets_immutable` is
--                          BEFORE UPDATE only. The surviving audit_events
--                          rows (005 kept them) then reference ticket ids
--                          that no longer exist.
--   • order_connections  — the OMS routes for clients they advised
--   • feed_connections   — every custodian credential for those clients
--   • simulations        — the result cache
--
-- The household keeps existing; its history does not. That is the wrong
-- half to lose, and nobody deletes a user until the product has been in
-- production for months — which is exactly why this has to land now,
-- while the tables are still empty.
--
-- Every one of these rows already carries `household_id` and `org_id`
-- (008), so nulling the actor orphans nothing. This is precisely the
-- shape 005 chose for audit_events, applied to the four tables it missed.
-- ════════════════════════════════════════════════════════════════════

-- ─── The actor becomes nullable, and the FK stops cascading ─────────
-- Order matters: the column must accept null before the FK may set it.

alter table public.feed_connections
  alter column user_id drop not null;
alter table public.feed_connections
  drop constraint if exists feed_connections_user_id_fkey;
alter table public.feed_connections
  add constraint feed_connections_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

alter table public.order_connections
  alter column user_id drop not null;
alter table public.order_connections
  drop constraint if exists order_connections_user_id_fkey;
alter table public.order_connections
  add constraint order_connections_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

alter table public.order_tickets
  alter column user_id drop not null;
alter table public.order_tickets
  drop constraint if exists order_tickets_user_id_fkey;
alter table public.order_tickets
  add constraint order_tickets_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

alter table public.simulations
  alter column user_id drop not null;
alter table public.simulations
  drop constraint if exists simulations_user_id_fkey;
alter table public.simulations
  add constraint simulations_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

-- `profiles.id` stays ON DELETE CASCADE deliberately: that row IS the
-- person. Erasing them should erase it. Same for org_members and
-- household_advisors — those are memberships, not records; a departed
-- advisor should stop being a member, and 008 already moved the data
-- those rows used to imply ownership of onto household_id.

-- ─── The immutability trigger has to allow the erasure ──────────────
-- Found by running the migration: `on delete set null` is performed as an
-- UPDATE, and `tg_order_tickets_immutable` (003) refuses ANY change to
-- user_id and refuses every update to a terminal row. So the four FK
-- changes above did not make a departing advisor deletable — they moved
-- the blocker from the foreign key to the trigger, and the DELETE still
-- aborted with "the order of record is immutable".
--
-- This is the SAME defect 005 had to fix on audit_events: a protective
-- trigger colliding with an erasure path. The fix is the same shape, and
-- it is narrow on purpose — exactly one update is permitted, the one that
-- nulls the actor and changes nothing else. Any other edit to the
-- instruction, and any reopening of a terminal row, is still refused.
create or replace function public.tg_order_tickets_immutable() returns trigger as $$
begin
  -- Erasure: user_id going non-null → null, with every other column
  -- byte-identical. Nothing else about the order may move.
  if old.user_id is not null and new.user_id is null
     and new.ticket_id     is not distinct from old.ticket_id
     and new.fingerprint   is not distinct from old.fingerprint
     and new.account       is not distinct from old.account
     and new.currency      is not distinct from old.currency
     and new.positions     is not distinct from old.positions
     and new.total_amount  is not distinct from old.total_amount
     and new.payload       is not distinct from old.payload
     and new.created_at    is not distinct from old.created_at
     and new.status        is not distinct from old.status
     and new.household_id  is not distinct from old.household_id
     and new.org_id        is not distinct from old.org_id then
    return new;
  end if;

  if new.user_id      is distinct from old.user_id
  or new.ticket_id    is distinct from old.ticket_id
  or new.fingerprint  is distinct from old.fingerprint
  or new.account      is distinct from old.account
  or new.currency     is distinct from old.currency
  or new.positions    is distinct from old.positions
  or new.total_amount is distinct from old.total_amount
  or new.payload      is distinct from old.payload
  or new.created_at   is distinct from old.created_at then
    raise exception 'order_tickets: the order of record is immutable';
  end if;
  if old.status <> 'sending' then
    raise exception 'order_tickets: status % is terminal', old.status;
  end if;
  return new;
end;
$$ language plpgsql;

-- ─── The audit trail can now describe what it could not ─────────────
-- `PATCH /api/orders/<id>` can repoint the custody account every ticket
-- books into, raise max_ticket_amount, and change the endpoint and
-- credential — and recorded NOTHING, because 004's CHECK constraint had
-- no value that could describe it. That directly undercuts the rule that
-- "the custody account comes from the CONNECTION, never the payload":
-- the connection was the trusted half, and it was mutable in silence.
alter table public.audit_events
  drop constraint if exists audit_events_action_check;
alter table public.audit_events
  add constraint audit_events_action_check check (action in (
    'plan.updated','feed.run','feed.applied',
    'order.staged','order.rejected','order.unknown',
    'order.duplicate_blocked','report.exported',
    -- New in 010. Money-routing configuration is now on the same
    -- timeline as the orders it routes.
    'connection.created','connection.updated','connection.deleted',
    -- And the tenancy events a compliance officer will ask about:
    -- who gained access to this client, and when.
    'household.created','household.updated',
    'advisor.assigned','advisor.unassigned',
    'member.invited','member.joined','member.removed'
  ));

-- ─── Credential encryption gains a rotation path ────────────────────
-- lib/feeds/crypto.ts writes a fixed "v1" tag and decrypt requires that
-- exact literal, so there is one key, forever. Losing or rotating
-- FEEDS_ENCRYPTION_KEY permanently bricks every stored custodian and OMS
-- credential, discovered one client at a time as a 500 mid-statement-pull
-- or a ticket marked failed mid-placement. The application change is in
-- crypto.ts (key id in the envelope + a previous-key fallback); this
-- column is what makes the re-encrypt job auditable and resumable.
alter table public.feed_connections
  add column if not exists secret_key_id text;
alter table public.order_connections
  add column if not exists secret_key_id text;

comment on column public.feed_connections.secret_key_id is
  'Which encryption key sealed secret_ciphertext. Null means the original '
  'single-key era ("v1"). Lets a rotation re-encrypt in batches and prove '
  'it finished: select count(*) where secret_ciphertext is not null and '
  'secret_key_id is distinct from <current>.';

create index if not exists idx_feed_connections_key_id
  on public.feed_connections(secret_key_id)
  where secret_ciphertext is not null;
create index if not exists idx_order_connections_key_id
  on public.order_connections(secret_key_id)
  where secret_ciphertext is not null;

-- ─── A migration ledger ─────────────────────────────────────────────
-- Nothing records what has been applied. With 003-009 never having run
-- against a real project, the first deploy is also the first time anyone
-- needs to answer "where did it stop?" after a failure halfway through.
create table if not exists public.schema_migrations (
  version    text primary key,
  applied_at timestamptz not null default now()
);

alter table public.schema_migrations enable row level security;
-- No policy at all: this is operator data. The service role bypasses RLS;
-- clients have no business reading the deploy state of the database.

revoke all on public.schema_migrations from authenticated, anon;

insert into public.schema_migrations (version) values
  ('001_init'), ('002_feeds'), ('003_orders'), ('004_audit'),
  ('005_fix_erasure_and_entitlement'), ('006_tenancy'),
  ('007_fix_entitlement_grants'), ('008_rekey_to_households'),
  ('009_household_management'), ('010_survive_a_departure')
on conflict (version) do nothing;
