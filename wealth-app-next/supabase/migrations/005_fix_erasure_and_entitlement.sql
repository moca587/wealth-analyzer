-- ════════════════════════════════════════════════════════════════════
-- Two live defects found while assessing the app for multi-institution
-- use. Both are small; both are the kind that only surface in production.
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. A user could never be deleted ───────────────────────────────
-- 004_audit.sql made audit_events.user_id `on delete cascade` from
-- auth.users AND put a BEFORE DELETE trigger on the table that raises
-- unconditionally. Deleting a user cascades into audit_events, the
-- trigger fires, and the whole transaction aborts. So any user who had
-- ever saved a plan was undeletable — which is an operational fault and
-- a GDPR erasure blocker.
--
-- The append-only guarantee is still exactly right; the mistake was
-- conflating "who did this" with "whose row this is". An erasure should
-- remove the PERSON, not the record that something happened: the
-- summary, the figures and the hashes stay, the actor becomes null.
--
-- Note the consequence, deliberately accepted: RLS is `auth.uid() =
-- user_id`, so a nulled actor makes the row unreadable through the API.
-- The event survives for a regulator reached via service-role, which is
-- the correct trade — erased means erased for the product surface.
-- Proper actor/subject separation arrives with the tenancy work, where
-- org_id becomes the scoping column and this becomes actor_user_id.

alter table public.audit_events
  drop constraint if exists audit_events_user_id_fkey;

alter table public.audit_events
  alter column user_id drop not null;

alter table public.audit_events
  add constraint audit_events_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

-- The trigger must not block the cascade's UPDATE-to-null either. It
-- only ever guarded against rewriting history, so let a null-ing of the
-- actor through and keep refusing everything else.
create or replace function public.tg_audit_events_append_only() returns trigger as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'audit_events is append-only: DELETE is not permitted';
  end if;
  -- The only legitimate UPDATE is erasure nulling the actor. Every other
  -- column must be untouched.
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
  or new.created_at       is distinct from old.created_at then
    raise exception 'audit_events is append-only: only actor erasure may modify a row';
  end if;
  return new;
end;
$$ language plpgsql;

-- ─── 2. Entitlement was self-writable ───────────────────────────────
-- profiles_self_update grants UPDATE on the whole row, and is_paid lives
-- on it — so `update profiles set is_paid = true` was a valid statement
-- for any authenticated user. RLS cannot express column-level rules, but
-- GRANT can: revoke the billing columns from the client role. They are
-- written by the Stripe webhook through the service role, which is not
-- subject to these grants.
revoke update (
  is_paid,
  stripe_customer_id,
  stripe_subscription_id,
  subscription_status
) on public.profiles from authenticated;

-- Belt and braces: the same for anon, which should never reach this table.
revoke update (
  is_paid,
  stripe_customer_id,
  stripe_subscription_id,
  subscription_status
) on public.profiles from anon;

-- ─── 3. The update policy had no WITH CHECK ─────────────────────────
-- Postgres falls back to USING when WITH CHECK is absent, so this was not
-- exploitable — but stating it explicitly is what the other three tables
-- already do, and leaving one table different invites the wrong guess.
drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
