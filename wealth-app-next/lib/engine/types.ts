// ─────────────────────────────────────────────────────────────────
// Types
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
  | "US"
  | "CA"
  | "GB"
  | "AU"
  | "CH"
  | "EU"
  | "JP"
  | "SG"
  | "HK"
  | "CN"
  | "TW"
  | "KR"
  | "IN"
  | "ID"
  | "MX"
  | "BR"
  | "SA"
  | "ZA"
  | "OTHER"
  // Individual eurozone members (each has its own account taxonomy)
  | "DE"
  | "FR"
  | "IT"
  | "ES"
  | "NL"
  | "BE"
  | "AT"
  | "IE"
  | "PT"
  | "LU"
  | "FI"
  | "GR"
  | "CY"
  | "HR"
  | "EE"
  | "LV"
  | "LT"
  | "SK"
  | "SI"
  | "MT";

// Stores the funding calculation for one financial goal
export type GoalFundingMetric = {
  goalId: string;
  presentValueCost: number;
  allocatedResources: number;

  // allocatedResources / presentValueCost
  fundingRatio: number;
};

// Represents one year of the required withdrawal projection
export type RequiredWithdrawalRow = {
  age: number;
  year: number;
  poolStart: number;
  requiredRate: number;
  withdrawal: number;
  estimatedTax: number;
  poolEnd: number;
};

// Contains the compete required withdrawal analysis
export type RequiredWithdrawalProjection = {
  rule: string;
  startAge: number;
  totalRequired: number;
  estimatedTax: number;
  rows: RequiredWithdrawalRow[];
};

// Result of analyzing the retirement-account conversion window
export type RothConversionProjection = {
  startAge: number;
  endAge: number;
  windowYears: number;
  taxDeferredPool: number;
  suggestedAnnualConversion: number;
  estimatedTaxRate: number;
  estimatedAnnualTax: number;
  estimatedTotalTax: number;
};

// Recommendation for where one asset class should be ideally held
// from a tax-efficiency perspective
export type AssetLocationRecommendation = {
  assetClass: AssetClass;
  value: number;
  recommendedLocation: string;
  reason: string;
};

// Complete tax-efficiency analysis of the plan's asset location
export type AssetLocationAnalysis = {
  taxFree: number;
  taxDeferred: number;
  taxable: number;

  score: number;

  annualTaxDrag: number;
  cumulativeTaxDrag: number;

  shortfallCostBasisTax: number;

  recommendations: AssetLocationRecommendation[];
};

// Result of the behavior-gap simulation
// Compares staying invested vs. panicking and selling at the first sign of trouble
export type BehaviorGapResult = {
  years: number;

  disciplinedPaths: number[][];
  panicPaths: number[][];

  startingInvested: number;

  staysInvestedMedian: number;
  panicMedian: number;

  panicCost: number;
  annualizedGap: number;

  panicShare: number;
};

// Represents one person receiving part of the household's estate
export type Beneficiary = {
  id: string;
  name: string;
  relationship?: string;
  share: number; // decimal: 0.5 = 50%
};

// Result of the estate-transfer calculation
export type EstateTransferSummary = {
  medianProjectedEstate: number;
  lifeInsuranceBenefit: number;

  grossEstate: number;

  estateTaxExemption: number;
  estateTaxRate: number;
  taxableEstate: number;
  estimatedEstateTax: number;

  netToBeneficiaries: number;
};

// Country-specific default assumptions used by the estate-tax analysis
export type EstateTaxDefaults = {
  exemption: number;
  rate: number;
  label: string;
  description: string;
};

// Indicates whether a deterministic cash-flow row occurs
// before or after retirement
export type CashFlowPhase = "Working" | "Retired";

export type ReturnRiskMetrics = {
  grossReturn: number;
  advisoryFee: number;
  netReturn: number;
  volatility: number;
};

// Represents one year of the linear cash-flow projection
export interface LinearCashFlowRow {
  year: number;
  age: number;

  phase: CashFlowPhase;

  earnedIncome: number;
  pensionRmdIncome: number;

  incomeTax: number;
  expenses: number;
  debtService: number;

  savingsTarget: number;
  surplusDeficit: number;

  goalOutflow: number;

  cash: number;
  investments: number;
  retirementPool: number;

  propertyValue: number;
  otherAssets: number;

  totalDebt: number;
  unfunded: number;

  netWorth: number;

  notes: string[];
}

