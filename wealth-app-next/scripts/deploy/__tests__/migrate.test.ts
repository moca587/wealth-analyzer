// The runner's brain is planMigrations(): it decides what to apply and
// refuses an inconsistent ledger. That logic is what stands between a
// clean deploy and a half-applied database, so it is tested without a
// Postgres — the pure function is the thing worth pinning.

import { describe, it, expect } from "vitest";
import { planMigrations, MIGRATIONS_DIR } from "../migrate.mjs";
import { readdirSync } from "node:fs";

const ALL = [
  "001_init.sql", "002_feeds.sql", "003_orders.sql", "004_audit.sql",
  "005_fix_erasure_and_entitlement.sql", "006_tenancy.sql",
  "007_fix_entitlement_grants.sql", "008_rekey_to_households.sql",
  "009_household_management.sql", "010_survive_a_departure.sql",
  "011_invites.sql", "012_seats_that_work.sql", "013_billing.sql", "014_proposals.sql",
];

describe("planMigrations", () => {
  it("applies everything, in order, against an empty ledger", () => {
    const { pending, error } = planMigrations(ALL, []);
    expect(error).toBeUndefined();
    expect(pending.map((p) => p.version)).toEqual([
      "001_init", "002_feeds", "003_orders", "004_audit",
      "005_fix_erasure_and_entitlement", "006_tenancy",
      "007_fix_entitlement_grants", "008_rekey_to_households",
      "009_household_management", "010_survive_a_departure",
      "011_invites", "012_seats_that_work", "013_billing", "014_proposals",
    ]);
  });

  it("sorts a shuffled directory listing into numeric order", () => {
    const shuffled = [...ALL].reverse();
    const { pending } = planMigrations(shuffled, []);
    expect(pending[0].version).toBe("001_init");
    expect(pending.at(-1)!.version).toBe("014_proposals");
  });

  it("skips what the ledger already records, resuming from the gap", () => {
    const applied = ["001_init", "002_feeds", "003_orders", "004_audit",
      "005_fix_erasure_and_entitlement", "006_tenancy"];
    const { pending } = planMigrations(ALL, applied);
    expect(pending.map((p) => p.version)).toEqual([
      "007_fix_entitlement_grants", "008_rekey_to_households",
      "009_household_management", "010_survive_a_departure",
      "011_invites", "012_seats_that_work", "013_billing", "014_proposals",
    ]);
  });

  it("returns nothing to do when the ledger is complete", () => {
    const { pending } = planMigrations(ALL, ALL.map((f) => f.replace(/\.sql$/, "")));
    expect(pending).toEqual([]);
  });

  it("REFUSES an inconsistent ledger — a later migration applied over a pending gap", () => {
    // 013 recorded but 007 missing: someone applied out of order, or the
    // ledger was hand-edited. Re-running would apply 007-012 ON TOP of a
    // schema that already has 013's objects. Refuse.
    const applied = ["001_init", "002_feeds", "003_orders", "004_audit",
      "005_fix_erasure_and_entitlement", "006_tenancy", "013_billing"];
    const { error, pending } = planMigrations(ALL, applied);
    expect(error).toMatch(/inconsistent/i);
    expect(pending).toEqual([]);
  });

  it("ignores non-migration files in the directory", () => {
    const withNoise = [...ALL, "README.md", ".DS_Store", "rollback.sql", "999-notes.txt"];
    const { pending } = planMigrations(withNoise, []);
    expect(pending).toHaveLength(ALL.length);
  });

  it("matches the migrations ACTUALLY on disk — no file drifted out of the plan", () => {
    // Guards against a new migration being added without the deploy tooling
    // (and this test's ALL list) knowing about it.
    const onDisk = readdirSync(MIGRATIONS_DIR).filter((f) => /^\d{3}_.+\.sql$/.test(f)).sort();
    expect(onDisk).toEqual(ALL);
  });
});
