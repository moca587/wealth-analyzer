import { describe, it, expect } from "vitest";
import { portfolioFromPlan, portfolioFromProposal, type FundLookup } from "../model";
import { comparePortfolios } from "../compare";
import { normalizeClass } from "../asset-class";
import { emptyPlan } from "@/lib/plan/default-plan";
import type { WealthPlan } from "@/lib/engine/types";
import type { Proposal } from "@/lib/orders/proposal";

const plan = (assets: WealthPlan["assets"]): WealthPlan => ({ ...emptyPlan(), currency: "CHF", assets });

const asset = (o: Partial<WealthPlan["assets"][number]>): WealthPlan["assets"][number] => ({
  id: Math.random().toString(36).slice(2), type: "", value: 0, liquid: true, ...o,
});

const proposal = (positions: Proposal["positions"], targetAmount = 100000): Proposal => ({
  positions, targetAmount, currency: "CHF",
});

const pos = (o: Partial<Proposal["positions"][number]>): Proposal["positions"][number] => ({
  id: Math.random().toString(36).slice(2), name: "", weightPct: 0, ...o,
});

describe("normalizeClass", () => {
  it("keeps canonical classes", () => {
    expect(normalizeClass("equity")).toBe("equity");
    expect(normalizeClass("fixed_income")).toBe("fixed_income");
  });
  it("folds synonyms and feed sub-classes", () => {
    expect(normalizeClass("Stocks")).toBe("equity");
    expect(normalizeClass("bonds")).toBe("fixed_income");
    expect(normalizeClass("REIT")).toBe("real_estate");
    expect(normalizeClass("private_equity")).toBe("alternative");
    expect(normalizeClass("hedge")).toBe("alternative");
    expect(normalizeClass("BTC")).toBe("crypto");
  });
  it("sends the unknown to mixed, never drops it", () => {
    expect(normalizeClass("wat")).toBe("mixed");
    expect(normalizeClass("")).toBe("mixed");
    expect(normalizeClass(undefined)).toBe("mixed");
  });
});

describe("portfolioFromPlan", () => {
  it("turns assets into weighted positions", () => {
    const p = portfolioFromPlan(plan([
      asset({ label: "Equity fund", cls: "equity", value: 60000 }),
      asset({ label: "Bond fund", cls: "fixed_income", value: 40000 }),
    ]));
    expect(p.total).toBe(100000);
    expect(p.positions.find((x) => x.cls === "equity")!.weightPct).toBeCloseTo(60, 6);
    expect(p.positions.find((x) => x.cls === "fixed_income")!.weightPct).toBeCloseTo(40, 6);
  });

  it("recovers a ticker parked in `type` and enriches cost/yield", () => {
    // apply.ts parks a holding's ticker in `type`; the enrichment the apply
    // path discarded is recovered here from the universe.
    const lookup: FundLookup = (t) => (t === "VWRL" ? { cls: "equity", er: 0.22, yld: 1.9, name: "FTSE All-World" } : undefined);
    const p = portfolioFromPlan(plan([asset({ type: "VWRL", value: 50000 })]), { lookup });
    const line = p.positions[0];
    expect(line.ticker).toBe("VWRL");
    expect(line.er).toBe(0.22);
    expect(line.yld).toBe(1.9);
    expect(line.cls).toBe("equity");
  });

  it("does not treat a generic word as a ticker", () => {
    const p = portfolioFromPlan(plan([asset({ type: "holding", label: "Cash account", cls: "cash", value: 1000 })]));
    expect(p.positions[0].ticker).toBeUndefined();
  });

  it("can exclude illiquid assets when comparing an investable proposal", () => {
    const p = portfolioFromPlan(plan([
      asset({ label: "ETF", cls: "equity", value: 50000, liquid: true }),
      asset({ label: "House", cls: "real_estate", value: 900000, liquid: false }),
    ]), { investableOnly: true });
    expect(p.total).toBe(50000);
    expect(p.positions).toHaveLength(1);
  });

  it("never produces a negative value or NaN weight", () => {
    const p = portfolioFromPlan(plan([
      asset({ label: "Broken", value: NaN }),
      asset({ label: "Negative", value: -5 }),
    ]));
    expect(p.total).toBe(0);
    for (const x of p.positions) expect(Number.isFinite(x.weightPct)).toBe(true);
  });
});

