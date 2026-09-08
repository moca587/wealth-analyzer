// ─────────────────────────────────────────────────────────────────
// Domain constants — risk profiles, time horizons, inflation regions
// Ported 1:1 from the HTML app for behavior compatibility.
// ─────────────────────────────────────────────────────────────────

import type { AssetClass, RiskProfile, TimeHorizon } from "./types";

import type { CountryCode, EstateTaxDefaults } from "./types";

export const ESTATE_TAX_DEFAULTS: Partial<Record<string, EstateTaxDefaults>> = {
  US: {
    exemption: 13_610_000,
    rate: 0.4,
    label: "United States — Estate tax",
    description:
      "Federal estate tax model with a configurable exemption and tax rate.",
  },

  CA: {
    exemption: 0,
    rate: 0,
    label: "Canada — Estate transfer",
    description:
      "No general federal estate tax modeled here; other taxes and deemed disposition rules are outside this simplified estimate.",
  },
};

export const RISK_PROFILES: Record<
  RiskProfile,
  {
    label: string;
    mu: number;
    sigma: number;
    note: string;
  }
> = {
  very_conservative: {
    label: "Very Conservative",
    mu: 3.5,
    sigma: 4,
    note: "Capital-preservation focus. Mostly cash & short bonds, minimal equity (~10–20%).",
  },

  conservative: {
    label: "Conservative",
    mu: 4.5,
    sigma: 7,
    note: "Income-oriented. Heavy fixed income, small equity allocation (~20–30%).",
  },

  moderately_conservative: {
    label: "Moderately Conservative",
    mu: 5.5,
    sigma: 9,
    note: "Balanced tilt toward safety. ~40% equities, 60% fixed income.",
  },

  moderate: {
    label: "Moderate",
    mu: 7,
    sigma: 12,
    note: "Classic 60/40 balanced portfolio. Equal focus on growth and stability.",
  },

  moderately_aggressive: {
    label: "Moderately Aggressive",
    mu: 8.5,
    sigma: 15,
    note: "Growth-oriented. ~70–75% equities, 25–30% bonds.",
  },

  aggressive: {
    label: "Aggressive",
    mu: 10,
    sigma: 18,
    note: "Primarily equities (~85–90%). Accepts significant short-term volatility.",
  },

  very_aggressive: {
    label: "Very Aggressive",
    mu: 12,
    sigma: 22,
    note: "Maximum growth. ~95–100% equities incl. emerging/small-cap. Highest volatility.",
  },
};

export const HORIZON_PROFILES: Record<
  TimeHorizon,
  {
    label: string;
    years: number;
    note: string;
  }
> = {
  "0_5": {
    label: "0–5 years",
    years: 5,
    note: "Short-term focus. Preserve capital. Favour low-volatility, income-oriented assets.",
  },

  "5_10": {
    label: "5–10 years",
    years: 10,
    note: "Medium-term. Balanced approach — measured equity exposure with a stability anchor.",
  },

  "10_15": {
    label: "10–15 years",
    years: 15,
    note: "Medium-to-long term. Can tolerate moderate volatility for meaningful compound growth.",
  },

  "15_plus": {
    label: "15+ years",
    years: 30,
    note: "Long horizon. Equity-heavy allocation is appropriate. Time smooths out volatility.",
  },
};

/** 50-year historical inflation averages (1974-2024) per region. */
export const INFLATION_REGIONS: Record<
  string,
  { label: string; rate: number; note?: string }
> = {
  CH: {
    label: "Switzerland",
    rate: 0.021,
    note: "World's lowest sustained inflation",
  },
  JP: {
    label: "Japan",
    rate: 0.02,
    note: "Deflation era 1998–2012 pulls down",
  },
  SA: { label: "Saudi Arabia", rate: 0.025, note: "Oil-pegged economy" },
  SG: { label: "Singapore", rate: 0.028 },
  EU: { label: "Euro zone", rate: 0.031, note: "HICP blended" },
  CA: { label: "Canada", rate: 0.037 },
  US: { label: "United States", rate: 0.038, note: "CPI-U" },
  CN: { label: "China & Taiwan", rate: 0.039 },
  HK: { label: "Hong Kong", rate: 0.041 },
  AU: { label: "Australia", rate: 0.044 },
  GB: { label: "United Kingdom", rate: 0.048 },
  KR: { label: "South Korea", rate: 0.052 },
  IN: { label: "India", rate: 0.074 },
  ZA: { label: "South Africa", rate: 0.089 },
  ID: { label: "Indonesia", rate: 0.116, note: "1998 spike" },
  MX: { label: "Mexico", rate: 0.152, note: "1980s–90s crisis era" },
  BR: {
    label: "Brazil",
    rate: 0.585,
    note: "Hyperinflation pre-1994 — consider override to ~7%",
  },
};

