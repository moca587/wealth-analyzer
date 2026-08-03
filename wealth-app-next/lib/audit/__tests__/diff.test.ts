// The audit summary is what a compliance reviewer reads. If it is wrong or
// incomplete, the trail is worse than useless — it is misleading.

import { describe, it, expect } from "vitest";
import { diffPlans, planNetWorth, planHash, auditMoney } from "../diff";
import { AUDIT_MAX_CHANGES } from "../types";
import { emptyPlan } from "@/lib/plan/default-plan";
import type { WealthPlan } from "@/lib/engine/types";

// emptyPlan() mints fresh ids on every call, so the fixture is built ONCE and
// cloned. That is not a test convenience — the diff matches rows by id, so
// unstable ids would make every save look like a wholesale replacement. The
// test below pins that requirement explicitly.
const BASE: WealthPlan = {
  ...emptyPlan(),
  currency: "CHF",
  assets: [
    { id: "a1", type: "depot", label: "Depot UBS", value: 1_000_000, liquid: true },
    { id: "a2", type: "bvg", label: "Pensionskasse", value: 480_000, liquid: false },
  ],
  loans: [{ id: "l1", type: "mortgage", label: "Hypothek", bal: 840_000, rate: 1.9, yrs: 20 }],
};
const base = (): WealthPlan => JSON.parse(JSON.stringify(BASE)) as WealthPlan;

describe("net worth, as the audit reports it", () => {
  it("is assets minus loan balances", () => {
    expect(planNetWorth(base())).toBe(640_000);
  });
  it("ignores non-finite values rather than producing NaN", () => {
    const p = base();
    p.assets.push({ id: "x", type: "t", label: "Bad", value: NaN as number, liquid: true });
    expect(planNetWorth(p)).toBe(640_000);
  });
  it("handles an absent plan", () => {
    expect(planNetWorth(null)).toBe(0);
  });
});

describe("row identity", () => {
  it("matches rows by id — a plan whose ids all changed reads as a full replacement", () => {
    // Documents why the writer must persist stable ids. If a client
    // regenerated them on every save, the trail would claim every row was
    // removed and re-added, and the net-worth line would be the only signal.
    const after = base();
    after.assets = after.assets.map((a, i) => ({ ...a, id: `regen-${i}` }));
    const d = diffPlans(base(), after);
    expect(d.changes.filter((c) => c.action === "added")).toHaveLength(2);
    expect(d.changes.filter((c) => c.action === "removed")).toHaveLength(2);
    expect(d.netWorthBefore).toBe(d.netWorthAfter);   // nothing actually moved
  });
});

describe("plan fingerprint", () => {
  it("is stable across key order — a re-serialized plan is the same plan", () => {
    expect(planHash({ b: 1, a: 2 })).toBe(planHash({ a: 2, b: 1 }));
    expect(planHash(base())).toBe(planHash(JSON.parse(JSON.stringify(base()))));
  });
  it("changes when any value changes", () => {
    const p = base();
    const h = planHash(p);
    p.assets[0].value = 1_000_000.01;
    expect(planHash(p)).not.toBe(h);
  });
});

describe("diffPlans", () => {
  it("reports nothing when nothing moved", () => {
    const d = diffPlans(base(), base());
    expect(d.unchanged).toBe(true);
    expect(d.changes).toEqual([]);
    expect(d.summary).toMatch(/no material change/i);
  });

  it("names the row that changed, with both values and the net-worth move", () => {
    const after = base();
    after.assets[0].value = 1_250_000;
    const d = diffPlans(base(), after);
    expect(d.changes).toEqual([{
      section: "assets", action: "changed", label: "Depot UBS",
      before: "CHF 1,000,000.00", after: "CHF 1,250,000.00",
    }]);
    expect(d.netWorthBefore).toBe(640_000);
    expect(d.netWorthAfter).toBe(890_000);
    expect(d.summary).toContain("net worth CHF 640,000.00 → CHF 890,000.00");
  });

  it("records additions and removals distinctly", () => {
    const after = base();
    after.assets.push({ id: "a3", type: "cash", label: "Privatkonto", value: 50_000, liquid: true });
    after.assets = after.assets.filter((a) => a.id !== "a2");
    const d = diffPlans(base(), after);
    const kinds = d.changes.map((c) => `${c.action}:${c.label}`).sort();
    expect(kinds).toEqual(["added:Privatkonto", "removed:Pensionskasse"]);
    expect(d.changes.find((c) => c.action === "added")?.after).toBe("CHF 50,000.00");
    expect(d.changes.find((c) => c.action === "removed")?.before).toBe("CHF 480,000.00");
  });

  it("catches a non-money edit — a renamed account still changed the plan", () => {
    const after = base();
    after.assets[0].label = "Depot Julius Bär";
    const d = diffPlans(base(), after);
    expect(d.unchanged).toBe(false);
    expect(d.changes[0].label).toMatch(/label/);
    expect(d.changes[0].before).toBe("Depot UBS");
    expect(d.changes[0].after).toBe("Depot Julius Bär");
  });

  it("catches a changed loan rate, which moves no balance at all", () => {
    const after = base();
    after.loans[0].rate = 2.4;
    const d = diffPlans(base(), after);
    expect(d.unchanged).toBe(false);
    expect(d.changes[0].section).toBe("loans");
    expect(d.changes[0].after).toBe("2.4");
    // net worth is untouched — which is exactly why the rate needs its own line
    expect(d.netWorthBefore).toBe(d.netWorthAfter);
  });

  it("reports the retirement block as one line, not a field storm", () => {
    const after = base();
    after.retirement = { enabled: true, retirementAge: 64, annualSpending: 180_000, planToAge: 95 };
    const d = diffPlans(base(), after);
    const r = d.changes.find((c) => c.section === "retirement");
    expect(r?.before).toBe("not set");
    expect(r?.after).toMatch(/age 64.*180,000\.00\/yr to 95/);
  });

  it("treats a first save (no prior plan) as all-additions with no prior net worth", () => {
    const d = diffPlans(null, base());
    expect(d.changes.every((c) => c.action === "added")).toBe(true);
    expect(d.netWorthBefore).toBe(0);
    expect(d.netWorthAfter).toBe(640_000);
  });

  it("ignores sub-cent float drift, so a re-save is not logged as a change", () => {
    const after = base();
    after.assets[0].value = 1_000_000 + 1e-9;
    expect(diffPlans(base(), after).unchanged).toBe(true);
  });

  it("caps the change list and says how many it dropped", () => {
    const before = base();
    const after = base();
    for (let i = 0; i < AUDIT_MAX_CHANGES + 15; i++) {
      after.assets.push({ id: `n${i}`, type: "t", label: `Account ${i}`, value: 1000, liquid: true });
    }
    const d = diffPlans(before, after);
    expect(d.changes).toHaveLength(AUDIT_MAX_CHANGES);
    expect(d.truncated).toBe(15);
    expect(d.summary).toContain("+15 more");
  });

  it("keeps the summary inside the column budget", () => {
    const after = base();
    after.assets[0].label = "x".repeat(400);
    const d = diffPlans(base(), after);
    expect(d.summary.length).toBeLessThanOrEqual(300);
    expect(d.changes[0].label.length).toBeLessThanOrEqual(120);
  });

  it("formats money exactly, never abbreviated", () => {
    // A reviewer must be able to tell 2,354,999 from 2.35M.
    expect(auditMoney(2_354_999, "CHF")).toBe("CHF 2,354,999.00");
    expect(auditMoney(null)).toBe("—");
    expect(auditMoney(NaN, "CHF")).toBe("—");
  });
});
