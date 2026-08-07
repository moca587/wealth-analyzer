# CLAUDE.md — Wealth Analyzer: Monte Carlo Financial Planner

> This file documents the full design and engineering decisions made during the development of this application. It is intended for use by Claude in future sessions to maintain continuity and avoid re-litigating resolved decisions.

---

## Project Overview

A single-file (`wealth-analyzer.html`) personal wealth analysis web application that runs entirely in the browser with no backend, no build step, and no dependencies beyond two CDN scripts (Chart.js and Google Fonts).

**Core capabilities:**
- Household profile management (1–2 clients + children)
- Multi-country account/asset registry (19 countries, ~500 account types)
- Loan tracking with amortization math
- Financial goal tracking with calendar-year targets
- Monte Carlo simulation (Box-Muller transform, configurable percentile bands)
- Country-aware inflation region presets (50-year historical averages)
- Risk profile + time horizon framework driving simulation parameters

> **DIRECTION CHANGE (2026-08-04): the SaaS is now the product.** `wealth-app-next/`
> is what gets built and sold; the single-file HTML app documented above is no
> longer the parity gate and no longer receives feature work. It stays in the
> repo — it is 22k lines of working, shipped code and the only thing that has
> ever run in front of a client — as reference for behaviour the SaaS still has
> to reproduce, and as a fallback until the SaaS has been deployed and used in
> anger. Do not delete it, and keep `legacy:check` green so the artifacts stay
> coherent. New work goes in `wealth-app-next/`; see
> [SaaS Migration](#saas-migration--wealth-app-next-stage-1) below.

---

## Architecture Decisions

### Single-file HTML
**Decision:** All HTML, CSS, and JavaScript live in one `wealth-analyzer.html` file.

**Rationale:** Earlier in development, the app was split into `index.html`, `data.js`, and `app.js`. This caused loading-order bugs (`DOMContentLoaded` fired before data scripts loaded in some browsers), a broken `showTab()` that relied on the global `event` object, and inconsistent element IDs across files. Consolidating into one file eliminated all of these issues with no downside for a single-page application of this size.

### No framework, no build
**Decision:** Vanilla JS, no React/Vue/Webpack/Vite.

**Rationale:** The app needs to be openable directly from the filesystem (`file://` protocol). Any bundler or module system would require a dev server. Vanilla JS with careful DOM management is perfectly adequate for this scope.

### CDN dependencies only
- `https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js` — charts
- `https://fonts.googleapis.com/css2?family=DM+Serif+Display...` — typography

No other external dependencies. If offline use is required, both can be vendored locally.

---

## UI/UX Decisions

### Dark theme
**Colors:** `#0f0f0f` base, `#161616` panels, `#1e1e1e` inputs, gold accent `#c9a96e`.
**Typography:** DM Serif Display (headings/values) + DM Sans (body/UI).
**Rationale:** Financial tools benefit from a refined, serious aesthetic. The gold accent on dark background signals premium/wealth context.

### Sidebar navigation with persistent metrics bar
The six metric cards (Net Worth, Monthly Surplus, Median Wealth, Goal Success, Total Assets, Household Risk) are always visible at the top regardless of active tab. This gives constant feedback while editing any section.

### Tab-based layout
Seven tabs: Household, Income, Expenses, Assets, Liabilities, Goals, Simulation. Avoids one long scrolling page. The simulation tab auto-activates after running.

### Collapsible address section
Address fields are hidden behind a `▶ Address` toggle to keep client cards compact. They expand inline without re-rendering.

---

## Data Model

### Goals
Goals store a `targetYear` (calendar year, e.g. 2050) rather than "years from now". The simulation converts to a relative index at runtime: `relYr = targetYear - currentYear`. This makes goals stable across time (a goal set for 2050 stays 2050, not "25 years" which would drift).

**Key:** `{ name: string, amt: number, targetYear: number }`

### Loans
```js
{ type: string, label: string, bal: number, rate: number, yrs: number }
```
Monthly payment calculated with standard amortization: `P × (r(1+r)^n) / ((1+r)^n − 1)`. Balances amortize down each simulation year.

### Assets
```js
{ id, type, group, label, baseLabel, value, liquid, country, note }
```
`liquid` flag distinguishes cash/investment accounts from locked accounts (pension, retirement). Used for simulation allocation logic.

### Children
```js
{ id: string, first: string, last: string, dob: string }
```
DOB stored as ISO date string (`YYYY-MM-DD`). Age calculated at render time.

---

## Monte Carlo Engine

### Algorithm
- **Simulations:** 200 / 500 / 1000 (user-selectable)
- **Random returns:** Log-normal via Box-Muller transform
  ```
  annRet = (μ - 0.5σ²) + σ × N(0,1)
  ```
- **Property appreciation:** Stochastic `3% ± 2%` annual growth
- **Debt amortization:** Per-loan annual balance reduction with actual interest math
- **Savings allocation:** 30% of surplus invested, 70% to cash

### Percentile bands
Three presets:
| Preset | Low | Mid | High |
|--------|-----|-----|------|
| Standard | 10th | 50th | 80th |
| Alternative | 20th | 60th | 90th |
| Custom | user | user | user |

Chart renders: outer band (low–high), inner band (25th–75th), median line.

### Return parameters by risk profile
| Profile | Mean return | Volatility |
|---------|-------------|------------|
| Very conservative | 3.5% | 4% |
| Conservative | 4.5% | 7% |
| Moderately conservative | 5.5% | 9% |
| Moderate | 7.0% | 12% |
| Moderately aggressive | 8.5% | 15% |
| Aggressive | 10.0% | 18% |
| Very aggressive | 12.0% | 22% |

When two clients are present, parameters are averaged.

---

## Country & Account System

### Supported countries (19)
US, CA, GB, AU, CH, EU, JP, SG, HK, CN, TW, KR, IN, ID, MX, BR, SA, ZA, OTHER

### Account type structure per country
Each country has `groups[]`, each group has `accounts[]` with:
- `value` — unique identifier
- `label` — display name (native script where applicable, e.g. Japanese kanji)
- `note` — one-line explanation with key facts (insurance limits, contribution caps, tax treatment)
- `liquid` — boolean for simulation classification

### Country → asset sync
Selecting a country in the Client 1 address field automatically updates the Asset tab's country selector and refreshes account types.

---

## Inflation Presets

50-year historical averages (1974–2024) per region:

| Region | Rate | Notes |
|--------|------|-------|
| Switzerland | 2.1% | World's lowest sustained inflation |
| Japan | 2.0% | Deflation era 1998–2012 pulls down |
| Saudi Arabia | 2.5% | Oil-pegged economy |
| Singapore | 2.8% | |
| Euro zone | 3.1% | HICP blended |
| Canada | 3.7% | |
| United States | 3.8% | CPI-U |
| China & Taiwan | 3.9% | Blended |
| Hong Kong | 4.1% | |
| Australia | 4.4% | |
| United Kingdom | 4.8% | RPI/CPI |
| South Korea | 5.2% | High 70s–80s |
| India | 7.4% | |
| South Africa | 8.9% | |
| Indonesia | 11.6% | 1998 spike |
| Mexico | 15.2% | 1980s–90s crisis era |
| Brazil | 58.5% | Hyperinflation pre-1994; recommend manual override to ~7% |

---

## Known Issues & Future Work

### Resolved bugs
- ✅ Children text inputs lost focus on every keystroke (fixed: smart DOM update, no re-render on text input)
- ✅ Goal analysis showed "yr 25" instead of calendar year (fixed: `targetYear` model)
- ✅ Client 2 income block not syncing avatar initials (fixed in `updateDisplays`)
- ✅ Three-file split caused load order bugs (fixed: single file)
- ✅ `showTab()` relied on global `event` object (fixed: explicit `el` parameter)

### Potential enhancements
- [ ] Export to PDF report
- [ ] Save/load household profile (localStorage or file download/upload)
- [ ] Tax modelling per country (capital gains, income brackets)
- [ ] Retirement drawdown phase (after accumulation)
- [ ] Social Security / state pension benefit estimator
- [ ] Currency selector (currently assumes single currency / USD display)
- [ ] Sensitivity analysis: tornado chart showing which inputs move the median most
- [ ] Portfolio rebalancing logic (currently static allocation)
- [ ] Inflation-adjusted vs nominal toggle on chart

---

## SaaS Migration — `wealth-app-next/` (Stage 1)

**What it is:** a parallel rebuild of the app as a real multi-user SaaS in
`wealth-app-next/`, using Next.js 14 (App Router) + Supabase. It lives in the
same repo as the legacy single-file app.

**Status:** the product. As of 2026-08-04 this is what gets built and sold. The
legacy `wealth-analyzer.html` is kept as reference and fallback but is not the
parity gate any more (see the note at the top of this file). It has still never
been deployed: migrations 002-012 have only ever run against PGlite, so the
first real deployment is the next gate — `docs/deploy-runbook.md`, and
`docs/avaloq-deployment.md` for the Avaloq-hosted shape. **Region decided
2026-08-05: managed Supabase in the EU (Frankfurt / `eu-central-1`)** — the
option that ships now; a Swiss-domiciled Postgres in a customer's Avaloq
estate is a separate later deployment. `legal/PRIVACY-EN.md` still needs its
sub-processor table finalised to name Supabase (EU) before that promise is
true — a founder/lawyer task, flagged in the runbook.

**Why a rebuild (not a port of the monolith):** the single file is ~22k lines
of vanilla JS with all state in the DOM. A real product needs accounts, saved
plans, server-side persistence, and auth — which means a framework, a database,
and validated data. The engine/data are ported as pure modules; the UI is
rebuilt as React components rather than copied.

### Stack
Next.js 15 (App Router) · React 19 · TypeScript · Tailwind + shadcn-style UI ·
Supabase (Postgres + Auth + Row-Level Security) · Zod (validation) · Vitest
(tests) · Chart.js via `react-chartjs-2`. Node 20+. ESLint 8.x with
`eslint-config-next@15`. (Upgraded from Next 14/React 18 to clear the Next.js
security advisories — `cookies()` is async in 15, so `lib/supabase/server.ts`
`createClient()` is async and its callers `await` it.)

### Layout
```
wealth-app-next/
├── lib/engine/          ← pure TS port of the Monte Carlo + financial math
│   ├── types.ts         ←   WealthPlan, Client, Asset, Goal, CountryCode…
│   ├── constants.ts     ←   RISK_PROFILES, HORIZON_PROFILES, INFLATION_REGIONS,
│   │                        inflationRegionForCountry()
│   ├── financial-math.ts←   Box-Muller (seedable), amortization, PV/FV, ageFromDOB
│   └── monte-carlo.ts   ←   runMonteCarlo(input)
├── lib/plan/            ← schema.ts (Zod), default-plan.ts, migrate.ts, import-export.ts
├── lib/data/            ← country-accounts.ts (GENERATED — see below)
├── lib/feeds/           ← custodian/CRM relay: model.ts (wa.feed/v1), adapters.ts,
│                          ssrf.ts (SSRF guard), crypto.ts (AES-GCM), xml.ts, schema.ts
├── lib/supabase/        ← browser + server clients (@supabase/ssr)
├── components/plan/     ← PlanForm + sections/{household,children,assets,import-export}
├── components/sim/      ← sim runner + chart
├── app/                 ← (auth)/{login,signup}, app/ (gated), app/plan, app/simulate,
│                            api/plan, api/feeds, preview/plan (dev-only, 404s in prod)
├── middleware.ts        ← Supabase session refresh + /app/* auth gate
└── supabase/migrations/ ← 001_init.sql (profiles + simulations),
                            002_feeds.sql (feed_connections + RLS)
```

### Feed relay — `/api/feeds` (custodian & CRM direct feeds)
The single-file app can pull custodian/CRM data itself, but a browser-direct
call needs the endpoint to send CORS headers, and putting a long-lived
custodian credential in a browser is not something a bank will bless. This
relay holds the credential server-side and answers with the SAME
**`wa.feed/v1`** model the legacy "Data feeds" panel consumes — point a
connection at `/api/feeds/<id>` and that panel works unchanged.

- `GET/POST /api/feeds` — list/create connections. `GET /api/feeds/<id>` RUNS
  the relay (fetch upstream → normalize → `wa.feed/v1`); PATCH/DELETE manage.
  All owner-scoped by RLS + explicit `user_id` filters; a foreign row 404s
  rather than 403s (don't confirm it exists). `runtime = "nodejs"` is required
  (node:crypto + node:dns).
- **`lib/feeds/ssrf.ts` is the security boundary — read it before touching the
  relay.** The relay fetches a URL the *user* supplies from *our* network, so
  without it this is an SSRF primitive (cloud metadata at 169.254.169.254,
  anything in the VPC, loopback). Guards: scheme allowlist, no embedded
  credentials, DNS resolution with EVERY resolved address range-checked
  (defeats DNS rebinding by name), manual redirect following with each hop
  re-validated, 15s timeout, 5 MB streaming cap. Optional
  `FEEDS_HOST_ALLOWLIST` pins it to named hosts. Residual TOCTOU window
  between DNS check and connect is documented in the file header.
- **Credentials are encrypted at rest** (AES-256-GCM, `FEEDS_ENCRYPTION_KEY`
  in the server env only) so a leaked DB dump doesn't expose custodian
  tokens. Fails CLOSED: no key → refuses to store a secret (503) rather than
  persisting plaintext. Secrets are never returned by any route (`toPublic()`
  maps ciphertext → `hasSecret: boolean`). **Only real key material is
  accepted** — 64 hex chars or 43-char base64. A passphrase is REJECTED; the
  old sha256 fallback made fail-closed unreachable (every string, `changeme`
  included, produced a working key, so a stolen dump was brute-forcible
  offline). Generate with `openssl rand -base64 32`.
- Adapters (`adapters.ts`, pure/testable): native `wa.feed/v1`, generic CRM
  contact JSON (Salesforce `__c` suffixes, HubSpot `properties` bags, OData
  envelopes, bare arrays), ISO 20022 **camt.052/053/054** (closing booked
  balance, CLBD→CLAV→PRCD→ITBD, `CdtDbtInd` sends debits to liabilities),
  OFX/QFX, and CSV (header-matched; refuses to guess when no value column is
  found). `xml.ts` is a hand-rolled parser that **skips DOCTYPE/ENTITY
  entirely**, making XXE and billion-laughs impossible by construction —
  don't swap it for a full DOM parser without re-checking that.
- Tests under `lib/feeds/__tests__/` cover the SSRF ranges (incl. IPv4-mapped
  IPv6, NAT64/6to4 wrappers, decimal/octal IP encodings), a `safeFetch` test
  that starts a REAL loopback server and asserts it is never hit, XXE
  immunity, crypto tamper-detection, connection validation, and adapter mapping.
  Two of these files carry most of the weight:
  - **`hardening.test.ts`** — one regression per confirmed defect from the
    2026-07-31 adversarial pass (see "Feed hardening" below). Read a failure
    here as a real client-money bug returning, not a brittle assertion.
  - **`wire-to-engine.test.ts`** — the only test that crosses every seam:
    raw camt XML + CRLF Swiss-apostrophe CSV + CRM JSON → `detectFormat` →
    `adaptFeed` → `diffPlan` → `applyChanges` → `parsePlan` → `runMonteCarlo`.
    Layers passing in isolation proved nothing about the joins between them
    (a schema-legal plan the engine NaNs, an envelope the merge drops). Also
    asserts a re-sync of the same three payloads is a byte-level no-op.
- **UI:** `/app/feeds` (`components/feeds/feeds-manager.tsx`) — list, add, edit,
  delete, and "Test fetch" which runs the relay and previews the normalized
  records without writing anything. The secret input is cleared after save and
  the API only ever reports `hasSecret`, so no credential is ever held in React
  state or serialized into props. On edit, a blank secret means "keep the stored
  one". `readJson()` handles non-JSON error bodies (gateway/framework HTML error
  pages) so users see the HTTP status instead of `Unexpected token '<'`.
  `/preview/feeds` renders it outside the auth gate for design review (404s in
  production, and the API still requires a session so no data is exposed).
- **Apply-to-plan** (`lib/feeds/apply.ts`, pure + 19 tests): `diffPlan(plan,
  envelope)` classifies every record as create/update/unchanged against the
  saved plan, then `applyChanges(plan, changes, selection)` returns a NEW plan
  with only the selected ones. The safety contract, each pinned by a test:
  never deletes; an update only writes fields the feed actually sent (a payload
  missing `rate` won't blank a loan's rate); re-running is idempotent (matched
  on a normalized natural key, so no duplicates); the input plan is never
  mutated (it doubles as the undo snapshot); and the merged plan is re-validated
  with `parsePlan` before it is PUT, so a feed can't persist something the
  schema rejects. Income carries a client INDEX and re-resolves the owner
  against the plan being written to — a stale client id would otherwise fail
  validation. Account matching treats country as a disambiguator only (requiring
  it to match duplicated country-less accounts). Feed-only classes
  (`private_equity`/`hedge`/`structured`) fold into `alternative`; annual
  expenses convert to the plan's monthly field; pension-type hints set
  `liquid: false`.
- **UI flow:** Test fetch → preview → "Review & apply to plan…" → per-record
  checkboxes grouped by section with before → after values → Apply → one-click
  Undo (re-PUTs the pre-apply snapshot).

### Tenancy — `006_tenancy.sql` (Stage 1 of multi-institution support)
`profiles.id` IS `auth.users(id)` and the client's whole position lives in
`profiles.plan` on that identity row — so **a login IS a household**. An
advisor cannot hold a second client, a firm cannot put two advisors on one
client, and there is no tenant to bill, suspend or audit against. That is an
architecture change, not a WHERE clause.

006 is **additive and ships alone**: `organizations`, `org_members`,
`households`, `household_advisors`, `plans` (versioned), the access helpers,
RLS, and a backfill putting every existing profile into a personal org. It
does NOT re-point `feed_connections` / `order_connections` / `order_tickets` /
`audit_events` — the app keeps working unchanged until 008 does that.

- **RLS is kept indexable.** The obvious `exists (select 1 from org_members ...)`
  runs a correlated subquery PER ROW. Instead every tenant table carries a
  denormalised `org_id`, and policies compare it against `STABLE SECURITY
  DEFINER` helpers (`auth_org_ids()`, `auth_household_ids()`, ...) that Postgres
  evaluates once per statement. Their `search_path` is pinned — an unpinned
  SECURITY DEFINER function is a privilege-escalation hole — and a test asserts
  all three properties.
- **Plans are versioned, and that is a bug fix.** `/api/plan` PUT is a
  read-modify-write: it SELECTs the old plan, UPSERTs, then diffs — so two
  tabs silently lose one save AND write an audit diff describing a change that
  never happened. `unique (household_id, version)` turns that into a 409.
  Plan versions have no UPDATE/DELETE policy: immutability is what makes the
  audit trail's before/after hashes mean anything.
- **Entitlement moved to `organizations`**, which has no client write policy,
  so the hole 005/007 had to close on `profiles` cannot recur there.
- The routes were re-pointed onto this model in **009** — see below. Until
  then `/api/plan` still read `profiles.plan` and every other route filtered
  on `user_id`.
### Re-keying onto households — `008_rekey_to_households.sql`
Moves `feed_connections`, `order_connections`, `order_tickets`,
`audit_events` and `simulations` off `user_id` and onto `household_id` +
`org_id`, and switches every policy to the 006 helpers.

- **THE IDEMPOTENCY RE-KEY is why this migration exists.**
  `idx_order_tickets_idem` was `unique (user_id, ticket_id)` — the only thing
  preventing a double placement, and correct solely because a login had one
  client. Two advisors on one household got SEPARATE namespaces: both press
  BUY on the same proposal, the rows do not collide, **two live orders reach
  the OMS**. Now `unique (household_id, ticket_id)`. The new index is created
  BEFORE the old is dropped, so there is never a window without uniqueness.
  A test puts two advisors on one household and asserts the second identical
  ticket is refused and exactly one row exists.
- **It ships without breaking the routes.** They insert with `user_id` and no
  household, so `tg_fill_household` derives it — but ONLY when the actor has
  exactly ONE household. With two or more it RAISES, because silently picking
  one would point a custodian feed or an order at the wrong client. Noisy now,
  never silent later. (009 makes the routes pass `household_id` explicitly,
  which is what lets an advisor have a second client at all.)
- **Audit separates actor from subject.** `user_id` meant both "who did this"
  and "whose money this is"; scoping now uses `household_id`, so a compliance
  officer sees another advisor's actions on their clients — and nothing
  outside the org. Rows whose actor was erased before 008 keep a null
  household deliberately: they are unreadable through the API but still
  present, because deleting them would break the append-only guarantee.
- **Firm-level order ceiling.** `organizations.max_ticket_amount` clamps
  `order_connections.max_ticket_amount` in a trigger — the advisor creates the
  connection, so the firm needs a bound they cannot raise.
- Found by running it: **`min(uuid)` does not exist in Postgres**, so the
  first cut of `resolve_default_household` failed on every insert. Count and
  fetch are now separate statements.

### Household-aware routes — `009_household_management.sql` + `lib/tenancy/`
006 built the model and 008 re-keyed the data onto it, but the app still
behaved as if a login were a household: every route filtered on `user_id`,
`/api/plan` still read and overwrote `profiles.plan`, and **there was no way
to create a second client at all** — `households_insert` lets a row be made,
but 007 revoked client writes to `household_advisors`, so an advisor's new
household was invisible to them the instant it existed. 009 closes that.

- **`lib/tenancy/context.ts` decides which client a request is about, and it
  REFUSES to guess.** Precedence: `?household=` / `x-household-id` → the
  switcher's `wa_household` cookie → the caller's only household → **400 with
  the candidate list**. This is deliberately the same rule
  `resolve_default_household()` applies inside the database, so the two layers
  can never disagree; an advisor with two clients gets a clear API error
  instead of a plpgsql exception surfacing as a 500. A household in another
  firm returns **404, not 403** — "forbidden" would confirm it exists.
  A malformed *explicit* id is a 400; a *stale cookie* is not an error at all
  but falls through to the picker, because a cookie outlives a reassignment or
  a different login on the same browser and failing hard would strand the user.
- **`lib/tenancy/plans.ts` replaces `profiles.plan` with versions.** GET reads
  the highest version; PUT inserts `version + 1` and checks the client's
  `baseVersion` first. Both checks matter: the explicit one gives a good
  message, and the `unique (household_id, version)` index catches the race that
  opens *after* it. A conflict is a **409 that keeps the user's edits on
  screen** — the old upsert silently discarded one of two concurrent saves and
  then wrote an audit diff describing a change that never happened. The feed
  Apply/Undo path carries the same version, so a feed-apply racing a manual
  save is refused rather than merged over it (and an Undo that would also
  discard someone else's later save is refused, because that is not what
  "undo" means).
- **Creation is an RPC, not a policy** (`create_household`). The safe operation
  writes TWO rows — the household and the creator's assignment — and a policy
  cannot make that atomic. Assignment (`set_advisor`) is owner/admin only: any
  `household_advisors` INSERT policy wide enough to let an advisor claim their
  own new client is also wide enough to let them claim someone else's, which
  erases the whole point of the advisor role. Both are SECURITY DEFINER with a
  pinned `search_path`, asserted by a test. `set_advisor` also refuses a target
  outside the organisation — otherwise an admin could hand a client's book to
  any user id they can guess.
- **Every route is now household-scoped, not user-scoped**, so two advisors on
  one client share its feeds, its OMS connection and its order history — which
  is what makes 008's idempotency re-key meaningful in the first place. The
  duplicate-ticket lookup was moved onto `household_id` too: on `user_id` it
  would miss a colleague's send (the exact case that makes a duplicate
  dangerous) and report "no prior row" for a collision that certainly happened.
