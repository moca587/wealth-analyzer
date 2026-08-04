-- ════════════════════════════════════════════════════════════════════
-- Seats: letting a second person into a firm.
--
-- This is the migration that makes the product sellable, because until
-- now a "firm" could only ever have one member. 006 gives org_members no
-- INSERT policy and 007 revokes the grant outright — deliberately, since
-- any policy wide enough to let someone add themselves to an org is a
-- self-promotion-to-owner primitive. So the only way in is a narrow,
-- audited, SECURITY DEFINER path. That is this file.
--
-- THE PROPERTY THAT MATTERS MOST: an invite is bound to an EMAIL, and
-- accepting it requires being signed in as that email. Without that,
-- forwarding the invitation mail — which people do, constantly, to their
-- personal address or an assistant — hands a stranger a seat inside a
-- firm that holds its clients' entire financial position. Everything
-- else here is ordinary; that one check is the whole security model.
--
-- Tokens are stored HASHED, like a password reset. A leaked database
-- dump must not contain usable invitations.
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.org_invites (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  -- Lower-cased on write so the accept-time comparison cannot be defeated
  -- by "Anna@Firm.ch" vs "anna@firm.ch".
  email        text not null check (position('@' in email) > 1 and length(email) <= 320),
  role         text not null default 'advisor'
                 check (role in ('owner','admin','compliance','advisor')),
  -- sha256 of the token that went out in the email. The raw token exists
  -- only in that message and in the invitee's URL.
  token_hash   text not null,
  expires_at   timestamptz not null,
  invited_by   uuid references auth.users(id) on delete set null,
  accepted_at  timestamptz,
  accepted_by  uuid references auth.users(id) on delete set null,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);

create unique index if not exists idx_org_invites_token on public.org_invites(token_hash);
create index if not exists idx_org_invites_org on public.org_invites(org_id, created_at desc);

-- One LIVE invite per (org, email). A second invitation to the same
-- person is a re-send, not a second seat — without this, ten resends
-- consume ten seats in the count below.
create unique index if not exists idx_org_invites_pending
  on public.org_invites(org_id, lower(email))
  where accepted_at is null and revoked_at is null;

alter table public.org_invites enable row level security;

-- Admins of the org may read their own invitations. Note there is NO
-- policy for the invitee: they are not a member yet, so they cannot see
-- the row at all — which is why acceptance has to be SECURITY DEFINER.
drop policy if exists "org_invites_admin_select" on public.org_invites;
create policy "org_invites_admin_select" on public.org_invites
  for select using (org_id = any(public.auth_admin_org_ids()));

-- No INSERT/UPDATE/DELETE policies: every write goes through the
-- functions below, which check the caller's role and the seat count.
revoke all on public.org_invites from authenticated, anon;
grant select on public.org_invites to authenticated;

-- ─── Seat accounting ────────────────────────────────────────────────
-- A pending invite holds a seat. Otherwise a firm on 3 seats invites
-- five people, all five accept, and the overage is discovered at renewal
-- rather than at the moment it happens.
create or replace function public.org_seats_used(p_org uuid)
returns integer
language sql stable security definer set search_path = public
as $$
  select (select count(*) from public.org_members where org_id = p_org)
       + (select count(*) from public.org_invites
           where org_id = p_org and accepted_at is null and revoked_at is null
             and expires_at > now());
$$;

-- ─── Invite ─────────────────────────────────────────────────────────
-- Returns the RAW token. It is returned exactly once, to the caller who
-- created it, and never stored — the table holds only its hash.
create or replace function public.create_invite(
  p_org   uuid,
  p_email text,
  p_role  text default 'advisor',
  p_ttl_days integer default 14
)
returns table (invite_id uuid, token text, expires_at timestamptz)
language plpgsql security definer set search_path = public
as $$
declare
  actor      uuid := auth.uid();
  actor_role text;
  norm_email text := lower(trim(p_email));
  raw_token  text;
  seats_cap  integer;
  used       integer;
  new_id     uuid;
  exp        timestamptz;
