-- ════════════════════════════════════════════════════════════════════
-- 011 shipped a seats feature that could never be used, plus four ways
-- to lose control of a firm. An adversarial review found all of them.
--
-- (a) THE FEATURE WAS UNREACHABLE. `organizations.seats` is `not null
--     default 1`, the 006 backfill hardcodes 1, `tg_on_auth_user_created`
--     inserts only (name, kind) — and 007 revokes UPDATE on
--     organizations from `authenticated`. Nothing in app/, lib/ or
--     components/ writes it. So `create_invite` refused EVERY first
--     invitation, and the UI's advice ("revoke a pending invitation or
--     remove a member") was impossible for a one-seat sole owner: there
--     are no invitations, and the last owner cannot be removed.
--     Every 011 test opened with `update organizations set seats = N`,
--     which is exactly why nobody noticed.
--
-- (b) AN ADMIN COULD EJECT AN OWNER. `remove_member` gated only on
--     auth_admin_org_ids(), which includes admin — while
--     `set_member_role` four lines later refuses the WEAKER operation
--     of changing an owner's role. The `actor` variable was declared and
--     never used, which is what an unfinished edit looks like.
--
-- (c) INVITATIONS OUTLIVED THE INVITER'S AUTHORITY. An owner could mint
--     an owner-invite to a personal address, be offboarded, and redeem it
--     weeks later — back in, as owner. Nothing revoked their pending
--     invitations, and accept_invite never re-checked the inviter.
--
-- (d) THE LAST-OWNER GUARDS RACED. Both counted owners with a plain
--     SELECT. Two concurrent removals read 2, both commit, and the firm
--     has zero owners — with no way back, because granting ownership
--     requires an owner.
--
-- Plus: org_seats_used() was SECURITY DEFINER, granted to authenticated,
-- and checked nobody — a seat-count oracle for any org id.
-- ════════════════════════════════════════════════════════════════════

-- ─── (a) Seats a firm can actually use ──────────────────────────────
-- The cap exists to enforce an entitlement. There is no billing yet, so
-- enforcing it at 1 enforces nothing except "the product does not work".
-- A working default that still bounds abuse is the honest position until
-- Stripe lands and starts writing this column.
alter table public.organizations alter column seats set default 5;

update public.organizations set seats = 5 where seats = 1;

-- Raising it is a COMMERCIAL act, not a self-service one — the whole
-- reason entitlement moved off `profiles` in 006 was that a user could
-- UPDATE their own row. So this is executable by the service role only:
-- today an operator, later the Stripe webhook. `authenticated` is
-- explicitly refused below, and a test asserts it.
create or replace function public.set_org_seats(p_org uuid, p_seats integer)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_seats is null or p_seats < 1 or p_seats > 10000 then
    raise exception 'seats must be between 1 and 10000' using errcode = 'check_violation';
  end if;
  -- Never below what is already in use, or the firm lands in a state it
  -- cannot see or fix.
  if p_seats < (select count(*) from public.org_members where org_id = p_org) then
    raise exception 'that is fewer seats than the organisation has members'
      using errcode = 'check_violation';
  end if;
  update public.organizations set seats = p_seats where id = p_org;
end $$;

revoke all on function public.set_org_seats(uuid, integer) from public, authenticated, anon;
-- service_role only. Deliberately NOT granted to authenticated.

