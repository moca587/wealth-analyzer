# Deploy runbook — wealth-app-next

The SaaS has never been deployed. Migrations 002–010 have only ever run
against PGlite (`lib/db/__tests__/migrations.test.ts`). This document is
the ordered procedure for the first real deployment, and the checklist for
every one after it.

**Read this before creating the Supabase project.** Two of the decisions
below are irreversible after that point.

---

## 0. Decisions that cannot be changed later

### Region — DECIDED: **EU (Frankfurt), `eu-central-1`**

Chosen 2026-08-05. Managed Supabase, EU region — "option A" in
[avaloq-deployment.md](avaloq-deployment.md). This is the option that lets
the app ship now: auth, RLS and the migrations all work as built, and the
data sits inside the EU, which satisfies the "Switzerland or the EU"
promise in `legal/PRIVACY-EN.md`.

- When creating the Supabase project, select region **Central EU
  (Frankfurt)**. It is fixed at creation; moving live household plans later
  is a migration with downtime.
- **`legal/PRIVACY-EN.md` must be finalised to match.** Its sub-processor
  table is still bracketed placeholders and names neither Supabase nor the
  compute host. Until it names *Supabase (EU/Frankfurt)* as the data
  processor, the published policy is not true. This is a lawyer-and-founder
  task, not an engineering one — flagged here so it is not forgotten.
- If a customer later requires data physically in **Switzerland**, that is
  "option B" (self-hosted Postgres in their Avaloq estate) and a separate
  deployment — see avaloq-deployment.md. Do not promise it against this
  Frankfurt project.

### Point-in-time recovery tier

PITR is a paid add-on selected at project creation on some plans.
`audit_events` is the one table whose entire value is being trustworthy
over years. Decide an RPO/RTO and record it here before creating the
project.

---

## 1. Rehearse against a real Postgres first

Not optional for the first run. `008_rekey_to_households.sql` re-keys order
idempotency and `010_survive_a_departure.sql` rewrites foreign keys and a
trigger on the order-of-record table. Their first execution against real
Postgres must not also be their first execution against client data.

Three fidelities, cheapest first — do at least the middle one before a real
deploy:

**CI (no Docker).** `lib/db/__tests__/migrations.test.ts` and
`scripts/deploy/__tests__/apply.test.ts` apply all 13 migrations to real
Postgres (PGlite) through the actual runner on every `npm run ci`. This
proves the SQL and the apply loop; it stubs Supabase's `auth` schema.

**Local throwaway Postgres (Docker).** Exercises the real triggers, RLS and
grants against a disposable database:

```bash
cd wealth-app-next
docker compose -f docker-compose.rehearsal.yml up -d
export DATABASE_URL=postgres://postgres:rehearsal@localhost:55432/postgres
npm run db:migrate -- --stub    # --stub creates the auth stand-ins a plain PG lacks
npm run db:verify
docker compose -f docker-compose.rehearsal.yml down -v   # discard
```

**Full-fidelity (Supabase CLI + Docker).** The only rehearsal with the REAL
`auth` schema and the actual `auth.users` trigger — install the Supabase CLI
separately, then `supabase start && supabase db reset`. Do this once before
the very first production deploy.

## 2. Apply the migrations, in order

```bash
cd wealth-app-next
# The DIRECT connection string (port 5432), NOT the pooler — 001 creates a
# trigger on auth.users the pooled role cannot. Supabase dashboard:
# Settings → Database → Connection string → URI. Append ?sslmode=require.
# (TLS verification is ON by default; an in-estate Postgres with a
# self-signed cert uses ?sslmode=no-verify instead — explicit, never silent.)
export DATABASE_URL='postgresql://postgres:...@db.<ref>.supabase.co:5432/postgres?sslmode=require'

npm run db:migrate -- --dry-run   # show the plan, change nothing
npm run db:migrate                # apply all pending, each in its own txn
npm run db:verify                 # assert the schema is what the app needs
```

`db:migrate` applies every pending `NNN_*.sql` in order, one transaction
each, recording `public.schema_migrations` as it goes. It refuses to run
out of order, is idempotent (a second run applies nothing), and on a
failure rolls that migration back and stops — so a re-run resumes cleanly
from the one that failed. Do NOT pass `--stub` against a real project (it
is rehearsal-only and the runner refuses it against a real auth schema).

> Prefer this over pasting into the SQL editor by hand. Applying files
> one-at-a-time and "stopping at the first error" is how a database ends up
> half-migrated: **applying only `001_init.sql` produces an app that 500s on
> first login**, because since migration 009 `/api/plan` reads `public.plans`
> and household resolution reads `public.households`, neither of which 001
> creates. (The Supabase CLI path — `supabase link` + `npm run db:push` —
> also works if you have the CLI installed.)

> **TLS.** The runner verifies the certificate by default. If `connect`
> fails with a cert error against the Supabase direct endpoint, its cert
> does not chain to a public CA in your trust store — append
> `?sslmode=require&sslrootcert=</path/to/supabase-ca.crt>` (download the CA
> from the dashboard) rather than dropping to `?sslmode=no-verify`, which
> turns off verification on the channel carrying your DDL.

### Verify it took

`npm run db:verify` runs these assertions and exits non-zero on any
failure. The key ones, if you want to check by hand in the SQL editor:

