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

  includeExecutiveSummary: boolean;
  includeHousehold: boolean;
  includeIncomeExpenses: boolean;
  includeAssetsLiabilities: boolean;
  includeGoalsRetirement: boolean;
  includePortfolio: boolean;
  includeWealthProjection: boolean;
  includeGoalSuccess: boolean;
  includeWealthAllocation: boolean;
  includeMethodology: boolean;
  includeGlossary: boolean;

  cashFlowDetail: CashFlowDetail;

  disclosureProfile: DisclosureProfile;
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
  includeAssetsLiabilities: true,
  includeGoalsRetirement: true,
  includePortfolio: true,
  includeWealthProjection: true,
  includeGoalSuccess: true,
  includeWealthAllocation: true,
  includeMethodology: true,
  includeGlossary: true,

  cashFlowDetail: "summary",

  disclosureProfile: "standard",
};
