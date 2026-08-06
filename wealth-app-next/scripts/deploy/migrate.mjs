// ─────────────────────────────────────────────────────────────────
// Apply the migrations to a real Postgres, in order, with a ledger.
//
// This replaces the runbook's most dangerous instruction — "paste 13
// files into the SQL editor by hand, one at a time, stop at the first
// error" — with one command that cannot skip, reorder, or half-apply.
//
// It works against ANY Postgres reachable by DATABASE_URL: a managed
// Supabase project's DIRECT connection string, an in-estate Avaloq
// Postgres (deployment option B), or a throwaway rehearsal database.
//
// It assumes migrations are applied ONLY through it (or through a tool
// that maintains public.schema_migrations the same way). That is the
// greenfield case this exists for — the first real deployment.
//
//   node scripts/deploy/migrate.mjs            apply all pending
//   node scripts/deploy/migrate.mjs --dry-run  show the plan, change nothing
//   node scripts/deploy/migrate.mjs --status   list applied vs pending
//
// `pg` is a devDependency and never ships in the container — this runs on
// the operator's machine or in CI, not inside the image.
// ─────────────────────────────────────────────────────────────────

import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const MIGRATIONS_DIR = join(HERE, "..", "..", "supabase", "migrations");

/**
 * Decide what to apply. Pure — no filesystem, no database — so the
 * ordering, ledger-skip and consistency rules are unit-tested without a
 * Postgres.
 *
 * @param {string[]} files   directory listing (any order, may include noise)
 * @param {Iterable<string>} appliedVersions  versions already in the ledger
 * @returns {{ pending: {version:string,file:string}[], applied: string[], error?: string }}
 */
export function planMigrations(files, appliedVersions) {
  const numbered = files
    .filter((f) => /^\d{3}_.+\.sql$/.test(f))
    .sort(); // filename order === numeric order for zero-padded prefixes
  const applied = new Set(appliedVersions);
  const pending = [];
  let sawPending = false;

  for (const f of numbered) {
    const version = f.replace(/\.sql$/, "");
    if (applied.has(version)) {
      // A migration recorded as applied AFTER an earlier one is still
      // pending means history is inconsistent — someone applied out of
      // order, or the ledger was hand-edited. Refuse rather than guess.
      if (sawPending) {
        return {
          pending: [], applied: [...applied],
          error: `ledger is inconsistent: ${version} is applied but an earlier migration is still pending. ` +
                 `Restore from the pre-deploy backup and re-run from a clean database.`,
        };
      }
      continue;
    }
    sawPending = true;
    pending.push({ version, file: f });
  }
  return { pending, applied: [...applied] };
}

/**
 * Apply an ordered list of pending migrations, each in its own
 * transaction, recording the ledger as it goes. Stops at the first
 * failure with the file rolled back, so the ledger never records a
 * half-applied migration.
 *
 * Pulled out and given an injectable `db` ({ query(sql, params?) }) and
 * `readFile(version)` so the loop that runs against a production database
 * can be exercised end-to-end against a real Postgres in a test — the
 * ordering planner is not the risky part, this loop is.
 *
 * @returns {Promise<{applied:string[], failed?:{version:string, error:string}}>}
 */
export async function applyPending(db, pending, readFile) {
  const applied = [];
  for (const { version } of pending) {
    const sql = readFile(version);
    // begin is INSIDE the try: a connection drop on `begin` itself must
    // return the structured failure (and the resume guidance) like any
    // other, not propagate raw out of the loop.
    try {
      await db.query("begin");
      await db.query(sql);
      await db.query(
        `insert into public.schema_migrations (version) values ($1) on conflict do nothing`, [version]);
      await db.query("commit");
      applied.push(version);
    } catch (e) {
      await db.query("rollback").catch(() => {});
      return { applied, failed: { version, error: e instanceof Error ? e.message : String(e) } };
    }
  }
  return { applied };
}

// ─── Everything below needs a database and only runs as a script ────

