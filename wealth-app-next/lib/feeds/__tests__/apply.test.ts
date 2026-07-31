// ─────────────────────────────────────────────────────────────────
// Apply-to-plan. The properties here are the safety contract: a feed
// may add and update, but it must never delete, never blank a field it
// didn't send, never duplicate on a re-run, and never leave the plan in
// a state the schema rejects.
// ─────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { diffPlan, applyChanges, summarize, type PlanChange } from "../apply";
import { emptyEnvelope, type FeedEnvelope } from "../model";
import { emptyPlan } from "@/lib/plan/default-plan";
import { parsePlan } from "@/lib/plan/schema";
import type { WealthPlan } from "@/lib/engine/types";

const allKeys = (changes: PlanChange[]) => new Set(changes.map((c) => c.key));

function feed(patch: Partial<FeedEnvelope>): FeedEnvelope {
  return { ...emptyEnvelope(), ...patch };
}

function planWith(patch: Partial<WealthPlan>): WealthPlan {
  return { ...emptyPlan(), ...patch };
}

describe("diffPlan — classification", () => {
  it("reports new records as creates", () => {
    const changes = diffPlan(emptyPlan(), feed({
      assets: [{ label: "Custody 8842", value: 350000, ccy: "CHF", _src: "x" }],
      holdings: [{ name: "iShares Core SPI", tkr: "CHSPI", val: 90000, cls: "equity" }],
      liabilities: [{ label: "Mortgage", balance: 800000, ratePct: 1.9, years: 20 }],
    }));
    expect(summarize(changes)).toMatchObject({ create: 3, update: 0, unchanged: 0 });
    expect(changes.find((c) => c.label.includes("Custody"))?.after).toContain("350,000");
  });

  it("matches an existing account by label + country and reports the delta", () => {
    const plan = planWith({
      assets: [{ id: "a1", type: "depot", label: "Custody 8842", value: 300000, liquid: true, country: "CH" }],
      clients: [{ ...emptyPlan().clients[0], country: "CH" }],
    });
    const changes = diffPlan(plan, feed({ assets: [{ label: "Custody 8842", value: 350000, country: "CH" }] }));
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ kind: "update", targetId: "a1" });
    expect(changes[0].before).toContain("300,000");
    expect(changes[0].after).toContain("350,000");
  });

  it("reports an identical re-run as unchanged, not as a duplicate", () => {
    const plan = planWith({
      assets: [{ id: "a1", type: "depot", label: "Custody 8842", value: 350000, liquid: true, country: "CH" }],
      clients: [{ ...emptyPlan().clients[0], country: "CH" }],
    });
    const changes = diffPlan(plan, feed({ assets: [{ label: "Custody 8842", value: 350000, country: "CH" }] }));
    expect(changes[0].kind).toBe("unchanged");
  });
});

