# Development guide

## Prerequisites

| Tool | Purpose |
|---|---|
| Modern browser | Run and inspect the production HTML app |
| Node.js 20+ and npm | SaaS development and repository checks |
| Perl | Regenerate legacy standalone builds |
| Supabase project | SaaS authentication and persistence |

## Repository setup

Clone the repository, then install SaaS dependencies:

```bash
npm run app:install
```

The root package does not have its own dependency tree; its scripts delegate to `wealth-app-next/` or run Node release utilities.

## Work on the production app

Run directly:

```bash
python -m http.server 8080
# open http://localhost:8080/wealth-analyzer.html
```

Edit source files only:

- `wealth-analyzer.html`
- `wealth-analyzer-avaloq.html`
- `admin.html`
- `country-accounts.js`
- `fund-universe.js`

Do not edit `*-standalone.html` or `version*.json`. After changing a source HTML or shared data file, run:

```bash
npm run legacy:build
npm run legacy:check
```

The build requires Perl and updates source/standalone version stamps together. Details are in [release-process.md](release-process.md).

Because the application is a large single file, make targeted edits and test the affected navigation tab, import/export path, simulation, and report preview. Verify both ordinary and standalone builds when changing dependency loading or offline behavior.

## Work on the SaaS app

### Configure the environment

```bash
cd wealth-app-next
cp .env.local.example .env.local
```

Set:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` is intentionally not part of the setup: no code reads it, and it bypasses every RLS policy in migrations 006-010. Do not provision it until something needs it. Never commit `.env.local`.

Apply **every** migration in `supabase/migrations/` in filename order (001 through 010) with the Supabase SQL editor, or `npm run db:push`. 001 alone creates only profiles and the simulation cache; the plan itself lives in `plans` (006) and the routes read it from 009 onward, so a 001-only database 500s on first login. Full procedure, including the irreversible region decision: [deploy-runbook.md](deploy-runbook.md).

### Run locally

```bash
npm ci
npm run dev
```

Useful routes:

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/login`, `/signup` | Authentication |
| `/app` | Protected dashboard |
| `/app/plan` | Plan capture and import/export |
| `/app/simulate` | Monte Carlo results |
| `/app/report` | Report view |
| `/preview/plan` | Development-only plan preview; 404 in production |
| `/preview/report` | Development-only report preview; 404 in production |

Placeholder Supabase values can render unauthenticated and preview UI, but real credentials are required for sign-in and plan persistence.

## Validation and data rules

The runtime schema is `wealth-app-next/lib/plan/schema.ts`. Keep it aligned with `lib/engine/types.ts`.

When adding or changing plan fields:

1. Update TypeScript domain types.
2. Update the Zod schema and cross-field validation.
3. Update the default plan.
4. Update migration logic for old imports.
5. Update form components and API handling.
6. Include the field in simulation hashing if it changes results.
7. Add schema, migration, pipeline, and engine tests as appropriate.

Do not allow malformed imports or database JSONB to bypass validation.

## Test and build commands

From the repository root:

```bash
npm run app:test       # Vitest suite
npm run app:typecheck  # TypeScript check
npm run app:lint       # Next/ESLint
npm run app:build      # Production Next.js build
npm run legacy:check   # Validate committed generated HTML artifacts
npm run ci             # All of the above
```

From `wealth-app-next/`:

```bash
npm run dev
npm run test
npm run test:run
npm run type-check
npm run lint
npm run build
npm run start
```

### Golden-master tests

Engine snapshots are intentionally strict. To print regenerated expected values after an approved model change:

```bash
cd wealth-app-next
GEN_GOLDEN=1 npx vitest run golden-master
```

Review the numerical changes before replacing expected values. Never regenerate snapshots merely to silence an unexplained failure. Bump `ENGINE_VERSION` in `lib/engine/monte-carlo.ts` whenever simulation behavior changes.

## Common pitfalls

- Editing a generated standalone file; the next build will overwrite it.
- Changing `CountryCode` without changing the Zod country enum.
- Hand-editing generated `lib/data/country-accounts.ts`.
- Adding loan payments to expenses and tracked liabilities, which double-counts debt service.
- Using only a random seed in time-sensitive tests; also set `asOfYear`.
- Persisting unvalidated JSONB or replacing a valid plan after a failed import.
- Using `.update()` for profile saves; a missing profile row causes a silent no-op. Keep the existing upsert behavior.
- Changing engine output without bumping the engine version used by `inputHash`.

## CI and releases

GitHub Actions runs SaaS tests, type-check/build checks, and legacy artifact validation on pushes to `main` and pull requests. The committed standalone artifacts are validated rather than silently rebuilt, making source/artifact drift a failing condition.

Follow [release-process.md](release-process.md) for release stamping and artifact checks.