- **UI:** a client switcher at the top of the sidebar (`components/nav/
  household-switcher.tsx`), writing localStorage **and** a `wa_household`
  cookie so server components render the same client the switcher names.
  Switching does `router.refresh()`, and `PlanForm` is **keyed on the household
  id** so it remounts — otherwise the previous client's figures would sit in
  component state under the new client's heading. Pages that cannot resolve a
  client render `ChooseClient` rather than defaulting to one.
- **`profiles.plan` is now write-dead.** 006's backfill copied it into `plans`
  v1 and nothing reads it any more. It is left in place deliberately: dropping
  a column holding every client's position belongs in its own reviewed
  migration, not in this one.
- **DEPLOY ORDER MATTERS.** These routes require 006-009 to have been applied.
  Migrations 003-009 have still only ever run against PGlite — `.env.local`
  points at a placeholder project — so the first real deployment must run them
  before (or with) this code, or `/api/plan` 500s on a missing `plans` table.

### Phase 0 of the SaaS build — `010_survive_a_departure.sql` + boot/ops
A readiness audit (six dimensions, adversarially verified) found the SaaS
blocked on two structural things rather than on features: it had never run
against a real Postgres, and the unit it sells — a seat — could not be
created. Phase 0 is everything that must be true before either can be fixed.

