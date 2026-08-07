// ─────────────────────────────────────────────────────────────────
// The non-trivial logic behind the holdings editor, pulled out so it is
// testable without a DOM. The row add/remove/update is the same proven
// pattern as the assets section; what is worth pinning is the fund-pick
// merge (must fill cost, must NOT blank a figure the advisor typed) and
// the number parsing (blank → unknown, not a "free" 0%).
// ─────────────────────────────────────────────────────────────────

import { newId } from "@/lib/plan/default-plan";
import { ASSET_CLASSES, type AssetClass } from "@/lib/portfolio/asset-class";
import type { Holding } from "@/lib/engine/types";
import type { FundPick } from "@/components/orders/fund-picker";

/** A fresh, schema-valid blank row. */
export function blankHolding(): Holding {
  return { id: newId(), name: "", value: 0, cls: "equity" };
}

/**
 * A number field's new value. Blank → undefined for er/yld, because a
 * position with no known expense ratio is UNKNOWN, not free (0%); a
 * mid-edit non-numeric string keeps the previous value.
 */
export function parseNumField(raw: string, prev: number | undefined): number | undefined {
  const v = raw.trim();
  if (v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : prev;
}

/**
 * Merge a fund-picker selection onto a holding. Fills name / ticker /
 * class always; fills er and yld ONLY when the universe actually carries
 * them, so picking a fund never blanks a cost the advisor entered by hand.
 */
export function applyFundPick(holding: Holding, f: FundPick): Holding {
  const cls = (ASSET_CLASSES as string[]).includes(f.cls) ? (f.cls as AssetClass) : holding.cls;
  return {
    ...holding,
    name: f.name || holding.name,
    ticker: f.ticker || holding.ticker,
    cls,
    ...(f.er != null ? { er: f.er } : {}),
    ...(f.yld != null ? { yld: f.yld } : {}),
  };
}