describe("applyChanges — the safety contract", () => {
  it("is idempotent: applying the same feed twice creates nothing the second time", () => {
    const envelope = feed({
      assets: [{ label: "Custody 8842", value: 350000, country: "CH" }],
      holdings: [{ name: "VWRL", tkr: "VWRL", val: 105000, cls: "equity" }],
      liabilities: [{ label: "Mortgage", balance: 800000, ratePct: 1.9, years: 20 }],
    });
    const first = diffPlan(emptyPlan(), envelope);
    const afterFirst = applyChanges(emptyPlan(), first, allKeys(first));
    expect(afterFirst.assets).toHaveLength(2);
    expect(afterFirst.loans).toHaveLength(1);

    const second = diffPlan(afterFirst, envelope);
    expect(second.every((c) => c.kind === "unchanged")).toBe(true);
    const afterSecond = applyChanges(afterFirst, second, allKeys(second));
    expect(afterSecond.assets).toHaveLength(2);   // no duplicates
    expect(afterSecond.loans).toHaveLength(1);
  });

  it("never mutates the plan it was given (so it can serve as the undo snapshot)", () => {
    const plan = planWith({
      assets: [{ id: "a1", type: "depot", label: "Depot", value: 100, liquid: true }],
    });
    const snapshot = JSON.stringify(plan);
    const changes = diffPlan(plan, feed({ assets: [{ label: "Depot", value: 999 }] }));
    applyChanges(plan, changes, allKeys(changes));
    expect(JSON.stringify(plan)).toBe(snapshot);
  });

  it("never deletes existing records the feed didn't mention", () => {
    const plan = planWith({
      assets: [{ id: "keep", type: "x", label: "Hand-entered account", value: 42, liquid: true }],
      loans: [{ id: "kl", type: "auto", label: "Car loan", bal: 1000, rate: 3, yrs: 4 }],
      goals: [{ id: "kg", name: "Sabbatical", amt: 10000, startYear: 2030, endYear: 2030 }],
    });
    const changes = diffPlan(plan, feed({ assets: [{ label: "New account", value: 5 }] }));
    const next = applyChanges(plan, changes, allKeys(changes));
    expect(next.assets.find((a) => a.id === "keep")).toBeTruthy();
    expect(next.loans).toHaveLength(1);
    expect(next.goals).toHaveLength(1);
  });

  it("does not blank fields the feed omitted", () => {
    const plan = planWith({
      loans: [{ id: "l1", type: "mortgage", label: "Mortgage", bal: 800000, rate: 1.9, yrs: 20 }],
    });
    // Feed sends only a new balance — rate and term must survive.
    const changes = diffPlan(plan, feed({ liabilities: [{ label: "Mortgage", balance: 750000 }] }));
    const next = applyChanges(plan, changes, allKeys(changes));
    expect(next.loans[0]).toMatchObject({ bal: 750000, rate: 1.9, yrs: 20 });
  });

  it("applies only the selected changes", () => {
    const changes = diffPlan(emptyPlan(), feed({
      assets: [{ label: "A", value: 1 }, { label: "B", value: 2 }],
    }));
    const onlyFirst = new Set([changes[0].key]);
    const next = applyChanges(emptyPlan(), changes, onlyFirst);
    expect(next.assets.map((a) => a.label)).toEqual(["A"]);
  });

  it("attaches income to a client that exists in the TARGET plan", () => {
    // The diff may be computed against one copy of the plan and applied to
    // another (a reload between preview and Apply). An income carrying a
    // stale client id would fail schema validation, so the owner is
    // re-resolved by index at apply time.
    const diffedAgainst = emptyPlan();
    const appliedTo = emptyPlan();                       // different client ids
    expect(diffedAgainst.clients[0].id).not.toBe(appliedTo.clients[0].id);

    const changes = diffPlan(diffedAgainst, feed({ income: [{ who: "client1", primary: 185000 }] }));
    const next = applyChanges(appliedTo, changes, allKeys(changes));

    const added = next.incomes.find((i) => i.amount === 185000)!;
    expect(added.clientId).toBe(appliedTo.clients[0].id);
    expect(parsePlan(next).ok).toBe(true);
  });

  it("skips 'unchanged' rows even when they are selected", () => {
    const plan = planWith({ assets: [{ id: "a1", type: "x", label: "A", value: 100, liquid: true }] });
    const changes = diffPlan(plan, feed({ assets: [{ label: "A", value: 100 }] }));
    const next = applyChanges(plan, changes, allKeys(changes));
    expect(next.assets).toHaveLength(1);
    expect(next.assets[0].value).toBe(100);
  });
});

