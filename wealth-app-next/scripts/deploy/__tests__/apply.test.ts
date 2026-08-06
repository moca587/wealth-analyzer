// The apply loop is what runs against the production database. This drives
// the REAL runner (planMigrations → applyPending, reading the actual
// migration files and the actual auth stub) against a real Postgres
// (PGlite), so a deploy-day failure mode — mis-order, half-apply, a
// non-resuming rollback — is caught here rather than in front of a client.

import { describe, it, expect, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { planMigrations, applyPending, MIGRATIONS_DIR } from "../migrate.mjs";

const DEPLOY = dirname(dirname(fileURLToPath(import.meta.url)));
const stub = () => readFileSync(join(DEPLOY, "supabase-stub.sql"), "utf8");
const readMigration = (version: string) => readFileSync(join(MIGRATIONS_DIR, `${version}.sql`), "utf8");

/**
 * A pg-shaped adapter over PGlite. applyPending calls query(sql) for whole
 * statements it sends unparameterised (a migration body can hold many
 * statements) and query(sql, params) for the parameterised ledger insert.
 * Real `pg` routes the first to the SIMPLE protocol (multi-statement ok)
 * and the second to the EXTENDED protocol (single statement); PGlite's
 * .exec() and .query() are the exact same split, so this mapping is
 * faithful rather than a workaround.
 */
function adapter(db: PGlite) {
  return {
    query: (sql: string, params?: unknown[]) => (params ? db.query(sql, params) : db.exec(sql)),
  };
}

async function freshDb() {
  const db = await new PGlite();
  await db.exec(stub());
  await db.exec(`create table if not exists public.schema_migrations (
    version text primary key, applied_at timestamptz not null default now())`);
  return db;
}

const allFiles = () => readdirSync(MIGRATIONS_DIR);
const ledger = async (db: PGlite) =>
  ((await db.query(`select version from public.schema_migrations order by version`)).rows as { version: string }[])
    .map((r) => r.version);

describe("the runner applies every migration end-to-end against real Postgres", () => {
  let db: PGlite;
  beforeAll(async () => {
    db = await freshDb();
    const { pending, error } = planMigrations(allFiles(), []);
    expect(error).toBeUndefined();
    const result = await applyPending(adapter(db), pending, readMigration);
    expect(result.failed, result.failed ? `${result.failed.version}: ${result.failed.error}` : "").toBeUndefined();
  }, 60_000);

  it("records all 13 in the ledger, in order", async () => {
    const v = await ledger(db);
    expect(v).toEqual([
      "001_init", "002_feeds", "003_orders", "004_audit",
      "005_fix_erasure_and_entitlement", "006_tenancy",
      "007_fix_entitlement_grants", "008_rekey_to_households",
      "009_household_management", "010_survive_a_departure",
      "011_invites", "012_seats_that_work", "013_billing",
    ]);
  });

  it("built the schema the app reads on first login", async () => {
    // The exact tables a 001-only database lacks, which made the app 500.
    for (const t of ["plans", "households", "organizations", "org_members", "org_invites", "stripe_events"]) {
      const r = await db.query(
        `select 1 from information_schema.tables where table_schema='public' and table_name=$1`, [t]);
      expect(r.rows.length, `missing table: ${t}`).toBe(1);
    }
  });

  it("is idempotent — a second run with a full ledger applies nothing", async () => {
    const { pending } = planMigrations(allFiles(), await ledger(db));
    expect(pending).toEqual([]);
    const result = await applyPending(adapter(db), pending, readMigration);
    expect(result.applied).toEqual([]);
  });

  it("resumes cleanly from a partial ledger", async () => {
    // Simulate a deploy that stopped after 006 (e.g. a dropped connection):
    // a fresh run must apply exactly 007-013 and nothing earlier.
    const partial = await freshDb();
    const first = planMigrations(allFiles(), []);
    await applyPending(adapter(partial), first.pending.slice(0, 6), readMigration);
    expect(await ledger(partial)).toHaveLength(6);

    const { pending } = planMigrations(allFiles(), await ledger(partial));
    expect(pending.map((p) => p.version)).toEqual([
      "007_fix_entitlement_grants", "008_rekey_to_households",
      "009_household_management", "010_survive_a_departure",
      "011_invites", "012_seats_that_work", "013_billing",
    ]);
    const result = await applyPending(adapter(partial), pending, readMigration);
    expect(result.failed).toBeUndefined();
    expect(await ledger(partial)).toHaveLength(13);
  }, 60_000);

  it("rolls back a failing migration and does NOT record it", async () => {
    // A syntactically broken migration must leave the ledger untouched and
    // stop the run, so the operator fixes and resumes rather than limping on
    // with a half-applied schema.
    const d2 = await freshDb();
    const good = planMigrations(allFiles(), []).pending.slice(0, 3);
    const withPoison = [...good, { version: "004_poison", file: "004_poison.sql" }];
    const files: Record<string, string> = { "004_poison": "this is not valid sql;" };
    const result = await applyPending(
      adapter(d2), withPoison,
      (v: string) => files[v] ?? readMigration(v),
    );
    expect(result.failed?.version).toBe("004_poison");
    expect(result.applied).toEqual(["001_init", "002_feeds", "003_orders"]);
    // The ledger holds exactly the three that committed — never the poison.
    expect(await ledger(d2)).toEqual(["001_init", "002_feeds", "003_orders"]);
  }, 60_000);
});