// Complete result returned by buildLinearCashFlow()
export interface LinearCashFlowResult {
  rows: LinearCashFlowRow[];

  startYear: number;
  startAge: number;
  endAge: number;

  investmentReturn: number;
  portfolioMean: number;
  portfolioSigma: number;

  propertyGrowth: number;
  retirementPoolGrowth: number;
}

/*
 * Some legacy cash-flow inputs do not yet have a clear canonical
 * field in the migrated WealthPlan schema.
 *
 * Keep those assumptions explicit rather than hiding hardcoded
 * values inside the engine.
 */
export interface LinearCashFlowOptions {
  endAge?: number;

  /*
   * The legacy UI has an annual savings-target field.
   *
   * Until that field is present on the migrated WealthPlan,
   * pass it into this engine explicitly.
   */
  annualSavingsTarget?: number;

  /*
   * Legacy deterministic retirement-account return.
   * 0.035 = 3.5%.
   */
  retirementPoolGrowth?: number;

  /*
   * During accumulation, remaining positive surplus can be
   * divided between cash and investments.
   *
   * Legacy description uses 30% cash / 70% invested.
   */
  cashSurplusShare?: number;

  /*
   * Anchor the calculation to a fixed calendar year when
   * reproducibility is needed.
   */
  asOfYear?: number;

  investmentReturnOverride?: number;
}

export interface Client {
  id: string;
  first: string;
  last: string;
  dob?: string; // ISO date YYYY-MM-DD
  country?: CountryCode;
  state?: string; // state/province/canton
  city?: string;
  zip?: string;
  risk?: RiskProfile;
  horizon?: TimeHorizon;
}

export interface Child {
  id: string;
  first: string;
  last: string;
  dob: string; // ISO date YYYY-MM-DD
}

export interface IncomeStream {
  id: string;
  clientId: string; // which client owns it (for two-client households)
  source: string; // "salary", "bonus", "dividends", etc.
  amount: number; // annual, in plan currency
  taxable?: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string; // "Rent/mortgage", "Food", "Transport", etc.
  amount: number; // monthly, in plan currency
}

export type AssetClass =
  | "equity"
  | "fixed_income"
  | "real_estate"
  | "commodity"
  | "cash"
  | "mixed"
  | "alternative"
  | "crypto";

export interface Asset {
  id: string;
  type: string; // account type from country-specific menu
  group?: string; // group label (e.g. "Retirement", "Taxable", "Cash")
  label?: string; // free-form label
  value: number;
  liquid: boolean;
  country?: CountryCode;
  cls?: AssetClass;
  note?: string;

  owner?: string;
  ccy?: string;
  withdrawAge?: number | null;
  /**
   * Stable origin key when this record came from a data feed, e.g.
   * "acct:CH93…" or "hold:CHSPI". Lets a later sync find the same record even
   * if its label changed, and keeps a security position from ever matching a
   * bank account. Absent on hand-entered records.
   */
  feedRef?: string;
}

export interface EquityGrant {
  id: string;
  kind: "rsu" | "nqso" | "iso";
  owner: string;

  ticker: string;
  shares: number;

  strike: number;
  price: number;
  growth: number;

  vestStart: number;
  vestYears: number;

  label: string;
}

export interface InsurancePolicy {
  id: string;

  type:
    | "term_life"
    | "whole_life"
    | "universal_life"
    | "disability"
    | "ltc"
    | "other";

  insured: string;
  benefit: number;
  cashValue: number;
  annualPremium: number;

  beneficiary?: string;
  label: string;
}

/**
 * A security POSITION inside an investable account — the detail the
 * `assets` list does not hold (an Asset is an account-level balance).
 *
 * Holdings are for PORTFOLIO ANALYTICS (allocation, blended cost/yield),
 * NOT for net worth: net worth sums `assets`, so a holding and its parent
 * account are two granularities of the same money and must never both be
 * counted. `accountRef` links a holding to the account it sits in.
 *
 * The point of a durable holding is the per-position facts a custodian
 * feed carries and the account balance does not — expense ratio, yield,
 * region — which the feed→plan apply used to discard.
 */
export interface Holding {
  id: string;
  name: string;
  ticker?: string;
  isin?: string;

