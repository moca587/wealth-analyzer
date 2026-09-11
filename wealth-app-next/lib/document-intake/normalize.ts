// lib/document-intake/normalize.ts

import type {
  DocumentExtraction,
  ExtractedAsset,
  ExtractedExpenses,
  ExtractedGoal,
  ExtractedHolding,
  ExtractedHouseholdMember,
  ExtractedIncome,
  ExtractedLiability,
  ExtractedRetirement,
  RiskTolerance,
} from "./types";

/**
 * Trim a string.
 * Empty strings become null.
 */
function normalizeString(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
}

/**
 * Keep only valid finite numbers.
 */
function normalizeNumber(value: number | null | undefined): number | null {
  if (value == null) {
    return null;
  }

  return Number.isFinite(value) ? value : null;
}

/**
 * Confidence must be between 0 and 1.
 */
function normalizeConfidence(value: number | null | undefined): number | null {
  const number = normalizeNumber(value);

  if (number === null) {
    return null;
  }

  return Math.min(1, Math.max(0, number));
}

/**
 * Convert a year-like value to a whole number.
 *
 * Example:
 * 2028.7 -> 2028
 */
function normalizeYear(value: number | null | undefined): number | null {
  const number = normalizeNumber(value);

  if (number === null) {
    return null;
  }

  const year = Math.round(number);

  if (year < 1900 || year > 2200) {
    return null;
  }

  return year;
}

/**
 * Normalize ages used by retirement planning.
 */
function normalizeAge(value: number | null | undefined): number | null {
  const number = normalizeNumber(value);

  if (number === null) {
    return null;
  }

  const age = Math.round(number);

  if (age < 0 || age > 120) {
    return null;
  }

  return age;
}

/**
 * Normalize ticker symbols.
 *
 * " voo " -> "VOO"
 */
function normalizeTicker(value: string | null | undefined): string | null {
  const ticker = normalizeString(value);

  return ticker ? ticker.toUpperCase() : null;
}

/**
 * Normalize country/currency codes.
 *
 * "us"  -> "US"
 * "usd" -> "USD"
 */
function normalizeCode(value: string | null | undefined): string | null {
  const code = normalizeString(value);

  return code ? code.toUpperCase() : null;
}

/**
 * The new app no longer exposes very_conservative
 * or very_aggressive.
 */
function normalizeRiskTolerance(
  value: RiskTolerance | null | undefined,
): RiskTolerance | null {
  if (!value) {
    return null;
  }

  if (value === "very_conservative") {
    return "conservative";
  }

  if (value === "very_aggressive") {
    return "aggressive";
  }

  return value;
}

function normalizeHouseholdMember(
  member: ExtractedHouseholdMember,
): ExtractedHouseholdMember {
  return {
    ...member,

    first: normalizeString(member.first),
    last: normalizeString(member.last),
    dob: normalizeString(member.dob),

    street: normalizeString(member.street),
    apt: normalizeString(member.apt),
    city: normalizeString(member.city),
    state: normalizeString(member.state),
    postal: normalizeString(member.postal),

    country: normalizeCode(member.country),

    relationship: normalizeString(member.relationship),

    riskTolerance: normalizeRiskTolerance(member.riskTolerance),

    timeHorizon: member.timeHorizon ?? null,

    confidence: normalizeConfidence(member.confidence),

    sourceQuote: normalizeString(member.sourceQuote),
  };
}

function normalizeIncome(income: ExtractedIncome): ExtractedIncome {
  return {
    ...income,

    primary: normalizeNumber(income.primary),
    secondary: normalizeNumber(income.secondary),
    raisePct: normalizeNumber(income.raisePct),

    confidence: normalizeConfidence(income.confidence),

    sourceQuote: normalizeString(income.sourceQuote),
  };
}

function normalizeExpenses(expenses: ExtractedExpenses): ExtractedExpenses {
  return {
    ...expenses,

    living: normalizeNumber(expenses.living),
    insurance: normalizeNumber(expenses.insurance),
    other: normalizeNumber(expenses.other),
    annualSavings: normalizeNumber(expenses.annualSavings),
    inflationPct: normalizeNumber(expenses.inflationPct),

    confidence: normalizeConfidence(expenses.confidence),

    sourceQuote: normalizeString(expenses.sourceQuote),
  };
}

