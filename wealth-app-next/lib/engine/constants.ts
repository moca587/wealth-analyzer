// ─────────────────────────────────────────────────────────────────
// Domain constants — risk profiles, time horizons, inflation regions
// Ported 1:1 from the HTML app for behavior compatibility.
// ─────────────────────────────────────────────────────────────────

import type { RiskProfile, TimeHorizon } from "./types";

export const RISK_PROFILES: Record<RiskProfile, { label: string; mu: number; sigma: number }> = {
  very_conservative:        { label: "Very Conservative",      mu: 3.5,  sigma: 4  },
  conservative:             { label: "Conservative",           mu: 4.5,  sigma: 7  },
  moderately_conservative:  { label: "Moderately Conservative",mu: 5.5,  sigma: 9  },
  moderate:                 { label: "Moderate",               mu: 7.0,  sigma: 12 },
  moderately_aggressive:    { label: "Moderately Aggressive",  mu: 8.5,  sigma: 15 },
  aggressive:               { label: "Aggressive",             mu: 10.0, sigma: 18 },
  very_aggressive:          { label: "Very Aggressive",        mu: 12.0, sigma: 22 }
};

export const HORIZON_PROFILES: Record<TimeHorizon, { label: string; years: number }> = {
  "0_5":      { label: "0–5 years",   years: 5  },
  "5_10":     { label: "5–10 years",  years: 10 },
  "10_15":    { label: "10–15 years", years: 15 },
  "15_plus":  { label: "15+ years",   years: 30 }
};

/** 50-year historical inflation averages (1974-2024) per region. */
export const INFLATION_REGIONS: Record<string, { label: string; rate: number; note?: string }> = {
  CH: { label: "Switzerland",     rate: 0.021, note: "World's lowest sustained inflation" },
  JP: { label: "Japan",           rate: 0.020, note: "Deflation era 1998–2012 pulls down" },
  SA: { label: "Saudi Arabia",    rate: 0.025, note: "Oil-pegged economy" },
  SG: { label: "Singapore",       rate: 0.028 },
  EU: { label: "Euro zone",       rate: 0.031, note: "HICP blended" },
  CA: { label: "Canada",          rate: 0.037 },
  US: { label: "United States",   rate: 0.038, note: "CPI-U" },
  CN: { label: "China & Taiwan",  rate: 0.039 },
  HK: { label: "Hong Kong",       rate: 0.041 },
  AU: { label: "Australia",       rate: 0.044 },
  GB: { label: "United Kingdom",  rate: 0.048 },
  KR: { label: "South Korea",     rate: 0.052 },
  IN: { label: "India",           rate: 0.074 },
  ZA: { label: "South Africa",    rate: 0.089 },
  ID: { label: "Indonesia",       rate: 0.116, note: "1998 spike" },
  MX: { label: "Mexico",          rate: 0.152, note: "1980s–90s crisis era" },
  BR: { label: "Brazil",          rate: 0.585, note: "Hyperinflation pre-1994 — consider override to ~7%" }
};

export const COUNTRY_LABELS: Record<string, string> = {
  US: "United States", CA: "Canada", GB: "United Kingdom", AU: "Australia",
  CH: "Switzerland", EU: "Euro zone", JP: "Japan", SG: "Singapore",
  HK: "Hong Kong", CN: "China", TW: "Taiwan", KR: "South Korea",
  IN: "India", ID: "Indonesia", MX: "Mexico", BR: "Brazil",
  SA: "Saudi Arabia", ZA: "South Africa", OTHER: "Other"
};

/**
 * Maps a country code to the INFLATION_REGIONS key that best represents it.
 * Not every country has its own region: individual eurozone members share
 * the blended "EU" rate, and Taiwan shares the "CN" (China & Taiwan) rate —
 * a direct code lookup would miss those and fall through to a default.
 */
const EUROZONE_MEMBERS = new Set([
  "DE", "FR", "IT", "ES", "NL", "BE", "AT", "IE", "PT", "LU",
  "FI", "GR", "CY", "HR", "EE", "LV", "LT", "SK", "SI", "MT",
]);

export function inflationRegionForCountry(country: string): string {
  if (INFLATION_REGIONS[country]) return country;
  if (EUROZONE_MEMBERS.has(country)) return "EU";
  if (country === "TW") return "CN";
  return "US";
}

/** IRS Uniform Lifetime Table for RMD calculations (US-specific). */
export const IRS_UNIFORM_LIFETIME: Record<number, number> = {
  73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1,
  80: 20.2, 85: 16.0, 90: 12.2, 95: 8.9, 100: 6.4
};
