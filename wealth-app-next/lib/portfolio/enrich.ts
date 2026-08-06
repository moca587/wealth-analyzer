// ─────────────────────────────────────────────────────────────────
// Turn the fund universe into a ticker → facts lookup for the compare.
//
// The universe is 135KB, so it is NOT imported here — the caller (a
// browser component) lazy-loads it exactly as the fund picker does, and
// passes the array in. This keeps the pure model/compare modules free of
// the data, and lets the lookup be a plain Map the compare injects.
// ─────────────────────────────────────────────────────────────────

import type { Fund } from "@/lib/data/fund-universe";
import type { FundLookup } from "./model";

/** Build a case-insensitive ticker → facts lookup from a loaded universe. */
export function fundLookup(funds: Fund[]): FundLookup {
  const byTicker = new Map<string, Fund>();
  for (const f of funds) byTicker.set(f.tkr.toUpperCase(), f);
  return (ticker: string) => {
    const f = byTicker.get(ticker.toUpperCase());
    return f ? { cls: f.cls, er: f.er, yld: f.yld, name: f.name } : undefined;
  };
}