export const COUNTRY_LABELS: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  GB: "United Kingdom",
  AU: "Australia",
  CH: "Switzerland",

  // European Union
  AT: "Austria",
  BE: "Belgium",
  BG: "Bulgaria",
  HR: "Croatia",
  CY: "Cyprus",
  CZ: "Czechia",
  DK: "Denmark",
  EE: "Estonia",
  FI: "Finland",
  FR: "France",
  DE: "Germany",
  GR: "Greece",
  HU: "Hungary",
  IE: "Ireland",
  IT: "Italy",
  LV: "Latvia",
  LT: "Lithuania",
  LU: "Luxembourg",
  MT: "Malta",
  NL: "Netherlands",
  PL: "Poland",
  PT: "Portugal",
  RO: "Romania",
  SK: "Slovakia",
  SI: "Slovenia",
  ES: "Spain",
  SE: "Sweden",

  JP: "Japan",
  SG: "Singapore",
  HK: "Hong Kong",
  CN: "China",
  TW: "Taiwan",
  KR: "South Korea",
  IN: "India",
  ID: "Indonesia",
  MX: "Mexico",
  BR: "Brazil",
  SA: "Saudi Arabia",
  ZA: "South Africa",
  OTHER: "Other",
};

/**
 * Maps a country code to the INFLATION_REGIONS key that best represents it.
 * Not every country has its own region: individual eurozone members share
 * the blended "EU" rate, and Taiwan shares the "CN" (China & Taiwan) rate —
 * a direct code lookup would miss those and fall through to a default.
 */
const EUROZONE_MEMBERS = new Set([
  "DE",
  "FR",
  "IT",
  "ES",
  "NL",
  "BE",
  "AT",
  "IE",
  "PT",
  "LU",
  "FI",
  "GR",
  "CY",
  "HR",
  "EE",
  "LV",
  "LT",
  "SK",
  "SI",
  "MT",
  "BG",
]);

export function inflationRegionForCountry(country: string): string {
  if (INFLATION_REGIONS[country]) return country;
  if (EUROZONE_MEMBERS.has(country)) return "EU";
  if (country === "TW") return "CN";
  return "US";
}

// ─────────────────────────────────────────────────────────────────
// Capital-market assumptions (long-run, per asset class). Arithmetic
// mean return and annualised volatility (both decimal). These let the
// engine derive a portfolio's μ/σ from its actual allocation instead
// of one blended risk-profile number — so a 100%-equity and a 60/40
// plan no longer simulate identically. Ported/adapted from the legacy
// CMA table in wealth-analyzer.html.
// ─────────────────────────────────────────────────────────────────
export const ASSET_CLASS_CMA: Record<
  AssetClass,
  { mean: number; sigma: number }
> = {
  equity: { mean: 0.08, sigma: 0.16 },
  fixed_income: { mean: 0.04, sigma: 0.06 },
  real_estate: { mean: 0.055, sigma: 0.11 },
  commodity: { mean: 0.045, sigma: 0.18 },
  cash: { mean: 0.03, sigma: 0.015 },
  mixed: { mean: 0.06, sigma: 0.1 },
  alternative: { mean: 0.07, sigma: 0.14 },
  crypto: { mean: 0.12, sigma: 0.6 },
};

// Correlation matrix between asset classes (symmetric; diagonal = 1).
// Used to compute portfolio σ from a covariance sum, so diversification
// (holding lowly-correlated sleeves) correctly reduces portfolio risk.
const _CORR_PAIRS: Partial<
  Record<AssetClass, Partial<Record<AssetClass, number>>>
> = {
  equity: {
    fixed_income: 0.15,
    real_estate: 0.55,
    commodity: 0.3,
    cash: 0.0,
    mixed: 0.85,
    alternative: 0.55,
    crypto: 0.35,
  },
  fixed_income: {
    real_estate: 0.2,
    commodity: 0.0,
    cash: 0.3,
    mixed: 0.55,
    alternative: 0.15,
    crypto: 0.05,
  },
  real_estate: {
    commodity: 0.25,
    cash: 0.05,
    mixed: 0.6,
    alternative: 0.45,
    crypto: 0.2,
  },
  commodity: { cash: 0.0, mixed: 0.25, alternative: 0.35, crypto: 0.25 },
  cash: { mixed: 0.1, alternative: 0.0, crypto: 0.0 },
  mixed: { alternative: 0.55, crypto: 0.35 },
  alternative: { crypto: 0.3 },
};

/** Correlation between two asset classes (order-independent; 1 on the diagonal). */
export function assetCorrelation(a: AssetClass, b: AssetClass): number {
  if (a === b) return 1;
  return _CORR_PAIRS[a]?.[b] ?? _CORR_PAIRS[b]?.[a] ?? 0;
}

// ─────────────────────────────────────────────────────────────────
// Progressive income-tax brackets (marginal rate up to each ceiling),
// keyed by country. A simplified, federal-level model applied to
// taxable income each simulation year so surplus is post-tax rather
// than gross. Not a substitute for filing advice — excludes
// state/provincial/local layers and credits. `default` covers any
// country without its own table.
// ─────────────────────────────────────────────────────────────────
export const TAX_BRACKETS: Record<
  string,
  Array<{ upTo: number; rate: number }>
