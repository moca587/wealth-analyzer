# Wealth Analyzer SaaS

This directory contains the Next.js + Supabase rebuild of Wealth Analyzer. It is an active migration; the root `wealth-analyzer.html` remains the authoritative production product.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS · Supabase Auth/Postgres/RLS · Zod · Vitest · Chart.js

Node.js 20+ is required.

## Local setup

```bash
npm ci
cp .env.local.example .env.local
npm run dev
```

Configure `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Apply `supabase/migrations/001_init.sql` in the Supabase SQL editor before testing authentication or persistence. Never commit `.env.local` or expose the service-role key to client code.

Open <http://localhost:3000>. Development-only design previews are available at `/preview/plan` and `/preview/report`; both return 404 in production.

## Commands

```bash
npm run dev          # development server
npm run test:run     # Vitest once
npm run type-check   # tsc --noEmit
npm run lint         # ESLint
npm run build        # production build
npm run start        # serve production build
```

The complete repository check is run from the parent directory with `npm run ci`.

## Structure

```text
app/                  App Router pages, auth, protected routes, API
components/plan/      Plan form and sections
components/sim/       Simulation runner and charts
components/report/    Report UI
lib/engine/           Pure financial math and Monte Carlo engine
lib/plan/             Schema, defaults, migration, import/export
lib/data/             Generated country-account taxonomy
lib/supabase/         Browser and server clients
supabase/migrations/  Postgres schema and RLS
```

## Data flow

- Supabase middleware refreshes sessions and gates `/app/*`.
- `GET /api/plan` and `PUT /api/plan` load and save the authenticated user's plan.
- Plans are migrated and validated with Zod before entering the UI or database.
- Postgres Row-Level Security limits profile and simulation rows to their owner.
- `runMonteCarlo()` is a pure, optionally seeded engine used by the simulation UI.

## Further documentation

- [Project overview](../README.md)
- [Architecture and simulation model](../docs/architecture.md)
- [Development and test workflow](../docs/development.md)
- [Release process](../docs/release-process.md)

The software provides educational projections, not financial, investment, tax, or legal advice.