function normalizeAsset(asset: ExtractedAsset): ExtractedAsset {
  return {
    ...asset,

    label: normalizeString(asset.label),

    accountTypeHint: normalizeString(asset.accountTypeHint),

    value: normalizeNumber(asset.value),

    country: normalizeCode(asset.country),

    ccy: normalizeCode(asset.ccy),

    propertyValue: normalizeNumber(asset.propertyValue),

    otherValue: normalizeNumber(asset.otherValue),

    confidence: normalizeConfidence(asset.confidence),

    sourceQuote: normalizeString(asset.sourceQuote),
  };
}

function normalizeLiability(liability: ExtractedLiability): ExtractedLiability {
  return {
    ...liability,

    type: normalizeString(liability.type),

    label: normalizeString(liability.label),

    balance: normalizeNumber(liability.balance),

    ratePct: normalizeNumber(liability.ratePct),

    years:
      liability.years == null ? null : Math.max(0, Math.round(liability.years)),

    confidence: normalizeConfidence(liability.confidence),

    sourceQuote: normalizeString(liability.sourceQuote),
  };
}

function normalizeGoal(goal: ExtractedGoal): ExtractedGoal {
  return {
    ...goal,

    name: normalizeString(goal.name),

    amount: normalizeNumber(goal.amount),

    homePrice: normalizeNumber(goal.homePrice),

    startYear: normalizeYear(goal.startYear),

    endYear: normalizeYear(goal.endYear),

    category: goal.category ?? null,

    tier: goal.tier ?? null,

    confidence: normalizeConfidence(goal.confidence),

    sourceQuote: normalizeString(goal.sourceQuote),
  };
}

function normalizeHolding(holding: ExtractedHolding): ExtractedHolding {
  return {
    ...holding,

    name: normalizeString(holding.name),

    tkr: normalizeTicker(holding.tkr),

    val: normalizeNumber(holding.val),

    type: normalizeString(holding.type),

    cls: normalizeString(holding.cls),

    region: normalizeString(holding.region),

    er: normalizeNumber(holding.er),

    yld: normalizeNumber(holding.yld),

    note: normalizeString(holding.note),

    confidence: normalizeConfidence(holding.confidence),

    sourceQuote: normalizeString(holding.sourceQuote),
  };
}

function normalizeRetirement(
  retirement: ExtractedRetirement,
): ExtractedRetirement {
  return {
    ...retirement,

    desiredAnnualSpend: normalizeNumber(retirement.desiredAnnualSpend),

    client1RetirementAge: normalizeAge(retirement.client1RetirementAge),

    client2RetirementAge: normalizeAge(retirement.client2RetirementAge),

    client1PensionAnnual: normalizeNumber(retirement.client1PensionAnnual),

    client1PensionStartAge: normalizeAge(retirement.client1PensionStartAge),

    client2PensionAnnual: normalizeNumber(retirement.client2PensionAnnual),

    client2PensionStartAge: normalizeAge(retirement.client2PensionStartAge),

    confidence: normalizeConfidence(retirement.confidence),

    sourceQuote: normalizeString(retirement.sourceQuote),
  };
}

/**
 * Normalize raw extracted document data from
 * CSV, Claude, OFX/QFX, etc.
 */
export function normalizeExtraction(
  raw: DocumentExtraction,
): DocumentExtraction {
  return {
    household: raw.household?.map(normalizeHouseholdMember),

    income: raw.income?.map(normalizeIncome),

    expenses: raw.expenses ? normalizeExpenses(raw.expenses) : undefined,

    assets: raw.assets?.map(normalizeAsset),

    liabilities: raw.liabilities?.map(normalizeLiability),

    goals: raw.goals?.map(normalizeGoal),

    holdings: raw.holdings?.map(normalizeHolding),

    retirement: raw.retirement
      ? normalizeRetirement(raw.retirement)
      : undefined,
  };
}
