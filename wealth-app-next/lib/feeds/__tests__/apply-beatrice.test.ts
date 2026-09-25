// ─────────────────────────────────────────────────────────────────
// Apply-to-plan against a REAL client profile.
//
// The base plan below is the Keller household from
// "Sample Client profiles/beatrice-keller-swiss-profile.json" translated
// into the SaaS WealthPlan shape (the sample file is in the single-file
// app's own save format). It is the interesting case for the merge
// engine: the plan ALREADY contains the accounts and holdings a custodian
// feed will report, so a correct run must update them in place and leave
// everything the advisor entered by hand alone. A regression here shows up
// as duplicated accounts — the failure mode most likely to reach a client
// report unnoticed.
// ─────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { diffPlan, applyChanges, summarize, type PlanChange } from "../apply";
import { emptyEnvelope, type FeedEnvelope } from "../model";
import { parsePlan } from "@/lib/plan/schema";
import type { WealthPlan } from "@/lib/engine/types";

const allKeys = (c: PlanChange[]) => new Set(c.map((x) => x.key));

/** The Keller household, as stored in the sample profile. */
function beatricePlan(): WealthPlan {
  const c1 = { id: "c1", first: "Béatrice", last: "Keller", dob: "1978-04-12",
               country: "CH" as const, state: "ZH", city: "Zürich",
               risk: "moderate" as const, horizon: "15_plus" as const };
  const c2 = { id: "c2", first: "Thomas", last: "Keller", dob: "1976-09-23",
               country: "CH" as const, state: "ZH", city: "Zürich",
               risk: "moderately_conservative" as const, horizon: "15_plus" as const };
  const account = (id: string, type: string, label: string, value: number, liquid: boolean, cls: WealthPlan["assets"][number]["cls"]) =>
    ({ id, type, label, value, liquid, country: "CH" as const, cls });
  const holding = (id: string, tkr: string, label: string, value: number, cls: WealthPlan["assets"][number]["cls"]) =>
    ({ id, type: tkr || "holding", label, value, liquid: true, country: "CH" as const, cls });

  return {
    version: 1, annualSavings: 0, annualRaiseRate: 0, currency: "CHF", inflationRate: 0.021, inflationRegion: "CH",
    clients: [c1, c2],
    children: [{ id: "ch1", first: "Elena", last: "Keller", dob: "2015-05-20" }],
    incomes: [
      { id: "i1", clientId: "c1", source: "Salary", amount: 185000, taxable: true },
      { id: "i2", clientId: "c1", source: "Board seat", amount: 15000, taxable: true },
      { id: "i3", clientId: "c2", source: "Salary", amount: 120000, taxable: true },
      { id: "i4", clientId: "c2", source: "Teaching", amount: 8000, taxable: true },
    ],
    // Legacy profile stores these annually; the plan model is monthly.
    expenses: [
      { id: "e1", name: "Living expenses", amount: 78000 / 12 },
      { id: "e2", name: "Insurance / health", amount: 12000 / 12 },
      { id: "e3", name: "Other", amount: 10000 / 12 },
    ],
    assets: [
      account("a1", "bvg_lpp", "Pensionskasse UBS", 480000, false, "mixed"),
      account("a2", "pillar_3a_fund", "3a Depot (VIAC)", 160000, false, "mixed"),
      account("a3", "savings_account", "ZKB Sparkonto", 90000, true, "cash"),
      account("a4", "depot", "Swissquote Depot", 350000, true, "mixed"),
      account("a5", "private_account", "ZKB Privatkonto", 35000, true, "cash"),
      account("a6", "bvg_lpp", "Pensionskasse Zürich Versicherung", 390000, false, "mixed"),
      account("a7", "pillar_3a_fund", "3a Depot (finpension)", 95000, false, "mixed"),
      holding("h1", "CHSPI", "iShares Core SPI", 90000, "equity"),
      holding("h2", "VWRL", "Vanguard FTSE All-World", 105000, "equity"),
      holding("h3", "NESN", "Nestlé", 30000, "equity"),
      holding("h4", "NOVN", "Novartis", 25000, "equity"),
      holding("h5", "ROG", "Roche GS", 20000, "equity"),
      holding("h6", "CHCORP", "iShares Core CHF Corporate Bond", 45000, "fixed_income"),
      holding("h7", "", "CHF Money Market / Depot Cash", 35000, "cash"),
    ],
    loans: [{ id: "l1", type: "mortgage_primary", label: "ZKB Festhypothek", bal: 800000, rate: 1.9, yrs: 20 }],
    goals: [
      { id: "g1", name: "University for Elena", amt: 30000, startYear: 2033, endYear: 2036, tier: "important" },
      { id: "g2", name: "Kitchen renovation", amt: 80000, startYear: 2029, endYear: 2029, tier: "important" },
    ],
    retirement: { enabled: true, retirementAge: 65, annualSpending: 110000, planToAge: 92 },
    createdAt: "2026-07-18T00:00:00.000Z", updatedAt: "2026-07-18T00:00:00.000Z",
  };
}

