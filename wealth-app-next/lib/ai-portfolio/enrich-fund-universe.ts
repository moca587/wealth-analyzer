import type { Fund } from "@/lib/data/fund-universe";

export type EnrichedFund = Fund & {
  mu: number;
  sigma: number;

  holdings: number;
  aum: number;

  beta: number;

  r1y: number | null;
  r3y: number | null;
  r5y: number | null;
  r10y: number | null;

  maxDD: number;
  sharpe: number;
  te: number;

  inception: number | null;

  income: "high" | "moderate" | "low";
};

type FundOverride = Partial<{
  mu: number;
  sigma: number;

  holdings: number;
  aum: number;

  beta: number;

  r1y: number;
  r3y: number;
  r5y: number;
  r10y: number;

  maxDD: number;
  sharpe: number;
  te: number;

  inception: number;
}>;

type ClassDefault = {
  mu: number;
  sigma: number;

  holdings: number;
  aum: number;

  beta: number;

  r1y: number;
  r3y: number;
  r5y: number;
  r10y: number;
};

const CLASS_DEFAULTS: Record<string, ClassDefault> = {
  equity: {
    mu: 9.5,
    sigma: 15.0,
    holdings: 500,
    aum: 50,
    beta: 1.0,
    r1y: 13.0,
    r3y: 9.5,
    r5y: 11.0,
    r10y: 10.5,
  },

  fixed_income: {
    mu: 4.8,
    sigma: 5.5,
    holdings: 5000,
    aum: 25,
    beta: 0.1,
    r1y: 5.0,
    r3y: 0.5,
    r5y: 1.5,
    r10y: 2.5,
  },

  real_estate: {
    mu: 7.5,
    sigma: 18.0,
    holdings: 80,
    aum: 20,
    beta: 0.85,
    r1y: 8.5,
    r3y: 1.0,
    r5y: 5.0,
    r10y: 7.0,
  },

  commodity: {
    mu: 5.0,
    sigma: 16.0,
    holdings: 1,
    aum: 30,
    beta: 0.2,
    r1y: 12.0,
    r3y: 8.0,
    r5y: 7.0,
    r10y: 4.0,
  },

  cash: {
    mu: 5.0,
    sigma: 0.3,
    holdings: 50,
    aum: 30,
    beta: 0.0,
    r1y: 5.2,
    r3y: 3.0,
    r5y: 2.0,
    r10y: 1.5,
  },

  mixed: {
    mu: 7.0,
    sigma: 10.0,
    holdings: 300,
    aum: 15,
    beta: 0.6,
    r1y: 8.5,
    r3y: 4.0,
    r5y: 6.5,
    r10y: 6.5,
  },

  alternative: {
    mu: 6.5,
    sigma: 12.0,
    holdings: 200,
    aum: 5,
    beta: 0.4,
    r1y: 7.0,
    r3y: 5.0,
    r5y: 5.5,
    r10y: 5.0,
  },

  crypto: {
    mu: 25.0,
    sigma: 65.0,
    holdings: 1,
    aum: 10,
    beta: 1.8,
    r1y: 80.0,
    r3y: 25.0,
    r5y: 30.0,
    r10y: 0.0,
  },
};

export const FUND_DATA_AS_OF = "2024-12-31";

