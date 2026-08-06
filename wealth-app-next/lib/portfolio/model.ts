// ─────────────────────────────────────────────────────────────────
// A portfolio is a set of positions with a total and a currency — the
// common shape both sides of the compare reduce to.
//
// The "current" book comes from the plan's assets (the finest granularity
// the app persists — account/holding-level balances with an asset class).
// The "proposed" book comes from the proposal (weighted target positions).
// Neither carries a price or a share count, so a position's `value` is its
// market value in the portfolio currency and weights are derived from it.
//
// All builders are PURE and take their reference data (the fund universe)
// as an injected lookup, so the compare math is unit-testable without
// loading 135KB of funds.
// ─────────────────────────────────────────────────────────────────

import type { WealthPlan, Asset } from "@/lib/engine/types";
import type { Proposal } from "@/lib/orders/proposal";
import { normalizeClass, type AssetClass } from "./asset-class";

export interface Position {
  /** Stable key used to align a current position with a proposed one:
   *  ISIN, else ticker, else a normalised name. */
  key: string;
  name: string;
  ticker?: string;
  isin?: string;
  cls: AssetClass;
  /** Market value in the portfolio's currency. */
  value: number;
  /** Share of the portfolio total, 0–100. Derived from value. */
  weightPct: number;
  /** Expense ratio, percent (0.20 = 0.20%). Enriched from the universe. */
  er?: number;
  /** Distribution yield, percent. */
  yld?: number;
  /** Where this line came from — for the UI to explain a row. */
  origin: "plan" | "proposal";
}

export interface Portfolio {
  positions: Position[];
  total: number;
  currency: string;
}

/** Injected enrichment: ticker → reference facts. Kept as a plain function
 *  so callers pass the loaded universe and the core stays data-free. */
export type FundLookup = (ticker: string) => { cls?: string; er?: number; yld?: number; name?: string } | undefined;

const noLookup: FundLookup = () => undefined;

/** A ticker-ish token: 1–6 letters, optionally a dot-suffix (VWRL.L). Used
 *  to tell a real ticker parked in an asset's `type` from a generic word
 *  like "holding" or an account label. */
const TICKER = /^[A-Z]{1,6}([.\-][A-Z]{1,4})?$/;

function positionKey(p: { isin?: string; ticker?: string; name: string }): string {
  if (p.isin) return `isin:${p.isin.toUpperCase()}`;
  if (p.ticker) return `tkr:${p.ticker.toUpperCase()}`;
  return `name:${p.name.toLowerCase().replace(/\s+/g, " ").trim()}`;
}

/** Recompute every weight from values and the total. One place, so current
 *  and proposed weights are always defined the same way. */
function withWeights(positions: Omit<Position, "weightPct">[], total: number): Position[] {
  return positions.map((p) => ({ ...p, weightPct: total > 0 ? (p.value / total) * 100 : 0 }));
}

export interface FromPlanOptions {
  /** Exclude illiquid assets (property, locked pensions). An advisor
   *  comparing an investable proposal usually wants only the tradeable
   *  book; the report view wants everything. Default false (include all). */
  investableOnly?: boolean;
  lookup?: FundLookup;
}

/**
 * The client's current portfolio, from their plan assets.
 *
 * Each asset is one position. An asset that came from a custodian HOLDING
 * carries its ticker in `type` (apply.ts parks it there) — we recover that
 * to enrich cost/yield from the universe, which apply.ts discards. An
 * account-level asset has no ticker and stays a class-only line, which is
 * still correct for the allocation compare.
 */
export function portfolioFromPlan(plan: WealthPlan, opts: FromPlanOptions = {}): Portfolio {
  const lookup = opts.lookup ?? noLookup;
  const assets: Asset[] = (plan.assets ?? []).filter((a) => (opts.investableOnly ? a.liquid : true));

  const raw = assets.map((a) => {
    const ticker = a.type && TICKER.test(a.type.trim().toUpperCase()) ? a.type.trim().toUpperCase() : undefined;
    const ref = ticker ? lookup(ticker) : undefined;
    const cls = normalizeClass(a.cls ?? ref?.cls ?? a.type);
    return {
      key: positionKey({ ticker, name: a.label || a.type || "Position" }),
      name: a.label || ref?.name || a.type || "Position",
      ticker,
      cls,
      value: Number.isFinite(a.value) ? Math.max(0, a.value) : 0,
      er: ref?.er,
      yld: ref?.yld,
      origin: "plan" as const,
    };
  });

  const total = raw.reduce((s, p) => s + p.value, 0);
  return { positions: withWeights(raw, total), total, currency: plan.currency || "CHF" };
}

/**
 * The proposed portfolio, from a proposal.
 *
 * The proposal is percentage-weighted against a `targetAmount`; a
 * position's value is `weightPct/100 × targetAmount`. Identifiers and an
 * optional `cls` come from the proposal itself; cost/yield are enriched by
 * ticker from the universe.
 */
export function portfolioFromProposal(proposal: Proposal, lookup: FundLookup = noLookup): Portfolio {
  const target = Number.isFinite(proposal.targetAmount) ? Math.max(0, proposal.targetAmount) : 0;

  const raw = (proposal.positions ?? []).map((p) => {
    const ticker = p.ticker ? p.ticker.trim().toUpperCase() : undefined;
    const ref = ticker ? lookup(ticker) : undefined;
    const cls = normalizeClass(p.cls ?? ref?.cls);
    const weight = Number.isFinite(p.weightPct) ? Math.max(0, p.weightPct) : 0;
    return {
      key: positionKey({ isin: p.isin, ticker, name: p.name || "Position" }),
      name: p.name || ref?.name || ticker || "Position",
      ticker,
      isin: p.isin,
      cls,
      value: (weight / 100) * target,
      er: ref?.er,
      yld: ref?.yld,
      origin: "proposal" as const,
    };
  });

  const total = raw.reduce((s, p) => s + p.value, 0);
  return { positions: withWeights(raw, total), total, currency: proposal.currency || "CHF" };
}
