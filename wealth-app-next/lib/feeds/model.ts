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
  /**
   * A date-of-birth value the adapter refused to interpret, kept verbatim so
   * the review UI can say "12.03.1971 — enter this by hand" instead of the
   * field silently disappearing. A client with no DOB has no retirement
   * horizon, so a dropped date is not a harmless omission.
   */
  dobRaw?: string;
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
  /**
   * Stable account identity (IBAN or equivalent) when the source has one.
   * Matching on this instead of a display label lets an account keep its plan
   * record when the label changes, and lets a balance that crosses zero move
   * between the asset and liability sides instead of stranding a duplicate.
   */
  accountRef?: string;
}
export interface FeedLiability extends FeedRecordMeta {
  label: string; balance: number; type?: string;
  ccy?: string;
  ratePct?: number | null; years?: number | null;
  /** See FeedAsset.accountRef. */
  accountRef?: string;
}
export interface FeedHolding extends FeedRecordMeta {
  name: string; tkr?: string; val: number;
  type?: string; cls?: string; region?: string;
  ccy?: string;
  er?: number | null; yld?: number | null; note?: string;
}
export interface FeedExpense extends FeedRecordMeta {
  name?: string; amount?: number | null;
  /** "monthly" (default) or "annual" — apply.ts normalizes to monthly. */
  period?: string;
}
export interface FeedGoal extends FeedRecordMeta {
  name?: string; cat?: string; tier?: string;
  amt?: number | null; startYear?: number | null; endYear?: number | null;
}
export interface FeedRetirement extends FeedRecordMeta {
  retirementAge?: number | null;
  annualSpending?: number | null;
  planToAge?: number | null;
  enabled?: boolean;
}

/** The full envelope an endpoint returns (every array optional). */
export interface FeedEnvelope {
  schema: typeof FEED_SCHEMA;
  source?: { system?: string; kind?: "custodian" | "crm"; generatedAt?: string };
  household: FeedHousehold[];
  income: FeedIncome[];
  expenses: FeedExpense[];
  assets: FeedAsset[];
  liabilities: FeedLiability[];
  goals: FeedGoal[];
  holdings: FeedHolding[];
  retirement: FeedRetirement[];
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
/** Optional per-file hint so an adapter can resolve the "1.234" ambiguity. */
export interface NumberParseOpts {
  /** Which mark this source uses as the DECIMAL separator. */
  decimal?: "." | ",";
}

// Strings that look like dates must never become money. Without this,
// "2026-08-31" had its hyphens stripped and arrived as 20,260,831 — a date
// column mistaken for an amount produced a 20-million-franc position.
const DATE_LIKE = [
  /^\d{4}-\d{1,2}-\d{1,2}(?:[T ]\d.*)?$/,   // 2026-08-31, 2026-08-31T00:00:00Z
  /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/,      // 31.08.2026, 31/08/26, 8-31-2026
  /^\d{4}\/\d{1,2}\/\d{1,2}$/,              // 2026/08/31
  /^\d{1,2}[.-][A-Za-z]{3}[.-]\d{2,4}$/,    // 31-Aug-2026
];

/**
 * Locale-tolerant money parsing for custodian/CRM payloads.
 *
 * Handles the separators real feeds use — Swiss apostrophes (350'000),
 * German dots (1.234,56), Anglo commas (1,234.56), spaces incl. NBSP
 * (95 000), accounting parentheses, trailing/leading minus, DR/CR markers,
 * currency symbols and codes, percent signs, and scientific notation.
 *
 * Returns null rather than a guess whenever the input is not a number:
 * a wrong magnitude is far more dangerous than a skipped row.
 *
 * Ambiguity note: a lone separator followed by exactly three digits
 * ("1.234" / "1,234") is genuinely ambiguous — decimal in one locale,
 * thousands in another. Without a `decimal` hint this treats it as
 * THOUSANDS, which is the dominant meaning in custodian exports and keeps
 * "." and "," consistent with each other. Adapters that can infer the
 * file's convention should pass the hint.
 */
export function parseFeedNumber(input: unknown, opts: NumberParseOpts = {}): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (input == null) return null;
  let s = String(input).trim();
  if (!s) return null;

  if (DATE_LIKE.some((re) => re.test(s))) return null;

  // ── Sign, determined BEFORE any stripping ──
  let negative = false;
  if (/^\(.*\)$/.test(s)) { negative = true; s = s.slice(1, -1).trim(); }
  // A minus anywhere ahead of the digits: "-240", "CHF -240", "- 240".
  if (/(?:^|[^\d])-\s*[\d.,]/.test(s)) negative = true;
  // Trailing minus (SAP/DATEV style): "240.00-".
  if (/[\d.,]\s*-\s*$/.test(s)) negative = true;
  if (/\bDR\b/i.test(s)) negative = true;
  if (/\bCR\b/i.test(s)) negative = false;

  // ── Scientific notation, before separator handling mangles the exponent ──
  const sci = s.replace(/[\s   '’_]/g, "").replace(/[A-DF-Za-df-z$€£¥₣%‰]/g, "");
  if (/^[+-]?\d+(?:[.,]\d+)?[eE][+-]?\d+$/.test(sci)) {
    const n = Number(sci.replace(",", "."));
    if (!Number.isFinite(n)) return null;
    return negative && n > 0 ? -n : n;
  }

  // ── Reduce to digits and separators ──
  s = s.replace(/[\s   '’_]/g, "")   // spaces incl. NBSP/narrow, apostrophes
       .replace(/[A-Za-z$€£¥₣%‰]/g, "")             // currency codes/symbols, percent
       .replace(/[+-]/g, "");
  if (!s || !/\d/.test(s)) return null;
  if (!/^[\d.,]+$/.test(s)) return null;            // anything else is not a number

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  const strip = (str: string, ch: string) => str.split(ch).join("");

  if (lastComma >= 0 && lastDot >= 0) {
    // Both present: whichever comes last is the decimal mark.
    if (lastComma > lastDot) s = strip(s, ".").replace(",", ".");
    else s = strip(s, ",");
  } else if (lastComma >= 0 || lastDot >= 0) {
    const sep = lastComma >= 0 ? "," : ".";
    const occurrences = s.split(sep).length - 1;
    const after = s.length - s.lastIndexOf(sep) - 1;
    if (occurrences > 1) {
      // Repeated separators mean grouping — but only if they actually group
      // in threes. "1.2.3.4" is a version string, not 1234.
      const grouped = sep === "," ? /^\d{1,3}(,\d{3})+$/ : /^\d{1,3}(\.\d{3})+$/;
      if (!grouped.test(s)) return null;
      s = strip(s, sep);
    } else if (opts.decimal) {
      s = opts.decimal === sep ? s.replace(sep, ".") : strip(s, sep);
    } else if (after === 3) {
      s = strip(s, sep);                                   // ambiguous → thousands
    } else {
      s = s.replace(sep, ".");
    }
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -Math.abs(n) : n;
}