/** A month-later Swissquote statement: some values moved, one new position. */
function swissquoteFeed(): FeedEnvelope {
  return {
    ...emptyEnvelope(),
    source: { system: "Swissquote", kind: "custodian", generatedAt: "2026-08-31T00:00:00Z" },
    assets: [
      // Custody account grew; savings account is untouched.
      { label: "Swissquote Depot", accountTypeHint: "Securities account (Depot)", value: 358000, country: "CH", ccy: "CHF", _src: "wa.feed/v1 · Swissquote" },
      { label: "ZKB Sparkonto", accountTypeHint: "Savings account", value: 90000, country: "CH", ccy: "CHF", _src: "wa.feed/v1 · Swissquote" },
    ],
    holdings: [
      { name: "iShares Core SPI", tkr: "CHSPI", val: 92000, cls: "equity", _src: "wa.feed/v1 · Swissquote" },      // moved
      { name: "Vanguard FTSE All-World", tkr: "VWRL", val: 105000, cls: "equity", _src: "wa.feed/v1 · Swissquote" }, // flat
      { name: "Nestlé", tkr: "NESN", val: 30000, cls: "equity", _src: "wa.feed/v1 · Swissquote" },                   // flat
      { name: "UBS ETF Gold CHF-hedged", tkr: "AUCHAH", val: 12000, cls: "commodity", _src: "wa.feed/v1 · Swissquote" }, // NEW
    ],
  };
}