- **Deleting one advisor destroyed the firm's records.** 005 repointed
  `audit_events.user_id` to `on delete set null` and stopped there.
  `order_tickets`, `order_connections`, `feed_connections` and `simulations`
  still cascaded from `auth.users` — and since 008, `user_id` on those tables
  means "who did this", not "whose money this is". So offboarding an advisor
  took the order-of-record, every custodian credential and every OMS route
  with them, while 005's surviving audit rows pointed at tickets that no
  longer existed. All four are now `set null`; a test asserts the only
  remaining cascades are `org_members` and `household_advisors`, which are
  memberships rather than records.
- **Found by running it:** `on delete set null` is an UPDATE, so
  `tg_order_tickets_immutable` refused it and the DELETE still aborted —
  the same shape as 004's "every user is undeletable" bug. The trigger now
  permits exactly one update: nulling the actor with every other column
  byte-identical. Seven tests probe the keyhole (erase + move the custody
  account, + change the amount, + reopen a terminal row, + repoint the
  household) and all are refused.
- **The audit vocabulary could not describe money-routing changes.**
  `PATCH /api/orders/<id>` can repoint the custody account, raise
  `max_ticket_amount` and change the endpoint and credential — and wrote
  nothing, because 004's CHECK constraint had no value for it. That
  undercuts "the custody account comes from the CONNECTION, never the
  payload": the trusted half was silently mutable. 010 adds
  `connection.*`, `household.*`, `advisor.*` and `member.*`.
- **Credential encryption gained a rotation path.** `VERSION = "v1"` was a
  format tag, not a key id, and decrypt required that literal — so there was
  one key forever, and rotating or losing it bricked every custodian and OMS
  secret, discovered one client at a time. `decryptSecret` now falls back to
  `FEEDS_ENCRYPTION_KEY_PREVIOUS`, `activeKeyId()` fingerprints the current
  key, `secret_key_id` (010) makes a re-encrypt job resumable and provable,
  and `rotateSecret()` re-seals. A test asserts a forged ciphertext still
  fails under BOTH keys — the fallback must not weaken GCM.
- **`lib/env.ts` + `instrumentation.ts` fail at boot, not at the worst
  moment.** `encryptionAvailable()` and `orderAllowlistConfigured()` already
  existed and were never called until an advisor saved a credential or
  pressed BUY. In production a fatal problem now refuses to start, because a
  server that boots unable to authenticate and reports itself healthy is the
  worst available failure. It specifically catches CI's placeholder Supabase
  URL and a localhost `NEXT_PUBLIC_APP_URL`, both of which are inlined at
  BUILD time and otherwise ship an app that renders perfectly, can never log
  anyone in, and emails confirmation links to localhost.
- **Security headers + `/api/health`.** `next.config.mjs` was seven lines;
  `/app/orders` shipped the BUY control with no framing protection. CSP is
  derived from `NEXT_PUBLIC_SUPABASE_URL` rather than wildcarded. Health is
  unauthenticated so it reveals no version, no counts and no error text, and
  distinguishes `degraded` (runs, some capability off) from `unhealthy` (take
  it out of rotation) — pulling every instance because an allowlist is unset
  would turn a config warning into an outage.

### The legacy importer was silently hollowing every client — `lib/plan/from-legacy.ts`
`migratePlan()` read `src.clients` / `src.incomes` / `src.expenses` /
`src.retirement`. A real export from the HTML app contains **none** of those:
the household, income, expenses, retirement, pensions, inflation and tax
settings all live in a flat `fields` bag of ~88 string keys. Only `assets`,
`loans`, `goals` and `children` happened to line up. So importing a genuine
client file produced plausible net worth with ZERO cash flow — and the UI
said "Imported — 1 client(s), 8 asset(s), 4 goal(s)". The Monte Carlo then
ran on that and printed a confident median. `lib/plan/legacy-schema.ts` (388
lines) modelled the real shape correctly and had **zero importers**.

`from-legacy.ts` is the adapter, wired into `migratePlan` behind
`isLegacyExport()`. It follows the feed adapters' rule — never invent a
number — and returns `notes` describing what it could not carry, because an
import that silently drops the client's salary must not read as a success. A
blank country stays blank rather than defaulting to `US` (which would tax a
Zurich household on US federal brackets); a pension with an amount but no
start age is skipped rather than guessed; retirement specified only half-way
is left off.

