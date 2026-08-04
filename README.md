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

Requires Node.js 20+ and a Supabase project:

```bash
cd wealth-app-next
npm ci
cp .env.local.example .env.local
npm run dev
```

Apply **every** migration in `wealth-app-next/supabase/migrations/` in filename order (001 through 010) before using authentication or persistence — applying only 001 leaves the app 500ing on first login, because `/api/plan` reads tables created in 006-009. See [docs/deploy-runbook.md](docs/deploy-runbook.md).

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
