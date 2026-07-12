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
├── lib/supabase/        ← browser + server clients (@supabase/ssr)
├── components/plan/     ← PlanForm + sections/{household,children,assets,import-export}
├── components/sim/      ← sim runner + chart
├── app/                 ← (auth)/{login,signup}, app/ (gated), app/plan, app/simulate,
│                            api/plan, preview/plan (dev-only, 404s in prod)
├── middleware.ts        ← Supabase session refresh + /app/* auth gate
└── supabase/migrations/001_init.sql  ← profiles + simulations tables, RLS, signup trigger
```

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
└── wealth-app-next/                  ← Next.js + Supabase SaaS migration (Stage 1)
```

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