**Two unit bugs in the first cut of this adapter, both caught by printing a
real import rather than trusting the tests:**
- Legacy `expL`/`expI`/`expO` are **ANNUAL** — the panel is titled "Annual
  Household Expenses" — while `ExpenseCategory.amount` is MONTHLY. Carrying
  them 1:1 turned CHF 78,000 a year into CHF 78,000 a month and made every
  imported household look ruined. Now `/12`, pinned by a test asserting
  annualised spend stays below annualised income for the Keller file.
- `penSrc` is a `<select>` of `auto`/`manual` — how the figure was derived,
  not what the benefit is called — so "manual" was printing on the client's
  pension line. Now used only when it is a genuine name.

Tests run against the **real** sample profiles in the repo, not fixtures:
the original bug was precisely that hand-written fixtures matched what
`migrate.ts` expected while no real export ever did.

### Also in this pass
- **The demo contradicted itself.** `sim-runner.tsx` ran unseeded while
  `report-view.tsx` passed `seed: 20260101`, so the median on screen and the
  median on the client's report were different numbers for the same
  unchanged plan. Both now use the shared `REPORT_SEED`.
- **`docs/deploy-runbook.md`** — the ordered procedure, the two irreversible
  decisions taken at project creation (region, PITR tier), the rehearsal
  step, the smoke test, and the key-rotation order. Three checked-in
  documents told an operator to apply `001_init.sql` **and stop**; since 009
  that produces an app that 500s on first login, because `/api/plan` reads
  `plans` and `households`, which 001 does not create. All three corrected.
- **`SUPABASE_SERVICE_ROLE_KEY` removed from the setup docs.** No code reads
  it, and it bypasses every RLS policy in 006-010 — instructing a firm's ops
  team to provision it was asking for the one credential that undoes the
  tenancy model, for nothing.


### Seats — `011_invites.sql` + `012_seats_that_work.sql` + `/app/team`
A firm could only ever hold one member: 006 gives `org_members` no INSERT
policy and 007 revokes the grant outright, deliberately, because any policy
wide enough to let someone add themselves to an org is a
self-promotion-to-owner primitive. So there was nothing to meter and billing
was premature. 011 adds the only way in — narrow SECURITY DEFINER functions
(`create_invite`, `accept_invite`, `revoke_invite`, `remove_member`,
`set_member_role`), each re-checking the caller's role, the seat cap and the
last-owner rule.

- **The load-bearing check is the email binding.** An invitation names an
  address and redeeming it requires being signed in as that address.
  Invitation mail gets forwarded — to a personal account, to an assistant —
  and without it whoever opens the message gets a seat inside a firm holding
  its clients' entire financial position. Everything else in the file is
  ordinary.
- Tokens are stored **hashed**, so a leaked dump contains no usable
  invitations, and every failure path returns ONE message so the endpoint is
  not an oracle for probing which tokens exist. Token generation uses only
  core `gen_random_uuid()` + `sha256()` — **not pgcrypto**, so the migration
  runs on a stock Postgres (an Avaloq-hosted one may not have extensions).
- A pending invitation **holds a seat**, or a 3-seat firm invites five people
  and the overage surfaces at renewal instead of at the moment it happens.
- A signup with a pending invite **joins the inviting firm** rather than
  getting a personal shell org plus a phantom household that is
  indistinguishable from a real client in the switcher.
- **No email sending, by decision.** That needs the service-role key, which
  this app does not use and which bypasses every RLS policy in 006-012. The
  invitation LINK is returned to the administrator once (only the hash is
  stored, so it genuinely cannot be shown again). For a ten-person EAM that
  is one fewer sub-processor on the DPA.
- `set_advisor` — written and tested since 009 with **no caller** — finally
  has one at `/api/households/<id>/advisors`, so an owner can actually give
  a colleague a client.

**012 exists because an adversarial review found six defects in 011.** Read
them before changing this path; each is a test now:
- **The feature was unreachable.** `organizations.seats` is `not null default
  1`, 007 revokes UPDATE on `organizations` from `authenticated`, and nothing
  in `app/` or `lib/` writes it — so `create_invite` refused EVERY first
  invitation, and the UI's advice ("revoke a pending invitation or remove a
  member") was impossible for a one-seat sole owner. **Every 011 test opened
  with `update organizations set seats = N` as a superuser, which is why
  nobody noticed.** There is now a test that runs the whole flow on a fresh
  signup with shipped defaults and no hand-editing — that is the test whose
  absence hid it.
- **An admin could eject an owner.** `remove_member` gated only on
  `auth_admin_org_ids()`, which includes admin, while `set_member_role` four
  lines later refused the *weaker* operation of changing an owner's role.
- **Invitations outlived their author's authority.** An owner could mint an
  owner-invite to a personal address, be offboarded, and redeem it weeks
  later — back in, as owner.
- **The last-owner guards raced.** Two concurrent removals both read
  `owners = 2` and both commit (different rows, so Read Committed never
  forces a re-read), leaving a firm with zero owners and no way back. Now
  serialized on the `organizations` row — note `select count(*) … for update`
  is not legal Postgres, which the harness caught.
- **An unconfirmed address is a claim, not an identity.** The email binding
  rests on `auth.users.email`, which on a deployment with confirmations off
  is a string someone typed — and nothing here pins that setting while
  `signup/page.tsx` explains how to turn it off. `accept_invite` now requires
  `email_confirmed_at`.
- **Membership audit recorded nothing in any real firm.** `recordEvent`
  always sent `household_id: null`, so 008's `tg_fill_household` tried to
  derive one from the actor and RAISED for anyone advising more than one
  client. In a single-client firm it was worse: the trigger succeeded and
  filed "Invited X as owner" onto that client's regulatory trail. Firm-level
  events are now legitimately household-less with their own RLS policies, and
  the handlers surface `auditWarning`.

**Nothing writes `organizations.seats` yet.** 012 sets a workable default (5)
and adds `set_org_seats` for the **service role only** — raising a seat count
is a commercial act, and the reason entitlement moved off `profiles` in 006
was precisely that a user could UPDATE their own row. Until billing lands it
is an operator action.

### Deployable into an Avaloq environment — `Dockerfile`, `lib/csp.ts`
The target is a Swiss EAM's Avaloq environment, not a PaaS, so the app has to
be a container their platform team places. `output: "standalone"` + a
non-root `node:20-alpine` image with a `HEALTHCHECK` against `/api/health`.
See `docs/avaloq-deployment.md` for the build-arg/runtime split, the two
Postgres options (managed vs in-estate, which is the residency answer), and
the six questions that need Avaloq's platform team.

Two bugs found by actually building and running it, not by reading it:
- **`outputFileTracingRoot` was unset**, so Next inferred the trace root from
  a lockfile above the app and buried `server.js` under the full host path
  (`.next/standalone/.claude/worktrees/…/server.js`). The Dockerfile copies
  the directory, so the image would have built and then failed to start. That
  warning had been printing for a long time and reading as cosmetic.
- **The CSP was frozen at BUILD time.** `next.config`'s `headers()` is
  evaluated when the app is built, so an image built with a placeholder
  shipped `connect-src https://placeholder-project.supabase.co` and then
  silently blocked every auth call at runtime — renders perfectly, nobody can
  sign in. Moved to `lib/csp.ts` and applied per request in `middleware.ts`.
  Verified by running the standalone server with a *different* Supabase URL
  than the build used and reading the header back. **Do not move security
  headers back into `next.config`.**


### Deployment tooling — `scripts/deploy/` + `supabase/config.toml` + `Dockerfile`
The SaaS has never been deployed; migrations 002-013 have only run against
PGlite. This kit makes the first real deployment mechanical instead of a
hand-paste, and it is the answer to "prep deployment".

- **`scripts/deploy/migrate.mjs`** applies every pending `NNN_*.sql` to a real
  Postgres (managed Supabase's DIRECT connection, an in-estate Avaloq
  Postgres, or a throwaway) via `DATABASE_URL`, one transaction per migration,
  recording `public.schema_migrations`. Refuses to run out of order, is
  idempotent, and on a failure rolls that file back and STOPS so a re-run
  resumes from it. `planMigrations` (pure, ordering + inconsistent-ledger
  guard) and `applyPending` (the loop that runs against prod) are BOTH tested
  — `apply.test.ts` drives the actual runner over all 13 migrations against
  real Postgres (PGlite), plus idempotency, partial-resume, and
  rollback-on-failure. `sslFor()` verifies TLS by default (the DDL connection
  is MITM-worth-protecting); an in-estate self-signed cert opts out visibly
  with `?sslmode=no-verify`.
