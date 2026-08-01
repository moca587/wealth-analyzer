-- ════════════════════════════════════════════════════════════════════
-- Order routing — PM/OMS endpoints that stage BUY tickets.
--
-- The outbound mirror of 002_feeds.sql. Where a feed connection PULLS a
-- custodian statement, an order connection PUSHES an order ticket that a
-- person with trading authority then executes in the PM system.
--
-- secret_ciphertext is AES-256-GCM output from lib/feeds/crypto.ts, with
-- a key that lives ONLY in the server environment. It is never selected
-- by any route that returns data to a client.
--
-- `account` is deliberately a property of the CONNECTION, not of an
-- inbound ticket: the custody account an order books to must be set by
-- someone with server-side access, never chosen by a browser payload.
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.order_connections (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  name              text not null check (length(trim(name)) between 1 and 120),
  url               text not null check (url ~* '^https?://'),
  format            text not null default 'wa'   check (format in ('wa','avaloq','generic')),
  auth              text not null default 'none' check (auth in ('none','bearer','apikey','basic')),
  header            text default 'X-API-Key',
  -- Custody account / portfolio id every ticket on this connection books to.
  account           text not null check (length(trim(account)) between 1 and 120),
  custodian         text,
  currency          text not null default 'CHF' check (length(currency) = 3),
  -- Hard per-ticket ceiling in `currency`. The relay re-derives a ticket's
  -- total from its lines, which proves the ticket is internally COHERENT but
  -- not that the amount is AUTHORIZED — there is no server-side proposal of
  -- record to compare against, so any self-consistent set of numbers a client
  -- sends would otherwise be forwarded. This is the authorization boundary on
  -- size, and it lives where a browser cannot raise it. NULL = no ceiling.
  max_ticket_amount numeric(20,2) not null default 100000 check (max_ticket_amount > 0),
  -- When false the relay strips client.name/advisor before the wire. A
  -- mistyped URL then leaks only instrument and amount, never client identity.
  send_client_identity boolean not null default false,
  -- Encrypted at the application layer; never plaintext, never returned.
  secret_ciphertext text,
  last_sent_at      timestamptz,
  last_status       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_order_connections_user
  on public.order_connections(user_id, created_at desc);

drop trigger if exists trg_order_connections_updated_at on public.order_connections;
create trigger trg_order_connections_updated_at
  before update on public.order_connections
  for each row execute function public.tg_set_updated_at();

-- ─── Audit / idempotency ────────────────────────────────────────────
-- Every placement ATTEMPT lands here, written BEFORE the upstream call so
-- a crash mid-flight still leaves a record that something was sent.
--
-- The unique index on (user_id, ticket_id) is what actually makes
-- idempotency a guarantee rather than a hope: forwarding an
-- Idempotency-Key header only works if the PM system honours it, and a
-- double-click, a second browser tab, or a retry after a timeout must not
-- depend on that. `fingerprint` catches the more dangerous case — the same
-- ticket_id resubmitted with DIFFERENT contents, which is a changed order
-- masquerading as a retry.
create table if not exists public.order_tickets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  connection_id   uuid references public.order_connections(id) on delete set null,
  ticket_id       text not null check (length(trim(ticket_id)) between 8 and 80),
  -- Hash of what the ticket INSTRUCTS (account, currency, per-line
  -- instrument + amount) — not of cosmetic fields.
  fingerprint     text not null,
  account         text not null,
  currency        text not null check (length(currency) = 3),
  positions       integer not null check (positions >= 0),
  total_amount    numeric(20,2) not null check (total_amount >= 0),
  -- Full normalized wa.order/v1 ticket as sent, for reconstruction.
  payload         jsonb not null,
  -- 'unknown' is load-bearing, not a catch-all. A timed-out request, or a
  -- 2xx that was not a readable order acknowledgement, has NOT been shown to
  -- have failed: the PM system may have staged the ticket before the socket
  -- dropped. Recording that as 'failed' would invite a resend, which is how
  -- one model portfolio becomes two.
  status          text not null default 'sending'
                    check (status in ('sending','staged','rejected','failed','unknown')),
  http_status     integer,
  upstream_ref    text,
  detail          text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- One row per ticket per user: a replayed ticket_id is detected, not duplicated.
create unique index if not exists idx_order_tickets_idem
  on public.order_tickets(user_id, ticket_id);
create index if not exists idx_order_tickets_user
  on public.order_tickets(user_id, created_at desc);

drop trigger if exists trg_order_tickets_updated_at on public.order_tickets;
create trigger trg_order_tickets_updated_at
  before update on public.order_tickets
  for each row execute function public.tg_set_updated_at();

-- ─── Row-level security — owner-only, same pattern as feed_connections ──
alter table public.order_connections enable row level security;

drop policy if exists "order_connections_self_select" on public.order_connections;
create policy "order_connections_self_select" on public.order_connections
  for select using (auth.uid() = user_id);

drop policy if exists "order_connections_self_insert" on public.order_connections;
create policy "order_connections_self_insert" on public.order_connections
  for insert with check (auth.uid() = user_id);

drop policy if exists "order_connections_self_update" on public.order_connections;
create policy "order_connections_self_update" on public.order_connections
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "order_connections_self_delete" on public.order_connections;
create policy "order_connections_self_delete" on public.order_connections
  for delete using (auth.uid() = user_id);

alter table public.order_tickets enable row level security;

drop policy if exists "order_tickets_self_select" on public.order_tickets;
create policy "order_tickets_self_select" on public.order_tickets
  for select using (auth.uid() = user_id);

drop policy if exists "order_tickets_self_insert" on public.order_tickets;
create policy "order_tickets_self_insert" on public.order_tickets
  for insert with check (auth.uid() = user_id);

drop policy if exists "order_tickets_self_update" on public.order_tickets;
create policy "order_tickets_self_update" on public.order_tickets
  for update using (auth.uid() = user_id and status = 'sending')
  with check (auth.uid() = user_id);

-- Belt and braces behind the policy: the instruction itself is immutable, and
-- a terminal row cannot be reopened. An order audit trail that the advisor can
-- rewrite after the fact is not an audit trail.
create or replace function public.tg_order_tickets_immutable() returns trigger as $$
begin
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

drop trigger if exists trg_order_tickets_immutable on public.order_tickets;
create trigger trg_order_tickets_immutable
  before update on public.order_tickets
  for each row execute function public.tg_order_tickets_immutable();

-- Deliberately NO delete policy: an order audit trail is not the
-- advisor's to erase.