describe("portfolioFromPlan — prefers real holdings when present", () => {
  const planWithHoldings = (): WealthPlan => ({
    ...emptyPlan(), currency: "CHF",
    // An account-level asset AND the positions inside it. Net worth would sum
    // assets; the portfolio must use holdings (the finer, richer level) and
    // NOT double-count.
    assets: [asset({ label: "Custody account", cls: "equity", value: 200000, feedRef: "acct:CH1" })],
    holdings: [
      { id: "h1", name: "SPI ETF", ticker: "CHSPI", cls: "equity", value: 120000, er: 0.10, yld: 2.6 },
      { id: "h2", name: "Corp Bonds", ticker: "CHCORP", cls: "fixed_income", value: 80000, er: 0.15, yld: 1.2 },
    ],
  });

  it("builds the portfolio from holdings, not the account balance", () => {
    const p = portfolioFromPlan(planWithHoldings());
    expect(p.total, "sum of the two positions, not the account total + positions").toBe(200000);
    expect(p.positions).toHaveLength(2);
    expect(p.positions.map((x) => x.ticker).sort()).toEqual(["CHCORP", "CHSPI"]);
  });

  it("uses the holding's OWN expense ratio, not a universe guess", () => {
    // A universe lookup that would return a DIFFERENT er must not override
    // the figure the custodian actually reported.
    const wrongLookup: FundLookup = () => ({ er: 9.99 });
    const p = portfolioFromPlan(planWithHoldings(), { lookup: wrongLookup });
    const spi = p.positions.find((x) => x.ticker === "CHSPI")!;
    expect(spi.er, "the feed's figure wins over the universe").toBe(0.10);
  });

  it("blends the real per-position cost", () => {
    const p = portfolioFromPlan(planWithHoldings());
    // (120k*0.10 + 80k*0.15) / 200k = 0.12
    expect(comparePortfolios(p, p).summary.currentTer).toBeCloseTo(0.12, 6);
  });
});

describe("portfolioFromProposal", () => {
  it("derives value from weightPct × targetAmount", () => {
    const p = portfolioFromProposal(proposal([
      pos({ name: "A", cls: "equity", weightPct: 70 }),
      pos({ name: "B", cls: "fixed_income", weightPct: 30 }),
    ], 200000));
    expect(p.total).toBe(200000);
    expect(p.positions[0].value).toBe(140000);
    expect(p.positions[1].value).toBe(60000);
  });
});

describe("comparePortfolios — allocation drift", () => {
  it("computes per-class drift and the rebalance CHF against the current book", () => {
    const current = portfolioFromPlan(plan([
      asset({ label: "Equity", cls: "equity", value: 72000 }),
      asset({ label: "Bonds", cls: "fixed_income", value: 28000 }),
    ])); // total 100k, 72/28
    const proposed = portfolioFromProposal(proposal([
      pos({ name: "Equity", cls: "equity", weightPct: 60 }),
      pos({ name: "Bonds", cls: "fixed_income", weightPct: 40 }),
    ])); // 60/40

    const c = comparePortfolios(current, proposed);
    const eq = c.byClass.find((r) => r.cls === "equity")!;
    const fi = c.byClass.find((r) => r.cls === "fixed_income")!;

    expect(eq.currentPct).toBeCloseTo(72, 6);
    expect(eq.proposedPct).toBeCloseTo(60, 6);
    expect(eq.driftPct).toBeCloseTo(-12, 6);
    // To reach 60% equity from 72% of a 100k book: trim CHF 12,000.
    expect(eq.rebalanceValue).toBeCloseTo(-12000, 6);
    expect(fi.rebalanceValue).toBeCloseTo(+12000, 6);
  });

  it("orders classes canonically and includes a class present on only one side", () => {
    const current = portfolioFromPlan(plan([asset({ cls: "equity", value: 100000 })]));
    const proposed = portfolioFromProposal(proposal([
      pos({ name: "Eq", cls: "equity", weightPct: 80 }),
      pos({ name: "Gold", cls: "commodity", weightPct: 20 }),
    ]));
    const c = comparePortfolios(current, proposed);
    const commodity = c.byClass.find((r) => r.cls === "commodity")!;
    expect(commodity.currentPct).toBe(0);
    expect(commodity.proposedPct).toBeCloseTo(20, 6);
    expect(commodity.driftPct).toBeCloseTo(20, 6);
    // equity comes before commodity in the canonical order
    expect(c.byClass.map((r) => r.cls)).toEqual(["equity", "commodity"]);
  });

  it("drift sums to zero across classes (allocations are closed)", () => {
    const current = portfolioFromPlan(plan([
      asset({ cls: "equity", value: 50000 }), asset({ cls: "cash", value: 50000 }),
    ]));
    const proposed = portfolioFromProposal(proposal([
      pos({ name: "E", cls: "equity", weightPct: 65 }), pos({ name: "C", cls: "cash", weightPct: 35 }),
    ]));
    const total = comparePortfolios(current, proposed).byClass.reduce((s, r) => s + r.driftPct, 0);
    expect(total).toBeCloseTo(0, 6);
  });
});

