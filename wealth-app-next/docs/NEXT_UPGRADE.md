# Next.js 14 → 15 Upgrade — Ready-to-Run Plan

> Status: **planned, not yet applied.** Blocked on disk headroom (a major
> install + build cache needs ~1–2 GB; the machine currently has ~200 MB free).
> Everything below is exact and verified against the current codebase.

## Why
The 5 `npm audit` highs/moderates are all in `next` (and its bundled `postcss`)
and `eslint-config-next`. The fixes are **major** version bumps. Next 15 clears
almost all of them; the remaining few clear on the latest 15.5.x patch.

## Target versions
```
next                 ^15.5.x   (latest 15)
react / react-dom    ^19.x     (Next 15 App Router expects React 19)
eslint-config-next   ^15.5.x
@types/react         ^19.x
@types/react-dom     ^19.x
```

## Prerequisites
1. **Free ~1–2 GB** (clear part of `~/Downloads`, which holds ~24 GB).
2. Recommended: commit current work first as a safety net (lots is uncommitted).

## Step 1 — bump deps & install
Easiest is the official codemod (also applies most code changes):
```
npx @next/codemod@canary upgrade latest
npm install
```
…or do it manually by editing `package.json` to the target versions and running
`npm install`.

## Step 2 — async request APIs (the only hand-edit needed)
Next 15 makes `cookies()`/`headers()` **async**. Exactly two kinds of change:

### 2a. `lib/supabase/server.ts` → make it async
```diff
- export function createClient() {
-   const cookieStore = cookies();
+ export async function createClient() {
+   const cookieStore = await cookies();
    return createServerClient(/* …unchanged… */);
  }
```
> `lib/supabase/client.ts` (browser) does **not** use `cookies()` — leave it sync.

### 2b. `await` the 7 SERVER-side callers
These import `createClient` from `@/lib/supabase/server`:

| File | Line |
|---|---|
| `app/app/layout.tsx` | 6 |
| `app/app/page.tsx` | 14 |
| `app/app/plan/page.tsx` | 6 |
| `app/app/simulate/page.tsx` | 9 |
| `app/api/plan/route.ts` | 12 and 27 |
| `app/api/avaloq/sync/route.ts` | 54 |

Change each:
```diff
- const supabase = createClient();
+ const supabase = await createClient();
```
All are already in `async` functions, so no signature changes ripple further.

> **Do NOT change** the 3 browser-client callers — they use
> `@/lib/supabase/client`, which stays synchronous:
> `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`,
> `components/nav/sidebar.tsx`.

## Step 3 — other Next 15 notes (low impact here)
- **Caching defaults changed**: `fetch` and GET Route Handlers are no longer
  cached by default. This app's `/api/plan` and `/api/avaloq/sync` do per-user
  reads/writes that should NOT be cached, so the new defaults are *correct* — no
  change needed.
- **`next/image`, `next.config`**: no deprecated options in use.
- React 19: this codebase uses no `propTypes`, legacy context, or string refs,
  so no React-19 breakages expected.

## Step 4 — verify (all already wired)
```
npm run type-check   # tsc --noEmit
npm run lint         # next lint
npm test             # vitest (27 mapper tests)
npm run build        # full production build — the real proof
npm run dev          # smoke-test http://localhost:3000 → 200
```
Confirm `GET / 200` and no `cookies()` sync-access warnings in the dev log.

## Rollback
Deps are isolated from source changes:
```
git checkout package.json package-lock.json
npm install
```
Your Avaloq module + tests are separate files and are unaffected.

## Next 16?
Possible later, but 16 is a further major bump for marginal additional audit
coverage. Recommendation: land on **15.5.x** first, ship, then consider 16 as a
separate task.
```
