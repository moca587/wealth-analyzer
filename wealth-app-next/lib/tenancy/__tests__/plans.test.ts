// ─────────────────────────────────────────────────────────────────
// Saving a plan as a version.
//
// The behaviour under test is a bug fix: the old route SELECTed the
// current plan, UPSERTed the new one and diffed the two, so two tabs
// silently lost one save AND wrote an audit entry describing a change
// that never happened. Every case here is one of the ways that can
// happen, and asserts it now surfaces as a conflict.
// ─────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { savePlanVersion, currentPlan, PG_UNIQUE_VIOLATION } from "../plans";
import { emptyPlan } from "@/lib/plan/default-plan";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { WealthPlan } from "@/lib/engine/types";

const HH = "11111111-1111-4111-8111-111111111111";
const ORG = "99999999-9999-4999-8999-999999999999";
const USER = "44444444-4444-4444-8444-444444444444";

interface Row { version: number; plan: unknown; created_at: string; created_by: string }

/**
 * A `plans` table with the real unique (household_id, version) constraint,
 * because that constraint IS the guarantee — a stub without it would let
 * every test pass while the production behaviour stayed broken.
 */
function fakeDb(seed: Row[] = []) {
  const store = [...seed];
  const inserts: Record<string, unknown>[] = [];
  /** Simulates another tab writing between our read and our insert. */
  let raceOnce: Row | null = null;

  const client = {
    from() {
      const chain = {
        select: () => chain,
        eq: () => chain,
        order: () => chain,
        limit: () => chain,
        maybeSingle: async () => {
          const latest = [...store].sort((a, b) => b.version - a.version)[0];
          return { data: latest ?? null, error: null };
        },
        insert: async (row: Record<string, unknown>) => {
          if (raceOnce) { store.push(raceOnce); raceOnce = null; }
          const v = Number(row.version);
          if (store.some((r) => r.version === v)) {
            return { error: { code: PG_UNIQUE_VIOLATION, message: "duplicate key value" } };
          }
          inserts.push(row);
          store.push({ version: v, plan: row.plan, created_at: "2026-08-03T00:00:00Z", created_by: USER });
          return { error: null };
        },
      };
      return chain;
    },
  } as unknown as SupabaseClient;

  return {
    client, inserts, store,
    raceNext(row: Row) { raceOnce = row; },
  };
}

const plan = (): WealthPlan => emptyPlan();
const row = (version: number): Row => ({
  version, plan: plan(), created_at: "2026-08-01T00:00:00Z", created_by: USER,
});

const save = (db: ReturnType<typeof fakeDb>, baseVersion?: number | null) =>
  savePlanVersion(db.client, { householdId: HH, orgId: ORG, userId: USER, plan: plan(), baseVersion });

describe("savePlanVersion", () => {
  it("writes version 1 for a household with no plan", async () => {
    const db = fakeDb();
    const r = await save(db);
    expect(r).toEqual({ ok: true, version: 1 });
    expect(db.inserts[0]).toMatchObject({ household_id: HH, org_id: ORG, version: 1, created_by: USER });
  });

  it("appends rather than overwriting", async () => {
    const db = fakeDb([row(1), row(2)]);
    const r = await save(db, 2);
    expect(r).toEqual({ ok: true, version: 3 });
    expect(db.store.map((s) => s.version).sort()).toEqual([1, 2, 3]);
  });

  it("REFUSES a save based on a version that is no longer current", async () => {
    // Two tabs open at version 2; one saves, the other tries. This is the
    // exact case the old upsert lost.
    const db = fakeDb([row(1), row(2), row(3)]);
    const r = await save(db, 2);
    expect(r).toEqual({ ok: false, conflict: true, currentVersion: 3 });
    expect(db.inserts, "nothing may be written on a conflict").toEqual([]);
  });

  it("still catches the race that opens AFTER the check", async () => {
    // The version check is not atomic; the unique index is. A save that
    // passes the check and then collides must come back as a conflict, not
    // as a 500 the UI reports as "save failed — try again" (which would
    // invite exactly the retry that clobbers the other tab).
    const db = fakeDb([row(1)]);
    db.raceNext(row(2));
    const r = await save(db, 1);
    expect(r).toEqual({ ok: false, conflict: true, currentVersion: 2 });
  });

  it("accepts a save with no base version — last write wins, explicitly", async () => {
    // An older client, or a first save. Not silently: the insert still races
    // on the unique index, so a genuine collision is still caught.
    const db = fakeDb([row(1)]);
    expect(await save(db, null)).toEqual({ ok: true, version: 2 });
  });

  it("reports a non-conflict database error as itself", async () => {
    const chain: Record<string, unknown> = {
      maybeSingle: async () => ({ data: null, error: null }),
      insert: async () => ({ error: { code: "42501", message: "permission denied for table plans" } }),
    };
    for (const m of ["select", "eq", "order", "limit"]) chain[m] = () => chain;
    const broken = { from: () => chain } as unknown as SupabaseClient;
    const r = await savePlanVersion(broken, { householdId: HH, orgId: ORG, userId: USER, plan: plan() });
    expect(r).toEqual({ ok: false, conflict: false, error: "permission denied for table plans" });
  });
});

describe("currentPlan", () => {
  it("reports 'none' rather than inventing an empty plan", async () => {
    expect(await currentPlan(fakeDb().client, HH)).toEqual({ state: "none" });
  });

  it("returns the highest version", async () => {
    const db = fakeDb([row(1), row(2)]);
    const cur = await currentPlan(db.client, HH);
    expect(cur.state).toBe("ok");
    if (cur.state !== "ok") return;
    expect(cur.version.version).toBe(2);
  });

  it("flags stored JSONB that no longer validates instead of handing it on", async () => {
    // A hand-edited row or an older schema. Passing it through would put
    // NaN amounts into the engine; throwing would take the page down with
    // no way back. It is a third state on purpose.
    const db = fakeDb([{ version: 4, plan: { clients: "not an array" }, created_at: "x", created_by: USER }]);
    const cur = await currentPlan(db.client, HH);
    expect(cur.state).toBe("invalid");
    if (cur.state !== "invalid") return;
    expect(cur.version, "the version is still reported, so the UI can say which").toBe(4);
  });

  it("counts an invalid current version when numbering the next save", async () => {
    // Otherwise the next save would try to reuse that version number and
    // collide forever, leaving the client unable to save at all.
    const db = fakeDb([{ version: 4, plan: { clients: 1 }, created_at: "x", created_by: USER }]);
    expect(await save(db, null)).toEqual({ ok: true, version: 5 });
  });
});