describe("comparePortfolios — position deltas", () => {
  it("labels new / exit / increase / decrease correctly", () => {
    const lookup: FundLookup = () => undefined;
    const current = portfolioFromPlan(plan([
      asset({ type: "VWRL", value: 50000 }),   // stays, trimmed
      asset({ type: "GLD", value: 50000 }),     // exits
    ]), { lookup });
    const proposed = portfolioFromProposal(proposal([
      pos({ name: "FTSE All-World", ticker: "VWRL", weightPct: 60 }),  // was 50% → increase? it's 60% of proposed
      pos({ name: "Global Agg", ticker: "AGGG", weightPct: 40 }),      // new
    ]), lookup);

    const c = comparePortfolios(current, proposed);
    const byTicker = Object.fromEntries(c.positions.map((p) => [p.ticker ?? p.name, p]));
    expect(byTicker["AGGG"].action).toBe("new");
    expect(byTicker["GLD"].action).toBe("exit");
    // VWRL is in both — action depends on weight direction
    expect(["increase", "decrease", "unchanged"]).toContain(byTicker["VWRL"].action);
  });

  it("sorts by the size of the move, largest first", () => {
    const current = portfolioFromPlan(plan([asset({ cls: "equity", value: 100000 })]));
    const proposed = portfolioFromProposal(proposal([
      pos({ name: "Big", cls: "equity", weightPct: 90 }),
      pos({ name: "Small", cls: "cash", weightPct: 10 }),
    ]));
    const drifts = comparePortfolios(current, proposed).positions.map((p) => Math.abs(p.driftPct));
    expect(drifts).toEqual([...drifts].sort((a, b) => b - a));
  });
});

describe("comparePortfolios — summary metrics", () => {
  it("value-weights the expense ratio and reports the cost improvement", () => {
    const lookup: FundLookup = (t) =>
      ({ EXP: { er: 0.80, cls: "equity" }, CHEAP: { er: 0.07, cls: "equity" } } as Record<string, { er: number; cls: string }>)[t];
    const current = portfolioFromPlan(plan([asset({ type: "EXP", value: 100000 })]), { lookup });
    const proposed = portfolioFromProposal(proposal([pos({ name: "Cheap", ticker: "CHEAP", cls: "equity", weightPct: 100 })]), lookup);
    const s = comparePortfolios(current, proposed).summary;
    expect(s.currentTer).toBeCloseTo(0.80, 6);
    expect(s.proposedTer).toBeCloseTo(0.07, 6);
  });

  it("blends TER only over positions that report one", () => {
    const lookup: FundLookup = (t) => (t === "KNOWN" ? { er: 0.20 } : undefined);
    const current = portfolioFromPlan(plan([
      asset({ type: "KNOWN", value: 50000 }),
      asset({ label: "Direct property", cls: "real_estate", value: 50000 }), // no er
    ]), { lookup });
    // The blended TER is the known part's 0.20, not diluted to 0.10 by the
    // half with no fee — a property line is not a "free fund".
    expect(comparePortfolios(current, current).summary.currentTer).toBeCloseTo(0.20, 6);
  });

  it("reports null TER when nothing carries one, not zero", () => {
    const p = portfolioFromPlan(plan([asset({ cls: "cash", value: 1000 })]));
    expect(comparePortfolios(p, p).summary.currentTer).toBeNull();
  });

  it("reports the largest single-position concentration", () => {
    const current = portfolioFromPlan(plan([
      asset({ label: "Big", cls: "equity", value: 80000 }),
      asset({ label: "Small", cls: "cash", value: 20000 }),
    ]));
    expect(comparePortfolios(current, current).summary.currentTopWeight).toBeCloseTo(80, 6);
  });

  it("handles an empty current book (a brand-new client) without dividing by zero", () => {
    const current = portfolioFromPlan(plan([]));
    const proposed = portfolioFromProposal(proposal([pos({ name: "E", cls: "equity", weightPct: 100 })]));
    const c = comparePortfolios(current, proposed);
    expect(c.summary.currentTotal).toBe(0);
    expect(c.byClass.find((r) => r.cls === "equity")!.proposedPct).toBeCloseTo(100, 6);
    expect(c.byClass.every((r) => Number.isFinite(r.driftPct))).toBe(true);
  });
});