begin
  if actor is null then
    raise exception 'not authenticated' using errcode = 'insufficient_privilege';
  end if;

  select role into actor_role from public.org_members
   where org_id = p_org and user_id = actor;
  if actor_role is null or actor_role not in ('owner','admin') then
    -- Same answer whether the org does not exist or the caller is not an
    -- admin of it; confirming another firm exists is itself a leak.
    raise exception 'organisation not found' using errcode = 'insufficient_privilege';
  end if;

  if p_role not in ('owner','admin','compliance','advisor') then
    raise exception 'unknown role %', p_role using errcode = 'check_violation';
  end if;

  -- An admin cannot mint an owner. Otherwise "admin" is one invitation
  -- away from full control of billing and every household in the firm.
  if p_role = 'owner' and actor_role <> 'owner' then
    raise exception 'only an owner may invite another owner'
      using errcode = 'insufficient_privilege';
  end if;

  if norm_email = '' or position('@' in norm_email) < 2 then
    raise exception 'a valid email address is required' using errcode = 'check_violation';
  end if;

  -- Already a member? Re-inviting them would consume a seat and produce a
  -- token that accept_invite refuses anyway.
  if exists (
    select 1 from public.org_members m
      join auth.users u on u.id = m.user_id
     where m.org_id = p_org and lower(u.email) = norm_email
  ) then
    raise exception 'that person is already a member of this organisation'
      using errcode = 'unique_violation';
  end if;

  select seats into seats_cap from public.organizations where id = p_org;
  used := public.org_seats_used(p_org);
  if seats_cap is not null and used >= seats_cap then
    raise exception 'this organisation has % of % seats in use — add seats before inviting', used, seats_cap
      using errcode = 'check_violation';
  end if;

  if p_ttl_days is null or p_ttl_days < 1 or p_ttl_days > 60 then
    p_ttl_days := 14;
  end if;
  exp := now() + make_interval(days => p_ttl_days);

  -- 64 hex chars from two v4 UUIDs: ~244 bits of CSPRNG entropy, which is
  -- far beyond guessable. Deliberately NOT pgcrypto's gen_random_bytes —
  -- gen_random_uuid() and sha256() are both core Postgres, so this works
  -- on a stock instance with no extension to enable. (Supabase ships
  -- pgcrypto, a self-hosted or Avaloq-hosted Postgres may not.)
  raw_token := replace(gen_random_uuid()::text, '-', '')
            || replace(gen_random_uuid()::text, '-', '');

  -- Supersede any live invitation for the same person rather than
  -- colliding with the partial unique index: a re-send should work.
  update public.org_invites
     set revoked_at = now()
   where org_id = p_org and lower(email) = norm_email
     and accepted_at is null and revoked_at is null;

  insert into public.org_invites (org_id, email, role, token_hash, expires_at, invited_by)
  values (p_org, norm_email, p_role,
          encode(sha256(convert_to(raw_token, 'UTF8')), 'hex'), exp, actor)
  returning id into new_id;

  return query select new_id, raw_token, exp;
end $$;

