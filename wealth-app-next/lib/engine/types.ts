// ─────────────────────────────────────────────────────────────────
// Domain types for the wealth-analyzer plan
// Mirrors the data shapes from the single-file HTML app so the
// migration is 1:1 — same fields, same units, same calendar-year
// semantics for goals.
// ─────────────────────────────────────────────────────────────────

export type RiskProfile =
  | "very_conservative"
  | "conservative"
  | "moderately_conservative"
  | "moderate"
  | "moderately_aggressive"
  | "aggressive"
  | "very_aggressive";

export type TimeHorizon = "0_5" | "5_10" | "10_15" | "15_plus";

export type CountryCode =
  // Original 19
  | "US" | "CA" | "GB" | "AU" | "CH" | "EU" | "JP" | "SG" | "HK"
  | "CN" | "TW" | "KR" | "IN" | "ID" | "MX" | "BR" | "SA" | "ZA" | "OTHER"
  // Individual eurozone members (each has its own account taxonomy)
  | "DE" | "FR" | "IT" | "ES" | "NL" | "BE" | "AT" | "IE" | "PT" | "LU"
  | "FI" | "GR" | "CY" | "HR" | "EE" | "LV" | "LT" | "SK" | "SI" | "MT";

export interface Client {
  id: string;
  first: string;
  last: string;
  dob?: string;       // ISO date YYYY-MM-DD
  country?: CountryCode;
  state?: string;     // state/province/canton
  city?: string;
  zip?: string;
  risk?: RiskProfile;
  horizon?: TimeHorizon;
}

export interface Child {
  id: string;
  first: string;
  last: string;
  dob: string;        // ISO date YYYY-MM-DD
}

export interface IncomeStream {
  id: string;
  clientId: string;   // which client owns it (for two-client households)
  source: string;     // "salary", "bonus", "dividends", etc.
  amount: number;     // annual, in plan currency
  taxable?: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;       // "Rent/mortgage", "Food", "Transport", etc.
  amount: number;     // monthly, in plan currency
}

export type AssetClass =
  | "equity" | "fixed_income" | "real_estate" | "commodity"
  | "cash" | "mixed" | "alternative" | "crypto";

export interface Asset {
  id: string;
  type: string;       // account type from country-specific menu
  group?: string;     // group label (e.g. "Retirement", "Taxable", "Cash")
  label?: string;     // free-form label
  value: number;
  liquid: boolean;
  country?: CountryCode;
  cls?: AssetClass;
  note?: string;
}

export interface Loan {
  id: string;
  type: string;       // "Mortgage", "Auto", "Student", "Credit Card", etc.
  label?: string;
  bal: number;        // current balance
  rate: number;       // annual % (e.g. 6.5 means 6.5%)
  yrs: number;        // remaining years
}

export interface Goal {
  id: string;
  name: string;
  cat?: string;       // "Retirement", "Education", "Travel", etc.
  tier?: "essential" | "important" | "aspirational";
  amt: number;        // annual amount needed
  startYear: number;  // calendar year (e.g. 2050)
  endYear: number;    // calendar year (>= startYear)
}

/** A pension / annuity / state benefit that pays out from a given age. */
export interface Pension {
  id: string;
  label: string;
  clientId?: string;
  annualAmount: number;   // annual payout, in plan currency (today's dollars)
  startAge: number;       // age the benefit begins
  colaRate?: number;      // annual cost-of-living adjustment (decimal); default 0
}

/**
 * Retirement / decumulation settings. When `enabled`, the simulation runs an
 * accumulate→decumulate life-cycle: the primary client's salary stops at
 * `retirementAge`, `annualSpending` replaces working expenses, pensions are
 * credited as income, and the portfolio is drawn down to fund the gap.
 */
export interface Retirement {
  enabled?: boolean;
  retirementAge: number;   // age the primary client stops working
  annualSpending: number;  // desired annual retirement spend (today's dollars)
  planToAge?: number;      // model horizon age (default 90)
}

// ─── Top-level plan ───────────────────────────────────────────────
export interface WealthPlan {
  version: number;
  currency: string;       // "USD", "EUR", "CHF", etc.
  inflationRate: number;  // decimal (0.03 = 3%)
  inflationRegion?: string;
  clients: Client[];      // 1 or 2
  children: Child[];
  incomes: IncomeStream[];
  expenses: ExpenseCategory[];
  assets: Asset[];
  loans: Loan[];
  goals: Goal[];
  retirement?: Retirement;
  pensions?: Pension[];
  notes?: string;
  createdAt: string;      // ISO
  updatedAt: string;      // ISO
}

// ─── Simulation inputs/outputs ───────────────────────────────────
export interface SimulationInput {
  plan: WealthPlan;
  sims: 200 | 500 | 1000;
  years: number;              // typically 30-40
  /** Fixes the PRNG for a byte-identical repeat run (tests, cache checks). Omit for a real random run. */
  seed?: number;
  /**
   * Base calendar year the run is anchored to. Drives goal-year offsets and the
   * primary client's current age. Omit for a live run (defaults to the current
   * year); pass an explicit value so a seeded run is fully reproducible and does
   * not drift as the wall clock advances (golden-master tests rely on this).
   */
  asOfYear?: number;
}

export interface SimulationResult {
  inputHash: string;          // for caching
  sims: number;
  years: number;
  /** Paths as [sim_index][year_index] of net worth */
  paths: number[][];
  /** Yearly percentiles */
  percentiles: {
    p10: number[]; p25: number[]; p50: number[];
    p75: number[]; p80: number[]; p90: number[];
  };
  /** Goal probability of success (calendar-year aware) */
  goalSuccess: Array<{ goalId: string; goalName: string; probability: number }>;
  /** Aggregate stats at final year */
  final: {
    p10: number; p25: number; p50: number; p75: number; p90: number;
    mean: number;
  };
  /** Retirement "will my money last?" summary — present only when the plan enables retirement. */
  retirement?: {
    enabled: boolean;
    /** Fraction of sims whose portfolio never runs out before planToAge (higher is better). */
    successProbability: number;
    /** Fraction of sims that deplete before planToAge (1 − successProbability). */
    depletionProbability: number;
    retirementAge: number;
    planToAge: number;
  };
  runMs: number;
}
