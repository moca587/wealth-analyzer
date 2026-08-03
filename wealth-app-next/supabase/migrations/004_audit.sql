-- ════════════════════════════════════════════════════════════════════
-- Audit trail — the record of what happened to a client's plan.
--
-- The question a compliance review asks is "who changed this client's
-- position, when, and from what to what". `profiles.plan` is a single
-- JSONB column overwritten on every save, so before this table that
-- question had no answer.
--
-- APPEND-ONLY, and enforced twice on purpose:
--   1. RLS grants SELECT and INSERT only — there is deliberately no
--      UPDATE policy and no DELETE policy.
--   2. A trigger raises on UPDATE and DELETE regardless of who is asking,
--      so a service-role key or a future policy mistake still cannot
--      rewrite history. An audit trail the operator can edit is not one.
--
-- Retention: nothing prunes this table. That is intentional — deleting
-- audit history should be a deliberate, reviewed migration, not a
-- background job. If volume becomes a problem, partition by month rather
-- than adding a delete path.
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.audit_events (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,

  action           text not null check (action in (
                     'plan.updated','feed.run','feed.applied',
                     'order.staged','order.rejected','order.unknown',
                     'order.duplicate_blocked','report.exported')),
  source           text not null default 'web'
                     check (source in ('web','feed','order','import','api')),

  -- One line a reviewer can scan.
  summary          text not null check (length(summary) between 1 and 300),
  -- Capped list of what actually moved. Never a full plan snapshot: that
  -- would duplicate the client's whole position on every save.
  changes          jsonb check (changes is null or jsonb_typeof(changes) = 'array'),

  -- The two numbers a compliance reviewer looks for first.
  net_worth_before numeric(20,2),
  net_worth_after  numeric(20,2),
  currency         text check (currency is null or length(currency) = 3),

  -- Tamper evidence. Cheap, deterministic, and settles "was this the plan
  -- at the time" without storing the plan itself.
  hash_before      text,
  hash_after       text,

  detail           text check (detail is null or length(detail) <= 500),
  -- Correlates an event with the thing it acted on: an order ticket id,
  -- a feed connection id.
  ref_type         text,
  ref_id           text,

  created_at       timestamptz not null default now()
);

-- The access pattern is "this user's history, newest first", optionally
-- filtered by action.
create index if not exists idx_audit_events_user
  on public.audit_events(user_id, created_at desc);
create index if not exists idx_audit_events_user_action
  on public.audit_events(user_id, action, created_at desc);

-- ─── Append-only enforcement ────────────────────────────────────────
create or replace function public.tg_audit_events_append_only() returns trigger as $$
begin
  raise exception 'audit_events is append-only: % is not permitted', tg_op;
end;
$$ language plpgsql;

drop trigger if exists trg_audit_events_no_update on public.audit_events;
create trigger trg_audit_events_no_update
  before update on public.audit_events
  for each row execute function public.tg_audit_events_append_only();

drop trigger if exists trg_audit_events_no_delete on public.audit_events;
create trigger trg_audit_events_no_delete
  before delete on public.audit_events
  for each row execute function public.tg_audit_events_append_only();

-- ─── Row-level security — owner may read and append, nothing else ───
alter table public.audit_events enable row level security;

drop policy if exists "audit_events_self_select" on public.audit_events;
create policy "audit_events_self_select" on public.audit_events
  for select using (auth.uid() = user_id);

drop policy if exists "audit_events_self_insert" on public.audit_events;
create policy "audit_events_self_insert" on public.audit_events
  for insert with check (auth.uid() = user_id);

-- No update policy and no delete policy, by design. See the header.