-- ─── Accept ─────────────────────────────────────────────────────────
-- SECURITY DEFINER because the invitee cannot see org_invites, cannot
-- insert into org_members, and is not yet related to the organisation in
-- any way a policy could express.
create or replace function public.accept_invite(p_token text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  actor      uuid := auth.uid();
  actor_mail text;
  inv        public.org_invites%rowtype;
  seats_cap  integer;
begin
  if actor is null then
    raise exception 'sign in first' using errcode = 'insufficient_privilege';
  end if;

  select lower(email) into actor_mail from auth.users where id = actor;

  select * into inv from public.org_invites
   where token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex');

  -- Deliberately ONE message for every failure below. Distinguishing
  -- "expired" from "no such invitation" turns this into an oracle for
  -- probing which tokens exist.
  if inv.id is null
     or inv.accepted_at is not null
     or inv.revoked_at is not null
     or inv.expires_at <= now() then
    raise exception 'this invitation is not valid — ask for a new one'
      using errcode = 'insufficient_privilege';
  end if;

  -- *** THE CHECK THIS WHOLE FILE EXISTS FOR ***
  -- Invitation emails get forwarded. Without this, whoever opens the
  -- message gets a seat inside a firm holding its clients' full financial
  -- position.
  if actor_mail is distinct from inv.email then
    raise exception 'this invitation was sent to %, but you are signed in as %',
      inv.email, coalesce(actor_mail, '(unknown)')
      using errcode = 'insufficient_privilege';
  end if;

  -- Seats are re-checked at ACCEPT, not only at invite: the firm may have
  -- downgraded, or other invitations may have landed first.
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

  -- Note what is NOT done here: no household assignment. A new advisor
  -- joins the firm seeing nothing, and an owner assigns clients with
  -- set_advisor (009). Auto-assigning the firm's whole book on join would
  -- make the advisor role meaningless.
  return inv.org_id;
end $$;

-- ─── Revoke ─────────────────────────────────────────────────────────
create or replace function public.revoke_invite(p_invite uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  inv_org uuid;
begin
  select org_id into inv_org from public.org_invites where id = p_invite;
  if inv_org is null or not (inv_org = any(public.auth_admin_org_ids())) then
    raise exception 'invitation not found' using errcode = 'insufficient_privilege';
  end if;
  update public.org_invites set revoked_at = now()
   where id = p_invite and accepted_at is null and revoked_at is null;
end $$;

-- ─── Remove a member ────────────────────────────────────────────────
-- Offboarding. 010 made this survivable — the firm's orders, feeds and
-- audit trail no longer die with the person — but there was still no way
-- to do it through the product.
create or replace function public.remove_member(p_org uuid, p_user uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  actor  uuid := auth.uid();
  target text;
  owners integer;
begin
  if not (p_org = any(public.auth_admin_org_ids())) then
    raise exception 'organisation not found' using errcode = 'insufficient_privilege';
  end if;

  select role into target from public.org_members where org_id = p_org and user_id = p_user;
  if target is null then
    raise exception 'that user is not a member of this organisation'
      using errcode = 'foreign_key_violation';
  end if;

  -- Never leave a firm with no owner: nobody could then invite, assign,
  -- or manage billing, and there is no self-service way back.
  if target = 'owner' then
    select count(*) into owners from public.org_members
     where org_id = p_org and role = 'owner';
    if owners <= 1 then
      raise exception 'cannot remove the last owner — promote someone else first'
        using errcode = 'check_violation';
    end if;
  end if;

  -- Their household assignments go with them; the households, plans,
  -- orders and audit trail do not (see 010).
  delete from public.household_advisors where org_id = p_org and user_id = p_user;
  delete from public.org_members where org_id = p_org and user_id = p_user;
end $$;

-- ─── Change a member's role ─────────────────────────────────────────
create or replace function public.set_member_role(p_org uuid, p_user uuid, p_role text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  actor      uuid := auth.uid();
  actor_role text;
  owners     integer;
begin
  select role into actor_role from public.org_members where org_id = p_org and user_id = actor;
  if actor_role is null or actor_role not in ('owner','admin') then
    raise exception 'organisation not found' using errcode = 'insufficient_privilege';
  end if;
  if p_role not in ('owner','admin','compliance','advisor') then
    raise exception 'unknown role %', p_role using errcode = 'check_violation';
  end if;
  -- Only an owner may create or remove an owner.
  if p_role = 'owner' and actor_role <> 'owner' then
    raise exception 'only an owner may grant ownership' using errcode = 'insufficient_privilege';
  end if;
  if exists (select 1 from public.org_members
              where org_id = p_org and user_id = p_user and role = 'owner')
     and actor_role <> 'owner' then
    raise exception 'only an owner may change another owner''s role'
      using errcode = 'insufficient_privilege';
  end if;

  if p_role <> 'owner' then
    select count(*) into owners from public.org_members where org_id = p_org and role = 'owner';
    if owners <= 1 and exists (select 1 from public.org_members
                                where org_id = p_org and user_id = p_user and role = 'owner') then
      raise exception 'cannot demote the last owner' using errcode = 'check_violation';
    end if;
  end if;

  update public.org_members set role = p_role where org_id = p_org and user_id = p_user;
end $$;

-- ─── Signup joins the inviting firm, not a new one ──────────────────
-- 006's trigger mints a personal organisation for EVERY new user. Someone
-- signing up because they were invited would get a junk one-person firm
-- AND an empty household named after their email prefix, then join the
-- real firm separately. Worse, that stray household is indistinguishable
-- from a real client in the switcher.
create or replace function public.tg_on_auth_user_created()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_org uuid;
  new_hh  uuid;
  nm      text;
  pending integer;
begin
  nm := coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1));

  insert into public.profiles (id, display_name) values (new.id, nm);

  -- Is someone already expecting this person? Then they are joining a
  -- firm, not founding one. The invitation is still accepted explicitly
  -- (accept_invite) — this only suppresses the personal org so they do
  -- not start out inside a shell company.
  select count(*) into pending from public.org_invites
   where lower(email) = lower(new.email)
     and accepted_at is null and revoked_at is null and expires_at > now();

  if pending > 0 then
    return new;
  end if;

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

-- ─── Grants ─────────────────────────────────────────────────────────
revoke all on function public.create_invite(uuid, text, text, integer) from public;
revoke all on function public.accept_invite(text) from public;
revoke all on function public.revoke_invite(uuid) from public;
revoke all on function public.remove_member(uuid, uuid) from public;
revoke all on function public.set_member_role(uuid, uuid, text) from public;
revoke all on function public.org_seats_used(uuid) from public;

grant execute on function public.create_invite(uuid, text, text, integer) to authenticated;
grant execute on function public.accept_invite(text) to authenticated;
grant execute on function public.revoke_invite(uuid) to authenticated;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
grant execute on function public.set_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.org_seats_used(uuid) to authenticated;

-- ─── One more audit action ──────────────────────────────────────────
-- 010 added the tenancy vocabulary but not this one: a role change is not
-- a join, and recording it as one makes the trail lie about what happened.
alter table public.audit_events
  drop constraint if exists audit_events_action_check;
alter table public.audit_events
  add constraint audit_events_action_check check (action in (
    'plan.updated','feed.run','feed.applied',
    'order.staged','order.rejected','order.unknown',
    'order.duplicate_blocked','report.exported',
    'connection.created','connection.updated','connection.deleted',
    'household.created','household.updated',
    'advisor.assigned','advisor.unassigned',
    'member.invited','member.joined','member.removed','member.role_changed'
  ));

insert into public.schema_migrations (version) values ('011_invites')
on conflict (version) do nothing;
