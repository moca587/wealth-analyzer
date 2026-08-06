// ─────────────────────────────────────────────────────────────────
// One asset-class vocabulary, shared.
//
// The 8-member class enum lived by COPY in four places (apply.ts,
// assets-section.tsx, fund-search.ts, report-view.tsx), each with its own
// label map and its own string→class inference. A current-vs-proposed
// compare only means something if BOTH sides bucket an instrument into the
// same class, so the compare cannot reuse any one of those copies — it
// needs the canonical one. This is it.
//
// The class list itself is `AssetClass` from the engine (types.ts); this
// module adds the label, the ordering, and a single tolerant normaliser
// for the free-form class strings that arrive from feeds and legacy data.
// ─────────────────────────────────────────────────────────────────

import type { AssetClass } from "@/lib/engine/types";

export type { AssetClass };

/** Canonical display order — growth assets first, cash/other last, so a
 *  legend and a donut read the same way every time. */
export const ASSET_CLASSES: AssetClass[] = [
  "equity", "fixed_income", "real_estate", "commodity",
  "alternative", "crypto", "mixed", "cash",
];

export const CLASS_LABEL: Record<AssetClass, string> = {
  equity: "Equity",
  fixed_income: "Fixed income",
  real_estate: "Real estate",
  commodity: "Commodity",
  cash: "Cash",
  mixed: "Mixed",
  alternative: "Alternative",
  crypto: "Crypto",
};

/** A stable colour per class, theme-independent (works on light and dark).
 *  Chosen to stay distinguishable next to each other in a donut. */
export const CLASS_COLOR: Record<AssetClass, string> = {
  equity: "#4f7cf0",       // blue
  fixed_income: "#3fae8f",  // teal-green
  real_estate: "#c9a96e",   // the app's gold accent
  commodity: "#d08a4f",     // amber
  alternative: "#9b6cd0",   // violet
  crypto: "#d0576b",        // rose
  mixed: "#7a8699",         // slate
  cash: "#8fa1b3",          // muted blue-grey
};

const label = (s: string) => s.toLowerCase().trim().replace(/[\s-]+/g, "_");

/**
 * Coerce an arbitrary class string (feed value, legacy label, a proposal's
 * free-text `cls`) into a canonical AssetClass. Unknown → "mixed", the
 * deliberately-neutral bucket, never silently dropped.
 *
 * Folds the feed-only sub-classes the apply path also folds
 * (private_equity / hedge / structured → alternative), so a holding
 * classified by the custodian lands in the same bucket whether it came
 * through the feed apply or is compared here directly.
 */
export function normalizeClass(raw: string | undefined | null): AssetClass {
  if (!raw) return "mixed";
  const s = label(raw);
  if (s in CLASS_LABEL) return s as AssetClass;
  // Common synonyms and feed sub-classes.
  if (/^(stock|stocks|equities|shares?|equity_fund)$/.test(s)) return "equity";
  if (/^(bond|bonds|fixed|fixedincome|fixed_income|credit|treasury|govt|gilt)$/.test(s)) return "fixed_income";
  if (/^(property|realestate|reit|reits)$/.test(s)) return "real_estate";
  if (/^(commodities|gold|metals|energy)$/.test(s)) return "commodity";
  if (/^(private_equity|privateequity|hedge|hedge_fund|structured|infrastructure|private_credit)$/.test(s)) return "alternative";
  if (/^(btc|eth|digital|digital_asset|digitalassets)$/.test(s)) return "crypto";
  if (/^(balanced|multi_asset|multiasset|allocation)$/.test(s)) return "mixed";
  if (/^(money_market|moneymarket|savings|deposit|cash_equivalent)$/.test(s)) return "cash";
  return "mixed";
}

export const classLabel = (c: AssetClass): string => CLASS_LABEL[c] ?? c;
