// ─────────────────────────────────────────────────────────────────
// wa.feed/v1 — the normalized feed model.
//
// This is the same contract the single-file app's "Data feeds" panel
// consumes, so the relay is a drop-in upstream for it: point a
// connection at /api/feeds/<id> and the panel keeps working unchanged.
// Every adapter in adapters.ts converts a custodian/CRM wire format
// into this shape; nothing downstream needs to know the source format.
// ─────────────────────────────────────────────────────────────────

export const FEED_SCHEMA = "wa.feed/v1" as const;

/** Wire formats the relay can normalize. */
export type FeedFormat = "auto" | "wa" | "crm" | "camt" | "ofx" | "csv";

/** Fields shared by every normalized record. */
export interface FeedRecordMeta {
  /** 0–1 confidence; the review UI surfaces anything below ~0.7. */
  _ok?: number;
  /** Human-readable provenance, shown per row in the review screen. */
  _src?: string;
}

export interface FeedHousehold extends FeedRecordMeta {
  role: "client1" | "client2" | "child";
  first?: string; last?: string; dob?: string;
  street?: string; city?: string; postal?: string; state?: string; country?: string;
  relationship?: string; riskTolerance?: string; timeHorizon?: string;
}
export interface FeedIncome extends FeedRecordMeta {
  who?: "client1" | "client2";
  primary?: number | null; secondary?: number | null; raisePct?: number | null;
}
export interface FeedAsset extends FeedRecordMeta {
  label: string; accountTypeHint?: string; value: number;
  country?: string; ccy?: string;
  propertyValue?: number | null; otherValue?: number | null;
}
export interface FeedLiability extends FeedRecordMeta {
  label: string; balance: number; type?: string;
  ratePct?: number | null; years?: number | null;
}
export interface FeedHolding extends FeedRecordMeta {
  name: string; tkr?: string; val: number;
  type?: string; cls?: string; region?: string;
  er?: number | null; yld?: number | null; note?: string;
}

/** The full envelope an endpoint returns (every array optional). */
export interface FeedEnvelope {
  schema: typeof FEED_SCHEMA;
  source?: { system?: string; kind?: "custodian" | "crm"; generatedAt?: string };
  household: FeedHousehold[];
  income: FeedIncome[];
  expenses: FeedRecordMeta[];
  assets: FeedAsset[];
  liabilities: FeedLiability[];
  goals: FeedRecordMeta[];
  holdings: FeedHolding[];
  retirement: FeedRecordMeta[];
}

export const FEED_BUCKETS = [
  "household", "income", "expenses", "assets",
  "liabilities", "goals", "holdings", "retirement",
] as const;

export function emptyEnvelope(): FeedEnvelope {
  return {
    schema: FEED_SCHEMA,
    household: [], income: [], expenses: [], assets: [],
    liabilities: [], goals: [], holdings: [], retirement: [],
  };
}

export function countRecords(env: FeedEnvelope): number {
  return FEED_BUCKETS.reduce((n, b) => n + (env[b]?.length ?? 0), 0);
}

/**
 * Locale-tolerant number parse. Feeds arrive with Swiss apostrophes
 * (350'000), European commas (1.234,56), spaces (95 000), parentheses
 * for negatives, and trailing/leading currency symbols.
 */
export function parseFeedNumber(input: unknown): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (input == null) return null;
  let s = String(input).trim();
  if (!s) return null;

  let negative = false;
  if (/^\(.*\)$/.test(s)) { negative = true; s = s.slice(1, -1); }
  if (/^-/.test(s) || /\bDR\b/i.test(s)) negative = true;

  s = s.replace(/[A-Za-z$€£¥₣\s'’_]/g, "").replace(/[+-]/g, "");
  if (!s) return null;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma >= 0 && lastDot >= 0) {
    // Whichever separator comes last is the decimal mark.
    if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (lastComma >= 0) {
    // A lone comma is a decimal mark only when it isn't grouping (1,234).
    const after = s.length - lastComma - 1;
    s = after === 3 && /^\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}
