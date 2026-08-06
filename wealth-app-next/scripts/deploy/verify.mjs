// ─────────────────────────────────────────────────────────────────
// Assert the schema is what the app requires — after a migration run, or
// against a live database you want to check. Exits non-zero on any
// failure so it can gate a deploy.
//
//   node scripts/deploy/verify.mjs
//
// Each check exists because its absence produces a specific, silent
// failure in the running app — see the message on each. The checks are
// pinned by scripts/deploy/__tests__/verify.test.ts, which runs them
// against a correctly-migrated real Postgres and asserts they ALL pass —
// the test that would have caught the trigger-name typo this file once had.
// ─────────────────────────────────────────────────────────────────

import { readdirSync } from "node:fs";
import { MIGRATIONS_DIR, sslFor } from "./migrate.mjs";

/** Versions expected in the ledger — derived from the files on disk, so a
 *  new migration cannot silently fall outside the gate (a hardcoded count
 *  green-lit a deploy missing the newest one). */
export function expectedVersions() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{3}_.+\.sql$/.test(f))
    .map((f) => f.replace(/\.sql$/, ""))
    .sort();
}

/** The checks, as a function of the on-disk expectation so the completeness
 *  check compares against reality rather than a magic number. Exported for
 *  the test. */
export function buildChecks(expected) {
  return [
    {
      name: `every migration on disk is recorded (${expected.length})`,
      // Applying only some (the runbook once said "apply 001 and stop")
      // produces an app that 500s on first login. Comparing to the on-disk
      // set — not a count — also catches a missing NEWEST migration.
      sql: `select coalesce(array_agg(version), '{}') applied from public.schema_migrations`,
      ok: (r) => expected.every((v) => r[0].applied.includes(v)),
      detail: (r) => `missing from the ledger: ${expected.filter((v) => !r[0].applied.includes(v)).join(", ")}`,
    },
    {
      name: "the signup trigger is installed on auth.users",
      // If it silently failed to install (it needs the postgres role), every
      // signup lands with no organisation and the app answers "choose a
      // client" with an empty list. NOTE the name: the FUNCTION is
      // tg_on_auth_user_created, the TRIGGER is trg_on_auth_user_created.
      sql: `select count(*)::int n from pg_trigger
             where tgrelid = 'auth.users'::regclass and tgname = 'trg_on_auth_user_created'`,
      ok: (r) => r[0].n === 1,
      detail: () => "trigger trg_on_auth_user_created missing — signups will not provision an org",
    },
    {
      name: "every public table has RLS enabled",
      // One table without RLS is one table where a bug in a query, or a
      // missing WHERE, leaks another firm's data.
      sql: `select coalesce(string_agg(relname, ', '), '') off
              from pg_class c join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`,
      ok: (r) => r[0].off === "",
      detail: (r) => `RLS OFF on: ${r[0].off}`,
    },
    {
      name: "clients cannot write is_paid",
      // Only the Stripe webhook (service role) writes it. A client-writable
      // is_paid is no entitlement at all.
      sql: `select count(*)::int n from information_schema.column_privileges
             where table_name = 'organizations' and grantee = 'authenticated'
               and privilege_type = 'UPDATE' and column_name = 'is_paid'`,
      ok: (r) => r[0].n === 0,
      detail: () => "authenticated can UPDATE organizations.is_paid — entitlement is bypassable",
    },
    {
      name: "the plans table exists",
      // /api/plan and household resolution read it; a 001-only database lacks
      // it and 500s on the first authenticated page. pg_catalog, not
      // information_schema, so a restricted role cannot make it falsely pass.
      sql: `select (to_regclass('public.plans') is not null) present`,
      ok: (r) => r[0].present === true,
      detail: () => "public.plans missing — /api/plan will 500",
    },
    {
      name: "no user_id column still cascades from auth.users",
      // 010's guarantee: deleting a departing advisor must not take the
      // firm's orders, feeds and audit trail with them.
      sql: `select coalesce(string_agg(distinct tc.table_name, ', '), '') bad
              from information_schema.table_constraints tc
              join information_schema.key_column_usage k on k.constraint_name = tc.constraint_name
              join information_schema.referential_constraints rc on rc.constraint_name = tc.constraint_name
             where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'
               and k.column_name = 'user_id' and rc.delete_rule = 'CASCADE'
               and tc.table_name not in ('org_members', 'household_advisors')`,
      ok: (r) => r[0].bad === "",
      detail: (r) => `these still cascade a departing user's records away: ${r[0].bad}`,
    },
    {
      name: "the entitlement writer is not client-callable",
      sql: `select count(*)::int n from information_schema.routine_privileges
             where routine_name = 'apply_stripe_event' and grantee in ('authenticated', 'anon')`,
      ok: (r) => r[0].n === 0,
      detail: () => "apply_stripe_event is client-callable — a user could grant themselves the product",
    },
  ];
}

/** Run the checks against a { query } adapter; returns the failure count.
 *  Exported so the test drives the exact same assertions the CLI runs.
 *  @param {(line: string) => void} [out] */
export async function runChecks(db, checks, out = (_line) => {}) {
  let failures = 0;
  for (const c of checks) {
    let rows;
    try { rows = (await db.query(c.sql)).rows; }
    catch (e) { out(`✗ ${c.name}\n    query error: ${e.message}`); failures++; continue; }
    if (c.ok(rows)) out(`✓ ${c.name}`);
    else { out(`✗ ${c.name}\n    ${c.detail(rows)}`); failures++; }
  }
  return failures;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { process.stderr.write("✗ DATABASE_URL is not set.\n"); process.exit(1); }

  let pg;
  try { pg = await import("pg"); }
  catch { process.stderr.write("✗ 'pg' not installed — run npm install.\n"); process.exit(1); }

  const client = new pg.default.Client({ connectionString: url, ssl: sslFor(url) });
  await client.connect();

  let failures;
  try {
    failures = await runChecks(client, buildChecks(expectedVersions()), (s) => process.stdout.write(s + "\n"));
  } finally {
    await client.end();
  }

  process.stdout.write(failures ? `\n✗ ${failures} check(s) failed.\n` : "\n✓ Schema verified.\n");
  process.exit(failures ? 1 : 0);
}

if (process.argv[1]?.endsWith("verify.mjs")) {
  main().catch((e) => { process.stderr.write(`✗ ${e.message}\n`); process.exit(1); });
}
