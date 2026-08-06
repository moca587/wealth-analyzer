// The check that was missing. verify.mjs shipped asserting a trigger name
// that never existed (tg_ vs trg_), so the deploy gate would have failed
// every CORRECT deploy — and nothing caught it, because verify.mjs had no
// test. This runs its real checks against a correctly-migrated Postgres and
// asserts they all pass, then breaks the schema and asserts the right check
// fails. If a check's SQL drifts from the schema again, this goes red.

import { describe, it, expect, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { planMigrations, applyPending, MIGRATIONS_DIR } from "../migrate.mjs";
import { buildChecks, expectedVersions, runChecks } from "../verify.mjs";

const DEPLOY = dirname(dirname(fileURLToPath(import.meta.url)));
const stub = () => readFileSync(join(DEPLOY, "supabase-stub.sql"), "utf8");
const readMigration = (v: string) => readFileSync(join(MIGRATIONS_DIR, `${v}.sql`), "utf8");

// applyPending needs the exec/query split (migration bodies are multi-
// statement); verify's checks are single SELECTs, so query() is fine.
const applyAdapter = (db: PGlite) => ({
  query: (sql: string, params?: unknown[]) => (params ? db.query(sql, params) : db.exec(sql)),
});
const checkAdapter = (db: PGlite) => ({
  query: (sql: string) => db.query(sql),
});

async function migratedDb() {
  const db = await new PGlite();
  await db.exec(stub());
  await db.exec(`create table if not exists public.schema_migrations (
    version text primary key, applied_at timestamptz not null default now())`);
  const { pending } = planMigrations(readdirSync(MIGRATIONS_DIR), []);
  const r = await applyPending(applyAdapter(db), pending, readMigration);
  if (r.failed) throw new Error(`${r.failed.version}: ${r.failed.error}`);
  return db;
}

describe("verify.mjs against a correctly-migrated database", () => {
  let db: PGlite;
  beforeAll(async () => { db = await migratedDb(); }, 60_000);

  it("passes EVERY check — the assertions match the real schema", async () => {
    const lines: string[] = [];
    const failures = await runChecks(checkAdapter(db), buildChecks(expectedVersions()), (s: string) => { lines.push(s); });
    expect(failures, `failing checks:\n${lines.filter((l) => l.startsWith("✗")).join("\n")}`).toBe(0);
  });

  it("expectedVersions() matches the migrations on disk", () => {
    expect(expectedVersions()).toEqual(
      readdirSync(MIGRATIONS_DIR).filter((f) => /^\d{3}_.+\.sql$/.test(f)).map((f) => f.replace(/\.sql$/, "")).sort());
  });

  it("specifically confirms the signup trigger check finds trg_on_auth_user_created", async () => {
    // The exact assertion that was wrong. Pin it to the real trigger name.
    const check = buildChecks(expectedVersions()).find((c) => c.name.includes("signup trigger"))!;
    const rows = (await db.query(check.sql)).rows;
    expect(check.ok(rows), "the signup trigger check must pass on a good deploy").toBe(true);
  });
});

describe("verify.mjs catches a broken schema", () => {
  it("fails the completeness check when a migration is missing from the ledger", async () => {
    const db = await migratedDb();
    await db.exec(`delete from public.schema_migrations where version = '013_billing'`);
    const check = buildChecks(expectedVersions()).find((c) => c.name.includes("recorded"))!;
    const rows = (await db.query(check.sql)).rows;
    expect(check.ok(rows), "a missing migration must fail the gate").toBe(false);
    expect(check.detail(rows)).toMatch(/013_billing/);
  }, 60_000);

  it("fails the trigger check when the trigger is absent", async () => {
    const db = await migratedDb();
    await db.exec(`drop trigger trg_on_auth_user_created on auth.users`);
    const check = buildChecks(expectedVersions()).find((c) => c.name.includes("signup trigger"))!;
    const rows = (await db.query(check.sql)).rows;
    expect(check.ok(rows)).toBe(false);
  }, 60_000);

  it("fails the plans-table check on a 001-only (half-migrated) database", async () => {
    // The exact half-migrated state health/smoke must also catch.
    const db = await new PGlite();
    await db.exec(stub());
    await db.exec(`create table if not exists public.schema_migrations (
      version text primary key, applied_at timestamptz not null default now())`);
    const { pending } = planMigrations(readdirSync(MIGRATIONS_DIR), []);
    await applyPending(applyAdapter(db), pending.slice(0, 1), readMigration); // 001 only
    const check = buildChecks(expectedVersions()).find((c) => c.name.includes("plans table"))!;
    const rows = (await db.query(check.sql)).rows;
    expect(check.ok(rows), "a 001-only database must fail the plans check").toBe(false);
  }, 60_000);
});
