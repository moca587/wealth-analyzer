import type { LegacyWealthPlan } from "@/lib/plan/legacy-schema";

export const newId = (prefix = "id") =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const today = () => new Date().toISOString();

export function emptyLegacyPlan(): LegacyWealthPlan {
  return {
    v: "1.1",
    savedAt: today(),

    fields: {
      c1f: "",
      c1l: "",
      c1d: "",
      c1r: "moderate",
      c1h: "15_plus",
      c1s1: "",
      c1s2: "",
      c1ci: "",
      c1st: "",
      c1zp: "",
      c1co: "US",

      c2f: "",
      c2l: "",
      c2d: "",
      c2r: "",
      c2h: "",
      c2s1: "",
      c2s2: "",
      c2ci: "",
      c2st: "",
      c2zp: "",
      c2co: "US",

      rel: "",

      inc1: "0",
      inc2: "0",
      inc1b: "0",
      inc2b: "0",
      raise: "0",
      savAnnual: "0",

      expL: "0",
      expI: "0",
      expO: "0",

      inf: "3.8",
      region: "us",

      aProp: "0",
      aOther: "0",

      retM: "7.0",
      retV: "12.0",
      retAge: "65",
      retSpend: "0",
      retLife: "comfortable",
      retLoc: "US",

      penSrc: "auto",
      penAnnual: "0",
      penStartAge: "67",
      penCola: "full",

      penSrc2: "auto",
      penAnnual2: "0",
      penStartAge2: "67",
      penCola2: "full",

      pfFeeType: "none",
      pfAdvisoryFee: "0",

      prFeeType: "none",
      prAdvisoryFee: "0",

      simYrs: "45",
      simN: "500",
      tgtEquity: "60",
      rebalFreq: "none",
      gpOn: "no",
      gpYears: "10",

      estExemption: "13610000",
      estRate: "40",

      taxMode: "auto",
      taxFlat: "25",
      cgtRate: "15",
      cgtTurnover: "10",
      taxApply: "yes",
      taxState: "",

      blow: "5",
      bmid: "50",
      bhigh: "95",
    },

    c2visible: false,

    assets: [],
    loans: [],
    goals: [],
    children: [],
    investments: [],
    proposals: [],
    insurances: [],
    equityComp: [],
    beneficiaries: [],

    assetSeq: 0,
    loanSeq: 0,
    goalSeq: 0,
    childSeq: 0,
    invSeq: 0,
    propSeq: 0,
    insSeq: 0,
    eqSeq: 0,
    benSeq: 0,

    pfLinkedAccountId: "",
  };
}