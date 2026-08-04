# Deploy runbook — wealth-app-next

The SaaS has never been deployed. Migrations 002–010 have only ever run
against PGlite (`lib/db/__tests__/migrations.test.ts`). This document is
the ordered procedure for the first real deployment, and the checklist for
every one after it.

**Read this before creating the Supabase project.** Two of the decisions
below are irreversible after that point.

---

## 0. Decisions that cannot be changed later

| Decision | Why it is irreversible | Where it shows up |
|---|---|---|
| **Region** | A Supabase project's region is fixed at creation. Moving live household plans later is a migration with downtime. | `legal/PRIVACY-EN.md` promises "no data is transferred outside Switzerland or the EU". The sub-processor table there is still bracketed placeholders and names neither Supabase nor the hosting provider — **fill it in to match whatever is chosen here**, or the published policy is false. |
| **Point-in-time recovery tier** | PITR is a paid add-on selected at project creation on some plans. `audit_events` is the one table whose entire value is being trustworthy over years. | Nothing in the repo names an RPO/RTO. Decide one and write it here. |

---

## 1. Rehearse on a throwaway project first

Not optional for the first run. Migration `008_rekey_to_households.sql` is
322 lines that re-key order idempotency, and `010_survive_a_departure.sql`
rewrites foreign keys and a trigger on the order-of-record table. Their
first execution against real Postgres must not also be their first
execution against client data.

Create a second, disposable Supabase project, run §2 against it, run §4,
then delete it.

## 2. Apply the migrations, in order

```bash
cd wealth-app-next
supabase link --project-ref <your-project-ref>
npm run db:push
```

`db:push` applies every file in `supabase/migrations/` in filename order,
which is the same order `migrations.test.ts` proves works.

If applying by hand in the SQL editor instead, paste them **in filename
order**, one at a time, and stop at the first error:

```
001_init  002_feeds  003_orders  004_audit
005_fix_erasure_and_entitlement  006_tenancy
007_fix_entitlement_grants  008_rekey_to_households
009_household_management  010_survive_a_departure
```

> **`001_init.sql` must run as the SQL-editor `postgres` role.** It creates
> a trigger on `auth.users`, which needs a privilege the pooled application
> role does not hold. If that trigger silently fails to install, every
> signup lands with no organisation and the app answers "choose a client"
> with an empty list.

**Applying only `001_init.sql` produces an app that 500s on first login.**
Since migration 009, `/api/plan` reads `public.plans` (`lib/tenancy/plans.ts`)
and household resolution reads `public.households` — neither of which 001
creates. Older copies of `README.md`, `docs/development.md` and
`wealth-app-next/README.md` said to apply 001 and stop; they were wrong.

### Verify it took

```sql
select version, applied_at from public.schema_migrations order by version;
-- expect 10 rows, 001_init … 010_survive_a_departure

select tgname from pg_trigger where tgrelid = 'auth.users'::regclass;
-- expect trg_on_auth_user_created
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

`SUPABASE_SERVICE_ROLE_KEY` is **not** currently read by any code. Do not
provision it until something needs it — it bypasses every RLS policy in
006–010.

## 4. Smoke test

Against the throwaway project, in this order. Each step catches a distinct
class of failure:

1. `GET /api/health` → `{"status":"healthy"}`. Any `down` check stops the deploy.
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