const FUND_OVERRIDES: Record<string, FundOverride> = {
  // US Large Cap Core
  VOO: {
    mu: 10.5,
    sigma: 15,
    holdings: 503,
    aum: 1100,
    beta: 1,
    r1y: 24.2,
    r3y: 9.8,
    r5y: 14.8,
    r10y: 12.5,
    maxDD: -23.9,
  },

  IVV: {
    mu: 10.5,
    sigma: 15,
    holdings: 503,
    aum: 480,
    beta: 1,
    r1y: 24.1,
    r3y: 9.7,
    r5y: 14.7,
    r10y: 12.4,
    maxDD: -23.9,
  },

  SPY: {
    mu: 10.5,
    sigma: 15.1,
    holdings: 503,
    aum: 520,
    beta: 1,
    r1y: 24,
    r3y: 9.6,
    r5y: 14.6,
    r10y: 12.3,
    maxDD: -24,
  },

  VTI: {
    mu: 10.4,
    sigma: 15.5,
    holdings: 3700,
    aum: 1400,
    beta: 1.02,
    r1y: 23.9,
    r3y: 8.5,
    r5y: 14.2,
    r10y: 11.9,
    maxDD: -25.5,
  },

  ITOT: {
    mu: 10.4,
    sigma: 15.5,
    holdings: 3650,
    aum: 55,
    beta: 1.02,
    r1y: 23.8,
    r3y: 8.4,
    r5y: 14.1,
    r10y: 11.8,
    maxDD: -25.5,
  },

  SPLG: {
    mu: 10.5,
    sigma: 15,
    holdings: 503,
    aum: 30,
    beta: 1,
    r1y: 24.2,
    r3y: 9.7,
    r5y: 14.7,
    r10y: 12.4,
    maxDD: -23.9,
  },

  QQQ: {
    mu: 13.5,
    sigma: 21,
    holdings: 101,
    aum: 280,
    beta: 1.18,
    r1y: 29.5,
    r3y: 11.5,
    r5y: 21.5,
    r10y: 18,
    maxDD: -32.5,
  },

  QQQM: {
    mu: 13.5,
    sigma: 21,
    holdings: 101,
    aum: 23,
    beta: 1.18,
    r1y: 29.4,
    r3y: 11.4,
    r5y: 21.4,
    r10y: 0,
    maxDD: -32.5,
  },

  RSP: {
    mu: 10,
    sigma: 16,
    holdings: 503,
    aum: 55,
    beta: 1.05,
    r1y: 13.5,
    r3y: 7.5,
    r5y: 11.5,
    r10y: 11,
    maxDD: -30,
  },

  // US Growth / Value
  VUG: {
    mu: 12.5,
    sigma: 19,
    holdings: 200,
    aum: 140,
    beta: 1.12,
    r1y: 33,
    r3y: 11,
    r5y: 18.5,
    r10y: 14.5,
    maxDD: -32,
  },

  VTV: {
    mu: 9.5,
    sigma: 14.5,
    holdings: 340,
    aum: 130,
    beta: 0.92,
    r1y: 14,
    r3y: 8,
    r5y: 11,
    r10y: 10,
    maxDD: -22,
  },

  IWF: {
    mu: 12.5,
    sigma: 19,
    holdings: 430,
    aum: 100,
    beta: 1.11,
    r1y: 33.5,
    r3y: 11.5,
    r5y: 18.5,
    r10y: 14.7,
    maxDD: -32,
  },

  IWD: {
    mu: 9.5,
    sigma: 14.5,
    holdings: 850,
    aum: 60,
    beta: 0.92,
    r1y: 13.5,
    r3y: 7.5,
    r5y: 10.5,
    r10y: 9.5,
    maxDD: -22,
  },

  SCHG: {
    mu: 12.5,
    sigma: 19,
    holdings: 240,
    aum: 35,
    beta: 1.12,
    r1y: 33,
    r3y: 11,
    r5y: 18.5,
    r10y: 14.5,
    maxDD: -32,
  },

  SCHD: {
    mu: 10,
    sigma: 14,
    holdings: 103,
    aum: 60,
    beta: 0.85,
    r1y: 11.5,
    r3y: 6.5,
    r5y: 13.5,
    r10y: 11.5,
    maxDD: -21,
  },

  VIG: {
    mu: 10.5,
    sigma: 13.5,
    holdings: 340,
    aum: 85,
    beta: 0.88,
    r1y: 17,
    r3y: 9,
    r5y: 11.5,
    r10y: 11,
    maxDD: -21,
  },

  VYM: {
    mu: 9.5,
    sigma: 14,
    holdings: 550,
    aum: 55,
    beta: 0.85,
    r1y: 14.5,
    r3y: 7.5,
    r5y: 9.5,
    r10y: 9.5,
    maxDD: -22,
  },

  // US Small / Mid
  IWM: {
    mu: 9,
    sigma: 21,
    holdings: 1980,
    aum: 65,
    beta: 1.18,
    r1y: 14,
    r3y: 1.5,
    r5y: 8.5,
    r10y: 8,
    maxDD: -33,
  },

  IJH: {
    mu: 10,
    sigma: 18.5,
    holdings: 400,
    aum: 90,
    beta: 1.08,
    r1y: 17.5,
    r3y: 6.5,
    r5y: 11,
    r10y: 10,
    maxDD: -29.5,
  },

  IJR: {
    mu: 9.5,
    sigma: 21,
    holdings: 600,
    aum: 90,
    beta: 1.15,
    r1y: 15,
    r3y: 3,
    r5y: 9.5,
    r10y: 9.5,
    maxDD: -32,
  },

  VB: {
    mu: 9.5,
    sigma: 20,
    holdings: 1450,
    aum: 60,
    beta: 1.15,
    r1y: 16.5,
    r3y: 3.5,
    r5y: 10,
    r10y: 9.5,
    maxDD: -31,
  },

  AVUV: {
    mu: 10.5,
    sigma: 22,
    holdings: 740,
    aum: 13,
    beta: 1.22,
    r1y: 16.5,
    r3y: 6.5,
    r5y: 14,
    r10y: 0,
    maxDD: -31,
  },

  // Sector ETFs
  XLK: {
    mu: 14,
    sigma: 21,
    holdings: 65,
    aum: 75,
    beta: 1.2,
    r1y: 36,
    r3y: 14.5,
    r5y: 21.5,
    r10y: 19.5,
    maxDD: -33,
  },

  XLV: {
    mu: 9,
    sigma: 14,
    holdings: 65,
    aum: 42,
    beta: 0.75,
    r1y: 7,
    r3y: 5,
    r5y: 9,
    r10y: 11,
    maxDD: -20,
  },

  XLF: {
    mu: 9.5,
    sigma: 18,
    holdings: 75,
    aum: 46,
    beta: 1.1,
    r1y: 25,
    r3y: 7.5,
    r5y: 9,
    r10y: 11,
    maxDD: -27,
  },

  XLE: {
    mu: 8,
    sigma: 25,
    holdings: 23,
    aum: 38,
    beta: 1.3,
    r1y: 6,
    r3y: 18,
    r5y: 11,
    r10y: 4.5,
    maxDD: -58,
  },

  XLY: {
    mu: 11.5,
    sigma: 20,
    holdings: 54,
    aum: 22,
    beta: 1.15,
    r1y: 25,
    r3y: 5,
    r5y: 11.5,
    r10y: 13,
    maxDD: -37,
  },

  XLP: {
    mu: 8,
    sigma: 12,
    holdings: 38,
    aum: 18,
    beta: 0.65,
    r1y: 9,
    r3y: 3.5,
    r5y: 8.5,
    r10y: 8.5,
    maxDD: -15,
  },

  XLI: {
    mu: 10,
    sigma: 17,
    holdings: 78,
    aum: 21,
    beta: 1.05,
    r1y: 18,
    r3y: 7,
    r5y: 11,
    r10y: 11,
    maxDD: -26,
  },

  XLU: {
    mu: 7.5,
    sigma: 14,
    holdings: 31,
    aum: 18,
    beta: 0.55,
    r1y: 23,
    r3y: 6,
    r5y: 7.5,
    r10y: 9,
    maxDD: -19,
  },

  XLRE: {
    mu: 7,
    sigma: 18,
    holdings: 32,
    aum: 7,
    beta: 0.85,
    r1y: 8,
    r3y: 1,
    r5y: 5,
    r10y: 8,
    maxDD: -31,
  },

  // Thematic
  SOXX: {
    mu: 18,
    sigma: 28,
    holdings: 30,
    aum: 13,
    beta: 1.4,
    r1y: 48,
    r3y: 14,
    r5y: 23,
    r10y: 23,
    maxDD: -42,
  },

  SMH: {
    mu: 18.5,
    sigma: 28,
    holdings: 25,
    aum: 23,
    beta: 1.42,
    r1y: 50,
    r3y: 18,
    r5y: 27,
    r10y: 26,
    maxDD: -43,
  },

  ARKK: {
    mu: 6,
    sigma: 38,
    holdings: 35,
    aum: 7,
    beta: 1.65,
    r1y: 9,
    r3y: -18,
    r5y: -3,
    r10y: 7.5,
    maxDD: -75,
  },

  ICLN: {
    mu: 5.5,
    sigma: 25,
    holdings: 100,
    aum: 2.6,
    beta: 1.1,
    r1y: -15,
    r3y: -12,
    r5y: 1.5,
    r10y: 6.5,
    maxDD: -54,
  },

  TAN: {
    mu: 6.5,
    sigma: 35,
    holdings: 48,
    aum: 1,
    beta: 1.3,
    r1y: -22,
    r3y: -15,
    r5y: 5,
    r10y: 8,
    maxDD: -60,
  },

  BOTZ: {
    mu: 9.5,
    sigma: 21,
    holdings: 42,
    aum: 2.6,
    beta: 1.1,
    r1y: 18,
    r3y: 1,
    r5y: 8,
    r10y: 0,
    maxDD: -37,
  },

  // Covered Call / Income
  JEPI: {
    mu: 9.5,
    sigma: 9,
    holdings: 135,
    aum: 35,
    beta: 0.65,
    r1y: 14.5,
    r3y: 7.5,
    r5y: 0,
    r10y: 0,
    maxDD: -13.5,
  },

  JEPQ: {
    mu: 11,
    sigma: 13,
    holdings: 90,
    aum: 20,
    beta: 0.85,
    r1y: 21,
    r3y: 0,
    r5y: 0,
    r10y: 0,
    maxDD: -16,
  },

  QYLD: {
    mu: 7.5,
    sigma: 14,
    holdings: 101,
    aum: 8,
    beta: 0.8,
    r1y: 14,
    r3y: 5,
    r5y: 6.5,
    r10y: 7.5,
    maxDD: -30,
  },

  XYLD: {
    mu: 7,
    sigma: 11,
    holdings: 503,
    aum: 3,
    beta: 0.75,
    r1y: 11.5,
    r3y: 4,
    r5y: 7,
    r10y: 7,
    maxDD: -22,
  },

  // International
  VEA: {
    mu: 7.5,
    sigma: 14,
    holdings: 4030,
    aum: 130,
    beta: 0.85,
    r1y: 5.5,
    r3y: 1.5,
    r5y: 5.5,
    r10y: 5,
    maxDD: -26,
  },

  IEFA: {
    mu: 7.5,
    sigma: 14,
    holdings: 2900,
    aum: 130,
    beta: 0.85,
    r1y: 5.4,
    r3y: 1.4,
    r5y: 5.5,
    r10y: 5,
    maxDD: -26,
  },

  VXUS: {
    mu: 7.5,
    sigma: 14.5,
    holdings: 8500,
    aum: 75,
    beta: 0.88,
    r1y: 5.7,
    r3y: 1,
    r5y: 5,
    r10y: 4.5,
    maxDD: -27,
  },

  EFA: {
    mu: 7,
    sigma: 14.5,
    holdings: 780,
    aum: 55,
    beta: 0.88,
    r1y: 5,
    r3y: 1,
    r5y: 5,
    r10y: 4.5,
    maxDD: -27.5,
  },

  ACWI: {
    mu: 9,
    sigma: 14,
    holdings: 2300,
    aum: 18,
    beta: 0.95,
    r1y: 17.5,
    r3y: 5.5,
    r5y: 10.5,
    r10y: 9,
    maxDD: -25,
  },

  EWJ: {
    mu: 7,
    sigma: 14,
    holdings: 230,
    aum: 13,
    beta: 0.75,
    r1y: 13,
    r3y: 3.5,
    r5y: 6,
    r10y: 5.5,
    maxDD: -23,
  },

  EWG: {
    mu: 6.5,
    sigma: 18,
    holdings: 65,
    aum: 1.8,
    beta: 0.95,
    r1y: 18,
    r3y: 1.5,
    r5y: 5.5,
    r10y: 5,
    maxDD: -30,
  },

  EWU: {
    mu: 5.5,
    sigma: 14.5,
    holdings: 85,
    aum: 3,
    beta: 0.85,
    r1y: 9.5,
    r3y: 5.5,
    r5y: 5,
    r10y: 3.5,
    maxDD: -26,
  },

  // Emerging Markets
  VWO: {
    mu: 7,
    sigma: 18,
    holdings: 5700,
    aum: 90,
    beta: 0.95,
    r1y: 8,
    r3y: -3.5,
    r5y: 4,
    r10y: 3.5,
    maxDD: -32,
  },

  IEMG: {
    mu: 7,
    sigma: 18,
    holdings: 2800,
    aum: 80,
    beta: 0.95,
    r1y: 8.5,
    r3y: -3.5,
    r5y: 4,
    r10y: 3.5,
    maxDD: -32,
  },

  EEM: {
    mu: 6.5,
    sigma: 18.5,
    holdings: 1235,
    aum: 18,
    beta: 0.95,
    r1y: 8,
    r3y: -4,
    r5y: 3.5,
    r10y: 3,
    maxDD: -33,
  },

  FXI: {
    mu: 3.5,
    sigma: 23,
    holdings: 50,
    aum: 6.5,
    beta: 1.05,
    r1y: 14,
    r3y: -9.5,
    r5y: -3,
    r10y: 1.5,
    maxDD: -50,
  },

  INDA: {
    mu: 11,
    sigma: 18,
    holdings: 130,
    aum: 11,
    beta: 0.9,
    r1y: 22.5,
    r3y: 7.5,
    r5y: 13.5,
    r10y: 9,
    maxDD: -32,
  },

  EWZ: {
    mu: 5.5,
    sigma: 30,
    holdings: 55,
    aum: 5.5,
    beta: 1.25,
    r1y: -25,
    r3y: 0.5,
    r5y: 0.5,
    r10y: 0,
    maxDD: -50,
  },

  // Fixed Income
  AGG: {
    mu: 4.5,
    sigma: 6,
    holdings: 11800,
    aum: 115,
    beta: 0.1,
    r1y: 5,
    r3y: -2.5,
    r5y: -0.5,
    r10y: 1.5,
    maxDD: -17.5,
  },

  BND: {
    mu: 4.5,
    sigma: 6,
    holdings: 11000,
    aum: 120,
    beta: 0.1,
    r1y: 5,
    r3y: -2.5,
    r5y: -0.5,
    r10y: 1.5,
    maxDD: -17.5,
  },

  TLT: {
    mu: 4,
    sigma: 14,
    holdings: 42,
    aum: 55,
    beta: -0.1,
    r1y: -3,
    r3y: -13,
    r5y: -5,
    r10y: 0.5,
    maxDD: -50,
  },

  IEF: {
    mu: 4,
    sigma: 7.5,
    holdings: 14,
    aum: 32,
    beta: 0,
    r1y: 1.5,
    r3y: -5,
    r5y: -1.5,
    r10y: 0.5,
    maxDD: -22,
  },

  SHY: {
    mu: 4.5,
    sigma: 1.5,
    holdings: 80,
    aum: 25,
    beta: 0.02,
    r1y: 4.5,
    r3y: 0.5,
    r5y: 1,
    r10y: 1,
    maxDD: -5,
  },

  TIP: {
    mu: 4.5,
    sigma: 7.5,
    holdings: 50,
    aum: 14,
    beta: 0.2,
    r1y: 4.5,
    r3y: -1.5,
    r5y: 2,
    r10y: 2.5,
    maxDD: -15,
  },

  LQD: {
    mu: 5,
    sigma: 9,
    holdings: 2600,
    aum: 30,
    beta: 0.3,
    r1y: 4.5,
    r3y: -2.5,
    r5y: 1,
    r10y: 2.5,
    maxDD: -22,
  },

  HYG: {
    mu: 7,
    sigma: 9,
    holdings: 1230,
    aum: 14,
    beta: 0.55,
    r1y: 9,
    r3y: 1.5,
    r5y: 3.5,
    r10y: 4,
    maxDD: -23.5,
  },

  MUB: {
    mu: 3.5,
    sigma: 5,
    holdings: 5550,
    aum: 38,
    beta: 0.05,
    r1y: 3,
    r3y: -0.5,
    r5y: 1,
    r10y: 2.5,
    maxDD: -11,
  },

  BIL: {
    mu: 5.2,
    sigma: 0.4,
    holdings: 18,
    aum: 38,
    beta: 0,
    r1y: 5.3,
    r3y: 3.2,
    r5y: 1.9,
    r10y: 1.2,
    maxDD: -0.2,
  },

  JPST: {
    mu: 5.3,
    sigma: 0.5,
    holdings: 700,
    aum: 39,
    beta: 0.02,
    r1y: 5.5,
    r3y: 3.6,
    r5y: 2.6,
    r10y: 0,
    maxDD: -1,
  },

  ICSH: {
    mu: 5.3,
    sigma: 0.5,
    holdings: 400,
    aum: 7.8,
    beta: 0.02,
    r1y: 5.5,
    r3y: 3.6,
    r5y: 2.5,
    r10y: 1.8,
    maxDD: -1,
  },

  GBIL: {
    mu: 5,
    sigma: 0.3,
    holdings: 40,
    aum: 7.5,
    beta: 0,
    r1y: 5.2,
    r3y: 3.3,
    r5y: 2.2,
    r10y: 0,
    maxDD: -0.3,
  },

  // UCITS money-market / ultra-short
  XEON: {
    mu: 3,
    sigma: 0.3,
    holdings: 1,
    aum: 22.4,
    beta: 0,
    r1y: 3.8,
    r3y: 2.4,
    r5y: 1.3,
    r10y: 0.4,
    maxDD: -0.1,
  },

  ERNE: {
    mu: 3.4,
    sigma: 0.6,
    holdings: 280,
    aum: 3.4,
    beta: 0.02,
    r1y: 4.1,
    r3y: 2.3,
    r5y: 1.4,
    r10y: 0,
    maxDD: -1.2,
  },

  ERNA: {
    mu: 5,
    sigma: 0.6,
    holdings: 340,
    aum: 2.6,
    beta: 0.02,
    r1y: 5.4,
    r3y: 3.4,
    r5y: 2.4,
    r10y: 0,
    maxDD: -1.4,
  },

  ERNS: {
    mu: 4.8,
    sigma: 0.6,
    holdings: 200,
    aum: 0.9,
    beta: 0.02,
    r1y: 5.1,
    r3y: 3.2,
    r5y: 2,
    r10y: 0,
    maxDD: -1.3,
  },

  IB01: {
    mu: 4.6,
    sigma: 0.4,
    holdings: 20,
    aum: 8.5,
    beta: 0,
    r1y: 5,
    r3y: 3.1,
    r5y: 0,
    r10y: 0,
    maxDD: -0.3,
  },

  // Real Estate
  VNQ: {
    mu: 7,
    sigma: 18,
    holdings: 160,
    aum: 35,
    beta: 0.85,
    r1y: 9,
    r3y: -1.5,
    r5y: 4,
    r10y: 6.5,
    maxDD: -35,
  },

  // Commodities
  GLD: {
    mu: 6.5,
    sigma: 14,
    holdings: 1,
    aum: 68,
    beta: 0.1,
    r1y: 28,
    r3y: 14,
    r5y: 11,
    r10y: 7.5,
    maxDD: -19,
  },

  IAU: {
    mu: 6.5,
    sigma: 14,
    holdings: 1,
    aum: 33,
    beta: 0.1,
    r1y: 28,
    r3y: 14,
    r5y: 11,
    r10y: 7.5,
    maxDD: -19,
  },

  SLV: {
    mu: 5.5,
    sigma: 24,
    holdings: 1,
    aum: 13,
    beta: 0.2,
    r1y: 30,
    r3y: 7.5,
    r5y: 9.5,
    r10y: 3.5,
    maxDD: -30,
  },

  // UCITS Flagships
  IWDA: {
    mu: 10.5,
    sigma: 14.5,
    holdings: 1450,
    aum: 80,
    beta: 1,
    r1y: 21.5,
    r3y: 8.5,
    r5y: 13,
    r10y: 11,
    maxDD: -25,
  },

  CSPX: {
    mu: 10.5,
    sigma: 15,
    holdings: 503,
    aum: 90,
    beta: 1,
    r1y: 24,
    r3y: 9.7,
    r5y: 14.7,
    r10y: 12.4,
    maxDD: -23.9,
  },

  VWRL: {
    mu: 9.5,
    sigma: 14.5,
    holdings: 3800,
    aum: 8.5,
    beta: 0.95,
    r1y: 18,
    r3y: 6.5,
    r5y: 11.5,
    r10y: 9.5,
    maxDD: -26,
  },

  VWCE: {
    mu: 9.5,
    sigma: 14.5,
    holdings: 3800,
    aum: 18,
    beta: 0.95,
    r1y: 18.5,
    r3y: 7,
    r5y: 11.5,
    r10y: 0,
    maxDD: -26,
  },

  EIMI: {
    mu: 7,
    sigma: 18,
    holdings: 3000,
    aum: 25,
    beta: 0.95,
    r1y: 8.5,
    r3y: -3,
    r5y: 4.5,
    r10y: 4,
    maxDD: -32,
  },

  VUSA: {
    mu: 10.5,
    sigma: 15,
    holdings: 503,
    aum: 50,
    beta: 1,
    r1y: 24,
    r3y: 9.6,
    r5y: 14.6,
    r10y: 12.3,
    maxDD: -23.9,
  },

  CNDX: {
    mu: 13.5,
    sigma: 21,
    holdings: 101,
    aum: 15,
    beta: 1.18,
    r1y: 29.5,
    r3y: 11.5,
    r5y: 21.5,
    r10y: 18,
    maxDD: -32.5,
  },

  EQQQ: {
    mu: 13.5,
    sigma: 21,
    holdings: 101,
    aum: 9,
    beta: 1.18,
    r1y: 29,
    r3y: 11,
    r5y: 21,
    r10y: 17.5,
    maxDD: -32.5,
  },

  // Active mutual fund flagships
  DODGX: {
    mu: 11,
    sigma: 16,
    holdings: 75,
    aum: 95,
    beta: 1,
    r1y: 18.5,
    r3y: 11,
    r5y: 14,
    r10y: 11,
    maxDD: -26,
  },

  FCNTX: {
    mu: 11.5,
    sigma: 18,
    holdings: 330,
    aum: 140,
    beta: 1.05,
    r1y: 34,
    r3y: 11.5,
    r5y: 17,
    r10y: 13.5,
    maxDD: -30,
  },

  AGTHX: {
    mu: 11,
    sigma: 17,
    holdings: 340,
    aum: 280,
    beta: 1.05,
    r1y: 30,
    r3y: 8.5,
    r5y: 15,
    r10y: 13,
    maxDD: -29,
  },

  PIMIX: {
    mu: 6,
    sigma: 5.5,
    holdings: 8500,
    aum: 115,
    beta: 0.3,
    r1y: 9.5,
    r3y: 3.5,
    r5y: 3,
    r10y: 4.5,
    maxDD: -12,
  },

  PRWCX: {
    mu: 11,
    sigma: 11,
    holdings: 175,
    aum: 55,
    beta: 0.8,
    r1y: 18,
    r3y: 9.5,
    r5y: 13,
    r10y: 11.5,
    maxDD: -20,
  },

  // Crypto
  IBIT: {
    mu: 35,
    sigma: 62,
    holdings: 1,
    aum: 55,
    beta: 1.85,
    r1y: 120,
    r3y: 0,
    r5y: 0,
    r10y: 0,
    maxDD: -22,
  },

  FBTC: {
    mu: 35,
    sigma: 62,
    holdings: 1,
    aum: 20,
    beta: 1.85,
    r1y: 120,
    r3y: 0,
    r5y: 0,
    r10y: 0,
    maxDD: -22,
  },

  ETHA: {
    mu: 30,
    sigma: 75,
    holdings: 1,
    aum: 5,
    beta: 2.1,
    r1y: 45,
    r3y: 0,
    r5y: 0,
    r10y: 0,
    maxDD: -30,
  },

  // Sponsor-depth additions
  VXF: {
    mu: 9.5,
    sigma: 20,
    holdings: 3600,
    aum: 20,
    beta: 1.12,
    inception: 2001,
  },
  VONG: {
    mu: 12.5,
    sigma: 19,
    holdings: 390,
    aum: 14,
    beta: 1.11,
    inception: 2010,
  },
  VONV: {
    mu: 9.5,
    sigma: 14.5,
    holdings: 850,
    aum: 10,
    beta: 0.92,
    inception: 2010,
  },
  VTHR: {
    mu: 10.4,
    sigma: 15.5,
    holdings: 2800,
    aum: 3.5,
    beta: 1.02,
    inception: 2010,
  },
  VTWG: {
    mu: 9,
    sigma: 22.5,
    holdings: 1080,
    aum: 1,
    beta: 1.2,
    inception: 2010,
  },
  VTWV: {
    mu: 9,
    sigma: 21.5,
    holdings: 1420,
    aum: 1,
    beta: 1.16,
    inception: 2010,
  },
  VOOG: {
    mu: 12,
    sigma: 18,
    holdings: 230,
    aum: 13,
    beta: 1.09,
    inception: 2010,
  },
  VOOV: {
    mu: 9.5,
    sigma: 14.5,
    holdings: 400,
    aum: 5.5,
    beta: 0.92,
    inception: 2010,
  },
  VIOO: {
    mu: 9.5,
    sigma: 21,
    holdings: 600,
    aum: 2.8,
    beta: 1.15,
    inception: 2010,
  },
  VIOG: {
    mu: 9.5,
    sigma: 22,
    holdings: 340,
    aum: 1.2,
    beta: 1.17,
    inception: 2010,
  },
  VIOV: {
    mu: 9.5,
    sigma: 21.5,
    holdings: 460,
    aum: 2,
    beta: 1.14,
    inception: 2010,
  },
  IVOO: {
    mu: 10,
    sigma: 18.5,
    holdings: 400,
    aum: 2.7,
    beta: 1.08,
    inception: 2010,
  },
  IVOG: {
    mu: 10,
    sigma: 19.5,
    holdings: 230,
    aum: 1.1,
    beta: 1.1,
    inception: 2010,
  },
  IVOV: {
    mu: 10,
    sigma: 18.5,
    holdings: 290,
    aum: 1.1,
    beta: 1.06,
    inception: 2010,
  },

  VIGI: {
    mu: 8.5,
    sigma: 15,
    holdings: 350,
    aum: 6.5,
    beta: 0.8,
    inception: 2016,
  },
  VFMF: {
    mu: 10,
    sigma: 17,
    holdings: 600,
    aum: 0.4,
    beta: 1,
    inception: 2018,
  },
  VFMO: {
    mu: 11,
    sigma: 19,
    holdings: 600,
    aum: 0.7,
    beta: 1.05,
    inception: 2018,
  },
  VFVA: {
    mu: 10,
    sigma: 19.5,
    holdings: 750,
    aum: 1,
    beta: 1.08,
    inception: 2018,
  },
  VFQY: {
    mu: 10.5,
    sigma: 16.5,
    holdings: 450,
    aum: 0.4,
    beta: 0.98,
    inception: 2018,
  },

  BSV: {
    mu: 4.3,
    sigma: 2.5,
    holdings: 2800,
    aum: 33,
    beta: 0.03,
    inception: 2007,
  },
  BIV: {
    mu: 4.8,
    sigma: 6,
    holdings: 2100,
    aum: 22,
    beta: 0.12,
    inception: 2007,
  },
  BLV: {
    mu: 5.2,
    sigma: 12,
    holdings: 3000,
    aum: 6,
    beta: 0.28,
    inception: 2007,
  },

  VCRB: {
    mu: 4.8,
    sigma: 5.5,
    holdings: 1600,
    aum: 2.5,
    beta: 0.1,
    inception: 2023,
    r3y: 0,
    r5y: 0,
    r10y: 0,
  },

  VPLS: {
    mu: 5.3,
    sigma: 6,
    holdings: 1400,
    aum: 1,
    beta: 0.15,
    inception: 2023,
    r3y: 0,
    r5y: 0,
    r10y: 0,
  },

  VTES: {
    mu: 3.2,
    sigma: 1.5,
    holdings: 1000,
    aum: 1.5,
    beta: 0.02,
    inception: 2023,
    r3y: 0,
    r5y: 0,
    r10y: 0,
  },

  VCEB: {
    mu: 5,
    sigma: 6.5,
    holdings: 800,
    aum: 0.6,
    beta: 0.13,
    inception: 2020,
    r5y: 0,
    r10y: 0,
  },

  VUSB: {
    mu: 4.9,
    sigma: 0.8,
    holdings: 700,
    aum: 5,
    beta: 0.01,
    inception: 2021,
    r5y: 0,
    r10y: 0,
  },

  VMRXX: { mu: 5, sigma: 0.25, holdings: 200, aum: 200, beta: 0 },

  VDIGX: { mu: 9.5, sigma: 13, holdings: 45, aum: 52, beta: 0.83 },
  VEIPX: { mu: 9, sigma: 13, holdings: 190, aum: 55, beta: 0.8 },
  VWNDX: { mu: 9.5, sigma: 17, holdings: 130, aum: 22, beta: 1.02 },
  VWNFX: { mu: 9.5, sigma: 16, holdings: 150, aum: 50, beta: 0.98 },
  VGHCX: { mu: 8.5, sigma: 14.5, holdings: 100, aum: 45, beta: 0.7 },
  VASGX: { mu: 8.5, sigma: 14, holdings: 4, aum: 29, beta: 0.8 },
  VSMGX: { mu: 7, sigma: 10.5, holdings: 4, aum: 33, beta: 0.6 },
  VSCGX: { mu: 5.8, sigma: 7.5, holdings: 4, aum: 18, beta: 0.4 },
  VASIX: { mu: 4.8, sigma: 5, holdings: 4, aum: 6.5, beta: 0.2 },
  VTMFX: { mu: 7.5, sigma: 9.5, holdings: 2, aum: 9, beta: 0.58 },

  VWRP: { mu: 9, sigma: 15, holdings: 3700, aum: 14, beta: 1 },
  VNRT: { mu: 10.3, sigma: 15.5, holdings: 700, aum: 4, beta: 1.01 },
  VNRA: { mu: 10.3, sigma: 15.5, holdings: 700, aum: 2, beta: 1.01 },

  // Fidelity
  FTEC: {
    mu: 11.5,
    sigma: 22,
    holdings: 300,
    aum: 13,
    beta: 1.25,
    inception: 2013,
  },
  FHLC: {
    mu: 8.5,
    sigma: 15,
    holdings: 380,
    aum: 2.6,
    beta: 0.72,
    inception: 2013,
  },
  FNCL: {
    mu: 9.5,
    sigma: 20,
    holdings: 390,
    aum: 2,
    beta: 1.08,
    inception: 2013,
  },
  FENY: {
    mu: 8,
    sigma: 26,
    holdings: 110,
    aum: 1.6,
    beta: 1.02,
    inception: 2013,
  },
  FDIS: {
    mu: 10,
    sigma: 20,
    holdings: 290,
    aum: 1.6,
    beta: 1.2,
    inception: 2013,
  },
  FSTA: {
    mu: 7.5,
    sigma: 13,
    holdings: 100,
    aum: 1.2,
    beta: 0.58,
    inception: 2013,
  },
  FIDU: {
    mu: 9.5,
    sigma: 18,
    holdings: 350,
    aum: 1.1,
    beta: 1.05,
    inception: 2013,
  },
  FUTY: {
    mu: 7.5,
    sigma: 15,
    holdings: 70,
    aum: 1.4,
    beta: 0.55,
    inception: 2013,
  },
  FMAT: {
    mu: 8,
    sigma: 19.5,
    holdings: 120,
    aum: 0.6,
    beta: 1.05,
    inception: 2013,
  },
  FCOM: {
    mu: 9,
    sigma: 19,
    holdings: 120,
    aum: 1.2,
    beta: 1.05,
    inception: 2013,
  },

  FDVV: {
    mu: 9.5,
    sigma: 14.5,
    holdings: 110,
    aum: 4.5,
    beta: 0.88,
    inception: 2016,
  },
  FQAL: {
    mu: 10.5,
    sigma: 15.5,
    holdings: 250,
    aum: 1.2,
    beta: 0.97,
    inception: 2016,
  },
  FVAL: {
    mu: 9.5,
    sigma: 15.5,
    holdings: 130,
    aum: 1.5,
    beta: 0.95,
    inception: 2016,
  },
  FDLO: {
    mu: 9,
    sigma: 12.5,
    holdings: 130,
    aum: 1,
    beta: 0.78,
    inception: 2016,
  },
  FDMO: {
    mu: 10.5,
    sigma: 17.5,
    holdings: 120,
    aum: 0.4,
    beta: 1.05,
    inception: 2016,
  },
  FSMD: {
    mu: 9.5,
    sigma: 18.5,
    holdings: 400,
    aum: 1.5,
    beta: 1.05,
    inception: 2019,
  },
  FDRR: {
    mu: 9.5,
    sigma: 14.5,
    holdings: 110,
    aum: 0.5,
    beta: 0.9,
    inception: 2016,
  },

  FELG: { mu: 10.8, sigma: 15.5, holdings: 200, aum: 2.5, beta: 1.02 },

  FDIG: {
    mu: 14,
    sigma: 45,
    holdings: 40,
    aum: 0.2,
    beta: 1.7,
    inception: 2022,
    r5y: 0,
    r10y: 0,
  },

  FNILX: {
    mu: 10.5,
    sigma: 15,
    holdings: 500,
    aum: 10,
    beta: 1,
    inception: 2018,
  },
  FZIPX: {
    mu: 9.5,
    sigma: 20,
    holdings: 2500,
    aum: 2,
    beta: 1.12,
    inception: 2018,
  },
  FSPGX: { mu: 12.5, sigma: 19, holdings: 390, aum: 9, beta: 1.11 },
  FLCOX: { mu: 9.5, sigma: 14.5, holdings: 850, aum: 8, beta: 0.92 },
  FSSNX: { mu: 9, sigma: 21, holdings: 1980, aum: 9, beta: 1.18 },
  FSMDX: { mu: 10, sigma: 18.5, holdings: 820, aum: 14, beta: 1.08 },
  FTIHX: { mu: 8, sigma: 16, holdings: 5200, aum: 20, beta: 0.85 },
  FSGGX: { mu: 8, sigma: 16, holdings: 2300, aum: 5, beta: 0.85 },
  FIPDX: { mu: 4.2, sigma: 6, holdings: 50, aum: 6.5, beta: 0.1 },
  FUAMX: { mu: 4.3, sigma: 6.5, holdings: 30, aum: 3, beta: 0.08 },
  FUMBX: { mu: 4.2, sigma: 1.8, holdings: 80, aum: 2.5, beta: 0.02 },
  FNBGX: { mu: 4.6, sigma: 14, holdings: 35, aum: 1.5, beta: 0.25 },

  FBALX: { mu: 8, sigma: 11, holdings: 1200, aum: 39, beta: 0.65 },
  FPURX: { mu: 7.8, sigma: 10.5, holdings: 900, aum: 29, beta: 0.62 },
  FLPSX: { mu: 9, sigma: 15.5, holdings: 800, aum: 26, beta: 0.85 },
  FMAGX: { mu: 10.5, sigma: 17.5, holdings: 150, aum: 29, beta: 1.05 },
  FSELX: { mu: 14, sigma: 31, holdings: 50, aum: 22, beta: 1.45 },
  FSPTX: { mu: 12.5, sigma: 24, holdings: 130, aum: 15, beta: 1.28 },
  FSPHX: { mu: 9, sigma: 17, holdings: 130, aum: 9, beta: 0.78 },
  FAGIX: { mu: 7, sigma: 9.5, holdings: 500, aum: 12, beta: 0.55 },
  FSICX: { mu: 5.8, sigma: 7, holdings: 1400, aum: 7, beta: 0.35 },

  FDRXX: { mu: 4.9, sigma: 0.25, holdings: 200, aum: 250, beta: 0 },
  FTEXX: { mu: 3.2, sigma: 0.3, holdings: 400, aum: 15, beta: 0 },

  FUSD: {
    mu: 9.8,
    sigma: 14.5,
    holdings: 130,
    aum: 1.2,
    beta: 0.92,
    inception: 2017,
  },
  FEME: {
    mu: 8.5,
    sigma: 17,
    holdings: 180,
    aum: 0.5,
    beta: 0.9,
    inception: 2017,
  },

  // iShares
  IXN: { mu: 11.5, sigma: 21, holdings: 130, aum: 5.5, beta: 1.22 },
  IXJ: { mu: 8.5, sigma: 14, holdings: 120, aum: 4, beta: 0.68 },
  IXG: { mu: 9, sigma: 18.5, holdings: 220, aum: 0.5, beta: 1.05 },
  IXC: { mu: 8, sigma: 23, holdings: 60, aum: 2, beta: 0.95 },
  IXP: { mu: 9, sigma: 18, holdings: 70, aum: 0.4, beta: 1 },
  MXI: { mu: 8, sigma: 19, holdings: 110, aum: 0.3, beta: 1 },
  EXI: { mu: 9, sigma: 16.5, holdings: 230, aum: 0.6, beta: 0.98 },
  KXI: { mu: 7, sigma: 12.5, holdings: 100, aum: 0.7, beta: 0.55 },
  RXI: { mu: 9.5, sigma: 18.5, holdings: 200, aum: 0.4, beta: 1.12 },
  JXI: { mu: 7, sigma: 14, holdings: 70, aum: 0.2, beta: 0.55 },
  IGF: { mu: 7.5, sigma: 14, holdings: 75, aum: 3.5, beta: 0.65 },

  IYY: { mu: 10.4, sigma: 15.5, holdings: 1100, aum: 2.3, beta: 1.02 },
  IYC: { mu: 10, sigma: 20, holdings: 170, aum: 1.6, beta: 1.2 },
  IYK: { mu: 7.5, sigma: 13, holdings: 55, aum: 1.5, beta: 0.58 },
  IYJ: { mu: 9.5, sigma: 18, holdings: 180, aum: 1.5, beta: 1.05 },
  IYM: { mu: 8, sigma: 19.5, holdings: 120, aum: 0.6, beta: 1.05 },
  IYZ: { mu: 6.5, sigma: 20, holdings: 25, aum: 0.4, beta: 0.95 },
  IDU: { mu: 7.5, sigma: 15, holdings: 45, aum: 1.7, beta: 0.55 },
  IYT: { mu: 9.5, sigma: 21, holdings: 50, aum: 0.7, beta: 1.1 },
  IYG: { mu: 9.5, sigma: 20, holdings: 100, aum: 1.5, beta: 1.1 },
  IHF: { mu: 9.5, sigma: 18, holdings: 70, aum: 0.6, beta: 0.8 },
  IHE: { mu: 8, sigma: 15, holdings: 40, aum: 0.6, beta: 0.68 },
  IEZ: { mu: 7, sigma: 32, holdings: 35, aum: 0.2, beta: 1.3 },
  IGE: { mu: 8, sigma: 21, holdings: 120, aum: 0.6, beta: 1.02 },
  PICK: { mu: 7.5, sigma: 27, holdings: 230, aum: 0.9, beta: 1.18 },
  SLVP: { mu: 7, sigma: 38, holdings: 35, aum: 0.3, beta: 1.05 },

  IGV: { mu: 12, sigma: 24, holdings: 120, aum: 9, beta: 1.2 },
  IGM: { mu: 12, sigma: 22, holdings: 280, aum: 5.5, beta: 1.22 },
  IHAK: {
    mu: 10.5,
    sigma: 22,
    holdings: 35,
    aum: 0.9,
    beta: 1.05,
    inception: 2019,
  },

  IDRV: {
    mu: 8,
    sigma: 26,
    holdings: 50,
    aum: 0.3,
    beta: 1.2,
    inception: 2021,
    r5y: 0,
    r10y: 0,
  },

  IUSG: { mu: 12, sigma: 18, holdings: 490, aum: 20, beta: 1.09 },
  IUSV: { mu: 9.5, sigma: 14.5, holdings: 680, aum: 19, beta: 0.92 },
  IWY: { mu: 13, sigma: 19.5, holdings: 110, aum: 9, beta: 1.12 },
  IWX: { mu: 9.5, sigma: 14, holdings: 150, aum: 1.5, beta: 0.88 },
  IWL: { mu: 10.8, sigma: 15.5, holdings: 200, aum: 1, beta: 1 },
  IWP: { mu: 10.5, sigma: 20, holdings: 290, aum: 15, beta: 1.12 },
  IWS: { mu: 9.5, sigma: 17.5, holdings: 700, aum: 13, beta: 1 },
  IWV: { mu: 10.4, sigma: 15.5, holdings: 2500, aum: 14, beta: 1.02 },
  IWC: { mu: 8.5, sigma: 24, holdings: 1400, aum: 0.8, beta: 1.22 },

  ISTB: { mu: 4.4, sigma: 2.8, holdings: 3000, aum: 4.5, beta: 0.04 },

  BINC: {
    mu: 6,
    sigma: 5,
    holdings: 2000,
    aum: 8,
    beta: 0.3,
    inception: 2023,
    r3y: 0,
    r5y: 0,
    r10y: 0,
  },

  IGOV: { mu: 3, sigma: 8, holdings: 750, aum: 1, beta: 0.15 },

  BGRN: {
    mu: 4.6,
    sigma: 6,
    holdings: 400,
    aum: 0.4,
    beta: 0.12,
    inception: 2018,
    r10y: 0,
  },

  HYDB: {
    mu: 6.5,
    sigma: 8,
    holdings: 900,
    aum: 3,
    beta: 0.45,
    inception: 2017,
    r10y: 0,
  },

  IBTF: {
    mu: 4.5,
    sigma: 0.8,
    holdings: 20,
    aum: 2,
    beta: 0.01,
    inception: 2023,
    r3y: 0,
    r5y: 0,
    r10y: 0,
  },
  IBTG: {
    mu: 4.3,
    sigma: 1.6,
    holdings: 20,
    aum: 1.5,
    beta: 0.02,
    inception: 2023,
    r3y: 0,
    r5y: 0,
    r10y: 0,
  },
  IBTH: {
    mu: 4.3,
    sigma: 2.4,
    holdings: 20,
    aum: 1.2,
    beta: 0.03,
    inception: 2023,
    r3y: 0,
    r5y: 0,
    r10y: 0,
  },
  IBTI: {
    mu: 4.3,
    sigma: 3.2,
    holdings: 20,
    aum: 0.9,
    beta: 0.04,
    inception: 2023,
    r3y: 0,
    r5y: 0,
    r10y: 0,
  },
  IBTJ: {
    mu: 4.3,
    sigma: 4,
    holdings: 20,
    aum: 0.7,
    beta: 0.05,
    inception: 2023,
    r3y: 0,
    r5y: 0,
    r10y: 0,
  },
  IBTK: {
    mu: 4.3,
    sigma: 4.8,
    holdings: 20,
    aum: 0.5,
    beta: 0.06,
    inception: 2023,
    r3y: 0,
    r5y: 0,
    r10y: 0,
  },
  IBTL: {
    mu: 4.3,
    sigma: 5.6,
    holdings: 20,
    aum: 0.4,
    beta: 0.07,
    inception: 2023,
    r3y: 0,
    r5y: 0,
    r10y: 0,
  },

  TLTW: {
    mu: 7,
    sigma: 12,
    holdings: 2,
    aum: 1,
    beta: 0.15,
    inception: 2022,
    r5y: 0,
    r10y: 0,
  },
  HYGW: {
    mu: 7.5,
    sigma: 7,
    holdings: 2,
    aum: 0.3,
    beta: 0.35,
    inception: 2022,
    r5y: 0,
    r10y: 0,
  },
  LQDW: {
    mu: 6,
    sigma: 6,
    holdings: 2,
    aum: 0.3,
    beta: 0.2,
    inception: 2022,
    r5y: 0,
    r10y: 0,
  },

  WSML: {
    mu: 9,
    sigma: 18,
    holdings: 3300,
    aum: 4.5,
    beta: 1.05,
    inception: 2018,
  },
  AGGU: {
    mu: 4.6,
    sigma: 5,
    holdings: 9000,
    aum: 3,
    beta: 0.08,
    inception: 2019,
  },
  IEGA: { mu: 3.2, sigma: 5.5, holdings: 400, aum: 4, beta: 0.1 },

  // UCITS alternatives
  IPRV: {
    mu: 9,
    sigma: 25,
    holdings: 80,
    aum: 0.9,
    beta: 1.2,
    maxDD: -60,
    inception: 2007,
  },
  DWSCK: {
    mu: 5.5,
    sigma: 8,
    holdings: 250,
    aum: 9,
    beta: 0.35,
    maxDD: -14,
    inception: 2011,
  },
  JPGMO: {
    mu: 5,
    sigma: 7.5,
    holdings: 300,
    aum: 2.5,
    beta: 0.2,
    maxDD: -12,
    inception: 2013,
  },
  MANTGR: {
    mu: 5.5,
    sigma: 9,
    holdings: 60,
    aum: 2,
    beta: 0.35,
    maxDD: -15,
    inception: 2014,
  },
  MANTRD: {
    mu: 6,
    sigma: 12,
    holdings: 80,
    aum: 1.5,
    beta: 0.05,
    maxDD: -18,
    inception: 2015,
  },
  PICTAT: {
    mu: 5,
    sigma: 5.5,
    holdings: 200,
    aum: 3,
    beta: 0.1,
    maxDD: -9,
    inception: 2014,
  },
  PICTDA: {
    mu: 4.8,
    sigma: 4.5,
    holdings: 400,
    aum: 1.5,
    beta: 0.15,
    maxDD: -8,
    inception: 2018,
  },
  SGAIBT: {
    mu: 6,
    sigma: 13,
    holdings: 150,
    aum: 0.9,
    beta: 0.05,
    maxDD: -20,
    inception: 2012,
  },
  SGAICB: {
    mu: 7,
    sigma: 5,
    holdings: 120,
    aum: 1.3,
    beta: 0.05,
    maxDD: -16,
    inception: 2013,
  },
  GAMSCB: {
    mu: 6.8,
    sigma: 4.5,
    holdings: 100,
    aum: 2.5,
    beta: 0.05,
    maxDD: -14,
    inception: 2017,
  },
  NORA10: {
    mu: 5.2,
    sigma: 5,
    holdings: 500,
    aum: 1.2,
    beta: 0.2,
    maxDD: -9,
    inception: 2017,
  },
  BSFGED: {
    mu: 5.5,
    sigma: 6.5,
    holdings: 180,
    aum: 1.8,
    beta: 0.25,
    maxDD: -11,
    inception: 2015,
  },
  LUMMWT: {
    mu: 6.5,
    sigma: 8,
    holdings: 400,
    aum: 3,
    beta: 0.25,
    maxDD: -12,
    inception: 2013,
  },
  JUPGAR: {
    mu: 4.8,
    sigma: 6,
    holdings: 300,
    aum: 0.6,
    beta: 0.05,
    maxDD: -12,
    inception: 2009,
  },
  ELEVAR: {
    mu: 5.5,
    sigma: 6.5,
    holdings: 120,
    aum: 2,
    beta: 0.2,
    maxDD: -11,
    inception: 2018,
  },
  BNYGRR: {
    mu: 5,
    sigma: 6,
    holdings: 300,
    aum: 3.5,
    beta: 0.3,
    maxDD: -12,
    inception: 2010,
  },

  // CHF-hedged share classes
  DWSCKC: {
    mu: 3,
    sigma: 8,
    holdings: 250,
    aum: 9,
    beta: 0.35,
    maxDD: -14,
    inception: 2011,
  },
  JPGMOC: {
    mu: 2.5,
    sigma: 7.5,
    holdings: 300,
    aum: 2.5,
    beta: 0.2,
    maxDD: -12,
    inception: 2013,
  },
  MANTGRC: {
    mu: 1.5,
    sigma: 9,
    holdings: 60,
    aum: 2,
    beta: 0.35,
    maxDD: -15,
    inception: 2014,
  },
  MANTRDC: {
    mu: 2,
    sigma: 12,
    holdings: 80,
    aum: 1.5,
    beta: 0.05,
    maxDD: -18,
    inception: 2015,
  },
  PICTATC: {
    mu: 2.5,
    sigma: 5.5,
    holdings: 200,
    aum: 3,
    beta: 0.1,
    maxDD: -9,
    inception: 2014,
  },
  PICTDAC: {
    mu: 2.3,
    sigma: 4.5,
    holdings: 400,
    aum: 1.5,
    beta: 0.15,
    maxDD: -8,
    inception: 2018,
  },
  SGAIBTC: {
    mu: 2,
    sigma: 13,
    holdings: 150,
    aum: 0.9,
    beta: 0.05,
    maxDD: -20,
    inception: 2012,
  },
  SGAICBC: {
    mu: 3,
    sigma: 5,
    holdings: 120,
    aum: 1.3,
    beta: 0.05,
    maxDD: -16,
    inception: 2013,
  },
  GAMSCBC: {
    mu: 2.8,
    sigma: 4.5,
    holdings: 100,
    aum: 2.5,
    beta: 0.05,
    maxDD: -14,
    inception: 2017,
  },
  NORA10C: {
    mu: 2.7,
    sigma: 5,
    holdings: 500,
    aum: 1.2,
    beta: 0.2,
    maxDD: -9,
    inception: 2017,
  },
  BSFGEDC: {
    mu: 1.5,
    sigma: 6.5,
    holdings: 180,
    aum: 1.8,
    beta: 0.25,
    maxDD: -11,
    inception: 2015,
  },
  LUMMWTC: {
    mu: 2.5,
    sigma: 8,
    holdings: 400,
    aum: 3,
    beta: 0.25,
    maxDD: -12,
    inception: 2013,
  },
  JUPGARC: {
    mu: 0.8,
    sigma: 6,
    holdings: 300,
    aum: 0.6,
    beta: 0.05,
    maxDD: -12,
    inception: 2009,
  },
  ELEVARC: {
    mu: 3,
    sigma: 6.5,
    holdings: 120,
    aum: 2,
    beta: 0.2,
    maxDD: -11,
    inception: 2018,
  },
  BNYGRRC: {
    mu: 2.5,
    sigma: 6,
    holdings: 300,
    aum: 3.5,
    beta: 0.3,
    maxDD: -12,
    inception: 2010,
  },
};

