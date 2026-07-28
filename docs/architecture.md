# Architecture

## Product boundaries

The repository deliberately contains two products.

| Product | Runtime | Persistence | Status |
|---|---|---|---|
| Production browser app | Vanilla HTML/CSS/JavaScript | Local profile files and share snapshots | Authoritative production product |
| SaaS app | Next.js 15, React 19, TypeScript | Supabase Auth + Postgres JSONB | Migration in progress |

The production app is not generated from the SaaS app. Changes needed in both products must be implemented and tested independently.

## Production browser application

### Packaging

`wealth-analyzer.html` contains the interface, application state, calculations, charts, import tools, and reporting logic. It can run over `file://` with no build server. Shared data originates in `country-accounts.js` and `fund-universe.js` and is embedded during release builds.

The build scripts create `*-standalone.html` variants by inlining pinned dependencies and fonts from `vendor/`. Standalone files are outputs, not source files.

### State and data flow

1. Form controls update in-memory JavaScript objects and derived displays.
2. Planning calculations read the current household, cash-flow, asset, debt, goal, and portfolio state.
3. Simulation paths are generated in the browser and summarized into percentile bands and success metrics.
4. Chart.js renders interactive charts.
5. The report pipeline converts shared calculated sections into an HTML preview or jsPDF document.
6. Profile export serializes the current state; profile import reconstructs it.

Normal operation has no server-side persistence. Optional AI functions are the exception to local-only processing and call an externally configured API.

### Editions

- `wealth-analyzer.html` — main production source.
- `wealth-analyzer-avaloq.html` — Avaloq-specific source with its own release stamp.
- `admin.html` — administrative/test console.

Each source has a generated offline counterpart. See [release-process.md](release-process.md).

## SaaS application

### Request architecture

```text
Browser
  ├─ React plan/simulation/report components
  ├─ Supabase browser client (session actions)
  └─ /api/plan
        ├─ Supabase server client
        ├─ Zod plan validation
        └─ Postgres profiles.plan JSONB

middleware.ts
  ├─ refreshes the Supabase session
  └─ gates /app/* routes
```

### Major directories

| Path | Responsibility |
|---|---|
| `app/` | App Router pages, auth callback, protected product routes, and API route |
| `components/plan/` | Plan form and stable-key section components |
| `components/sim/` | Simulation runner and Chart.js result view |
| `components/report/` | Report presentation |
| `lib/engine/` | Pure financial math and Monte Carlo engine |
| `lib/plan/` | Defaults, migration, import/export, and Zod validation |
| `lib/data/` | Generated country-account taxonomy |
| `lib/supabase/` | Browser and server Supabase clients |
| `supabase/migrations/` | Database schema, triggers, indexes, and RLS policies |

### Plan persistence

A user has one `profiles` row keyed by the Supabase Auth user ID. The plan is stored as JSONB to support rapid schema evolution. `GET /api/plan` and `PUT /api/plan` both validate data with `lib/plan/schema.ts`; writes use `upsert` so a missing signup-trigger row does not silently lose data.

Imported data follows this pipeline:

```text
JSON text → unwrap export envelope → migratePlan → parsePlan (Zod) → form state
```

Invalid imports do not overwrite the current plan. Database Row-Level Security independently ensures a user can access only their own profile and simulation rows.

## SaaS simulation model

`runMonteCarlo(input)` is a pure TypeScript function. Given a validated plan, simulation count, horizon, and optional seed/year anchor, it returns paths, percentile arrays, goal success, final statistics, and retirement success.

Key modelling behavior:

- Box-Muller normal draws and true log-normal investment growth
- Portfolio return and volatility derived from asset-class assumptions and correlations
- Risk-profile assumptions used as a fallback when classified holdings are absent
- Stochastic property appreciation
- Progressive income-tax approximation
- Full loan debt service and annual amortization
- Inflation-adjusted expenses and goals
- Taxable and tax-deferred investment pools
- Retirement spending, pensions, deferred-withdrawal tax gross-up, and age-based RMDs
- Calendar-year goal funding, with retirement goals excluded from duplicate funding when decumulation is enabled

A supplied `seed` makes random draws repeatable. A supplied `asOfYear` also freezes ages and goal offsets; tests use both for byte-reproducible runs. The input hash includes an engine version so cached results cannot be reused after a model change.

### Important assumptions

- Expense categories exclude payments for loans already entered as tracked liabilities.
- Working income is nominal; expenses inflate.
- Taxes are simplified and omit many local rules, credits, deductions, and filing circumstances.
- Property is not liquidated to meet retirement spending in the SaaS engine.
- The RMD table is simplified and US-oriented.
- Results are scenario estimates, not forecasts or advice.

The SaaS and production engines share concepts but are intentionally not numerically identical: the SaaS engine adds asset-class covariance, tax, and two-pool decumulation structure.

## Data sources and synchronization

`wealth-app-next/lib/data/country-accounts.ts` is generated from root `country-accounts.js` using `scratchpad/convert-accounts.js` when that converter is present. Do not hand-edit the generated TypeScript taxonomy.

`CountryCode` in `lib/engine/types.ts` and `countryCodeEnum` in `lib/plan/schema.ts` must remain synchronized. Individual eurozone country codes map to the `EU` inflation region; Taiwan maps to `CN`.

## Testing strategy

The SaaS engine uses several layers:

- Unit tests for financial math and plan validation
- Seeded Monte Carlo behavior tests
- Analytical log-normal bounds and invariants
- Golden-master scenarios for intentional numeric-change review
- End-to-end-lite import → migration → validation → simulation tests
- Rich-plan composition and adversarial hardening tests

Any intentional model change should bump `ENGINE_VERSION`, update documentation, run the complete suite, and regenerate golden values only after reviewing the numerical impact.
