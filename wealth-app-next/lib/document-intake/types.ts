// lib/document-intake/types.ts

// ─────────────────────────────────────────────────────────────
// Shared legacy extraction types
// ─────────────────────────────────────────────────────────────

export type ExtractionConfidence = number | null;
export type SourceQuote = string | null;

// ─────────────────────────────────────────────────────────────
// Household
// ─────────────────────────────────────────────────────────────

export type HouseholdRole = "client1" | "client2" | "child";

export type RiskTolerance =
  | "very_conservative"
  | "conservative"
  | "moderately_conservative"
  | "moderate"
  | "moderately_aggressive"
  | "aggressive"
  | "very_aggressive";

export type TimeHorizon = "1_5" | "5_10" | "10_15" | "15_plus";

export type ExtractedHouseholdMember = {
  role: HouseholdRole;

  first?: string | null;
  last?: string | null;
  dob?: string | null;

  street?: string | null;
  apt?: string | null;
  city?: string | null;
  state?: string | null;
  postal?: string | null;

  country?: string | null;

  relationship?: string | null;

  riskTolerance?: RiskTolerance | null;
  timeHorizon?: TimeHorizon | null;

  confidence?: ExtractionConfidence;
  sourceQuote?: SourceQuote;
};

// ─────────────────────────────────────────────────────────────
// Income
// ─────────────────────────────────────────────────────────────

export type IncomeOwner = "client1" | "client2";

export type ExtractedIncome = {
  who?: IncomeOwner;

  primary?: number | null;
  secondary?: number | null;
  raisePct?: number | null;

  confidence?: ExtractionConfidence;
  sourceQuote?: SourceQuote;
};

// ─────────────────────────────────────────────────────────────
// Expenses
// ─────────────────────────────────────────────────────────────

export type ExtractedExpenses = {
  living?: number | null;
  insurance?: number | null;
  other?: number | null;

  annualSavings?: number | null;
  inflationPct?: number | null;

  confidence?: ExtractionConfidence;
  sourceQuote?: SourceQuote;
};

// ─────────────────────────────────────────────────────────────
// Assets
// ─────────────────────────────────────────────────────────────

export type ExtractedAsset = {
  label?: string | null;

  /**
   * Legacy Claude extraction does not require the exact account type.
   * It extracts a hint which can later be normalized against
   * COUNTRY_ACCOUNTS.
   */
  accountTypeHint?: string | null;

  value?: number | null;

  country?: string | null;
  ccy?: string | null;

  propertyValue?: number | null;
  otherValue?: number | null;

  confidence?: ExtractionConfidence;
  sourceQuote?: SourceQuote;
};

// ─────────────────────────────────────────────────────────────
// Liabilities
// ─────────────────────────────────────────────────────────────

/**
 * In legacy this enum is generated dynamically from:
 *
 * Object.keys(LOAN_LABELS)
 *
 * Keep it string-based here so document intake stays independent
 * from the UI constants. We can make this stricter later.
 */
export type ExtractedLoanType = string;

export type ExtractedLiability = {
  type?: ExtractedLoanType | null;

  label?: string | null;

  balance?: number | null;
  ratePct?: number | null;
  years?: number | null;

  confidence?: ExtractionConfidence;
  sourceQuote?: SourceQuote;
};

// ─────────────────────────────────────────────────────────────
// Goals
// ─────────────────────────────────────────────────────────────

export type GoalCategory =
  | "retirement"
  | "home"
  | "education"
  | "travel"
  | "emergency"
  | "business"
  | "wedding"
  | "car"
  | "health"
  | "legacy"
  | "other";

export type GoalTier = "essential" | "important" | "aspirational" | "legacy";

export type ExtractedGoal = {
  name?: string | null;

  amount?: number | null;
  homePrice?: number | null;

  startYear?: number | null;
  endYear?: number | null;

  category?: GoalCategory | null;
  tier?: GoalTier | null;

  confidence?: ExtractionConfidence;
  sourceQuote?: SourceQuote;
};

// ─────────────────────────────────────────────────────────────
// Investment Holdings
// ─────────────────────────────────────────────────────────────

/**
 * Legacy generates these values dynamically from:
 *
 * Object.keys(INV_TYPE_LABELS)
 * Object.keys(INV_CLASS_LABELS)
 * Object.keys(INV_REGION_LABELS)
 *
 * We can replace these strings with actual unions/imported types
 * once we connect document intake to the portfolio engine.
 */
export type ExtractedInvestmentType = string;
export type ExtractedInvestmentClass = string;
export type ExtractedInvestmentRegion = string;

export type ExtractedHolding = {
  name?: string | null;

  /**
   * Legacy property name for ticker.
   */
  tkr?: string | null;

  /**
   * Legacy property name for market value.
   */
  val?: number | null;

  type?: ExtractedInvestmentType | null;
  cls?: ExtractedInvestmentClass | null;
  region?: ExtractedInvestmentRegion | null;

  /**
   * Expense ratio, represented as a whole percentage.
   *
   * Example:
   * 0.03% => 0.03
   */
  er?: number | null;

  /**
   * Yield as a whole percentage.
   */
  yld?: number | null;

  note?: string | null;

  confidence?: ExtractionConfidence;
  sourceQuote?: SourceQuote;
};

// ─────────────────────────────────────────────────────────────
// Retirement
// ─────────────────────────────────────────────────────────────

export type ExtractedRetirement = {
  desiredAnnualSpend?: number | null;

  client1RetirementAge?: number | null;
  client2RetirementAge?: number | null;

  client1PensionAnnual?: number | null;
  client1PensionStartAge?: number | null;

  client2PensionAnnual?: number | null;
  client2PensionStartAge?: number | null;

  confidence?: ExtractionConfidence;
  sourceQuote?: SourceQuote;
};

// ─────────────────────────────────────────────────────────────
// Complete extraction result
// ─────────────────────────────────────────────────────────────

export type DocumentExtraction = {
  household?: ExtractedHouseholdMember[];

  income?: ExtractedIncome[];

  expenses?: ExtractedExpenses;

  assets?: ExtractedAsset[];

  liabilities?: ExtractedLiability[];

  goals?: ExtractedGoal[];

  holdings?: ExtractedHolding[];

  retirement?: ExtractedRetirement;
};

// ─────────────────────────────────────────────────────────────
// Useful empty value for deterministic parsers
// ─────────────────────────────────────────────────────────────

export const EMPTY_DOCUMENT_EXTRACTION: DocumentExtraction = {
  household: [],
  income: [],
  assets: [],
  liabilities: [],
  goals: [],
  holdings: [],
};