> = {
  US: [
    { upTo: 11600, rate: 0.1 },
    { upTo: 47150, rate: 0.12 },
    { upTo: 100525, rate: 0.22 },
    { upTo: 191950, rate: 0.24 },
    { upTo: 243725, rate: 0.32 },
    { upTo: 609350, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  GB: [
    { upTo: 12570, rate: 0.0 },
    { upTo: 50270, rate: 0.2 },
    { upTo: 125140, rate: 0.4 },
    { upTo: Infinity, rate: 0.45 },
  ],
  CA: [
    { upTo: 55867, rate: 0.15 },
    { upTo: 111733, rate: 0.205 },
    { upTo: 173205, rate: 0.26 },
    { upTo: 246752, rate: 0.29 },
    { upTo: Infinity, rate: 0.33 },
  ],
  AU: [
    { upTo: 18200, rate: 0.0 },
    { upTo: 45000, rate: 0.19 },
    { upTo: 135000, rate: 0.325 },
    { upTo: 190000, rate: 0.37 },
    { upTo: Infinity, rate: 0.45 },
  ],
  DE: [
    { upTo: 11604, rate: 0.0 },
    { upTo: 17005, rate: 0.14 },
    { upTo: 66760, rate: 0.3 },
    { upTo: 277825, rate: 0.42 },
    { upTo: Infinity, rate: 0.45 },
  ],
  default: [
    { upTo: 15000, rate: 0.1 },
    { upTo: 50000, rate: 0.2 },
    { upTo: 150000, rate: 0.3 },
    { upTo: Infinity, rate: 0.38 },
  ],
};

/** IRS Uniform Lifetime Table for RMD calculations (US-specific). */
export const IRS_UNIFORM_LIFETIME: Record<number, number> = {
  73: 26.5,
  74: 25.5,
  75: 24.6,
  76: 23.7,
  77: 22.9,
  78: 22.0,
  79: 21.1,
  80: 20.2,
  81: 19.4,
  82: 18.5,
  83: 17.7,
  84: 16.8,
  85: 16.0,
  86: 15.2,
  87: 14.4,
  88: 13.7,
  89: 12.9,
  90: 12.2,
  91: 11.5,
  92: 10.8,
  93: 10.1,
  94: 9.5,
  95: 8.9,
  96: 8.4,
  97: 7.8,
  98: 7.3,
  99: 6.8,
  100: 6.4,
  101: 5.9,
  102: 5.5,
  103: 5.2,
  104: 4.9,
  105: 4.6,
  106: 4.3,
  107: 4.1,
  108: 3.9,
  109: 3.7,
  110: 3.5,
  111: 3.4,
  112: 3.3,
  113: 3.1,
  114: 3.0,
  115: 2.9,
  116: 2.8,
  117: 2.7,
  118: 2.5,
  119: 2.3,
  120: 2.0,
};

export const RRIF_RATES: Record<number, number> = {
  71: 5.28,
  72: 5.4,
  73: 5.53,
  74: 5.67,
  75: 5.82,
  76: 5.98,
  77: 6.17,
  78: 6.36,
  79: 6.58,
  80: 6.82,
  81: 7.08,
  82: 7.38,
  83: 7.71,
  84: 8.08,
  85: 8.51,
  86: 8.99,
  87: 9.55,
  88: 10.21,
  89: 10.99,
  90: 11.92,
  91: 13.06,
  92: 14.49,
  93: 16.34,
  94: 18.79,
};

export const US_STATE_TAX_RATES: Record<string, number> = {
  AL: 4.8,
  AK: 0,
  AZ: 2.5,
  AR: 4.4,
  CA: 7.5,
  CO: 4.4,
  CT: 5.0,
  DE: 5.2,
  FL: 0,
  GA: 5.49,
  HI: 8.25,
  ID: 5.8,
  IL: 4.95,
  IN: 3.15,
  IA: 4.82,
  KS: 5.7,
  KY: 4.0,
  LA: 4.25,
  ME: 6.0,
  MD: 5.0,
  MA: 5.0,
  MI: 4.25,
  MN: 7.0,
  MS: 5.0,
  MO: 4.8,
  MT: 6.5,
  NE: 5.5,
  NV: 0,
  NH: 0,
  NJ: 5.53,
  NM: 4.9,
  NY: 6.85,
  NC: 4.75,
  ND: 1.5,
  OH: 3.0,
  OK: 4.75,
  OR: 8.5,
  PA: 3.07,
  RI: 4.75,
  SC: 6.5,
  SD: 0,
  TN: 0,
  TX: 0,
  UT: 4.65,
  VT: 6.0,
  VA: 5.75,
  WA: 0,
  WV: 5.12,
  WI: 5.3,
  WY: 0,
  DC: 8.5,
};
