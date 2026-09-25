# Wealth Analyzer

Wealth Analyzer is a browser-based financial-planning suite for modelling household cash flow, assets, liabilities, goals, portfolios, and retirement outcomes with Monte Carlo simulation.

The repository contains two implementations:

- **Legacy browser application** — the production product. It is a self-contained HTML application with no backend or build step.
- **Next.js SaaS application** — a parallel authenticated rebuild using Next.js, TypeScript, and Supabase. It is not yet the production replacement.

> The projections are educational estimates, not financial, investment, tax, or legal advice.

## Start here

### Production browser application

Open the source application directly:

```bash
open wealth-analyzer.html
```

On Windows, double-click `wealth-analyzer.html`. For a fully offline copy with all libraries and fonts embedded, open `wealth-analyzer-standalone.html` instead.

You can also serve the repository locally:

```bash
python -m http.server 8080
# http://localhost:8080/wealth-analyzer.html
```


### Next.js SaaS application

Two ways to run it: entirely locally with Docker Compose (recommended for development), or against your own hosted Supabase project.

#### Option 1: local, with Docker Compose

One command starts the app with hot reload and a complete local Supabase (Postgres, auth, REST API, mail catcher), and applies every migration. No Node.js or Supabase account is needed on your machine.

**Prerequisites:** Docker and Docker Compose 2.24+.

```bash
cp wealth-app-next/.env.local.example wealth-app-next/.env.local   # once
docker compose up --build
```

The first start builds the image and initialises the database, so it takes a few minutes; later starts are fast. Then:

1. Open <http://localhost:3000> and sign up.
2. Email confirmation is on, and no mail leaves your machine. Open the local inbox at <http://localhost:8025> and click the confirmation link; it signs you in.
3. A new account has no plan yet. Open **Plan**, fill in the sections that apply and click **Save**; the other pages load from that plan.

| Service | Host address (loopback only) |
|---------|------------------------------|
| App | <http://localhost:3000> (set `APP_PORT` to change) |
| Supabase API (auth + REST) | <http://localhost:54321> |
| Postgres | `localhost:55432`, user `postgres`, password `dev-only-password` |
| Mail inbox | <http://localhost:8025> |

Common tasks:

```bash
APP_PORT=3100 docker compose up            # port 3000 already in use
docker compose up --build --watch          # restart the app when package.json / lockfile change
docker compose run --rm app npm run test:run
docker compose run --rm app npm run lint
docker compose down                        # stop, keep the database
docker compose down -v                     # stop and wipe the database and caches
```

Notes:
- This setup is for development only; the production image is `wealth-app-next/Dockerfile`. The Supabase URLs and JWT keys in `docker-compose.yaml` are dev-only and must never be reused elsewhere.
- The source is bind-mounted, so anything run in the container can write to your checkout.
- The browser reaches Supabase at `localhost:54321`, while the app container uses `SUPABASE_INTERNAL_URL=http://gateway:8000` (see `wealth-app-next/lib/supabase/config.ts`).
- The project is mounted at `/workspace`, not `/app`: with the root at `/app`, Next.js serves the gated layout for every route and all pages redirect to `/login`.

#### Option 2: hosted Supabase project

Requires Node.js 20+ and a Supabase project:

```bash
cd wealth-app-next
npm ci
cp .env.local.example .env.local   # then fill in your Supabase URL and anon key
npm run dev
```

Apply **every** migration in `wealth-app-next/supabase/migrations/` in filename order (001 through 014) before using authentication or persistence. Applying only 001 leaves the app returning 500 on first login, because `/api/plan` reads tables created in 006-009. See [docs/deploy-runbook.md](docs/deploy-runbook.md).

## Capabilities

### Production application

- One- or two-client household profiles, children, risk profiles, and time horizons
- Income, expenses, insurance, taxes, assets, loans, and financial goals
- Country-aware account taxonomy and inflation presets
- Retirement, pension, drawdown, RMD, Roth-conversion, and estate analysis
- Current portfolio capture, statement import, proposal construction, and comparison
- Monte Carlo projections, goal-funding analysis, sensitivity analysis, and recommendations
- Profile import/export and read-only sharing
- Customizable browser preview and multi-page PDF report
- Optional AI-assisted document extraction and portfolio-building features

All normal plan calculations run in the browser. Features that call an external AI service require explicit configuration and send the submitted content to that service.

### SaaS application

- Supabase email authentication and per-user plan persistence
- Validated plan capture and JSON import/export
- Seedable Monte Carlo simulation with asset-class assumptions and correlation
- Progressive tax estimates, loan debt service, inflation-adjusted goals, and retirement decumulation
- Pension income, tax-deferred and taxable pools, and age-based RMDs
- Simulation charts and report view
- Row-Level Security for profile and simulation data

## Repository map

```text
.
├── wealth-analyzer.html                 Production app source
├── wealth-analyzer-standalone.html      Generated offline build; do not edit
├── wealth-analyzer-avaloq.html          Avaloq edition source
├── wealth-analyzer-avaloq-standalone.html
├── admin.html                           Admin console source
├── admin-standalone.html                Generated offline build
├── country-accounts.js                  Shared account taxonomy source
├── fund-universe.js                     Shared fund data source
├── vendor/                              Pinned browser dependencies
├── scripts/release/                     Legacy build and validation scripts
├── wealth-app-next/                     Next.js + Supabase SaaS application
├── docs/
│   ├── user-guide.md                    Using the production app
│   ├── architecture.md                  System and simulation architecture
│   ├── development.md                   Local setup, tests, and contribution workflow
│   └── release-process.md               Artifact generation and release checks
└── CLAUDE.md                            Engineering history and detailed decisions
```

Files ending in `-standalone.html` and `version*.json` are generated artifacts. Edit the corresponding source HTML and then run `npm run legacy:build`.

## Documentation

- [User guide](docs/user-guide.md)
- [Architecture](docs/architecture.md)
- [Development and testing](docs/development.md)
- [Release process](docs/release-process.md)
- [SaaS-specific setup](wealth-app-next/README.md)

## Quality checks

From the repository root:

```bash
npm run legacy:check   # validate committed standalone artifacts
npm run ci             # SaaS tests, types, lint, build, and legacy validation
```

To regenerate all legacy standalone files (requires Perl):

```bash
npm run legacy:build
```

## Privacy and security

- The production application has no account system or backend; profile data remains in browser memory unless the user exports or shares it.
- Imported files are processed locally unless an AI-assisted feature is used.
- The SaaS application stores each authenticated user's plan in Supabase. Database Row-Level Security limits rows to their owner.
- Never commit `.env.local` or a Supabase service-role key.

## Project status

`wealth-analyzer.html` remains the authoritative production product. `wealth-app-next/` is an active migration and should not be assumed to have complete feature parity. Generated standalone files must remain synchronized with their source files before release.