- **`--stub`** applies `supabase-stub.sql` (the auth stand-ins a plain
  Postgres lacks, mirroring the PGlite test's SUPABASE_STUB) for a rehearsal,
  and is REFUSED against any DB that already has `auth.users`.
- **`verify.mjs`** asserts the deployed schema is what the app needs (13
  migrations recorded, the `auth.users` trigger installed, RLS on every
  table, `is_paid` not client-writable, `plans` exists, no `user_id` still
  cascading, the entitlement writer not client-callable) and exits non-zero to
  gate a deploy. **`smoke.mjs`** hits `/api/health` on a running instance
  (which runs `lib/env.ts` server-side, so it is the runtime preflight) and
  prints the human checklist.
- **`docker-compose.rehearsal.yml`** is a disposable Postgres so the whole
  migrate→verify run can be rehearsed locally against real Postgres; `npm run
  db:migrate` / `db:verify` / `smoke` wire it up. `pg` is a **devDependency
  only** — deploy tooling runs on the operator's machine / CI, never inside
  the container (the Dockerfile copies only `.next/standalone`).
- **`supabase/config.toml`** was missing (the CLI needs it) and now pins the
  auth setting the app depends on: **email confirmations ON**, because 012's
  `accept_invite` refuses an unconfirmed address. The hosted project must
  match it in the dashboard, and the signup UI no longer suggests turning it
  off. `docs/deploy-runbook.md` §1-§4 drive all of this.

### Migrations are executed, not just read — `lib/db/__tests__/migrations.test.ts`
003-009 have never run against a real Supabase project: `.env.local` points at
a placeholder. The append-only audit guarantee, the order idempotency index and the
tenancy model were all unverified SQL. That test now applies every migration
to a **real Postgres 18** (PGlite, Postgres compiled to WASM — the triggers,
plpgsql, constraints and grants are genuine), stubbing only `auth.users`,
`auth.uid()` and the three Supabase roles.

It paid for itself immediately:
- **004 made every user undeletable.** `audit_events.user_id` was `ON DELETE
  CASCADE` from `auth.users` while a `BEFORE DELETE` trigger raised
  unconditionally, so the cascade aborted the transaction — a GDPR erasure
  blocker. 005 makes the actor FK `ON DELETE SET NULL` and lets the trigger
  permit exactly one update: nulling the actor. The event survives; DELETE is
  still refused.
- **005's entitlement fix was a NO-OP.** It wrote `revoke update (is_paid, ...)`
  against a role holding a TABLE-level grant. In Postgres a table-level grant
  subsumes every column and a column REVOKE does not carve a hole in it — the
  statement succeeds and changes nothing, so `update profiles set is_paid =
  true` was still valid. **007** does it the documented way: revoke the
  table-level privilege, grant back only `display_name` and `plan`. A test now
  executes the self-grant as `authenticated` and asserts it is refused.

Read a failure here as a real database defect, not a brittle assertion.

### Audit trail — `/api/audit` + `audit_events` (migration `004_audit.sql`)
The record of what happened to a client's plan. Before this, `profiles.plan`
was a single JSONB column overwritten on every save, so "who changed this
client's position, when, and from what to what" had **no answer at all**.

- **Append-only, enforced TWICE.** RLS grants `SELECT` + `INSERT` and nothing
  else (no update policy, no delete policy), AND a trigger raises on `UPDATE`
  and `DELETE` regardless of caller — so a service-role key or a future policy
  mistake still cannot rewrite history. `/api/audit` has no POST/DELETE handler
  at all, so history can be neither fabricated nor erased through the API.
- **Events, not snapshots.** Storing both plans per save would duplicate the
  client's entire position on every keystroke. An event carries a summary, a
  capped list of rows that moved with before/after, net worth on both sides,
  and a `planHash` fingerprint of each side — enough to answer the review
  question and to test later whether a given plan was the one in force.
- **`lib/audit/diff.ts` is pure** (no DB, no clock), so the summary a reviewer
  reads is reproducible from the two plans alone. It matches rows **by id** —
  a client that regenerated ids on every save would make each save read as a
  wholesale replacement, which `diff.test.ts` pins explicitly.
- **`planNetWorth` is deliberately independent of the engine** (assets minus
  loan balances). A compliance figure must not move because a projection model
  changed.
- **Audit failure is surfaced, never swallowed.** `recordEvent` never throws;
  the plan PUT returns `auditWarning` alongside `ok:true` rather than either
  losing the save or reporting a clean one. A trail with unreported holes is
  worse than a short one. (Orders are different: `order_tickets` is written
  BEFORE the upstream call and a failure there is fatal.)
- Retention: nothing prunes the table, by design. Deleting audit history should
  be a reviewed migration, not a background job; partition by month if volume
  becomes a problem.
- **Not covered:** the legacy single-file app. Its order log lives in
  localStorage, which the user can clear — that is a convenience log, not an
  audit trail, and pretending otherwise would be worse than the gap.

### Billing & entitlement — `013_billing.sql` + `lib/billing/` + `/api/billing`
Seats existed (011/012) but nothing metered them. This is the meter.
Product line: **evaluate free, pay to operate** — capture/simulate/report
are free; the OPERATIONAL routes (order placement `POST /api/orders/<id>`,
feed runs `GET /api/feeds/<id>`) are gated on `organizations.is_paid`.

- **`is_paid` is written by ONE caller: the Stripe webhook**, through the
  service-role client (`lib/supabase/admin.ts`) — its first and only
  legitimate use, since 007 revokes UPDATE on `organizations` from clients
  and a user who can set their own `is_paid` has no entitlement. `grep`
  confirms `createAdminClient` is imported only by the webhook.
- **No Stripe SDK.** The whole surface (verify webhook, create checkout,
  create portal) is a documented HMAC/HTTP contract done against
  `node:crypto` + `fetch` (`lib/billing/stripe.ts`) — zero new dependency,
  which matters for an Avaloq-hosted container's supply-chain review. The
  webhook verifier is the security boundary (a forged event = free product)
  so it's in code we can read: constant-time HMAC over `"t.body"`, explicit
  replay window, fails CLOSED with no secret.
- **The webhook MUST read the raw body** (`request.text()`) — re-serialising
  the JSON changes bytes and every signature fails.
- **`apply_stripe_event` (SECURITY DEFINER, service-role only) is the single
  write path**, doing four things in ONE transaction — an adversarial review
  reproduced the failure of each:
  - *Idempotency + atomicity*: the ledger insert and the entitlement write
    are in the same transaction (`applied` boolean distinguishes seen from
    applied), so a crash between them can't strand an event that Stripe's
    retry then dedupes away.
  - *Monotonicity (M2)*: **Stripe does not deliver in order** and retries for
    ~3 days. Every entitlement change is gated on the event's `created`
    against a per-org `last_billing_event_at` watermark, so a stale `past_due`
    arriving after `active` binds ids but does NOT flip a paying firm to
    unpaid. Without this the firm was locked out indefinitely.
  - *Seat floor*: seats only ever RAISED to cover members, never dropped
    below them.
  - *Customer binding* guarded so one Stripe customer can't attach to two orgs.
- **M1 — an unsettled checkout must not grant.** `checkout.session.completed`
  has `status === "complete"` ALWAYS, so keying `is_paid` on it granted the
  product before funds settled — days of free access for the delayed-
  settlement methods (SEPA/ACH) common in the CH/EU launch market. It now
  grants only on `payment_status` settled; otherwise `isPaid: null`
  (do-not-change) binds ids and the authoritative `customer.subscription.*`
  event grants when it settles. Unknown status ⇒ NOT paid — granting on an
  unrecognised status is the expensive mistake.
- **An actionable-but-unattributable event returns 409, not 200** — a 200
  would consume it permanently before its customer is bound; a non-2xx lets
  Stripe retry.
- **`billingEnforced()` is false unless `STRIPE_SECRET_KEY` is set**, so a
  pilot / self-hosted install billed by agreement treats everyone as
  entitled. The gate (`lib/billing/gate.ts`) fails OPEN on a DB read error —
  a blip must not block a paying firm.
- **`lib/env.ts` makes a HALF-configured billing setup FATAL at boot**:
  `STRIPE_SECRET_KEY` set but no `STRIPE_WEBHOOK_SECRET` /
  `SUPABASE_SERVICE_ROLE_KEY` / `STRIPE_PRICE_ID` means checkout takes money
  while the webhook can never write `is_paid` — the customer pays and stays
  locked out, invisibly. Caught at startup instead.
- Checkout/portal (`/api/billing` POST) are **owner-only**; `/app/billing`
  shows state and the Subscribe/Manage button. The org→Stripe-customer bind
  happens in the webhook on `checkout.session.completed`.

### Investment Proposal builder in the SaaS — `/app/proposal`
The SaaS UI that finally reaches the hardened `/api/orders` path (before
this it was fully built and unreachable — an advisor could configure the
pipe and stare at an empty ticket table). `lib/orders/proposal.ts` is the
pure half — the SaaS twin of legacy `ordBuildTicket`: a `Proposal`
(positions with weights + identifiers, a target amount, a currency) →
`checkProposal()` (advisory-only problems) → `buildTicket()` → the
`wa.order/v1` ticket. `components/orders/proposal-builder.tsx` is the
editor; `/app/proposal` is household-scoped and keyed on the household so
switching clients resets it; `/preview/proposal` renders it outside the
auth gate (404s in prod).

- **`amount` is authoritative, not `weightPct`.** The amounts are what a
  human confirms and the OMS books; weights are recorded for audit. So the
  LAST line absorbs the rounding residue — a 3-way split of CHF 100,000
  sends exactly 100,000, not 99,999.99, or the server's total-vs-lines
  check in `checkTicket` rejects it after BUY. Pinned by a test that builds
  a ticket and runs it through the real `checkTicket`.
- **The account is NOT chosen in the proposal** — it comes from the
  connection, on the server. The builder only says what to buy and how
  much; `checkTicket` overwrites `ticket.account` with the connection's.
- **Retry reuses the ticket id**, held until a clean `staged`, so the
  server's Postgres idempotency dedupes a resend. A fresh id per press
  turns one model portfolio into two — the exact bug the legacy side had.
- **The three-state result is surfaced**: `staged` (green), `unknown`
  (amber — "check the PM system", resend offered as safe *because* the id
  is reused), `rejected` (red). A 2xx is never assumed to be success.
- `checkProposal` mirrors `checkTicket`'s identity checks (ISIN/CUSIP/Valor
  check digits, CUSIP↔ISIN and Valor↔ISIN agreement) so the advisor sees a
  mismatch while editing rather than as a post-BUY rejection. The
  identifier box routes by shape (5–9 digits → Valor, 9 alphanumerics →
  CUSIP, else ticker). Ticker-only is a WARNING, not a block.

### Portfolio compare & the holdings layer — `lib/portfolio/` + `plan.holdings`
The EAM's daily view: current book vs proposed target. Shown in the proposal
builder (`components/portfolio/allocation-compare.tsx`) and its donut is
reused in the client report.

- **`lib/portfolio/` is pure and tested.** `comparePortfolios(current,
  proposed)` → per-class allocation drift, per-position deltas, and
  value-weighted TER/yield + concentration. It is **allocation-based**
  (percent of each side) because the current book and the proposed target
  need not be the same size; the one CHF figure ("to reach target")
  rebalances the current book to the proposed mix and is labelled as such.
  `asset-class.ts` is the ONE shared class vocabulary (label/order/colour/
  normaliser) — the 8-class enum used to live by copy in four places, and a
  compare only means something if both sides bucket identically.
