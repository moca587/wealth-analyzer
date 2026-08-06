-- ════════════════════════════════════════════════════════════════════
-- Billing — the write path for entitlement, and a webhook idempotency
-- ledger.
--
-- 006 put `is_paid`, `seats`, `stripe_customer_id`, `stripe_subscription_id`
-- and `subscription_status` on `organizations`, with NO client write policy
-- and 007 revoking UPDATE — deliberately, because a user who can set their
-- own `is_paid` has no entitlement at all. So the only writer is the Stripe
-- webhook, running server-side through the service role, which bypasses RLS.
--
-- The whole write path is ONE function, apply_stripe_event(), doing four
-- things in a single transaction so they cannot diverge. Each exists
-- because an adversarial review reproduced the failure of NOT doing it:
--
--   • IDEMPOTENCY + ATOMICITY. Stripe delivers at least once and retries on
--     any non-2xx. The ledger insert and the entitlement write are in the
--     SAME transaction, so a crash or timeout between "seen" and "applied"
--     cannot leave an event acknowledged-but-unapplied (which Stripe's retry
--     would then dedupe away, stranding the change).
--   • MONOTONICITY. Stripe does NOT guarantee event ORDER and retries for
--     ~3 days. Without a watermark, a stale `past_due` delivered after
--     `active` sets is_paid=false on a paying firm — indefinitely, because
--     Stripe's own state already settled and emits nothing further. Every
--     entitlement change is gated on the event's `created` timestamp against
--     a per-org watermark; an older event binds ids but does not change
--     is_paid / status / seats.
--   • SEAT FLOOR. Seats are only ever RAISED to cover members, never dropped
--     below them — a downgrade that stranded members would make the firm
--     unusable and unfixable through the product.
--   • CUSTOMER BINDING is guarded so one Stripe customer cannot be attached
--     to two orgs.
--
-- Nothing here is reachable by `authenticated`: apply_stripe_event is
-- service-role only, and stripe_events has no client grant at all.
-- ════════════════════════════════════════════════════════════════════

-- ─── Which Stripe customer maps to which org ────────────────────────
create unique index if not exists idx_org_stripe_customer
  on public.organizations(stripe_customer_id)
  where stripe_customer_id is not null;

-- ─── The entitlement watermark ──────────────────────────────────────
-- The `created` (unix seconds) of the newest entitlement-changing event
-- applied to this org. An event older than this is stale and must not
-- change is_paid / status / seats. NULL until the first such event.
alter table public.organizations
  add column if not exists last_billing_event_at bigint;

-- ─── Webhook event ledger ───────────────────────────────────────────
-- One row per Stripe event id. `applied` distinguishes "seen" from
-- "applied" so a delivery that crashed mid-apply is retried rather than
-- deduped away. Written only inside apply_stripe_event, in the same
-- transaction as the entitlement write.
create table if not exists public.stripe_events (
  id            text primary key,          -- Stripe's evt_… id
  type          text not null,
  org_id        uuid references public.organizations(id) on delete set null,
  event_created bigint,                     -- the event's `created`, unix seconds
  applied       boolean not null default false,
  received_at   timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
-- No policy: operator data, written only by the service role.
revoke all on public.stripe_events from authenticated, anon;
create index if not exists idx_stripe_events_org on public.stripe_events(org_id, received_at desc);

-- ─── The single write path ──────────────────────────────────────────
-- Returns a status the webhook maps to an HTTP result:
--   'applied'   — entitlement written
--   'bound'     — ids bound, no entitlement change carried (e.g. an
--                 unpaid checkout that only records the customer)
--   'stale'     — older than the watermark; ledgered, entitlement untouched
--   'duplicate' — this event id was already applied
--
-- p_is_paid is NULLABLE and null means "do not change is_paid" — a checkout
-- whose payment has not settled binds the customer id without granting the
-- product, and the authoritative customer.subscription.* event grants it.
create or replace function public.apply_stripe_event(
  p_event_id   text,
  p_event_type text,
  p_event_created bigint,
  p_org        uuid,
  p_is_paid    boolean,
  p_status     text,
  p_seats      integer,
  p_customer   text,
  p_subscription text
)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  prior_applied boolean;
  wm       bigint;
  members  integer;
begin
  if p_org is null then
    raise exception 'apply_stripe_event: org is required' using errcode = 'check_violation';
  end if;

  -- ── Idempotency, in this transaction ──
  insert into public.stripe_events (id, type, org_id, event_created, applied)
  values (p_event_id, p_event_type, p_org, p_event_created, false)
  on conflict (id) do nothing;
  if not found then
    -- Already seen. If it was fully applied, it is a true duplicate; if a
    -- prior delivery crashed before applying, fall through and apply now.
    select applied into prior_applied from public.stripe_events where id = p_event_id;
    if prior_applied then return 'duplicate'; end if;
  end if;

  -- Lock the org row: this serialises concurrent deliveries and is where
  -- the watermark is read and written, so two events cannot interleave.
  select last_billing_event_at into wm from public.organizations where id = p_org for update;
  if not found then
    raise exception 'apply_stripe_event: no such organisation %', p_org using errcode = 'foreign_key_violation';
  end if;

  -- Binding the customer id is always safe (monotonic via coalesce) and is
  -- done even for a stale or unpaid event, so the webhook can resolve future
  -- events by customer. Guard against stealing a customer bound elsewhere.
  if p_customer is not null then
    if exists (select 1 from public.organizations
                where stripe_customer_id = p_customer and id <> p_org) then
      raise exception 'that Stripe customer is already bound to another organisation'
        using errcode = 'unique_violation';
    end if;
  end if;
  update public.organizations
     set stripe_customer_id     = coalesce(p_customer, stripe_customer_id),
         stripe_subscription_id = coalesce(p_subscription, stripe_subscription_id),
         updated_at = now()
   where id = p_org;

  -- ── Entitlement change: watermark-gated ──
  -- Only events that actually assert is_paid move the watermark and the
  -- entitlement. A null p_is_paid (unpaid checkout) binds ids only.
  if p_is_paid is null then
    update public.stripe_events set applied = true where id = p_event_id;
    return 'bound';
  end if;

  if wm is not null and p_event_created is not null and p_event_created < wm then
    -- Older than what we have already applied — do not regress is_paid.
    update public.stripe_events set applied = true where id = p_event_id;
    return 'stale';
  end if;

  if p_seats is not null then
    select count(*) into members from public.org_members where org_id = p_org;
    update public.organizations set seats = greatest(p_seats, members) where id = p_org;
  end if;

  update public.organizations
     set is_paid = p_is_paid,
         subscription_status = coalesce(p_status, subscription_status),
         last_billing_event_at = greatest(coalesce(wm, 0), coalesce(p_event_created, 0)),
         updated_at = now()
   where id = p_org;

  update public.stripe_events set applied = true where id = p_event_id;
  return 'applied';
end $$;

revoke all on function public.apply_stripe_event(text, text, bigint, uuid, boolean, text, integer, text, text)
  from public, authenticated, anon;
grant execute on function public.apply_stripe_event(text, text, bigint, uuid, boolean, text, integer, text, text)
  to service_role;

insert into public.schema_migrations (version) values ('013_billing')
on conflict (version) do nothing;
