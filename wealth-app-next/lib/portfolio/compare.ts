// ─────────────────────────────────────────────────────────────────
// Comparing a current portfolio to a proposed one.
//
// The two sides can have DIFFERENT totals — the current book is the whole
// position, the proposal is a weighted target for some amount of cash — so
// the comparison is ALLOCATION-based (percent of each side's own total).
// Percentages are apples-to-apples where CHF is not.
//
// The one CHF figure that IS unambiguous, and the one an advisor asks for,
// is "to reach the target mix using the current book, move this much per
// class": (proposedPct − currentPct) × currentTotal. Positive = buy that
// class, negative = trim. It rebalances the money already there; it does
// not assume new cash.
//
// Pure: no I/O, no engine, no clock. Given two Portfolios it is fully
// determined, so the numbers on the advisor's screen are reproducible.
// ─────────────────────────────────────────────────────────────────

import type { Portfolio, Position } from "./model";
import { ASSET_CLASSES, type AssetClass } from "./asset-class";

export interface ClassRow {
  cls: AssetClass;
  currentValue: number;
  currentPct: number;
  proposedValue: number;
  proposedPct: number;
  /** proposedPct − currentPct. The allocation drift, in percentage points. */
  driftPct: number;
  /** CHF to move in the CURRENT book to reach the target mix. */
  rebalanceValue: number;
}

export type PositionAction = "new" | "exit" | "increase" | "decrease" | "unchanged";

export interface PositionDelta {
  key: string;
  name: string;
  ticker?: string;
  cls: AssetClass;
  currentPct: number;
  proposedPct: number;
  driftPct: number;
  currentValue: number;
  proposedValue: number;
  action: PositionAction;
}

export interface PortfolioSummary {
  currency: string;
  currentTotal: number;
  proposedTotal: number;
  /** Value-weighted expense ratio, percent — null when no position on that
   *  side carries one. The headline cost number for a review. */
  currentTer: number | null;
  proposedTer: number | null;
  currentYield: number | null;
  proposedYield: number | null;
  /** Largest single position's weight, percent — a plain concentration read. */
  currentTopWeight: number;
  proposedTopWeight: number;
  currentClassCount: number;
  proposedClassCount: number;
}

export interface Comparison {
  byClass: ClassRow[];
  positions: PositionDelta[];
  summary: PortfolioSummary;
}

function classTotals(p: Portfolio): Map<AssetClass, number> {
  const m = new Map<AssetClass, number>();
  for (const pos of p.positions) m.set(pos.cls, (m.get(pos.cls) ?? 0) + pos.value);
  return m;
}

/** Value-weighted mean of a per-position field, over the positions that
 *  actually carry it — so a book where only some positions report an
 *  expense ratio still yields a meaningful blended figure for the part
 *  that does, rather than a zero that reads as "free". */
function weightedMean(positions: Position[], pick: (p: Position) => number | undefined): number | null {
  let num = 0, den = 0;
  for (const p of positions) {
    const v = pick(p);
    if (v == null || !Number.isFinite(v) || p.value <= 0) continue;
    num += v * p.value;
    den += p.value;
  }
  return den > 0 ? num / den : null;
}

const topWeight = (p: Portfolio): number =>
  p.positions.reduce((max, pos) => Math.max(max, pos.weightPct), 0);

export function comparePortfolios(current: Portfolio, proposed: Portfolio): Comparison {
  const cur = classTotals(current);
  const prop = classTotals(proposed);

  const present = ASSET_CLASSES.filter((c) => (cur.get(c) ?? 0) > 0 || (prop.get(c) ?? 0) > 0);

  const byClass: ClassRow[] = present.map((cls) => {
    const currentValue = cur.get(cls) ?? 0;
    const proposedValue = prop.get(cls) ?? 0;
    const currentPct = current.total > 0 ? (currentValue / current.total) * 100 : 0;
    const proposedPct = proposed.total > 0 ? (proposedValue / proposed.total) * 100 : 0;
    const driftPct = proposedPct - currentPct;
    return {
      cls, currentValue, currentPct, proposedValue, proposedPct, driftPct,
      // Rebalance the CURRENT book to the target mix (not new cash).
      rebalanceValue: (driftPct / 100) * current.total,
    };
  });

  // ── Position-level deltas, aligned by key ──
  const byKey = new Map<string, { name: string; ticker?: string; cls: AssetClass; cur?: Position; prop?: Position }>();
  for (const p of current.positions) {
    const e = byKey.get(p.key) ?? { name: p.name, ticker: p.ticker, cls: p.cls };
    e.cur = p; byKey.set(p.key, e);
  }
  for (const p of proposed.positions) {
    const e = byKey.get(p.key) ?? { name: p.name, ticker: p.ticker, cls: p.cls };
    e.prop = p;
    // Prefer the proposal's name/class for a matched line (it is the target).
    e.name = p.name; e.cls = p.cls; e.ticker = p.ticker ?? e.ticker;
    byKey.set(p.key, e);
  }

  const positions: PositionDelta[] = [...byKey.entries()].map(([key, e]) => {
    const currentPct = e.cur?.weightPct ?? 0;
    const proposedPct = e.prop?.weightPct ?? 0;
    const driftPct = proposedPct - currentPct;
    const action: PositionAction =
      !e.cur ? "new" : !e.prop ? "exit"
      : driftPct > 0.05 ? "increase" : driftPct < -0.05 ? "decrease" : "unchanged";
    return {
      key, name: e.name, ticker: e.ticker, cls: e.cls,
      currentPct, proposedPct, driftPct,
      currentValue: e.cur?.value ?? 0,
      proposedValue: e.prop?.value ?? 0,
      action,
    };
  }).sort((a, b) => Math.abs(b.driftPct) - Math.abs(a.driftPct));

  const summary: PortfolioSummary = {
    currency: proposed.currency || current.currency || "CHF",
    currentTotal: current.total,
    proposedTotal: proposed.total,
    currentTer: weightedMean(current.positions, (p) => p.er),
    proposedTer: weightedMean(proposed.positions, (p) => p.er),
    currentYield: weightedMean(current.positions, (p) => p.yld),
    proposedYield: weightedMean(proposed.positions, (p) => p.yld),
    currentTopWeight: topWeight(current),
    proposedTopWeight: topWeight(proposed),
    currentClassCount: cur.size,
    proposedClassCount: prop.size,
  };

  return { byClass, positions, summary };
}