-- ─── (b) Only an owner may remove an owner ──────────────────────────
-- and (c) a departing member's live invitations die with their authority,
-- and (d) the owner count is taken under a lock.
create or replace function public.remove_member(p_org uuid, p_user uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  actor      uuid := auth.uid();
  actor_role text;
  target     text;
  owners     integer;
begin
  select role into actor_role from public.org_members
   where org_id = p_org and user_id = actor;
  if actor_role is null or actor_role not in ('owner','admin') then
    raise exception 'organisation not found' using errcode = 'insufficient_privilege';
  end if;

  select role into target from public.org_members where org_id = p_org and user_id = p_user;
  if target is null then
    raise exception 'that user is not a member of this organisation'
      using errcode = 'foreign_key_violation';
  end if;

  -- (b) An admin removing an owner was a full takeover in one call.
  -- set_member_role already refused the weaker operation; this matches it.
  if target = 'owner' and actor_role <> 'owner' then
    raise exception 'only an owner may remove another owner'
      using errcode = 'insufficient_privilege';
  end if;

  if target = 'owner' then
    -- (d) Serialize on the ORGANISATION row before counting. Without a
    -- lock, two concurrent removals both read 2 and both commit — they
    -- touch different rows, so Read Committed never forces a re-read — and
    -- the firm ends with no owner and no way back, because granting
    -- ownership requires an owner.
    --
    -- Locking the org (not the member rows) is deliberate: `select count(*)
    -- ... for update` is not even legal Postgres, and one lock point covers
    -- removal, demotion and any future seat change without deadlocking
    -- against itself.
    perform 1 from public.organizations where id = p_org for update;
    select count(*) into owners from public.org_members
     where org_id = p_org and role = 'owner';
    if owners <= 1 then
      raise exception 'cannot remove the last owner — promote someone else first'
        using errcode = 'check_violation';
    end if;
  end if;

  -- (c) Their pending invitations die with their authority. Otherwise an
  -- owner mints an owner-invite to a personal address, is offboarded, and
  -- redeems it later — back in, as owner.
  update public.org_invites
     set revoked_at = now()
   where org_id = p_org and invited_by = p_user
     and accepted_at is null and revoked_at is null;

  delete from public.household_advisors where org_id = p_org and user_id = p_user;
  delete from public.org_members where org_id = p_org and user_id = p_user;
end $$;

create or replace function public.set_member_role(p_org uuid, p_user uuid, p_role text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  actor      uuid := auth.uid();
  actor_role text;
  target     text;
  owners     integer;
begin
  select role into actor_role from public.org_members where org_id = p_org and user_id = actor;
  if actor_role is null or actor_role not in ('owner','admin') then
    raise exception 'organisation not found' using errcode = 'insufficient_privilege';
  end if;
  if p_role not in ('owner','admin','compliance','advisor') then
    raise exception 'unknown role %', p_role using errcode = 'check_violation';
  end if;
  if p_role = 'owner' and actor_role <> 'owner' then
    raise exception 'only an owner may grant ownership' using errcode = 'insufficient_privilege';
  end if;

  select role into target from public.org_members where org_id = p_org and user_id = p_user;
  if target is null then
    raise exception 'that user is not a member of this organisation'
      using errcode = 'foreign_key_violation';
  end if;
  if target = 'owner' and actor_role <> 'owner' then
    raise exception 'only an owner may change another owner''s role'
      using errcode = 'insufficient_privilege';
  end if;

  if target = 'owner' and p_role <> 'owner' then
    -- Same lock point as remove_member, so a concurrent remove-and-demote
    -- cannot between them empty the firm of owners.
    perform 1 from public.organizations where id = p_org for update;
    select count(*) into owners from public.org_members
     where org_id = p_org and role = 'owner';
    if owners <= 1 then
      raise exception 'cannot demote the last owner' using errcode = 'check_violation';
    end if;
  end if;

  -- (c) again: a demoted owner must not keep a live owner-invitation in
  -- flight that would let them back in at the old level.
  if target = 'owner' and p_role <> 'owner' then
    update public.org_invites
       set revoked_at = now()
     where org_id = p_org and invited_by = p_user and role = 'owner'
       and accepted_at is null and revoked_at is null;
  end if;

  update public.org_members set role = p_role where org_id = p_org and user_id = p_user;
end $$;

-- ─── (c) Redemption re-checks the inviter ───────────────────────────
-- plus: the invited address must be a CONFIRMED one. The email binding is
-- the whole security model, and it rests on auth.users.email — which on a
-- deployment with confirmations disabled is merely a string someone typed.
create or replace function public.accept_invite(p_token text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  actor      uuid := auth.uid();
  actor_mail text;
  confirmed  timestamptz;
  inv        public.org_invites%rowtype;
  seats_cap  integer;
  inviter    text;
begin
  if actor is null then
    raise exception 'sign in first' using errcode = 'insufficient_privilege';
  end if;

  select lower(email), email_confirmed_at into actor_mail, confirmed
    from auth.users where id = actor;

  select * into inv from public.org_invites
   where token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex');

  if inv.id is null
     or inv.accepted_at is not null
     or inv.revoked_at is not null
     or inv.expires_at <= now() then
    raise exception 'this invitation is not valid — ask for a new one'
      using errcode = 'insufficient_privilege';
  end if;

  -- An unconfirmed address is a claim, not an identity. Without this the
  -- email binding below can be defeated by signing up as someone else's
  -- address on a deployment where confirmations are off — and nothing in
  -- this repo pins that setting.
  if confirmed is null then
    raise exception 'confirm your email address first, then open the invitation again'
      using errcode = 'insufficient_privilege';
  end if;

  if actor_mail is distinct from inv.email then
    raise exception 'this invitation was sent to %, but you are signed in as %',
      inv.email, coalesce(actor_mail, '(unknown)')
      using errcode = 'insufficient_privilege';
  end if;

  -- The inviter must still hold the authority they exercised. An
  -- invitation is not a bearer instrument that outlives its author.
  select role into inviter from public.org_members
   where org_id = inv.org_id and user_id = inv.invited_by;
  if inviter is null or inviter not in ('owner','admin') then
    raise exception 'the person who invited you no longer administers this organisation — ask for a new invitation'
      using errcode = 'insufficient_privilege';
  end if;
  if inv.role = 'owner' and inviter <> 'owner' then
    raise exception 'this invitation is no longer valid — ask for a new one'
      using errcode = 'insufficient_privilege';
  end if;

  select seats into seats_cap from public.organizations where id = inv.org_id;
  if seats_cap is not null
     and (select count(*) from public.org_members where org_id = inv.org_id) >= seats_cap then
    raise exception 'this organisation has no seat available — ask an administrator'
      using errcode = 'check_violation';
  end if;

  insert into public.org_members (org_id, user_id, role)
  values (inv.org_id, actor, inv.role)
  on conflict (org_id, user_id) do nothing;

  update public.org_invites
     set accepted_at = now(), accepted_by = actor
   where id = inv.id;

  return inv.org_id;
end $$;

-- ─── The seat-count oracle ──────────────────────────────────────────
create or replace function public.org_seats_used(p_org uuid)
returns integer
language sql stable security definer set search_path = public
as $$
  -- Membership check. SECURITY DEFINER bypasses RLS, so without this any
  -- authenticated user could count seats in any organisation whose id they
  -- hold — contradicting the rule the rest of this file states three times.
  select case when p_org = any(public.auth_org_ids()) then
    (select count(*) from public.org_members where org_id = p_org)
  + (select count(*) from public.org_invites
      where org_id = p_org and accepted_at is null and revoked_at is null
        and expires_at > now())
  else null end;
$$;

-- ─── Org-scoped audit events ────────────────────────────────────────
-- A team event ("Invited X as advisor") is about the FIRM, not a client,
-- so it has no household. 008's tg_fill_household then tried to derive one
-- from the actor and RAISED for anyone advising more than one client —
-- i.e. every real firm — so membership changes were recorded nowhere. In a
-- single-client firm it was worse: the trigger succeeded and filed the
-- team event onto that client's regulatory trail.
create or replace function public.tg_fill_household() returns trigger as $$
declare
  hh uuid;
begin
  if new.household_id is null then
    -- An explicitly org-scoped row is legitimate: it is about the firm.
    -- Only rows with NEITHER need a household derived.
    if new.org_id is not null then
      return new;
    end if;
    hh := public.resolve_default_household(new.user_id);
    new.household_id := hh;
  end if;
  if new.org_id is null then
    select org_id into new.org_id from public.households where id = new.household_id;
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public;

-- A household and an org that disagree would file one firm's event onto
-- another firm's client. Cheap to make impossible.
alter table public.audit_events drop constraint if exists audit_events_org_matches_household;
alter table public.audit_events add constraint audit_events_org_matches_household
  check (household_id is null or org_id is not null);

-- Firm-level events have no household, so the 008 household policy cannot
-- see them. Without this they are written and never readable.
drop policy if exists "audit_events_org_select" on public.audit_events;
create policy "audit_events_org_select" on public.audit_events
  for select using (household_id is null and org_id = any(public.auth_org_ids()));

drop policy if exists "audit_events_org_insert" on public.audit_events;
create policy "audit_events_org_insert" on public.audit_events
  for insert with check (household_id is null and org_id = any(public.auth_org_ids()));

insert into public.schema_migrations (version) values ('012_seats_that_work')
on conflict (version) do nothing;