describe("field mapping", () => {
  it("marks pension-type accounts as illiquid and cash accounts as cash", () => {
    const changes = diffPlan(emptyPlan(), feed({
      assets: [
        { label: "Pensionskasse", accountTypeHint: "BVG/LPP pension", value: 480000 },
        { label: "Sparkonto", accountTypeHint: "Savings account", value: 90000 },
      ],
    }));
    const next = applyChanges(emptyPlan(), changes, allKeys(changes));
    const pension = next.assets.find((a) => a.label === "Pensionskasse")!;
    const savings = next.assets.find((a) => a.label === "Sparkonto")!;
    expect(pension.liquid).toBe(false);
    expect(savings.liquid).toBe(true);
    expect(savings.cls).toBe("cash");
  });

  it("maps feed-only asset classes onto the plan's enum", () => {
    const changes = diffPlan(emptyPlan(), feed({
      holdings: [{ name: "PE Fund", val: 100, cls: "private_equity" }, { name: "Bond Fund", val: 50, cls: "fixed_income" }],
    }));
    const next = applyChanges(emptyPlan(), changes, allKeys(changes));
    expect(next.assets.find((a) => a.label === "PE Fund")?.cls).toBe("alternative");
    expect(next.assets.find((a) => a.label === "Bond Fund")?.cls).toBe("fixed_income");
  });

  it("converts an annual expense to the plan's monthly field", () => {
    const plan = emptyPlan();   // one shared plan: emptyPlan() mints fresh ids each call
    const changes = diffPlan(plan, feed({
      expenses: [{ name: "Feed living costs", amount: 120000, period: "annual" } as never],
    }));
    const next = applyChanges(plan, changes, allKeys(changes));
    expect(next.expenses.find((e) => e.name === "Feed living costs")?.amount).toBe(10000);
  });

  it("treats an amount with no period as monthly, matching the plan's field", () => {
    const plan = emptyPlan();
    const changes = diffPlan(plan, feed({ expenses: [{ name: "Feed rent", amount: 2500 } as never] }));
    const next = applyChanges(plan, changes, allKeys(changes));
    expect(next.expenses.find((e) => e.name === "Feed rent")?.amount).toBe(2500);
  });

  it("gives a new loan numeric rate/term rather than undefined", () => {
    const changes = diffPlan(emptyPlan(), feed({ liabilities: [{ label: "Lombard", balance: 120000 }] }));
    const next = applyChanges(emptyPlan(), changes, allKeys(changes));
    expect(next.loans[0].rate).toBe(0);
    expect(next.loans[0].yrs).toBe(0);
    expect(Number.isFinite(next.loans[0].bal)).toBe(true);
  });

  it("fills client 2 from a CRM spouse record without touching client 1", () => {
    const plan = emptyPlan();
    const changes = diffPlan(plan, feed({
      household: [
        { role: "client1", first: "Béatrice", last: "Keller", country: "CH", riskTolerance: "moderate" },
        { role: "client2", first: "Thomas", last: "Keller", country: "CH" },
      ],
    }));
    const next = applyChanges(plan, changes, allKeys(changes));
    expect(next.clients[0]).toMatchObject({ first: "Béatrice", country: "CH", risk: "moderate" });
    expect(next.clients[1]).toMatchObject({ first: "Thomas", last: "Keller" });
    expect(next.clients[1].id).toBeTruthy();
  });

  it("ignores records with a missing or non-numeric value instead of writing NaN", () => {
    const changes = diffPlan(emptyPlan(), feed({
      assets: [{ label: "Bad", value: NaN as number }, { label: "Missing" } as never],
      holdings: [{ name: "NoVal" } as never],
      liabilities: [{ label: "NoBal" } as never],
    }));
    expect(changes).toHaveLength(0);
  });
});

describe("the merged plan stays schema-valid", () => {
  it("passes parsePlan after a full multi-section apply", () => {
    const envelope = feed({
      household: [
        { role: "client1", first: "Béatrice", last: "Keller", dob: "1978-04-12", country: "CH", city: "Zürich", riskTolerance: "moderate", timeHorizon: "15_plus" },
        { role: "child", first: "Elena", last: "Keller", dob: "2015-05-20" },
      ],
      income: [{ who: "client1", primary: 185000 }],
      expenses: [{ name: "Living", amount: 6500 } as never],
      assets: [{ label: "Custody 8842", accountTypeHint: "Securities account", value: 350000, country: "CH" }],
      holdings: [{ name: "iShares Core SPI", tkr: "CHSPI", val: 90000, cls: "equity" }],
      liabilities: [{ label: "Festhypothek", balance: 800000, ratePct: 1.9, years: 20, type: "mortgage" }],
      goals: [{ name: "University", amt: 30000, startYear: 2033, endYear: 2036 } as never],
      retirement: [{ retirementAge: 65, annualSpending: 110000, planToAge: 92 } as never],
    });
    const plan = emptyPlan();
    const changes = diffPlan(plan, envelope);
    const next = applyChanges(plan, changes, allKeys(changes));

    const parsed = parsePlan(next);
    expect(parsed.ok, parsed.ok ? "" : JSON.stringify((parsed as { fieldErrors: unknown }).fieldErrors)).toBe(true);
    expect(next.assets).toHaveLength(2);
    expect(next.children).toHaveLength(1);
    expect(next.retirement).toMatchObject({ retirementAge: 65, annualSpending: 110000 });
  });

  it("stays valid when the feed carries only partial data", () => {
    const changes = diffPlan(emptyPlan(), feed({ assets: [{ label: "Solo", value: 1 }] }));
    const next = applyChanges(emptyPlan(), changes, allKeys(changes));
    expect(parsePlan(next).ok).toBe(true);
  });
});
