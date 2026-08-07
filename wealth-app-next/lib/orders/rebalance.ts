// ─────────────────────────────────────────────────────────────────
// Turning "current book → target allocation" into an order ticket.
//
// The proposal builder deploys NEW cash — all BUYs. This is the other
// operation an EAM does daily: rebalance the money already invested to a
// target mix, which means SELLING the overweight positions and BUYING the
// underweight ones. It is the reason SELL exists on the order path.
//
// The basis is the CURRENT book value (rebalance the money that is there),
// not the proposal's targetAmount (that is new cash). Each target position
// gets `weight × currentTotal`; the delta against what is held becomes a
// BUY (delta up) or a SELL (delta down); a holding absent from the target
// is sold in full. Amounts are the POSITIVE cash value of each leg, `side`
// gives direction, and the ticket total is the GROSS notional traded.
//
// Pure: no clock beyond an injected timestamp, no I/O. The SELL lines it
// produces are still validated by checkTicket against the holdings — this
// builder derives them FROM the holdings, so they pass, but the gate is
// the safety net, not this.
// ─────────────────────────────────────────────────────────────────

import { ORDER_SCHEMA, round2, sumLines, type OrderLine, type OrderTicket } from "./model";
import type { Proposal } from "./proposal";
import type { Holding } from "@/lib/engine/types";

export interface RebalanceOptions {
  account: string;
  currency: string;
  ticketId: string;
  createdAt: string;
  custodian?: string;
  clientName?: string;
  advisor?: string;
  objective?: string;
  /** Skip trades smaller than this, so a rounding difference does not churn
   *  the book. In the ticket currency; default 100. */
  minTrade?: number;
}

interface Ident { isin?: string; ticker?: string; name?: string }

const U = (s?: string) => (s || "").trim().toUpperCase();
const N = (s?: string) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Do two instruments refer to the same security?
 *
 * A single canonical key does not work here: a holding may arrive from a
 * feed with only a ticker while the proposal carries the ISIN, and treating
 * them as different would sell the whole position and re-buy it. So match
 * on whatever the two SHARE — but conservatively: when both carry an ISIN
 * they must AGREE (a shared ticker across different ISINs is a
 * cross-listing or an error, not a merge), else fall to ticker, else name.
 */
function sameInstrument(a: Ident, b: Ident): boolean {
  const ai = U(a.isin), bi = U(b.isin);
  if (ai && bi) return ai === bi;
  const at = U(a.ticker), bt = U(b.ticker);
  if (at && bt) return at === bt;
  const an = N(a.name), bn = N(b.name);
  return !!an && an === bn;
}

interface Bucket {
  isin?: string;
  ticker?: string;
  name: string;
  cls?: string;
  current: number;
  target: number;
}

/**
 * Build a rebalance ticket. Returns a ticket whose lines are the buy/sell
 * deltas to move `current` to the `proposal`'s allocation. May have zero
 * lines when the book already matches the target (the caller should treat
 * that as "nothing to do", since checkTicket rejects an empty ticket).
 */
export function buildRebalanceTicket(
  current: Holding[],
  proposal: Proposal,
  opts: RebalanceOptions,
): OrderTicket {
  const currentTotal = current.reduce(
    (s, h) => s + (Number.isFinite(h.value) ? Math.max(0, h.value) : 0), 0);

  const buckets: Bucket[] = [];
  const find = (x: Ident) => buckets.find((b) => sameInstrument(b, x));

  for (const h of current) {
    let b = find(h);
    if (!b) { b = { isin: h.isin, ticker: h.ticker, name: h.name, cls: h.cls, current: 0, target: 0 }; buckets.push(b); }
    b.current += Math.max(0, Number.isFinite(h.value) ? h.value : 0);
  }
  for (const p of proposal.positions ?? []) {
    let b = find(p);
    if (!b) { b = { isin: p.isin, ticker: p.ticker, name: p.name || "", cls: p.cls, current: 0, target: 0 }; buckets.push(b); }
    const w = Number.isFinite(p.weightPct) ? Math.max(0, p.weightPct) : 0;
    b.target += (w / 100) * currentTotal;
    // A matched line prefers the proposal's identifiers and name — it is the
    // target of record — while keeping the holding's when the proposal omits.
    b.isin = p.isin || b.isin;
    b.ticker = p.ticker || b.ticker;
    b.name = p.name || b.name;
    b.cls = p.cls || b.cls;
  }

  const minTrade = opts.minTrade ?? 100;
  const lines: OrderLine[] = [];
  let i = 0;
  for (const b of buckets) {
    const delta = round2(b.target - b.current);
    if (Math.abs(delta) < minTrade) continue;   // already at target
    lines.push({
      lineId: `rb${++i}`,
      side: delta > 0 ? "BUY" : "SELL",
      instrument: { isin: b.isin, ticker: b.ticker, name: b.name, cls: b.cls },
      // Audit-only. The target's share of the book; 0 for a full exit.
      weightPct: currentTotal > 0 ? round2((b.target / currentTotal) * 100) : 0,
      amount: Math.abs(delta),
      currency: opts.currency,
      orderType: "market",
      note: "",
    });
  }

  return {
    schema: ORDER_SCHEMA,
    ticketId: opts.ticketId,
    createdAt: opts.createdAt,
    intent: "stage",
    account: { id: opts.account, custodian: opts.custodian, currency: opts.currency },
    client: { name: opts.clientName, advisor: opts.advisor },
    source: { system: "Wealth Analyzer", objective: opts.objective },
    totals: { amount: sumLines(lines), currency: opts.currency, positions: lines.length },
    lines,
  };
}
