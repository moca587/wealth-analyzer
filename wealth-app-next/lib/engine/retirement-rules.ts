export type RetirementRule = {
  name: string;

  /**
   * Default age shown in the Goals section.
   *
   * This is a planning default, not a guarantee that every person
   * in the country legally retires at this exact age.
   */
  planningAge: number;

  /**
   * Normal/reference age for the main public/state pension system.
   *
   * Some countries vary by birth year, sex, contribution history,
   * occupation, or pension scheme.
   */
  pensionAge: number;

  /**
   * True when the exact age can depend materially on personal factors.
   */
  variable?: boolean;

  note?: string;
};

export const RETIREMENT_RULES: Record<string, RetirementRule> = {
  US: {
    name: "United States",
    planningAge: 67,
    pensionAge: 67,
    variable: true,
    note: "Social Security full retirement age depends on birth year. It is 67 for people born in 1960 or later.",
  },

  CA: {
    name: "Canada",
    planningAge: 65,
    pensionAge: 65,
    note: "CPP standard pension start age is 65; it may generally be started from 60 to 70.",
  },

  GB: {
    name: "United Kingdom",
    planningAge: 67,
    pensionAge: 67,
    variable: true,
    note: "State Pension age is transitioning from 66 to 67 between 2026 and 2028 and depends on date of birth.",
  },

  AU: {
    name: "Australia",
    planningAge: 67,
    pensionAge: 67,
    note: "Age Pension eligibility age is 67.",
  },

  CH: {
    name: "Switzerland",
    planningAge: 65,
    pensionAge: 65,
    variable: true,
    note: "Reference age is 65 for men. Women's reference age is being gradually raised to 65.",
  },

  EU: {
    name: "Euro area",
    planningAge: 65,
    pensionAge: 65,
    variable: true,
    note: "Fallback only. Use the client's actual country whenever available because pension ages differ across euro-area countries.",
  },

  DE: {
    name: "Germany",
    planningAge: 67,
    pensionAge: 67,
    variable: true,
    note: "Normal pension age is cohort-dependent and is gradually reaching 67.",
  },

  FR: {
    name: "France",
    planningAge: 64,
    pensionAge: 64,
    variable: true,
    note: "Minimum statutory pension age is being phased toward 64 and full-rate entitlement also depends on contribution history.",
  },

  IT: {
    name: "Italy",
    planningAge: 67,
    pensionAge: 67,
    variable: true,
    note: "Statutory old-age pension age is generally 67, with other contribution-based retirement routes possible.",
  },

  ES: {
    name: "Spain",
    planningAge: 67,
    pensionAge: 67,
    variable: true,
    note: "Normal pension age depends on year and contribution history; 65 may apply with sufficient contributions.",
  },

  NL: {
    name: "Netherlands",
    planningAge: 67,
    pensionAge: 67,
    variable: true,
    note: "AOW pension age is 67 in 2026 and is linked to longevity for future cohorts.",
  },

  BE: {
    name: "Belgium",
    planningAge: 66,
    pensionAge: 66,
    variable: true,
    note: "Statutory pension age increased to 66 in 2025 and is scheduled to increase to 67 in 2030.",
  },

  AT: {
    name: "Austria",
    planningAge: 65,
    pensionAge: 65,
    variable: true,
    note: "Men's standard pension age is 65. Women's pension age is being gradually increased to 65.",
  },

  IE: {
    name: "Ireland",
    planningAge: 66,
    pensionAge: 66,
    note: "State Pension Contributory is normally payable from age 66.",
  },

  PT: {
    name: "Portugal",
    planningAge: 67,
    pensionAge: 67,
    variable: true,
    note: "Normal pension age changes over time and may also be reduced for long contribution histories.",
  },

  LU: {
    name: "Luxembourg",
    planningAge: 65,
    pensionAge: 65,
    variable: true,
    note: "Standard old-age pension age is 65, although earlier pensions may be available with sufficient insurance history.",
  },

  FI: {
    name: "Finland",
    planningAge: 65,
    pensionAge: 65,
    variable: true,
    note: "Retirement age is cohort-dependent and is increasingly linked to life expectancy.",
  },

  GR: {
    name: "Greece",
    planningAge: 67,
    pensionAge: 67,
    variable: true,
    note: "General full pension age is 67, while retirement at 62 may be available with a long contribution history.",
  },

  CY: {
    name: "Cyprus",
    planningAge: 65,
    pensionAge: 65,
    variable: true,
    note: "General statutory pension age is 65; contribution and early-retirement conditions can modify eligibility.",
  },

  HR: {
    name: "Croatia",
    planningAge: 65,
    pensionAge: 65,
    variable: true,
    note: "Normal pension age is generally 65; women's rules have been transitioning toward the same age.",
  },

  EE: {
    name: "Estonia",
    planningAge: 65,
    pensionAge: 65,
    variable: true,
    note: "Pension age reaches 65 and future ages are linked to changes in life expectancy.",
  },

  LV: {
    name: "Latvia",
    planningAge: 65,
    pensionAge: 65,
    note: "Normal old-age pension age has reached 65.",
  },

  LT: {
    name: "Lithuania",
    planningAge: 65,
    pensionAge: 65,
    note: "Normal pension age reaches 65 for both men and women in 2026.",
  },

  SK: {
    name: "Slovakia",
    planningAge: 64,
    pensionAge: 64,
    variable: true,
    note: "Pension age depends on birth cohort and may also be reduced based on number of children raised.",
  },

  SI: {
    name: "Slovenia",
    planningAge: 65,
    pensionAge: 65,
    variable: true,
    note: "Standard pension age is generally 65, while earlier retirement can be available with long contribution history.",
  },

  MT: {
    name: "Malta",
    planningAge: 65,
    pensionAge: 65,
    variable: true,
    note: "Retirement age depends on year of birth; it reaches 65 for younger cohorts.",
  },

  BG: {
    name: "Bulgaria",
    planningAge: 65,
    pensionAge: 65,
    variable: true,
    note: "Pension age is gradually increasing and differs by sex and contribution history.",
  },

  CZ: {
    name: "Czechia",
    planningAge: 65,
    pensionAge: 65,
    variable: true,
    note: "Pension age depends on birth cohort and is gradually increasing.",
  },

  HU: {
    name: "Hungary",
    planningAge: 65,
    pensionAge: 65,
    variable: true,
    note: "General pension age is 65, with special contribution-based provisions including women's eligibility rules.",
  },

  RO: {
    name: "Romania",
    planningAge: 65,
    pensionAge: 65,
    variable: true,
    note: "Retirement age is cohort- and sex-dependent, with women's pension age gradually increasing.",
  },

  DK: {
    name: "Denmark",
    planningAge: 67,
    pensionAge: 67,
    variable: true,
    note: "State pension age is 67 for current cohorts and is scheduled to rise for younger cohorts.",
  },

  SE: {
    name: "Sweden",
    planningAge: 66,
    pensionAge: 66,
    variable: true,
    note: "Sweden uses target/reference ages linked to life expectancy and different pension components have different minimum ages.",
  },

  NO: {
    name: "Norway",
    planningAge: 67,
    pensionAge: 67,
    variable: true,
    note: "Normal pension reference age is 67, although flexible pension withdrawal may begin earlier.",
  },

  PL: {
    name: "Poland",
    planningAge: 65,
    pensionAge: 65,
    variable: true,
    note: "Statutory pension age is 65 for men and 60 for women.",
  },

  JP: {
    name: "Japan",
    planningAge: 65,
    pensionAge: 65,
    variable: true,
    note: "Normal public pension age is 65, with early and delayed claiming options.",
  },

  SG: {
    name: "Singapore",
    planningAge: 64,
    pensionAge: 65,
    variable: true,
    note: "Statutory retirement age became 64 on 1 July 2026. CPF payout eligibility remains age 65.",
  },

  HK: {
    name: "Hong Kong",
    planningAge: 65,
    pensionAge: 65,
    variable: true,
    note: "Hong Kong has no general statutory retirement age. Age 65 is used here as the MPF normal withdrawal/planning reference age.",
  },

  CN: {
    name: "China",
    planningAge: 63,
    pensionAge: 63,
    variable: true,
    note: "China began gradually increasing statutory retirement ages in 2025. Exact retirement age depends on sex, worker category and birth date.",
  },

  TW: {
    name: "Taiwan",
    planningAge: 65,
    pensionAge: 65,
    variable: true,
    note: "Labor Insurance old-age pension legal claiming age reaches 65 from 2026.",
  },

  KR: {
    name: "South Korea",
    planningAge: 65,
    pensionAge: 65,
    variable: true,
    note: "National Pension normal pension age is cohort-dependent and is gradually increasing to 65.",
  },

  IN: {
    name: "India",
    planningAge: 58,
    pensionAge: 58,
    variable: true,
    note: "EPS-95 superannuation pension is normally payable at age 58. Other Indian pension and employment schemes can use different ages.",
  },

  ID: {
    name: "Indonesia",
    planningAge: 59,
    pensionAge: 59,
    variable: true,
    note: "BPJS Jaminan Pensiun retirement age is 59 from 2025 and increases by one year every three years until reaching 65.",
  },

  MX: {
    name: "Mexico",
    planningAge: 65,
    pensionAge: 65,
    variable: true,
    note: "Normal old-age pension reference age is 65; earlier retirement benefits may be available from age 60 under applicable schemes.",
  },

  BR: {
    name: "Brazil",
    planningAge: 65,
    pensionAge: 65,
    variable: true,
    note: "General programmed retirement minimum age is 65 for men and 62 for women, subject to contribution requirements and transition rules.",
  },

  SA: {
    name: "Saudi Arabia",
    planningAge: 65,
    pensionAge: 65,
    variable: true,
    note: "Saudi pension rules are undergoing reform and exact retirement eligibility depends on the applicable Social Insurance Law and contributor status.",
  },

  ZA: {
    name: "South Africa",
    planningAge: 60,
    pensionAge: 60,
    variable: true,
    note: "There is no universal employment retirement age; age 60 is the eligibility age for the Older Person's Grant and is used here as a public-benefit planning reference.",
  },

  NZ: {
    name: "New Zealand",
    planningAge: 65,
    pensionAge: 65,
    note: "NZ Superannuation eligibility age is 65.",
  },

  IL: {
    name: "Israel",
    planningAge: 67,
    pensionAge: 67,
    variable: true,
    note: "Retirement age differs by sex and cohort. Men's retirement age is 67; women's age is being increased gradually.",
  },

  AE: {
    name: "United Arab Emirates",
    planningAge: 60,
    pensionAge: 60,
    variable: true,
    note: "For insured UAE nationals under the federal pension authority, the stated retirement age is 60, subject to service requirements and applicable scheme.",
  },

  TH: {
    name: "Thailand",
    planningAge: 60,
    pensionAge: 55,
    variable: true,
    note: "Employment retirement practices and Social Security old-age benefit eligibility are different concepts, so manual review is recommended.",
  },

  MY: {
    name: "Malaysia",
    planningAge: 60,
    pensionAge: 60,
    variable: true,
    note: "Minimum employment retirement age is 60. EPF savings can generally begin to be accessed at age 55, with additional rules at age 60.",
  },

  NG: {
    name: "Nigeria",
    planningAge: 60,
    pensionAge: 60,
    variable: true,
    note: "Nigeria's contributory pension legislation does not set one universal retirement age; employment terms determine retirement age. Age 60 is used only as a planning default.",
  },

  TR: {
    name: "Türkiye",
    planningAge: 60,
    pensionAge: 60,
    variable: true,
    note: "Retirement eligibility is highly dependent on sex, insurance start date and contribution history. Do not treat this value as legal eligibility.",
  },

  OTHER: {
    name: "Other",
    planningAge: 65,
    pensionAge: 65,
    variable: true,
    note: "Generic planning fallback. User should confirm the correct age manually.",
  },
};

