export type ReportSectionId =
  | "household-profile"
  | "about-client"
  | "executive-summary"
  | "income-expenses"
  | "net-worth"
  | "protection-insurance"
  | "goals-retirement"
  | "plan-strategies"
  | "investment-policy"
  | "portfolio-analysis"
  | "proposed-portfolio"
  | "total-portfolio"
  | "portfolio-efficiency"
  | "allocation-performance"
  | "wealth-allocation-framework"
  | "risk-categories"
  | "wealth-risk-status"
  | "wealth-projection"
  | "goal-success"
  | "goal-funding"
  | "achievable-lifestyle"
  | "annual-potential-wealth"
  | "cash-flow"
  | "retirement-pensions"
  | "what-if"
  | "investment-fact-sheets"
  | "appendix-divider"
  | "investor-education"
  | "capital-market-assumptions"
  | "methodology"
  | "glossary"
  | "disclosures";

export const DEFAULT_REPORT_SECTION_ORDER: ReportSectionId[] = [
  "household-profile",
  "about-client",
  "executive-summary",
  "income-expenses",
  "net-worth",
  "protection-insurance",
  "goals-retirement",
  "plan-strategies",
  "investment-policy",
  "portfolio-analysis",
  "proposed-portfolio",
  "total-portfolio",
  "portfolio-efficiency",
  "allocation-performance",
  "wealth-allocation-framework",
  "risk-categories",
  "wealth-risk-status",
  "wealth-projection",
  "goal-success",
  "goal-funding",
  "achievable-lifestyle",
  "annual-potential-wealth",
  "cash-flow",
  "retirement-pensions",
  "what-if",
  "investment-fact-sheets",
  "appendix-divider",
  "investor-education",
  "capital-market-assumptions",
  "methodology",
  "glossary",
  "disclosures",
];

export type ReportPageSize = "a4" | "letter";

export type ReportOrientation = "portrait" | "landscape";

export type ReportAccent =
  | "midnight"
  | "navy"
  | "forest"
  | "graphite"
  | "crimson"
  | "teal";

export type ReportNumberFormat = "full" | "thousands" | "millions";

export type DisclosureProfile = "standard" | "advisor" | "minimal" | "none";

export type CashFlowDetail = "summary" | "full" | "none";

export type ReportSettings = {
  reportTitle: string;
  preparedBy: string;
  preparedFor: string;
  firmName: string;
  reference: string;
  subtitle: string;

  pageSize: ReportPageSize;
  orientation: ReportOrientation;
  accent: ReportAccent;
  numberFormat: ReportNumberFormat;

  confidentiality: "confidential" | "restricted" | "internal" | "none";

  aboutClient: string;
  customDisclosure: string;

  // sections to include
  includeExecutiveSummary: boolean;
  includeHousehold: boolean;
  includeIncomeExpenses: boolean;

  includeEquityCompensation: boolean;

  includeAssetsLiabilities: boolean;
  includeProtectionInsurance: boolean;

  includeGoalsRetirement: boolean;
  includePlanStrategies: boolean;

  includeInvestmentPolicy: boolean;
  includePortfolio: boolean;
  includeFactSheets: boolean;

  includeWealthProjection: boolean;
  includeGoalSuccess: boolean;
  includeGoalFunding: boolean;
  includeAchievableLifestyle: boolean;

  includeWealthAllocation: boolean;
  includeAnnualPotentialWealth: boolean;
  includeRetirementPensions: boolean;

  includeWhatIf: boolean;

  includeCapitalMarketAssumptions: boolean;

  cashFlowDetail: CashFlowDetail;

  includeMethodology: boolean;
  includeGlossary: boolean;

  includeInvestorEducation: boolean;

  disclosureProfile: DisclosureProfile;

  sectionOrder: ReportSectionId[];
};

export const defaultReportSettings: ReportSettings = {
  reportTitle: "Wealth Planning Report",
  preparedBy: "",
  preparedFor: "",
  firmName: "",
  reference: "",
  subtitle: "",

  pageSize: "letter",
  orientation: "portrait",
  accent: "midnight",
  numberFormat: "full",

  confidentiality: "confidential",

  aboutClient: "",
  customDisclosure: "",

  includeExecutiveSummary: true,
  includeHousehold: true,
  includeIncomeExpenses: true,

  includeEquityCompensation: true,

  includeAssetsLiabilities: true,
  includeProtectionInsurance: true,

  includeGoalsRetirement: true,
  includePlanStrategies: true,

  includeInvestmentPolicy: true,
  includePortfolio: true,
  includeFactSheets: true,

  includeWealthProjection: true,
  includeGoalSuccess: true,
  includeGoalFunding: true,
  includeAchievableLifestyle: true,

  includeWealthAllocation: true,
  includeAnnualPotentialWealth: true,
  includeRetirementPensions: true,

  includeWhatIf: true,

  includeCapitalMarketAssumptions: true,

  cashFlowDetail: "summary",

  includeMethodology: true,
  includeGlossary: true,

  disclosureProfile: "standard",

  includeInvestorEducation: true,

  sectionOrder: [...DEFAULT_REPORT_SECTION_ORDER],
};
