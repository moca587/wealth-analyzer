// ─────────────────────────────────────────────────────────────────
// Searching the fund universe.
//
// Pure and synchronous — the data is a plain array, so ranking a few
// hundred matches is trivial and needs no index. Kept separate from the
// data module so the picker can lazy-load the 135KB of funds while this
// stays cheap to import.
//
// Ranking is deliberately simple and explaining-itself: an exact ticker
// beats a ticker prefix beats a word-start in the name beats a substring.
// An advisor who types "VWRL" wants that exact ETF at the top, not a fund
// whose long name happens to contain those letters.
// ─────────────────────────────────────────────────────────────────

import type { Fund, FundClass } from "./fund-universe";

export interface FundQuery {
  text?: string;
  cls?: FundClass;
  /** Only UCITS vehicles — the default an EU/CH advisor usually wants. */
  ucitsOnly?: boolean;
  limit?: number;
}

const norm = (s: string) => s.toLowerCase().trim();

/** Score a fund against a normalised query. Higher is better; 0 = no match. */
function score(f: Fund, q: string): number {
  if (!q) return 1; // no text filter → everything passes at a flat rank
  const tkr = f.tkr.toLowerCase();
  const name = f.name.toLowerCase();
  const sponsor = f.sponsor.toLowerCase();

  if (tkr === q) return 1000;
  if (tkr.startsWith(q)) return 800;
  // A word in the name that starts with the query — "world" matches
  // "Vanguard FTSE All-World".
  if (name.split(/[\s-]+/).some((w) => w.startsWith(q))) return 500;
  if (name.includes(q)) return 300;
  if (sponsor.includes(q)) return 200;
  if (tkr.includes(q)) return 100;
  return 0;
}

export function searchFunds(all: Fund[], query: FundQuery): Fund[] {
  const q = norm(query.text ?? "");
  const limit = query.limit ?? 40;

  const scored: Array<{ f: Fund; s: number }> = [];
  for (const f of all) {
    if (query.cls && f.cls !== query.cls) continue;
    if (query.ucitsOnly && !f.ucits) continue;
    const s = score(f, q);
    if (s > 0) scored.push({ f, s });
  }

  scored.sort((a, b) => {
    if (b.s !== a.s) return b.s - a.s;
    // Stable, meaningful tiebreak: cheaper first (expense ratio), then name.
    const ea = a.f.er ?? 99, eb = b.f.er ?? 99;
    if (ea !== eb) return ea - eb;
    return a.f.name.localeCompare(b.f.name);
  });

  return scored.slice(0, limit).map((x) => x.f);
}

/** Human label for a class, for filter chips. */
export const CLASS_LABEL: Record<FundClass, string> = {
  equity: "Equity",
  fixed_income: "Fixed income",
  real_estate: "Real estate",
  commodity: "Commodity",
  cash: "Cash",
  mixed: "Mixed",
  alternative: "Alternative",
  crypto: "Crypto",
};
