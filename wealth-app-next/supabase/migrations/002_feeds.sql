-- ════════════════════════════════════════════════════════════════════
-- Feed connections — custodian & CRM endpoints relayed server-side.
--
-- The relay holds credentials so the browser never has to: the
-- single-file app's "Data feeds" panel can point at /api/feeds/<id>
-- and let the server carry the custodian token.
--
-- secret_ciphertext is AES-256-GCM output produced by lib/feeds/crypto.ts
-- with a key that lives ONLY in the server environment
-- (FEEDS_ENCRYPTION_KEY). A leaked database dump therefore does not
-- expose custodian credentials. It is never selected by any API route
-- that returns data to a client.
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.feed_connections (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  name              text not null check (length(trim(name)) between 1 and 120),
  url               text not null check (url ~* '^https?://'),
  kind              text not null default 'custodian' check (kind in ('custodian','crm')),
  format            text not null default 'auto'      check (format in ('auto','wa','crm','camt','ofx','csv')),
  auth              text not null default 'none'      check (auth in ('none','bearer','apikey','basic')),
  header            text default 'X-API-Key',
  default_country   text default 'CH' check (default_country is null or length(default_country) = 2),
  -- Encrypted at the application layer; never plaintext, never returned.
  secret_ciphertext text,
  last_run_at       timestamptz,
  last_status       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_feed_connections_user
  on public.feed_connections(user_id, created_at desc);

drop trigger if exists trg_feed_connections_updated_at on public.feed_connections;
create trigger trg_feed_connections_updated_at
  before update on public.feed_connections
  for each row execute function public.tg_set_updated_at();

-- ─── Row-level security — owner-only, same pattern as profiles ──────
alter table public.feed_connections enable row level security;

drop policy if exists "feed_connections_self_select" on public.feed_connections;
create policy "feed_connections_self_select" on public.feed_connections
  for select using (auth.uid() = user_id);

drop policy if exists "feed_connections_self_insert" on public.feed_connections;
create policy "feed_connections_self_insert" on public.feed_connections
  for insert with check (auth.uid() = user_id);

drop policy if exists "feed_connections_self_update" on public.feed_connections;
create policy "feed_connections_self_update" on public.feed_connections
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "feed_connections_self_delete" on public.feed_connections;
create policy "feed_connections_self_delete" on public.feed_connections
  for delete using (auth.uid() = user_id);