/**
 * Use this in the Goals section.
 *
 * This returns a sensible country-specific planning default.
 * A manually saved retirement age should always override it.
 */
export function getRetirementAge(country?: string): number {
  const code = (country ?? "US").toUpperCase();

  return (
    RETIREMENT_RULES[code]?.planningAge ?? RETIREMENT_RULES.OTHER.planningAge
  );
}

/**
 * Use this in the State Pension / Social Security section.
 *
 * This represents the normal/reference public pension age,
 * which is not necessarily the same as the age someone chooses
 * to stop working.
 */
export function getStatePensionAge(country?: string): number {
  const code = (country ?? "US").toUpperCase();

  return (
    RETIREMENT_RULES[code]?.pensionAge ?? RETIREMENT_RULES.OTHER.pensionAge
  );
}

/**
 * Lets the UI tell the user when the country's age is only
 * a default and the exact result depends on personal circumstances.
 */
export function retirementAgeNeedsReview(country?: string): boolean {
  const code = (country ?? "US").toUpperCase();

  return (
    RETIREMENT_RULES[code]?.variable ?? RETIREMENT_RULES.OTHER.variable ?? false
  );
}

export function getRetirementRule(country?: string): RetirementRule {
  const code = (country ?? "US").toUpperCase();

  return RETIREMENT_RULES[code] ?? RETIREMENT_RULES.OTHER;
}