```sql
select count(*) from public.schema_migrations;              -- expect 13
select tgname from pg_trigger where tgrelid = 'auth.users'::regclass;
-- expect tg_on_auth_user_created; if absent, 001 ran as the wrong role
select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname='public' and c.relkind='r' and not c.relrowsecurity;
-- expect zero rows — every table must have RLS on
```

## 3. Environment

Set these in the **build** environment, not only at runtime —
`NEXT_PUBLIC_*` values are inlined into the browser bundle at build time. A
deploy that inherits CI's placeholders produces an app that renders
perfectly, can never authenticate, and emails confirmation links pointing
at `localhost`.

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | always | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | always | |
| `NEXT_PUBLIC_APP_URL` | always | The public origin. Confirmation and reset emails carry it. |
| `FEEDS_ENCRYPTION_KEY` | production | `openssl rand -base64 32`. A passphrase is rejected. |
| `FEEDS_ENCRYPTION_KEY_PREVIOUS` | during rotation only | See §6. |
| `ORDERS_HOST_ALLOWLIST` | production | Comma-separated PM/OMS hosts. Without it, order tickets could be POSTed to any public host. |
| `FEEDS_HOST_ALLOWLIST` | optional | Pins custodian feed egress. |

`lib/env.ts` checks all of these at boot (`instrumentation.ts`) and **in
production refuses to start** if a fatal one is wrong. A misconfigured
server that boots and reports itself healthy is the worst available
failure mode.

`SUPABASE_SERVICE_ROLE_KEY` is read by exactly one thing — the Stripe
webhook (`lib/supabase/admin.ts`), to write `is_paid`. Provision it only if
billing is enabled; it bypasses every RLS policy in 006–013, so nothing
else should ever hold it.

### Auth settings (dashboard, not env)

**Confirm email must be ON** (Authentication → Providers → Email → Confirm
email). This is not optional: migration 012's `accept_invite` refuses an
unconfirmed address, because the invite security model rests on the invited
email being one the user actually controls. `supabase/config.toml` pins this
for the local stack; the hosted project must be set to match. The signup UI
no longer suggests turning it off.

## 4. Smoke test

Machine half first — one command against the running instance:

```bash
BASE_URL=https://wealth.<firm>.ch npm run smoke
```

`smoke` asserts `/api/health` is not `unhealthy` (which calls `lib/env.ts`
server-side, so a fatal misconfiguration surfaces as `configuration: down`)
and prints the human checklist below. Then, by hand, in this order — each
step catches a distinct class of failure:

1. `npm run smoke` → `status: healthy`. Any `down` check stops the deploy.
2. Sign up. Confirm the email link points at `NEXT_PUBLIC_APP_URL`, not localhost.
3. Land on `/app`. A named household must already exist — this proves
   `tg_on_auth_user_created` installed and fired.
4. Save a plan, then save it again. `select version from public.plans` → 1, 2.
5. Open the same client in two tabs, save both. The second must show a
   version conflict, not silently win.
6. Add a second client from the sidebar switcher, then switch between them.
   The plan form must show different figures under each name.
7. `/app/feeds` → add a connection with a credential → "Test fetch". Proves
   `FEEDS_ENCRYPTION_KEY` is real.
8. `/app/audit` → the plan saves appear.

## 5. Rollback

There is no down-migration. Restore from a backup taken immediately before
§2 — which is why §1 exists, and why the PITR decision belongs in §0.

## 6. Rotating the credential encryption key

`FEEDS_ENCRYPTION_KEY` seals every custodian and OMS credential. Rotation
is a background job, not an outage, provided the order is respected:

1. Set `FEEDS_ENCRYPTION_KEY` to the new key **and**
   `FEEDS_ENCRYPTION_KEY_PREVIOUS` to the old one. Deploy. Both keys now
   open a secret; new secrets are sealed with the new key.
2. Re-encrypt: for each connection, `rotateSecret()` (`lib/feeds/crypto.ts`)
   and write back `secret_ciphertext` + `secret_key_id`.
3. Confirm nothing is left behind:
   ```sql
   select count(*) from public.feed_connections
    where secret_ciphertext is not null
      and secret_key_id is distinct from '<activeKeyId()>';
   -- and the same for order_connections; both must be 0
   ```
4. Only then unset `FEEDS_ENCRYPTION_KEY_PREVIOUS`.

Skipping step 3 leaves credentials that fail the moment step 4 happens —
discovered one client at a time, as a 500 partway through a statement pull
or a ticket marked `failed` partway through a placement.

## 7. Known operational gaps

Recorded so they are decisions rather than surprises:

- **Rate limits are per-instance.** `app/api/feeds/[id]/route.ts` and
  `app/api/orders/[id]/route.ts` hold their counters in module-scope `Map`s.
  On a horizontally-scaled host the effective limit is `LIMIT × instances`.
  Either pin the instance count to 1, or add an edge rate-limit rule, before
  scaling out.
- **No error aggregation.** There is no Sentry/OTel wiring. Per-event
  forensics do exist (`order_tickets` carries status, HTTP status, upstream
  ref and detail per attempt; feed runs land in the audit trail) but all of
  it sits behind household RLS, so an operator cannot answer "what happened
  to my client's order" without the customer's session.
- **The `unknown` order state pages nobody.** `readPlacementResponse`
  deliberately produces a third state for a ticket that may or may not have
  reached the OMS. That is exactly the case a human must look at, and
  nothing currently alerts.
