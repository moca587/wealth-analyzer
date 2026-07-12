# Wealth Analyzer — Next.js + Supabase

Stage 1 of the SaaS migration from the single-file HTML prototype.

## What's in this scaffold (so far)

- `package.json` + configs — Next.js 14 (App Router), TypeScript, Tailwind, shadcn-ready
- `lib/engine/` — pure TS port of the Monte Carlo + financial math from the HTML app
  - `types.ts` — TypeScript types for the plan (clients, goals, loans, assets, etc.)
  - `constants.ts` — RISK_PROFILES, HORIZON_PROFILES, INFLATION_REGIONS (1:1 with HTML app)
  - `financial-math.ts` — Box-Muller, amortization, RMD, PV/FV, age-from-DOB
  - `monte-carlo.ts` — the `runMonteCarlo(input)` function, callable from client or server
- `lib/supabase/` — browser + server Supabase clients (using `@supabase/ssr`)
- `middleware.ts` — auth session refresh + `/app/*` route gating
- `supabase/migrations/001_init.sql` — `profiles` and `simulations` tables with RLS policies and auto-create-on-signup trigger

## Setup (do these in order)

Built and verified against **Node 24.16.0 / npm 11.13.0**. Any Node 20+ LTS should work; the dependency set is pinned so `npm ci` resolves deterministically without `--legacy-peer-deps` or `--force`.

### 1. Install Node.js LTS

https://nodejs.org/en/download/ — accept defaults, reopen your terminal.

### 2. Install dependencies

From this directory (`wealth-app-next/`):

```bash
npm ci
```

### 3. Create your Supabase project

1. https://supabase.com/dashboard → New Project
2. Pick a region close to your users; generate a strong DB password and save it
3. Wait ~2 min for provisioning
4. Settings → API — copy three values to `.env.local` (next step)

### 4. Configure environment

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with your Supabase values:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # KEEP SECRET
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Apply the database schema

Open the Supabase dashboard → SQL Editor → New Query.
Paste the contents of `supabase/migrations/001_init.sql` and run it.

You should see two tables in Table Editor: `profiles` and `simulations`.

### 6. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000 — you should see the landing page.
Try signing up at http://localhost:3000/signup.

### 7. Verify before you build on top of this

```bash
npm test -- --run
npm run type-check
npm run build
```

All three should exit 0. If `npm test` fails on an empty test file, or `npm run build`
fails prerendering a page that calls `useSearchParams()`, that page needs its
client body split out and wrapped in `<Suspense>` (see `app/(auth)/login/` for
the pattern).

## Folder structure (target — what's next)

```
wealth-app-next/
├── app/                          (next up)
│   ├── layout.tsx                root layout, fonts, providers
│   ├── page.tsx                  landing page
│   ├── (auth)/                   route group — no app shell
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── app/                      gated route group — requires auth
│   │   ├── layout.tsx            app shell with nav
│   │   ├── page.tsx              dashboard
│   │   ├── plan/page.tsx         profile capture (household/income/assets/goals)
│   │   └── simulate/page.tsx     simulation results + chart
│   └── api/
│       └── plan/route.ts         save/load plan to Postgres
├── components/
│   ├── ui/                       shadcn primitives (Button, Input, Card, etc.)
│   └── plan/                     plan-capture form components
├── lib/
│   ├── engine/                   ✓ done — pure TS engine port
│   └── supabase/                 ✓ done — auth clients
├── supabase/
│   └── migrations/               ✓ 001_init.sql ready
├── middleware.ts                 ✓ done — session refresh + route gating
└── ...configs                    ✓ done — package.json, tsconfig, tailwind, etc.
```

## What I'm building next (after you confirm Node + accounts ready)

1. App shell (`app/layout.tsx`, fonts, global CSS)
2. Landing page (`app/page.tsx`) — minimal version of the marketing index.html
3. Auth pages (login, signup) with Supabase Auth
4. App shell layout with sidebar nav
5. Plan capture form (household → income → assets → liabilities → goals)
6. Simulation page using the ported `runMonteCarlo()` engine
7. Save/load plan via API route
8. Vercel deployment

## Engine port — verification

The Monte Carlo engine in `lib/engine/monte-carlo.ts` mirrors `runSim()`
from `wealth-analyzer.html`:
- Log-normal returns via Box-Muller (`boxMuller()`)
- Property appreciation as stochastic 3% ± 2%
- Real loan amortization (per-month interest math; full debt service —
  interest + principal — is funded from each year's cash flow, so expense
  categories must exclude payments on tracked loans)
- 30% surplus invested / 70% cash
- Goals evaluated at calendar-year targets (`yearOffset = startYear - currentYear`)
- Percentile bands: 10/25/50/75/80/90
- Goal success probability per goal

Difference from HTML version: this engine doesn't yet implement
country-aware inflation per `INFLATION_REGIONS` — uses `plan.inflationRate`
directly. Easy to add when wired into the UI.