describe("Keller household — custodian feed against an established plan", () => {
  const plan = beatricePlan();
  const changes = diffPlan(plan, swissquoteFeed(), "CHF");

  it("recognizes every account and holding it already has — only the new position is a create", () => {
    const creates = changes.filter((c) => c.kind === "create");
    expect(creates.map((c) => c.label)).toEqual(["UBS ETF Gold CHF-hedged (AUCHAH)"]);
    expect(summarize(changes)).toMatchObject({ create: 1, update: 2, unchanged: 3 });
  });

  it("shows the real before → after figures for what moved", () => {
    const depot = changes.find((c) => c.label === "Swissquote Depot")!;
    expect(depot.kind).toBe("update");
    expect(depot.before).toContain("350,000");
    expect(depot.after).toContain("358,000");

    const spi = changes.find((c) => c.label.startsWith("iShares Core SPI"))!;
    expect(spi.kind).toBe("update");
    expect(spi.before).toContain("90,000");
    expect(spi.after).toContain("92,000");
  });

  it("leaves untouched positions alone rather than rewriting them", () => {
    const flat = changes.filter((c) => /Vanguard|Nestl|Sparkonto/.test(c.label));
    expect(flat).toHaveLength(3);
    expect(flat.every((c) => c.kind === "unchanged")).toBe(true);
  });

  it("adds exactly one asset and never duplicates the existing fourteen", () => {
    const next = applyChanges(plan, changes, allKeys(changes));
    expect(plan.assets).toHaveLength(14);
    expect(next.assets).toHaveLength(15);

    const labels = next.assets.map((a) => a.label);
    expect(new Set(labels).size).toBe(labels.length);          // no duplicates
    expect(labels).toContain("UBS ETF Gold CHF-hedged");
  });

  it("updates in place, preserving each record's identity and hand-set fields", () => {
    const next = applyChanges(plan, changes, allKeys(changes));
    const depot = next.assets.find((a) => a.id === "a4")!;      // same row, new value
    expect(depot.value).toBe(358000);
    expect(depot.type).toBe("depot");                           // account type not clobbered

    const spi = next.assets.find((a) => a.id === "h1")!;
    expect(spi.value).toBe(92000);
    expect(spi.cls).toBe("equity");
  });

  it("does not touch anything the custodian didn't report", () => {
    const next = applyChanges(plan, changes, allKeys(changes));
    // Pensions, the second 3a, the mortgage, goals, children, income, retirement.
    expect(next.assets.find((a) => a.id === "a1")!.value).toBe(480000);
    expect(next.assets.find((a) => a.id === "a6")!.value).toBe(390000);
    expect(next.assets.find((a) => a.id === "a7")!.value).toBe(95000);
    expect(next.loans).toEqual(plan.loans);
    expect(next.goals).toEqual(plan.goals);
    expect(next.children).toEqual(plan.children);
    expect(next.incomes).toEqual(plan.incomes);
    expect(next.retirement).toEqual(plan.retirement);
    expect(next.clients).toEqual(plan.clients);
  });

  it("produces a plan the schema still accepts", () => {
    const next = applyChanges(plan, changes, allKeys(changes));
    const parsed = parsePlan(next);
    expect(parsed.ok, parsed.ok ? "" : JSON.stringify((parsed as { fieldErrors: unknown }).fieldErrors)).toBe(true);
  });

  it("is idempotent — running the same statement again changes nothing", () => {
    const once = applyChanges(plan, changes, allKeys(changes));
    const second = diffPlan(once, swissquoteFeed(), "CHF");
    expect(second.every((c) => c.kind === "unchanged")).toBe(true);
    const twice = applyChanges(once, second, allKeys(second));
    expect(twice.assets).toHaveLength(15);
    expect(twice.assets.map((a) => a.value)).toEqual(once.assets.map((a) => a.value));
  });

  it("lets the advisor take the new position but skip the repricing", () => {
    const onlyNew = new Set(changes.filter((c) => c.kind === "create").map((c) => c.key));
    const next = applyChanges(plan, changes, onlyNew);
    expect(next.assets).toHaveLength(15);
    expect(next.assets.find((a) => a.id === "a4")!.value).toBe(350000);   // repricing declined
    expect(next.assets.find((a) => a.id === "h1")!.value).toBe(90000);
  });

  it("keeps the household's totals consistent with the statement", () => {
    const next = applyChanges(plan, changes, allKeys(changes));
    const before = plan.assets.reduce((s, a) => s + a.value, 0);
    const after = next.assets.reduce((s, a) => s + a.value, 0);
    // +8,000 depot, +2,000 SPI, +12,000 new gold position.
    expect(after - before).toBe(22000);
  });
});

describe("Keller household — CRM feed", () => {
  it("updates the couple's details without creating a third client", () => {
    const plan = beatricePlan();
    const envelope: FeedEnvelope = {
      ...emptyEnvelope(),
      household: [
        { role: "client1", first: "Béatrice", last: "Keller", city: "Winterthur", country: "CH", riskTolerance: "moderately_aggressive", _src: "CRM" },
        { role: "client2", first: "Thomas", last: "Keller", city: "Winterthur", country: "CH", _src: "CRM" },
      ],
    };
    const changes = diffPlan(plan, envelope, "CHF");
    const next = applyChanges(plan, changes, allKeys(changes));

    expect(next.clients).toHaveLength(2);
    expect(next.clients[0]).toMatchObject({ id: "c1", city: "Winterthur", risk: "moderately_aggressive" });
    expect(next.clients[1]).toMatchObject({ id: "c2", city: "Winterthur" });
    expect(next.clients[0].dob).toBe("1978-04-12");   // untouched field survives
    expect(parsePlan(next).ok).toBe(true);
  });
});