/**
 * TLS for the connection, SECURE BY DEFAULT. This connection carries DDL
 * to a production database, so a MITM that could inject SQL is a real
 * threat and verification must be on unless the operator explicitly opts
 * out. `pg` honours `sslmode` in the URL, so:
 *   - `sslmode` present (require / verify-full / no-verify / disable) → let
 *     pg parse it; the operator has stated intent.
 *   - absent → default to SSL WITH verification (managed Supabase verifies
 *     against a public CA). An in-estate Postgres with a self-signed cert
 *     must say so with `?sslmode=no-verify`, which is visible, not silent.
 */
export function sslFor(url) {
  return /\bsslmode=/.test(url) ? undefined : { rejectUnauthorized: true };
}

function fail(msg) {
  process.stderr.write(`\n✗ ${msg}\n\n`);
  process.exit(1);
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run");
  const statusOnly = args.has("--status");
  // REHEARSAL ONLY. A plain Postgres has no `auth` schema, no auth.uid(),
  // and no anon/authenticated/service_role roles — which the migrations
  // reference. --stub creates minimal stand-ins so a rehearsal against a
  // throwaway database exercises the real triggers, RLS and grants. NEVER
  // pass it against a real Supabase project: it would shadow the real auth
  // schema. Guarded below.
  const withStub = args.has("--stub");

  const url = process.env.DATABASE_URL;
  if (!url) {
    fail("DATABASE_URL is not set.\n" +
         "  Managed Supabase: Settings → Database → Connection string → URI (the DIRECT\n" +
         "  connection on port 5432, NOT the pooler — 001 creates a trigger on auth.users\n" +
         "  that the pooled role cannot).\n" +
         "  Rehearsal: the DATABASE_URL your docker-compose.rehearsal.yml prints.");
  }

  let files;
  try { files = readdirSync(MIGRATIONS_DIR); }
  catch (e) { return fail(`cannot read ${MIGRATIONS_DIR}: ${e.message}`); }

  let pg;
  try { pg = await import("pg"); }
  catch { return fail("the 'pg' package is not installed. Run `npm install` in wealth-app-next first."); }

  const client = new pg.default.Client({ connectionString: url, ssl: sslFor(url) });

  await client.connect().catch((e) => fail(`could not connect: ${e.message}`));
  try {
    // Serialize concurrent runs (an operator plus a CI step, or two
    // operators). A second runner blocks here and then resumes cleanly from
    // whatever the first left, instead of both computing the same plan and
    // colliding mid-apply. Session-scoped; released when the connection ends.
    await client.query(`select pg_advisory_lock(hashtext('wealth-analyzer:migrate'))`);

    if (withStub) {
      // Refuse to stub a database that already has a real Supabase auth
      // schema. pg_catalog, NOT information_schema — the latter is
      // privilege-filtered, so a migration role without rights on auth.users
      // would see it as absent and let --stub clobber the real auth.uid().
      const real = await client.query(
        `select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'auth' and c.relname = 'users'`);
      if (real.rowCount) {
        fail("--stub refused: this database already has an auth.users table (a real\n" +
             "  Supabase project). --stub is only for a throwaway plain-Postgres rehearsal.");
      }
      const stub = readFileSync(join(HERE, "supabase-stub.sql"), "utf8");
      await client.query("begin");
      try { await client.query(stub); await client.query("commit"); }
      catch (e) { await client.query("rollback").catch(() => {}); fail(`stub failed: ${e.message}`); }
      process.stdout.write("✓ Applied the rehearsal auth stub.\n");
    }

    // The WHOLE migration set requires the three Supabase roles: 001 grants
    // to them, every RLS policy references them, and the ledger lockdown
    // below revokes from them. On managed Supabase they always exist; on an
    // in-estate Postgres (option B) they must be provisioned first, and
    // --stub creates them for a rehearsal. Check upfront so a missing role
    // is one clear message here, not a cryptic `role "authenticated" does
    // not exist` from deep inside 001 or the ledger revoke.
    const roles = await client.query(
      `select rolname from pg_roles where rolname in ('anon','authenticated','service_role')`);
    if (roles.rowCount < 3) {
      const have = new Set(roles.rows.map((r) => r.rolname));
      const missing = ["anon", "authenticated", "service_role"].filter((r) => !have.has(r));
      fail(`this database is missing the Supabase role(s): ${missing.join(", ")}.\n` +
           "  Managed Supabase provisions them automatically. For an in-estate Postgres,\n" +
           "  create them before migrating (create role anon; create role authenticated; …),\n" +
           "  or use --stub for a throwaway rehearsal.");
    }

    // The ledger 010 introduced. Created here too, so a from-scratch run
    // (001-009 predate it) still has somewhere to record — and locked down
    // to match 010, so it is never client-writable even during the window
    // before 010 runs.
    await client.query(
      `create table if not exists public.schema_migrations (
         version text primary key, applied_at timestamptz not null default now())`);
    await client.query(`alter table public.schema_migrations enable row level security`);
    await client.query(`revoke all on public.schema_migrations from authenticated, anon`);

    const { rows } = await client.query(`select version from public.schema_migrations`);
    const appliedVersions = rows.map((r) => r.version);

    // The runbook historically told operators to paste migrations into the
    // SQL editor by hand. If that was done, the schema exists but the ledger
    // (created just now) is empty — and replaying from 001 could double-apply
    // a non-idempotent statement. Refuse rather than guess.
    if (appliedVersions.length === 0) {
      const probe = await client.query(`select to_regclass('public.profiles') is not null as populated`);
      if (probe.rows[0].populated) {
        fail("this database already has the 001 schema but an EMPTY migration ledger —\n" +
             "  it was migrated out-of-band (e.g. by hand in the SQL editor). Re-running would\n" +
             "  replay from 001. Adopt the existing state first:\n" +
             "    insert into public.schema_migrations (version)\n" +
             "    values ('001_init'), ... up to the last version actually applied;\n" +
             "  then re-run this to apply the rest.");
      }
    }

    const { pending, applied, error } = planMigrations(files, appliedVersions);
    if (error) fail(error);

    if (statusOnly) {
      process.stdout.write(`Applied (${applied.length}):\n  ${applied.sort().join("\n  ") || "(none)"}\n\n`);
      process.stdout.write(`Pending (${pending.length}):\n  ${pending.map((p) => p.version).join("\n  ") || "(none)"}\n`);
      return;
    }

    if (!pending.length) { process.stdout.write("✓ Database is up to date.\n"); return; }

    process.stdout.write(`${pending.length} migration(s) to apply:\n  ${pending.map((p) => p.version).join("\n  ")}\n\n`);
    if (dryRun) { process.stdout.write("(--dry-run: nothing applied)\n"); return; }

    // One transaction per migration (no migration uses CREATE INDEX
    // CONCURRENTLY, which would forbid it — checked). This is the exact
    // applyPending the tests exercise against a real Postgres.
    const byVersion = new Map(pending.map((p) => [p.version, p.file]));
    const result = await applyPending(
      { query: (sql, params) => (params ? client.query(sql, params) : client.query(sql)) },
      pending,
      (version) => {
        process.stdout.write(`→ ${version}\n`);
        return readFileSync(join(MIGRATIONS_DIR, byVersion.get(version)), "utf8");
      },
    );

    if (result.failed) {
      fail(`${result.failed.version} failed and was rolled back: ${result.failed.error}\n` +
           `  ${result.applied.length} migration(s) applied before it remain committed.\n` +
           `  Fix the cause and re-run; the runner resumes from ${result.failed.version}.`);
    }
    process.stdout.write(`\n✓ Applied ${result.applied.length} migration(s).\n`);
  } finally {
    await client.end();
  }
}

// Only run when invoked directly, so the planner can be imported by tests.
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("migrate.mjs")) {
  main().catch((e) => fail(e.message));
}
