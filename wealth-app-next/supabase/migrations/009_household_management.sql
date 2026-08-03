-- ════════════════════════════════════════════════════════════════════
-- Household management — creating a second client, and putting a
-- colleague on one.
--
-- 006 built the tables and 008 re-keyed the working data onto them, but
-- neither made a SECOND household reachable: `households_insert` lets an
-- advisor insert a row, and nothing then assigns them to it, so the
-- household they just created is invisible to them (`auth_household_ids`
-- returns org-wide households for owner/admin/compliance and ASSIGNED
-- ones for an advisor). Create-then-vanish is worse than not being able
-- to create at all.
--
-- Both operations here are SECURITY DEFINER functions rather than
-- policies, for the same reason in each case: the safe version of the
-- operation writes TWO rows, and a policy cannot make that atomic.
--
--   create_household  — household + the creator's assignment
--   set_advisor       — assignment, but only by someone who already sees
--                       the whole org
--
-- And one thing deliberately NOT done as a policy: a plain
-- `household_advisors_insert` policy scoped to `auth_write_org_ids()`
-- would let an ADVISOR assign themselves to any household in the firm.
-- The advisor role exists precisely to not see the whole book, so that
-- policy would erase the distinction in a single INSERT. Assignment is
-- restricted to owner/admin below.
-- ════════════════════════════════════════════════════════════════════

-- ─── Who may administer membership ──────────────────────────────────
-- auth_write_org_ids() includes 'advisor'; this deliberately does not.
create or replace function public.auth_admin_org_ids()
returns uuid[]
language sql stable security definer set search_path = public
as $$
  select coalesce(array_agg(org_id), '{}')::uuid[]
  from public.org_members
  where user_id = auth.uid() and role in ('owner','admin');
$$;

-- ─── Create a client household ──────────────────────────────────────
-- Returns the new household id. Raises (rather than returning null) on
-- every refusal, so a caller cannot mistake a refusal for a success.
create or replace function public.create_household(
  p_org      uuid,
  p_name     text,
  p_reference text default null,
  p_currency text default 'CHF'
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  new_hh  uuid;
  n_hh    int;
  actor   uuid := auth.uid();
begin
  if actor is null then
    raise exception 'not authenticated' using errcode = 'insufficient_privilege';
  end if;

  -- SECURITY DEFINER bypasses RLS, so the membership check that a policy
  -- would have done must be done here, explicitly.
  if not (p_org = any(public.auth_write_org_ids())) then
    raise exception 'not a member of organisation % with write access', p_org
      using errcode = 'insufficient_privilege';
  end if;

  if coalesce(trim(p_name), '') = '' then
    raise exception 'household name is required' using errcode = 'check_violation';
  end if;

  -- A ceiling, not a business rule. Nothing legitimate creates 5,000
  -- clients in one firm through this API, and an unbounded loop here is a
  -- cheap way to fill someone else's database.
  select count(*) into n_hh from public.households
   where org_id = p_org and archived_at is null;
  if n_hh >= 5000 then
    raise exception 'organisation % has reached the household limit', p_org
      using errcode = 'check_violation';
  end if;

  insert into public.households (org_id, name, reference, currency, created_by)
  values (p_org, trim(p_name), nullif(trim(coalesce(p_reference, '')), ''),
          upper(coalesce(nullif(trim(p_currency), ''), 'CHF')), actor)
  returning id into new_hh;

  -- The half that a policy could not have done atomically. Without it an
  -- advisor's new household is immediately invisible to them.
  insert into public.household_advisors (household_id, user_id, org_id)
  values (new_hh, actor, p_org)
  on conflict do nothing;

  return new_hh;
end $$;

-- ─── Assign / unassign an advisor ───────────────────────────────────
create or replace function public.set_advisor(
  p_household uuid,
  p_user      uuid,
  p_assign    boolean default true
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  hh_org uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = 'insufficient_privilege';
  end if;

  select org_id into hh_org from public.households where id = p_household;
  if hh_org is null then
    -- Same answer for "does not exist" and "not yours": confirming a
    -- household exists in another firm is itself a leak.
    raise exception 'household not found' using errcode = 'insufficient_privilege';
  end if;
  if not (hh_org = any(public.auth_admin_org_ids())) then
    raise exception 'household not found' using errcode = 'insufficient_privilege';
  end if;

  -- The target must already be a member of the SAME organisation. Without
  -- this, an admin could hand a client's book to any user id they can
  -- guess, across firm boundaries.
  if not exists (select 1 from public.org_members
                  where org_id = hh_org and user_id = p_user) then
    raise exception 'that user is not a member of this organisation'
      using errcode = 'foreign_key_violation';
  end if;

  if p_assign then
    insert into public.household_advisors (household_id, user_id, org_id)
    values (p_household, p_user, hh_org)
    on conflict do nothing;
  else
    delete from public.household_advisors
     where household_id = p_household and user_id = p_user;
  end if;
end $$;

-- ─── Grants ─────────────────────────────────────────────────────────
-- Both functions check membership themselves; execute is what lets a
-- signed-in client call them at all.
revoke all on function public.create_household(uuid, text, text, text) from public;
revoke all on function public.set_advisor(uuid, uuid, boolean) from public;
grant execute on function public.create_household(uuid, text, text, text) to authenticated;
grant execute on function public.set_advisor(uuid, uuid, boolean) to authenticated;
grant execute on function public.auth_admin_org_ids() to authenticated;

-- ─── Archiving, not deleting ────────────────────────────────────────
-- households_update (006) already permits this; the constraint is that a
-- household with a plan, orders or audit history must never be removed,
-- and there is no DELETE policy, so archiving is the only exit.
comment on column public.households.archived_at is
  'Soft close. There is no DELETE policy on households: removing one would '
  'orphan its plan versions, order tickets and audit trail.';