const RISK_FREE_BY_CCY: Record<string, number> = {
  USD: 4.5,
  EUR: 3.0,
  CHF: 0.5,
  GBP: 4.75,
  JPY: 0.25,
  SGD: 3.0,
  HKD: 4.5,
  AUD: 4.35,
  CAD: 3.25,
  SEK: 2.5,
  NOK: 4.5,
  DKK: 2.6,
};

function fundHash(ticker: string) {
  let h = 0;

  for (let i = 0; i < ticker.length; i++) {
    h = (h << 5) - h + ticker.charCodeAt(i);

    h |= 0;
  }

  return Math.abs(h);
}

export function enrichFund(fund: Fund): EnrichedFund {
  const defaults = CLASS_DEFAULTS[fund.cls] ?? CLASS_DEFAULTS.equity;

  const override = FUND_OVERRIDES[fund.tkr] ?? {};

  const h = fundHash(fund.tkr);

  const jitter = [
    ((h % 100) / 100 - 0.5) * 0.3,
    (((h >> 4) % 100) / 100 - 0.5) * 0.3,
    (((h >> 8) % 100) / 100 - 0.5) * 0.3,
    (((h >> 12) % 100) / 100 - 0.5) * 0.3,
    (((h >> 16) % 100) / 100 - 0.5) * 0.3,
  ];

  const mu = override.mu ?? +(defaults.mu * (1 + jitter[0])).toFixed(2);

  const sigma =
    override.sigma ?? +(defaults.sigma * (1 + jitter[1])).toFixed(2);

  const holdings =
    override.holdings ??
    Math.max(1, Math.round(defaults.holdings * (1 + jitter[2])));

  const aum =
    override.aum ?? +Math.max(0.1, defaults.aum * (1 + jitter[3])).toFixed(1);

  const beta =
    override.beta ??
    +Math.max(-0.5, defaults.beta + jitter[0] * 0.4).toFixed(2);

  let r1y: number | null =
    override.r1y ?? +(defaults.r1y + jitter[0] * 10).toFixed(2);

  let r3y: number | null =
    override.r3y ?? +(defaults.r3y + jitter[1] * 5).toFixed(2);

  let r5y: number | null =
    override.r5y ?? +(defaults.r5y + jitter[2] * 4).toFixed(2);

  let r10y: number | null =
    override.r10y ?? +(defaults.r10y + jitter[3] * 3).toFixed(2);

  const levered = /\b(2x|3x|ultra|leveraged|inverse|short|bull|bear)\b/i.test(
    fund.name || "",
  );

  const rawMaxDD =
    override.maxDD ??
    -+(sigma * 2 * (1 + Math.abs(jitter[4]) * 0.5)).toFixed(1);

  const maxDD = levered ? rawMaxDD : Math.max(-100, rawMaxDD);

  const currency =
    (
      fund as Fund & {
        ccy?: string;
      }
    ).ccy?.toUpperCase() ?? "USD";

  const riskFree = RISK_FREE_BY_CCY[currency] ?? RISK_FREE_BY_CCY.USD;

  let sharpe: number;

  if (override.sharpe != null) {
    sharpe = override.sharpe;
  } else if (fund.cls === "cash") {
    sharpe = +Math.max(-0.5, Math.min(0.5, (mu - riskFree) / 2)).toFixed(2);
  } else {
    sharpe = +((mu - riskFree) / Math.max(0.5, sigma)).toFixed(2);
  }

  const te =
    override.te ??
    (fund.vehicle === "mutual_fund"
      ? +(1.5 + (h % 25) / 10).toFixed(2)
      : +(0.05 + (h % 25) / 100).toFixed(2));

  // Legacy uses 0 as "fund isn't old enough
  // for this return period."
  if (override.r1y === 0) {
    r1y = null;
  }

  if (override.r3y === 0) {
    r3y = null;
  }

  if (override.r5y === 0) {
    r5y = null;
  }

  if (override.r10y === 0) {
    r10y = null;
  }

  const inception = override.inception ?? null;

  const yld = fund.yld ?? 0;

  const income: EnrichedFund["income"] =
    yld >= 4 ? "high" : yld >= 2 ? "moderate" : "low";

  return {
    ...fund,

    mu,
    sigma,

    holdings,
    aum,

    beta,

    r1y,
    r3y,
    r5y,
    r10y,

    maxDD,
    sharpe,
    te,

    inception,
    income,
  };
}

export function enrichFundUniverse(funds: Fund[]): EnrichedFund[] {
  return funds.map(enrichFund);
}
