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

> **Two products in this repo:** the single-file HTML app documented above is the
> **production** product. A parallel Next.js + Supabase SaaS rebuild lives in
> `wealth-app-next/` — see [SaaS Migration](#saas-migration--wealth-app-next-stage-1)
> below. The HTML app stays authoritative until the SaaS version reaches parity.

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

**Status:** Stage-1 scaffold. **The legacy `wealth-analyzer.html` is still the
production product** and stays authoritative until the SaaS version reaches
parity. Do not delete or deprioritize the HTML app.

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