  instrumentType?: string;
  cls?: AssetClass;
  value: number; // market value, in plan currency
  er?: number; // expense ratio, percent (0.20 = 0.20%)
  yld?: number; // distribution yield, percent
  region?: string;
  ccy?: string;
  /** The account this position sits in — feedRef of the parent Asset, e.g.
   *  "acct:CH93…". Lets a re-sync match, and ties a holding to its balance. */
  accountRef?: string;
  /** See Asset.feedRef — "hold:<ticker>" for a fed position. */
  feedRef?: string;
  note?: string;
}

export interface Loan {
  id: string;
  type: string; // "Mortgage", "Auto", "Student", "Credit Card", etc.
  label?: string;
  bal: number; // current balance
  rate: number; // annual % (e.g. 6.5 means 6.5%)
  yrs: number; // remaining years

  owner?: string;

  /** See Asset.feedRef. */
  feedRef?: string;
}

export interface Goal {
  id: string;
  name: string;
  cat?: string; // "Retirement", "Education", "Travel", etc.
  tier?: "essential" | "important" | "aspirational";
  amt: number; // annual amount needed
  startYear: number; // calendar year (e.g. 2050)
  endYear: number; // calendar year (>= startYear)
}

/** A pension / annuity / state benefit that pays out from a given age. */
export interface Pension {
  id: string;
  label: string;
  clientId?: string;
  annualAmount: number; // annual payout, in plan currency (today's dollars)
  startAge: number; // age the benefit begins
  colaRate?: number; // annual cost-of-living adjustment (decimal); default 0
}

/**
 * Retirement / decumulation settings. When `enabled`, the simulation runs an
 * accumulate→decumulate life-cycle: the primary client's salary stops at
 * `retirementAge`, `annualSpending` replaces working expenses, pensions are
 * credited as income, and the portfolio is drawn down to fund the gap.
 */
export interface Retirement {
  enabled?: boolean;
  retirementAge: number; // age the primary client stops working
  annualSpending: number; // desired annual retirement spend (today's dollars)
  planToAge?: number; // model horizon age (default 90)
}

// ─── Top-level plan ───────────────────────────────────────────────
export interface WealthPlan {
  version: number;
  currency: string; // "USD", "EUR", "CHF", etc.
  inflationRate: number; // decimal (0.03 = 3%)
  annualSavings: number;
  annualRaiseRate: number;
  inflationRegion?: string;
  clients: Client[]; // 1 or 2
  children: Child[];
  incomes: IncomeStream[];
  expenses: ExpenseCategory[];
  assets: Asset[];
  loans: Loan[];
  goals: Goal[];
  /**
   * Security positions inside the investable accounts. Optional and
   * additive: net worth and the engine use `assets`; the portfolio
   * compare/report prefer `holdings` when present for real per-position
   * cost/yield. Populated by the custodian feed and the legacy importer.
   */
  holdings?: Holding[];

  linkedPortfolioAssetId?: string;

  retirement?: Retirement;
  pensions?: Pension[];
  notes?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO

  equityGrants?: EquityGrant[];

  returnMean?: number;
  returnVolatility?: number;

  insurancePolicies?: InsurancePolicy[];
  includeInsurancePremiums?: boolean;

  // Tax fields
  taxJurisdiction?: CountryCode;

  incomeTaxSource?: "auto" | "manual" | "none";

  flatIncomeTaxRate?: number;

  capitalGainsTaxRate?: number;

  portfolioTurnover?: number;

  applyTaxToSimulation?: boolean;

  beneficiaries?: Beneficiary[];
  estateTaxExemption?: number;
  estateTaxRate?: number;
}

// ─── Simulation inputs/outputs ───────────────────────────────────
export interface SimulationInput {
  plan: WealthPlan;
  sims: 200 | 500 | 1000;
  years: number; // typically 30-40
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
  inputHash: string; // for caching
  sims: number;
  years: number;
  /** Paths as [sim_index][year_index] of net worth */
  paths: number[][];
  /** Yearly percentiles */
  // percentiles: {
  //   p10: number[]; p25: number[]; p50: number[];
  //   p75: number[]; p80: number[]; p90: number[];
  // };
  percentiles: Record<string, number[]>;

  realPercentiles: Record<string, number[]>;
  /** Goal probability of success (calendar-year aware) */
  goalSuccess: Array<{ goalId: string; goalName: string; probability: number }>;
  /** Aggregate stats at final year */
  // final: {
  //   p10: number; p25: number; p50: number; p75: number; p90: number;
  //   mean: number;
  // };
  final: Record<string, number> & { mean: number };

  realFinal: Record<string, number>;

  medianUnfunded: number;
  depletionProbability?: number;
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