- **`portfolioFromPlan` prefers `plan.holdings` when present**, else derives
  from account-level assets. Weighted TER blends only over positions that
  report an er (a property line is not a "free fund"); a null TER is null,
  never 0.
- **The holdings layer (`plan.holdings`, optional/additive).** A security
  POSITION with ticker/cls/value/**er/yld/region** and an `accountRef`.
  HOLDINGS ARE FOR ANALYTICS, NOT NET WORTH: net worth sums `assets`, so a
  holding and its parent account are the same money at two granularities and
  are never both counted. No DB migration — the plan is JSONB, versioned in
  `plans`; `migratePlan` defaults old plans to none.
- **Two populators, both preserving the per-position cost/yield the account
  balance cannot hold:**
  - `from-legacy.ts` imports the legacy `investments` array (was dropped).
  - `apply.ts` (feed) used to COLLAPSE a `FeedHolding` to a flat asset value,
    discarding er/yld/region. It now rides the rich facts through as
    `_holding` on the change patch; `applyChanges` strips it before writing
    the **byte-identical** Asset and upserts the holdings layer. The
    account/holding matching, the double-count guard and every hardening test
    are untouched — the change is purely additive, idempotent on re-sync, and
    never blanks an er a later partial payload omits.

### Order routing — `/api/orders` (send a proposal to a PM/OMS)
The outbound mirror of the feed relay. An advisor approves an Investment
Proposal, presses **BUY**, and the positions go to a portfolio/order
management system as a **`wa.order/v1`** ticket. `lib/orders/` +
`app/api/orders/` + `components/orders/orders-manager.tsx` (`/app/orders`,
`/preview/orders`), migration `003_orders.sql`.

**Nothing here executes a trade.** `intent` is pinned to `"stage"` by Zod
(`z.literal`), and every dialect carries it to the wire: Avaloq
`PENDING_APPROVAL`, generic `execute:false`. A wire format that cannot say
"do not execute yet" must not be added.

Read these before changing anything on this path — each exists because an
adversarial pass found the opposite behaviour:
- **Positive acknowledgement only.** A 2xx is NOT success. `readPlacementResponse`
  reports `staged` only for a 2xx **with** a JSON content-type **and** a
  reference or a non-zero accepted count. Anything else is **`unknown`** — a
  third state, not a failure. This is the exact mirror of the inbound
  login-page defect, and worse: inbound produced a wrong number a human still
  reviewed, whereas a false green "staged" stops anyone looking again.
  `ok === (state === "staged")` is invariant.
- **`unknown` is load-bearing.** A timeout or dropped socket may have staged
  the ticket. Recording it as `failed` reads as "nothing happened" and invites
  a resend — that is how one model portfolio becomes two.
- **Idempotency lives in Postgres**, not in a forwarded header the OMS may
  ignore. The row is INSERTed (unique on `user_id, ticket_id`) *before* the
  upstream call. Same key + same `fingerprint` → return the prior result, do
  not re-POST. Same key + **different** fingerprint → 409, because silently
  returning the first result would discard a corrected order.
- **The custody account comes from the CONNECTION, never the payload.** A
  ticket naming a different account is refused, not rebooked.
- **`checkTicket` is a COHERENCE check, not an authorization one.** It
  re-derives the total from the lines, so a client whose arithmetic disagrees
  with itself is refused — but the server has no proposal of record, so any
  self-consistent set of amounts would pass. `max_ticket_amount` (NOT NULL,
  default 100k) is therefore the only bound on ticket size, and it lives where
  a browser cannot raise it. Also checks ISIN check digits, currency vs the
  account, and blocks the WHOLE ticket if any line lacks an ISIN and a ticker.
- **`safePost` does NOT follow redirects** — a 3xx is an error. `safeFetch`
  re-validates each hop, which is right for reading a statement and wrong
  here: 307/308 would replay the order body to whatever `Location` names, and
  301/302/303 rewrite POST→GET and deliver an empty request that reads as
  success. Do not "improve" this into hop re-validation.
- **`ORDERS_HOST_ALLOWLIST` is required in production** (`lib/orders/allowlist.ts`).
  ssrf.ts accepts a residual DNS-rebinding window on GET-specific grounds
  ("limited to READING responses from hosts already reachable"); on a POST a
  bypass writes an attacker-influenced body to an internal endpoint, and
  writing is not recoverable.
- **Client identity is opt-in** (`send_client_identity`, default false). The
  OMS needs account + instrument + amount, not who the client is; a mistyped
  URL should leak what was bought, never whose.
- **The audit row is immutable.** RLS allows UPDATE only while
  `status='sending'`, and a trigger rejects any change to the instruction or
  reopening of a terminal row. No DELETE policy at all.
- `last_status` (rendered in the connections list) carries a code and counts
  only — never upstream body text, which routinely echoes the account, the
  client name, and sometimes the credential.

**Instrument identifiers — ISIN, CUSIP, ticker** (`lib/orders/identifiers.ts`,
mirrored in the legacy app above `detectInputType`). All arithmetic, no
network, verifiable against published check digits:
- For US/CA issuers an ISIN IS the country code + the 9-char CUSIP + an ISIN
  check digit, so `cusipToIsin` / `isinToCusip` are exact. `cusipToIsin`
  defaults to `US` and never guesses CA — nothing inside a CUSIP distinguishes
  them, and guessing yields a valid-looking ISIN for a different security.
- `checkIdentifierAgreement` is the highest-value check: two identifiers on one
  row that name DIFFERENT securities is an error no custodian can catch (it
  books whichever the wire carries). Both being individually valid is not
  enough. A non-US/CA ISIN beside a CUSIP is deliberately NOT flagged —
  cross-listing is legitimate and a false alarm trains people to click through
  the real one.
- `detectInputType` classifies a 9-char string as a CUSIP only if its CHECK
  DIGIT validates, so a 9-character search phrase is not resolved as an
  identifier. **An ALL-NUMERIC 9-digit string is genuinely ambiguous** — it is
  also the shape of a Valor, and ~1 in 10 Valoren pass the CUSIP check digit by
  coincidence (measured: 20/200). In that case the resolver tries CUSIP, falls
  back to the Valor reading, and fills NOTHING unless one of them resolves.
  Filling the arithmetically-derived US ISIN there would substitute a US
  security for a Swiss one, which is the exact failure the identifier work
  exists to prevent. A CUSIP containing a letter is unambiguous and still
  fills its ISIN offline.
- **`lib/orders/__tests__/legacy-parity.test.ts` is what keeps the two copies
  honest.** The arithmetic is implemented twice (the single-file app cannot
  import), so that test extracts the legacy block from the shipped HTML and
  diffs both implementations across ~1,900 real/malformed/hostile inputs. If
  you change one, it will tell you that you did not change the other.
- Wire preference is ISIN → CUSIP → symbol (Avaloq books on one identifier);
  the generic dialect sends all three. `ticketFingerprint` APPENDS the CUSIP
  only when present, so tickets without one keep their pre-existing hash and a
  stored fingerprint still matches on retry.
- **No manual CUSIP field, by product decision.** CUSIP is US/Canada-only and
  the launch market is Swiss EAMs, whose UCITS instruments have no CUSIP at
  all (the Keller sample's seven positions: zero). A third identifier box on
  the proposal row earned its keep for nobody, and it widened the blast radius
  of the reset bug above. The ARITHMETIC stays, because CUSIPs do reach the
  app — via the statement importer, whose column map already includes
  `cusip` — and turning one into a bookable ISIN offline is real value in the
  direction they actually arrive. A position's `cusip` is now DERIVED from a
  US/CA ISIN (`isinToCusip`), so a US line still carries it to the PM system
  with nothing typed. Pasting a CUSIP into the universal ticker box still
  resolves it: `detectInputType` recognises one by its check digit.
- **Valor (Swiss Valorennummer) IS a first-class field**, and the contrast with
  CUSIP is the point: the field earns its place when the market actually uses
  the identifier. Two properties shape the code and must not be smoothed over:
  1. **A Valor has NO check digit.** It is an ordinal, so a typo is simply a
     different valid Valor and no arithmetic catches it. Verified empirically:
     three single-digit typos of Nestlé's Valor all produced structurally
     valid CH ISINs. They happened to resolve to nothing — that is the
     sparseness of the number space, not a guarantee. The real defence is
     showing the resolved instrument NAME for a human to confirm.
  2. **Valor → CH ISIN is exact only for Swiss-DOMICILED issues**, where the
     Valor is the ISIN's national number. SIX also assigns Valoren to foreign
     instruments listed here — an Irish UCITS keeps its IE ISIN — so the
     derived ISIN is a CANDIDATE. It is therefore filled in ONLY after OpenFIGI
     resolves it, never on the arithmetic alone. `checkValorAgreement`
     consequently ignores a non-CH ISIN beside a Valor: that is the normal
     case for a Swiss portfolio, and flagging it would fire on most holdings.
- **OpenFIGI does NOT accept `ID_VALOREN`** (verified against the live API —
  it returns "Invalid value for idType"; the supported national types are
  ID_CUSIP, ID_SEDOL, ID_WERTPAPIER, ID_CINS, ID_COMMON). So a Valor is
  resolved via the CH ISIN it implies, which is also what makes the
  resolve-before-filling rule necessary rather than merely cautious.
- Wire preference is ISIN → Valor → CUSIP → symbol; Valor outranks CUSIP
  because Avaloq is a Swiss system that books on it natively.
- **Market data**: OpenFIGI (already used for ISIN) is generalized to
  `openFigiMap(idType, idValue, hintCc)`; `ID_CUSIP` resolves directly to a
  ticker, which then feeds the existing Yahoo quote/performance path. Verified
  live: CUSIP 037833100 → US0378331005 → AAPL → "Apple Inc.". If OpenFIGI is
  unreachable the flow still fills the derived ISIN and says so rather than
  substituting a guess.

**Legacy side** (`wealth-analyzer.html`, Investment Proposal tab): the same
ticket shape, built by `ordBuildTicket`, reviewed line-by-line before any
send. Three defects found and fixed there in the same pass:
- The idempotency promise on the review screen was **false**. `ordBuildTicket()`
  was called with no argument, so every BUY minted a fresh reference and a
  post-failure retry was a new order to the OMS. There is now a **Retry this
  ticket** button that reuses the reference, `_ordRetryId` keeps it until a
  clean success, and the wording says what the code actually does.
- The route was re-read from localStorage at send time while validation was
  snapshotted at review time — a second tab could change endpoint, credential
  and account between review and send. The route is now frozen on `_ordPending`.
- The browser `fetch` used the default `redirect:"follow"` and had no timeout.
  Now `redirect:"manual"` (fetch strips `Authorization` cross-origin but NOT a
  custom `X-API-Key`, which is one of the offered auth modes) plus a 20s abort.

**Known limitations, deliberately not built** (they need custodian position
data and a product decision, and half-building them would be worse):
BUY only — no SELL, no delta/rebalance mode, so re-sending a target allocation
against an already-funded account doubles the position; no pre-trade cash or
buying-power check; no account↔client binding beyond the connection's single
account; no FX — a ticket is refused if its currency differs from the
account's, never converted.

### Feed hardening (2026-07-31) — read before touching the feed path
An adversarial pass over the whole feed stack. Every item below is a defect
that was REPRODUCED, then fixed and pinned in `hardening.test.ts`. The theme:
for a feed the dangerous failure is not a crash but a plausible **wrong
number** landing silently in a client's plan, so the fixes bias toward
refusing/flagging over guessing.

- **A date must never become money.** Stripping separators turned a
  `2026-08-31` Value Date cell into 20,260,831 — and every European statement
  puts a date column beside the amount, so one column-match miss produced a
  20-million-franc position. Guarded in BOTH products (`parseFeedNumber` and
  legacy `siNum`). Same pass: sign is read before stripping (`CHF -240'000`,
  trailing minus, DR/CR, parens), scientific notation and percentages parse,
  and a repeated separator must group in threes (`1.2.3.4` is not 1234).
- **camt fixes, in both products.** `<CdtLine><Amt>` (the overdraft LIMIT) was
  read as the balance — a CHF 12,500 account imported as CHF 500,000; balance
  lookups are now DIRECT-CHILD only (`kids`/`kid` in `xml.ts`, `kid()` in the
  legacy adapter). Accounts were labelled with the account HOLDER's name, so
  every statement in a multi-account file collapsed onto one row. An
  already-negative amount carrying `DBIT` was double-negated back into a
  positive asset — magnitude first, then `CdtDbtInd`. Balance `Ccy` beats
  account `Ccy`. **If you touch either camt adapter, re-run the browser check:
  the legacy one is only covered by tests via the standalone.**
- **Kind-scoped matching.** A cash line named "Pensionskasse UBS" could
  overwrite a CHF 480,000 pension with CHF 5,000. A holding may no longer
  match an account-like record at all (`ACCOUNT_LIKE`/`LOCKED` in apply.ts).
- **`resolve()` distinguishes three outcomes** — matched / genuinely new /
  *duplicate of a row already claimed in this payload*. Folding the third into
  "new" made a duplicated row create a fresh plan record on every subsequent
  sync, so the plan grew a phantom account per refresh and never converged.
- **Income no longer falls back to client 1.** When the CRM introduces the
  spouse in the same payload, client 2 has no income to match; the fallback
  made both salaries resolve to client 1's single record and the second
  overwrote the first — CHF 435,000 of household income arrived as CHF 285,000.
- **`risky` vs `warning` are different things.** `risky` (unticked by default
  in the review UI) means "applying this writes a WRONG number": foreign
  currency with no conversion, an account total that duplicates the positions
  in the same feed (net worth 2x), a retirement age the feed never sent.
  Correct-but-incomplete rows — a mortgage balance with no rate — get a
  `warning` and stay SELECTED, because omitting an CHF 840,000 debt overstates
  net worth by more than any rate assumption distorts it. Don't collapse these
  two back together.
- **Relay egress is scrubbed** (`lib/feeds/redact.ts`): credentials, query
  strings (custodians put keys there), and resolved IPs (a blocked host was
  otherwise an internal-network oracle) never reach `last_status` or the
  browser. Upstream failures map to distinct statuses instead of a blanket 502.
- **PATCH enforces the auth/secret invariant POST already had.** It was
  reachable in two steps (switch to `bearer` without a secret, or clear the
  secret while auth stays `bearer`), after which the relay fetched anonymously
  and normalized the custodian's HTML login page into the plan. GET refuses
  that state outright. Also: per-user run throttle, UTF-8 basic auth (RFC 7617).
- **SSRF:** `::/96` and `::ffff:0:` closed, trailing-dot hosts normalized,
  credentials no longer replayed across a cross-origin redirect.

### Review-driven hardening (Petros's "Top 5 plans", all complete + merged)
1. **Build/test/dep baseline** — clean `npm ci`; `/login` `useSearchParams` moved
   into `login-form.tsx` behind `<Suspense>`; real `financial-math` tests.
2. **Plan persistence** — Zod validation on `PUT /api/plan`; `.upsert` (not
   `.update`, which silently no-ops when the signup trigger didn't create a row);
   `parseMoneyInput` so blank/invalid fields never store `NaN`/`null`; removing a
   client reassigns its income (no orphan `clientId`).
3. **Engine correctness** — optional `seed` for reproducible runs; inflation now
   actually applied to expenses/goals each year; funded goals draw down wealth;
   negative surplus draws down liquid assets; loan amortization fixed; invariant
   tests (percentile ordering, goals reduce wealth, higher inflation lowers real).
4. **Legacy feature parity** — see next section.
5. **Release pipeline** — see "Release & CI".

### Data model notes / gotchas
- **`lib/data/country-accounts.ts` is GENERATED** from the root `country-accounts.js`
  by `scratchpad/convert-accounts.js` (39 countries, 521 account types). Do not
  hand-edit; regenerate from the source data file.
- **`CountryCode` (types.ts) and the `countryCodeEnum` (schema.ts) must stay in
  sync.** They were widened past the original 19 to include individual eurozone
  members (DE, FR, IT, …) because the taxonomy defines each separately.
  `inflationRegionForCountry()` maps eurozone members → `EU` and `TW` → `CN`
  (a direct region lookup would miss them).
- **Goals use a `startYear`/`endYear` span**, not the legacy single `targetYear`.
  `migratePlan()` converts old shapes (targetYear → span, stringified numbers,
  orphan income) on import, then Zod validates — a bad file errors rather than
  overwriting the current plan.
- **`components/plan/sections/*`** are module-level components with stable row
  keys so inputs never remount on keystroke (the legacy "child input loses focus"
  bug does not recur).
- **`app/preview/plan`** renders `PlanForm` with sample data outside the auth
  gate for design review; it `notFound()`s in production.

### Quality safety net (audit Plan E)
The engine is guarded by three layers of tests under `lib/engine/__tests__/`
(all seeded + `asOfYear`-anchored, so runs are byte-reproducible):
- **`golden-master.test.ts`** — 5 canonical plans frozen to expected
  percentiles / goal-success / retirement stats. Any numeric drift trips it.
  Regenerate intentionally with `GEN_GOLDEN=1 npx vitest run golden-master`
  (prints a JSON blob to paste into `EXPECTED`), then review the diff.
- **`analytical-bounds.test.ts`** — pins the engine to first-principles truth
  (single-class median = `initial·e^(drift·T)` exactly, mean = `initial·e^(μT)`
  within 3 sample-SE — the log-normal closed forms; mean ≥ median skew;
  percentile ordering; equity out-grows/out-spreads cash; diversification
  lowers spread).
  This is the honest replacement for a legacy-vs-SaaS parity harness: the SaaS
  engine is **no longer a port** of `wealth-analyzer.html` `runMC()` (it
  re-models with per-class CMAs + correlation + progressive tax + two-pool
  decumulation), so a numeric parity test would compare two intentionally
  different models.
- **`pipeline.test.ts`** — "E2E-lite": raw legacy-shaped export →
  `migratePlan` → `parsePlan` → `runMonteCarlo` → report-coherence asserts.
  Also pins the **retirement double-count fix**: when `retirement.enabled`, the
  engine excludes `cat === "Retirement"` goals from goal-funding (the
  decumulation loop already models that spend via `retirement.annualSpending`),
  so a plan carrying BOTH — as the sample report/plan previews do — no longer
  double-counts. Those goals report their success as the retirement money-lasts
  probability rather than an always-zero funded flag. The test asserts that
  adding an overlapping retirement goal is a no-op on decumulation success.

**Engine v2 (loan debt-service fix):** `amortizeLoan` used to compute
`principalPaid` that no caller consumed — debt amortized down with **no cash
outflow**, so a mortgage cost $0 and inflated net worth by the principal. The
sim loop now deducts full debt service (interest + principal) from working-year
surplus and retirement-year need; paying principal moves cash to equity, so a
payment nets to costing exactly the interest. Expense categories are assumed to
EXCLUDE debt service on tracked loans (the plan form's expenses section and the
report methodology now say so; the report's cash-flow table shows a debt-service
row and nets it from surplus). Also: the retirement gross-up tax rate is based
on spending + debt service (a mortgage paid from the deferred pool isn't
tax-free); a malformed `dob` can't NaN the retirement horizon; degenerate loans
(`yrs <= 0` with balance) freeze instead of vanishing; `years` input is clamped
(`[1,100]`, floored, non-finite → 30) so `years: 0` can't emit NaN; and
`hashPlan` embeds an `ENGINE_VERSION` (byte-pinned by a test — bump it on any
model change, never silently repin) so persisted results keyed by `inputHash`
can't collide across model changes. Golden master regenerated for the two
loan-bearing scenarios (loan-free scenarios were byte-identical — RNG stream
untouched). All of this was adversarially reviewed by a 4-lens agent panel
(financial-math, regression, test-adequacy via mutant runs, edge-cases).

**Determinism knob:** `runMonteCarlo` accepts an optional `asOfYear`
(`SimulationInput`) that fixes goal-year offsets and the primary client's age;
omit it for live runs (defaults to the current year).

### Audit hardening (2026-07) — `all-plans.test.ts` + `hardening.test.ts`
`all-plans.test.ts` runs ONE rich two-client household (7 asset classes,
taxable + muni income, mortgage, goals, retirement to 95, two pensions,
RMD-triggering 401k) end-to-end, proving Plans B/C/D-data/E compose. A
verification+adversarial workflow then probed the engine; the confirmed bugs
were fixed (all golden-safe — the frozen snapshots did not move) and pinned by
`hardening.test.ts`:
- **Return multiplier floored at 0** and applied only to a positive balance —
  a long-only pool can't flip negative from a >100% down-draw (was projecting
  −$78M for a $200k crypto position), and a cash shortfall no longer compounds
  at the market rate.
- **RMDs are age-based (73), not coupled to `retirementAge`** — a client
  working past 73 is now forced to draw the deferred pool (IRS-correct).
- **A term-expired loan with a balance is kept** (was silently erased).
- **`Button asChild`** now renders via a minimal Slot (no Radix) so the primary
  CTAs are styled `<a>`s, not invalid `<button><a>` (`components/ui/button.tsx`).
- **Schema guards**: reject `planToAge ≤ retirementAge` when retirement is
  enabled (avoids a falsely-reassuring 100% success) and duplicate goal ids
  (they collapse in the engine's per-goal maps).

**Deferred modelling notes** (need a product decision / would move goldens, so
NOT changed): working income is held nominal (no wage-growth term while
expenses inflate); the `IRS_UNIFORM_LIFETIME` table is sparse (nearest-5
fallback for missing ages); pensions with `startAge < retirementAge` aren't
credited during working years; `/login?error=auth` isn't surfaced to the user.

### Stress campaign (2026-07) — engine passed, findings recorded
A 6-agent stress workflow (statistical validity vs closed form, 600-plan
property fuzz, 7 common-random-number sensitivity sweeps, performance/scale,
pipeline fuzz, seed/convergence) found **zero hard failures**: no NaN/crash,
percentiles ordered everywhere, all 7 sensitivity directions correct, 120k fuzz
paths clean, huge plan (120 assets × 1000 sims × 70 yrs) runs in ~186ms with
linear sims-scaling, 12-seed estimates cluster (p50 rel-sd 5.4%), migrate/parse
never throws (incl. prototype-pollution attempts). Deterministic + `asOfYear`
semantics exact.

**Return model — switched to TRUE log-normal (2026-07-09, product decision):**
the engine now applies the drawn log-return exponentially —
`pool *= exp((μ−σ²/2) + σZ)` — so the stated CMA arithmetic mean μ is actually
delivered (`E[terminal] = V0·e^(μT)`) and the median grows at the geometric
rate (`V0·e^((μ−σ²/2)T)`), the volatility drag counted exactly once. The prior
formula (inherited from legacy `runMC()`) applied the same draw ARITHMETICALLY
(`pool *= 1+annRet`), double-counting the drag: 30-yr equity delivered mean
≈7.0× / median ≈5.0× vs the CMA-faithful 10.9×/7.5×. Impact of the switch
(all goldens regenerated + reviewed): medians +20–60% scaling with equity
share × horizon; retirement money-lasts probabilities +12–13pp; cash/bond
plans nearly unchanged; a long-only pool can now never hit exactly 0 from
returns (e^x > 0). Property appreciation stays arithmetic 3%±2% in the SaaS
(σ too small to matter).

**Correction (2026-07-09):** an earlier version of this note claimed the
legacy `wealth-analyzer.html` still used the arithmetic formula. Reading the
code disproved that: the legacy main app has applied returns exponentially
all along — per-class buckets (`buckets[cls] * Math.exp(r)`, commit 2493e01),
property (`Math.exp(propLogR)`, commit 4569095 by steslic), and the drawdown
MCs. The arithmetic double-count was introduced **in the SaaS port**, which
copied the `(μ−σ²/2)+σZ` draw but dropped the `exp()`. With the SaaS fix the
two engines now agree in model form (the SaaS adds correlation/tax/two-pool
structure on top). Two true stragglers were fixed the same day: the Avaloq
edition's property line (was `prop*(1+propR)`) and the admin console's
test-bench `runMC` (was `nw*(1+r)`).

**Minor (recorded, not fixed):** no distress flag for accumulation-phase
insolvency (deep-negative net worth reports without a qualitative warning);
goal `startYear/endYear` unbounded ints; `migratePlan` coerces garbage numerics
to 0 (a `amt:'abc'` goal becomes a $0 goal at 100% success); no length cap on
`notes` (5MB string passes to JSONB); sims=200 reads ~5pp rosier on
money-lasts than converged 1000-sim runs.

### Running it
```bash
cd wealth-app-next
cp .env.local.example .env.local   # real Supabase creds, or placeholders to just boot the UI
npm install
npm run dev        # http://localhost:3000  (or PORT=3100 npm run dev)
npm run type-check && npm run test && npm run lint && npm run build
```
`.env.local` is gitignored. Placeholder Supabase values are enough to render the
UI (including `/preview/plan`); real values are needed for auth/persistence.

### Release & CI (whole repo)
The legacy standalones and the SaaS app share one pipeline, driven from the
**repo root** `package.json`:
- `npm run ci` — app tests + type-check + **lint** (`app:lint` → `next lint`,
  config in `wealth-app-next/.eslintrc.json`) + Next build + `legacy:check`.
- `npm run legacy:build` — regenerate every `*-standalone.html` via the Perl
  builders, then validate (needs Perl).
- `npm run legacy:check` — `scripts/release/check-artifacts.mjs`; validates each
  app's `source APP_VERSION === version file === standalone`, offline-safety, and
  embedded data blocks, **without** rebuilding.
- GitHub Actions runs all of the above on every push to `main` + PR (active and
  green). See `docs/release-process.md` for source-of-truth vs generated files.
- The push token here lacks GitHub's `workflow` scope — workflow YAML changes go
  through the GitHub web UI, not a push from this environment.
- **Pending web-UI edit:** `.github/workflows/ci.yml` still runs test /
  type-check / build / `legacy:check` as separate steps but has **no lint
  step** — add one (`run: npm run app:lint`) after "Type-check" so CI enforces
  the lint the root `ci` script already includes. (`next build` also lints now
  that `.eslintrc.json` exists, so lint is enforced at build time regardless.)

---

## File Structure

Source files live at the repository **root** (there is no `src/` directory).
`*-standalone.html` files are **generated** — never hand-edit them.

```
wealth-analyzer/
├── CLAUDE.md                          ← this file
├── README.md
├── wealth-analyzer.html              ← main app (source, production, single file)
├── wealth-analyzer-standalone.html   ← generated: fully-vendored offline build
├── wealth-analyzer-avaloq.html       ← Avaloq edition (source)
├── admin.html                        ← admin console (source)
├── country-accounts.js / fund-universe.js  ← source data injected into the app
├── vendor/                           ← pinned Chart.js, jsPDF, pdf.js…
├── version.json / version-avaloq.json← build stamps (generated)
├── build-standalone*.pl              ← standalone builders (Perl)
├── scripts/release/                  ← build-legacy.mjs + check-artifacts.mjs
├── docs/release-process.md           ← release pipeline docs
├── docs/pitch/avaloq-partnership-deck.html ← Avaloq deck source (print to PDF; see below)
└── wealth-app-next/                  ← Next.js + Supabase SaaS migration (Stage 1)
```

**`Avaloq-Pitch-Deck.pdf`** (repo root, untracked) has no prior source in this
repo — it was printed from a throwaway HTML page that was never saved.
`docs/pitch/avaloq-partnership-deck.html` is that missing source, established
2026-07-07: open it in a Chromium browser and Print → Save as PDF (landscape,
no margins, background graphics on) to regenerate the deck. Edit slide content
there, not the PDF.

---

## Development Notes

### Running locally
```bash
open wealth-analyzer.html
# or
python3 -m http.server 8080
# then visit http://localhost:8080/wealth-analyzer.html
```
(For the fully-offline single-file build, open `wealth-analyzer-standalone.html`.
For the SaaS app, see the `wealth-app-next/` section above.)

### Editing
All logic is in the `<script>` block at the bottom of `wealth-analyzer.html`. Data is in the large `COUNTRY_ACCOUNTS`, `REGIONS`, `RISK_PROFILES`, and `HORIZON_PROFILES` objects defined at the top of the script block.

Key functions:
| Function | Purpose |
|----------|---------|
| `runSim()` | Main simulation entry point |
| `redrawChart(paths)` | Renders Chart.js projection |
| `refreshAssetTypes()` | Rebuilds account type dropdown for selected country |
| `renderChildren()` | Full re-render of children cards (only on add/remove) |
| `updChild(id, field, val)` | In-place DOM update for child fields (no re-render) |
| `updateDisplays()` | Syncs all name/avatar/income displays across tabs |
| `updateHouseRisk()` | Updates household risk metric card |
| `getReturnParams()` | Returns blended mean/vol from risk profiles |

### CSS class reference
| Class | Purpose |
|-------|---------|
| `.tab` / `.tab.active` | Tab visibility |
| `.panel` | Card container |
| `.ptitle` | Gold section heading with decorative line |
| `.frow` | Form row (label + input) |
| `.mc` / `.mc-val` | Metric card |
| `.client-card` | Household profile card |
| `.coll-toggle` / `.coll-body` | Collapsible section |
| `.band-btn.active` | Active probability band button |
