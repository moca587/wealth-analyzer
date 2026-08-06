-- ═══════════════════════════════════════════════════════════════════
-- REHEARSAL ONLY — minimal stand-ins for the Supabase-managed surface.
--
-- A real Supabase project already provides all of this. Applying it there
-- would SHADOW the real auth schema, so migrate.mjs refuses --stub against
-- any database that already has an auth.users table.
--
-- This mirrors the SUPABASE_STUB in lib/db/__tests__/migrations.test.ts,
-- so a plain-Postgres rehearsal and the PGlite CI test stub the same
-- surface — the migrations behave the same in both.
-- ═══════════════════════════════════════════════════════════════════

create schema if not exists auth;

create table if not exists auth.users (
  id                  uuid primary key default gen_random_uuid(),
  email               text,
  -- Real Supabase leaves this NULL until the address is confirmed, and
  -- 012's accept_invite refuses an unconfirmed one. Defaulted to now()
  -- here so seed rows are usable; the unconfirmed path is exercised by
  -- inserting an explicit NULL.
  email_confirmed_at  timestamptz default now(),
  raw_user_meta_data  jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

-- Supabase resolves the subject from the request JWT. A session GUC is the
-- faithful local equivalent.
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
end $$;

grant usage on schema public to anon, authenticated, service_role;

-- Supabase's default: new public tables are granted to the client roles as
-- they are created, which is why the migrations use column-level REVOKE to
-- protect individual columns.
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant select on tables to anon;
