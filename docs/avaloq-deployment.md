# Deploying into an Avaloq environment

The target is a Swiss EAM running Avaloq, so the application has to be
something their platform team can run — a container they place, not a URL
we host. This document is what changes because of that, what is already
done, and what still needs a decision from Avaloq before the first
install.

Read [deploy-runbook.md](deploy-runbook.md) first for the database
procedure; this file only covers what is Avaloq-specific.

---

## What is already true

- **`output: "standalone"`** — `next.config.mjs` emits a self-contained
  Node server under `.next/standalone` with only the modules actually
  reached. No PaaS-specific adapter, no build step at deploy time.
- **A `Dockerfile`** that produces a non-root image on `node:20-alpine`,
  with a `HEALTHCHECK` against `/api/health`.
- **`/api/health`** distinguishes *unhealthy* (503 — take the instance out
  of rotation) from *degraded* (200 — running, some capability off). It is
  unauthenticated and deliberately reveals nothing: no version, no counts,
  no error text.
- **Boot-time configuration checking** (`lib/env.ts` via
  `instrumentation.ts`). In production the process refuses to start on a
  fatal misconfiguration rather than serving a site nobody can sign in to.
- **Security headers built per request** (`lib/csp.ts`, applied in
  `middleware.ts`). CSP, HSTS, `frame-ancestors 'none'`, nosniff,
  Referrer-Policy, Permissions-Policy, COOP.

## The build-time / run-time split — the thing that bites

`NEXT_PUBLIC_*` values are **compiled into the browser bundle**. They must
be supplied as `--build-arg`, not only at `docker run`:

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key> \
  --build-arg NEXT_PUBLIC_APP_URL=https://wealth.<firm>.ch \
  -t wealth-analyzer:<version> wealth-app-next
```

Get this wrong and the image renders perfectly, can never authenticate,
and emails confirmation links pointing at `localhost` — with nothing in
the server logs. `lib/env.ts` refuses to boot on the placeholder values
specifically because this failure is otherwise invisible.

**Server-side secrets are runtime only** and must never be build args — a
build arg is readable in the image history forever:

```bash
docker run -p 3000:3000 \
  -e FEEDS_ENCRYPTION_KEY=<openssl rand -base64 32> \
  -e ORDERS_HOST_ALLOWLIST=<the firm's OMS host> \
  wealth-analyzer:<version>
```

**One image per firm.** Because the Supabase project URL is baked in, a
single image cannot serve two EAMs with separate databases. That is the
right default for this market — an EAM expects its own instance — but it
means the build is per-customer, and the release pipeline has to reflect
that.

## Data residency

`legal/PRIVACY-EN.md` promises client data stays in Switzerland or the EU,
and its sub-processor table is still bracketed placeholders naming neither
Supabase nor any host. Deploying inside the firm's Avaloq environment is
the cleanest way to make that promise true, because the data never leaves
their infrastructure — but it only holds if **Postgres is also inside it**.

Two shapes, and the choice is a commercial one, not a technical one:

| | Where Postgres lives | Residency answer | Cost |
|---|---|---|---|
| **A. Container + managed Supabase** | Supabase, EU region | "EU, at Supabase" — needs the sub-processor table filled in | Lowest; auth, RLS and migrations all work as built |
| **B. Container + Postgres in the firm's estate** | Their infrastructure | "Never leaves your environment" — the strongest answer, and the one the Avaloq deck already implies | Supabase Auth must be replaced or self-hosted; see below |

Option B is the one an EAM's compliance officer wants to hear. It is not
free: this app uses Supabase for **auth** as well as storage, and RLS
policies depend on `auth.uid()` resolving from a JWT claim. Self-hosting
Supabase (it is open source) preserves all of that; swapping in a
different identity provider does not, and would mean re-pointing every
policy in migrations 006–011.

**Do not promise B before deciding which.** The migrations are portable —
011 deliberately avoids `pgcrypto` and uses only core `gen_random_uuid()`
and `sha256()` — but the auth layer is not automatically portable.

## What still needs an answer from Avaloq

These are questions for the platform team, not engineering decisions:

1. **Runtime.** Do they run OCI containers (Kubernetes, OpenShift), or do
   partner apps have to be something else? The image assumes the former.
2. **Ingress and TLS.** Who terminates TLS, and what hostname does the app
   see? `NEXT_PUBLIC_APP_URL` must be the public origin or every auth
   email link is wrong.
3. **Egress.** The order relay POSTs to an OMS and the feed relay GETs
   from custodians. Both are pinned by allowlist, but if egress is denied
   by default, those hosts need opening — and the SSRF guard's DNS
   resolution needs to work.
4. **Identity.** Does the firm expect SSO against their existing directory?
   If so, that is a Supabase Auth SAML/OIDC configuration, and it should be
   scoped before the first install rather than after.
5. **Postgres.** Option A or B above.
6. **Where the OMS actually is.** `ORDERS_HOST_ALLOWLIST` is required in
   production and is the only bound on where a live order ticket can be
   sent. It needs the real hostname of their Avaloq order endpoint.

## Avaloq-specific application behaviour that already exists

- `lib/orders/adapters.ts` speaks an **Avaloq dialect** on the wire, and
  pins `intent` to stage-only (`PENDING_APPROVAL`). Nothing in this
  application executes a trade.
- `ORDERS_HOST_ALLOWLIST` is **required in production** and re-checked at
  send time, not only when the connection is saved.
- `lib/orders/identifiers.ts` treats **Valor** as first-class, because
  Avaloq is a Swiss system that books on it natively. Wire preference is
  ISIN → Valor → CUSIP → symbol.
- The legacy repo also contains `wealth-analyzer-avaloq.html`, an
  Avaloq-branded edition of the single-file app. It is not part of the
  SaaS and is not deployed here.

## Verifying an install

Run the smoke test in [deploy-runbook.md](deploy-runbook.md) §4 against
the deployed instance. Add one Avaloq-specific check:

```bash
curl -s https://wealth.<firm>.ch/api/health | jq
# orderEgressPinned must be "ok" — "degraded" means ORDERS_HOST_ALLOWLIST
# is unset and a ticket could be POSTed to any public host.
```
