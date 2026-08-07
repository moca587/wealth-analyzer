import { describe, it, expect } from "vitest";
import { buildRebalanceTicket, type RebalanceOptions } from "../rebalance";
import { checkTicket } from "../schema";
import type { Holding } from "@/lib/engine/types";
import type { Proposal } from "../proposal";

const OPTS: RebalanceOptions = {
  account: "CH-1", currency: "CHF", ticketId: "wo_rebalance_0001",
  createdAt: "2026-08-06T00:00:00.000Z", clientName: "Keller", advisor: "Adv",
};

const holding = (o: Partial<Holding>): Holding => ({ id: "h", name: "", value: 0, ...o });
const proposal = (positions: Proposal["positions"]): Proposal => ({ positions, targetAmount: 0, currency: "CHF" });
const pos = (o: Partial<Proposal["positions"][number]>): Proposal["positions"][number] =>
  ({ id: "p", name: "", weightPct: 0, ...o });

// A current book of CHF 100,000: 70% IWDA, 30% VWRL.
const CURRENT: Holding[] = [
  holding({ name: "iShares Core MSCI World", ticker: "IWDA", isin: "IE00B4L5Y983", cls: "equity", value: 70000 }),
  holding({ name: "FTSE All-World", ticker: "VWRL", cls: "equity", value: 30000 }),
];

describe("buildRebalanceTicket", () => {
  it("sells the overweight, buys the underweight, exits what's dropped", () => {
    // Target: IWDA 50%, AGGG (bonds) 50%. VWRL dropped.
    const t = buildRebalanceTicket(CURRENT, proposal([
      pos({ name: "iShares Core MSCI World", ticker: "IWDA", isin: "IE00B4L5Y983", weightPct: 50 }),
      pos({ name: "Global Aggregate Bond", ticker: "AGGG", weightPct: 50 }),
    ]), OPTS);

    const byTkr = Object.fromEntries(t.lines.map((l) => [l.instrument.ticker, l]));
    // IWDA: target 50k, held 70k → SELL 20k
    expect(byTkr.IWDA.side).toBe("SELL");
    expect(byTkr.IWDA.amount).toBe(20000);
    // VWRL: not in target → SELL all 30k
    expect(byTkr.VWRL.side).toBe("SELL");
    expect(byTkr.VWRL.amount).toBe(30000);
    // AGGG: target 50k, held 0 → BUY 50k
    expect(byTkr.AGGG.side).toBe("BUY");
    expect(byTkr.AGGG.amount).toBe(50000);
  });

  it("nets to zero cash (a rebalance deploys no new money) but has gross churn", () => {
    const t = buildRebalanceTicket(CURRENT, proposal([
      pos({ name: "IWDA", ticker: "IWDA", isin: "IE00B4L5Y983", weightPct: 50 }),
      pos({ name: "AGGG", ticker: "AGGG", weightPct: 50 }),
    ]), OPTS);
    const net = t.lines.reduce((s, l) => s + (l.side === "BUY" ? l.amount : -l.amount), 0);
    expect(net).toBeCloseTo(0, 6);
    // gross = 20k + 30k + 50k
    expect(t.totals.amount).toBe(100000);
  });

  it("produces a ticket that PASSES checkTicket against the same holdings", () => {
    // The round-trip that matters: the sells it derives from the book must
    // survive the holdings-aware gate.
    const t = buildRebalanceTicket(CURRENT, proposal([
      pos({ name: "IWDA", ticker: "IWDA", isin: "IE00B4L5Y983", weightPct: 50 }),
      pos({ name: "AGGG", ticker: "AGGG", weightPct: 50 }),
    ]), OPTS);
    const r = checkTicket(t, { account: "CH-1", currency: "CHF", maxTicketAmount: 10_000_000 }, { holdings: CURRENT });
    expect(r.ok, r.errors.join(" | ")).toBe(true);
  });

  it("skips a trade smaller than minTrade (no churn on rounding)", () => {
    // Target essentially equals current: IWDA 70%, VWRL 30%.
    const t = buildRebalanceTicket(CURRENT, proposal([
      pos({ name: "IWDA", ticker: "IWDA", isin: "IE00B4L5Y983", weightPct: 70 }),
      pos({ name: "VWRL", ticker: "VWRL", weightPct: 30 }),
    ]), OPTS);
    expect(t.lines).toHaveLength(0);
  });

  it("a partial trim: reduce IWDA from 70% to 60%", () => {
    const t = buildRebalanceTicket(CURRENT, proposal([
      pos({ name: "IWDA", ticker: "IWDA", isin: "IE00B4L5Y983", weightPct: 60 }),
      pos({ name: "VWRL", ticker: "VWRL", weightPct: 40 }),
    ]), OPTS);
    const byTkr = Object.fromEntries(t.lines.map((l) => [l.instrument.ticker, l]));
    expect(byTkr.IWDA.side).toBe("SELL");
    expect(byTkr.IWDA.amount).toBe(10000);   // 70k → 60k
    expect(byTkr.VWRL.side).toBe("BUY");
    expect(byTkr.VWRL.amount).toBe(10000);   // 30k → 40k
  });

  it("carries the proposal's ISIN onto a matched line even when the holding lacked one", () => {
    const t = buildRebalanceTicket(
      [holding({ name: "FTSE All-World", ticker: "VWRL", value: 100000 })],
      proposal([pos({ name: "FTSE All-World", ticker: "VWRL", isin: "IE00BK5BQT80", weightPct: 50 })]),
      OPTS,
    );
    const vwrl = t.lines.find((l) => l.instrument.ticker === "VWRL")!;
    expect(vwrl.instrument.isin).toBe("IE00BK5BQT80");
  });

  it("is stage-only and deterministic", () => {
    const a = buildRebalanceTicket(CURRENT, proposal([pos({ ticker: "IWDA", isin: "IE00B4L5Y983", name: "IWDA", weightPct: 100 })]), OPTS);
    const b = buildRebalanceTicket(CURRENT, proposal([pos({ ticker: "IWDA", isin: "IE00B4L5Y983", name: "IWDA", weightPct: 100 })]), OPTS);
    expect(a.intent).toBe("stage");
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));   // no hidden clock/random
  });
});
