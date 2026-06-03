// ─────────────────────────────────────────────────────────────────
// Unit tests for the Avaloq → WealthPlan mapper.
// Pure functions, no live API — fixtures only.
// ─────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import {
  mapCountry,
  mapRisk,
  mapInstrumentClass,
  mapPartnerToClient,
  mapAccountToAsset,
  mapPositionToAsset,
  mapCreditToLoan,
  buildPlanFragmentsFromAvaloq,
  mergePlan,
} from "./mapper";
import type {
  AvaloqPartner,
  AvaloqAccount,
  AvaloqPosition,
  AvaloqCredit,
  AvaloqInstrument,
  AvaloqHouseholdData,
} from "./types";
import type { WealthPlan } from "@/lib/engine/types";

const NOW = "2026-06-02T00:00:00.000Z";

// ─── fixtures ────────────────────────────────────────────────────

const partnerFull: AvaloqPartner = {
  partnerId: "P1",
  firstName: "Ada",
  lastName: "Lovelace",
  dateOfBirth: "1980-12-10",
  domicileCountry: "CH",
  address: { city: "Zürich", region: "ZH", postalCode: "8001", country: "CH" },
  riskClassification: "BALANCED",
  investmentHorizon: "LONG",
};

const partnerLegalOnly: AvaloqPartner = {
  partnerId: "P2",
  legalName: "Grace Hopper",
  domicileCountry: "DE", // euro-zone → "EU"
};

const cashAccount: AvaloqAccount = {
  accountId: "A1",
  partnerId: "P1",
  iban: "CH93 0076 2011 6238 5295 7",
  accountType: "SAVINGS",
  balance: { amount: 25_000, currency: "CHF" },
  available: true,
};

const equityPositionEmbedded: AvaloqPosition = {
  positionId: "POS1",
  partnerId: "P1",
  instrumentId: "I-AAPL",
  quantity: 100,
  marketValue: { amount: 18_000, currency: "CHF" },
  instrument: {
    instrumentId: "I-AAPL",
    isin: "US0378331005",
    name: "Apple Inc.",
    instrumentClass: "EQUITY",
    currency: "USD",
  },
};

const reitPositionLookup: AvaloqPosition = {
  positionId: "POS2",
  partnerId: "P1",
  instrumentId: "I-REIT",
  marketValue: { amount: 50_000, currency: "CHF" },
};

const instrumentMaster: Record<string, AvaloqInstrument> = {
  "I-REIT": { instrumentId: "I-REIT", name: "Swiss Prime REIT", instrumentClass: "REAL_ESTATE_FUND" },
};

const mortgage: AvaloqCredit = {
  creditId: "C1",
  partnerId: "P1",
  creditType: "MORTGAGE",
  outstanding: { amount: 400_000, currency: "CHF" },
  interestRatePct: 1.8,
  remainingTermYears: 20,
};

// ─── code-list maps ──────────────────────────────────────────────

describe("mapCountry", () => {
  it("passes through known app country codes", () => {
    expect(mapCountry("US")).toBe("US");
    expect(mapCountry("CH")).toBe("CH");
  });
  it("is case-insensitive", () => {
    expect(mapCountry("ch")).toBe("CH");
  });
  it("collapses euro-zone members to EU", () => {
    expect(mapCountry("DE")).toBe("EU");
    expect(mapCountry("FR")).toBe("EU");
  });
  it("maps unknown countries to OTHER", () => {
    expect(mapCountry("NZ")).toBe("OTHER");
  });
  it("returns undefined for missing input", () => {
    expect(mapCountry(undefined)).toBeUndefined();
  });
});

describe("mapRisk", () => {
  it("maps numeric profiles", () => {
    expect(mapRisk("1")).toBe("very_conservative");
    expect(mapRisk("4")).toBe("moderate");
    expect(mapRisk("7")).toBe("very_aggressive");
  });
  it("maps text profiles case-insensitively", () => {
    expect(mapRisk("BALANCED")).toBe("moderate");
    expect(mapRisk("balanced")).toBe("moderate");
    expect(mapRisk("Growth")).toBe("moderately_aggressive");
  });
  it("returns undefined for unknown or missing codes", () => {
    expect(mapRisk("ZZZ")).toBeUndefined();
    expect(mapRisk(undefined)).toBeUndefined();
  });
});

describe("mapInstrumentClass", () => {
  it("maps known classes", () => {
    expect(mapInstrumentClass("EQUITY")).toBe("equity");
    expect(mapInstrumentClass("bond")).toBe("fixed_income");
    expect(mapInstrumentClass("REAL_ESTATE_FUND")).toBe("real_estate");
    expect(mapInstrumentClass("CRYPTO")).toBe("crypto");
  });
  it("defaults unknown/empty to mixed", () => {
    expect(mapInstrumentClass("WIDGETS")).toBe("mixed");
    expect(mapInstrumentClass(undefined)).toBe("mixed");
  });
});

// ─── entity mappers ──────────────────────────────────────────────

describe("mapPartnerToClient", () => {
  it("maps a fully-populated partner", () => {
    expect(mapPartnerToClient(partnerFull)).toEqual({
      id: "avaloq:partner:P1",
      first: "Ada",
      last: "Lovelace",
      dob: "1980-12-10",
      country: "CH",
      state: "ZH",
      city: "Zürich",
      zip: "8001",
      risk: "moderate",
    });
  });
  it("falls back to legalName for first/last and collapses DE→EU", () => {
    const c = mapPartnerToClient(partnerLegalOnly);
    expect(c.first).toBe("Grace");
    expect(c.last).toBe("Hopper");
    expect(c.country).toBe("EU");
    expect(c.risk).toBeUndefined();
    expect(c.id).toBe("avaloq:partner:P2");
  });
});

describe("mapAccountToAsset", () => {
  it("maps a cash account to a liquid cash asset", () => {
    const a = mapAccountToAsset(cashAccount);
    expect(a).toMatchObject({
      id: "avaloq:account:A1",
      group: "Cash",
      value: 25_000,
      liquid: true,
      cls: "cash",
    });
    expect(a.note).toContain("CHF");
  });
  it("defaults liquidity to true when 'available' is absent", () => {
    const { available, ...noAvail } = cashAccount;
    void available;
    expect(mapAccountToAsset(noAvail).liquid).toBe(true);
  });
});

describe("mapPositionToAsset", () => {
  it("uses the embedded instrument and marks equities liquid", () => {
    const a = mapPositionToAsset(equityPositionEmbedded);
    expect(a).toMatchObject({
      id: "avaloq:position:POS1",
      label: "Apple Inc.",
      value: 18_000,
      cls: "equity",
      liquid: true,
    });
    expect(a.note).toContain("qty 100");
  });
  it("resolves instrument from the master map and marks real estate illiquid", () => {
    const a = mapPositionToAsset(reitPositionLookup, instrumentMaster);
    expect(a.cls).toBe("real_estate");
    expect(a.liquid).toBe(false);
    expect(a.label).toBe("Swiss Prime REIT");
  });
  it("falls back to a generic label when no instrument is found", () => {
    const a = mapPositionToAsset(reitPositionLookup); // no master provided
    expect(a.cls).toBe("mixed");
    expect(a.label).toBe("I-REIT");
  });
});

describe("mapCreditToLoan", () => {
  it("maps a mortgage with title-cased type", () => {
    expect(mapCreditToLoan(mortgage)).toEqual({
      id: "avaloq:credit:C1",
      type: "Mortgage",
      label: "Avaloq mortgage C1",
      bal: 400_000,
      rate: 1.8,
      yrs: 20,
    });
  });
  it("applies safe defaults when rate/term/type are missing", () => {
    const bare: AvaloqCredit = {
      creditId: "C2",
      partnerId: "P1",
      outstanding: { amount: 1_000, currency: "CHF" },
    };
    const loan = mapCreditToLoan(bare);
    expect(loan.type).toBe("Loan");
    expect(loan.rate).toBe(0);
    expect(loan.yrs).toBe(0);
  });
});

// ─── aggregate build ─────────────────────────────────────────────

describe("buildPlanFragmentsFromAvaloq", () => {
  const household: AvaloqHouseholdData = {
    partners: [partnerFull],
    accounts: [cashAccount],
    positions: [equityPositionEmbedded, reitPositionLookup],
    credits: [mortgage],
    instruments: instrumentMaster,
  };

  it("produces correct counts and inferred currency, no warnings (single ccy)", () => {
    const r = buildPlanFragmentsFromAvaloq(household);
    expect(r.clients).toHaveLength(1);
    expect(r.assets).toHaveLength(3); // 1 account + 2 positions
    expect(r.loans).toHaveLength(1);
    expect(r.inferredCurrency).toBe("CHF");
    expect(r.warnings).toHaveLength(0);
  });

  it("warns and truncates when more than two partners are present", () => {
    const r = buildPlanFragmentsFromAvaloq({
      ...household,
      partners: [partnerFull, partnerLegalOnly, { partnerId: "P3" }],
    });
    expect(r.clients).toHaveLength(2);
    expect(r.warnings.join(" ")).toMatch(/3 partners/);
  });

  it("warns when multiple currencies are detected", () => {
    const r = buildPlanFragmentsFromAvaloq({
      ...household,
      accounts: [cashAccount, { ...cashAccount, accountId: "A2", balance: { amount: 9, currency: "USD" } }],
    });
    expect(r.warnings.join(" ")).toMatch(/Multiple currencies/i);
  });

  it("tolerates empty arrays", () => {
    const r = buildPlanFragmentsFromAvaloq({ partners: [], accounts: [], positions: [], credits: [] });
    expect(r.clients).toHaveLength(0);
    expect(r.assets).toHaveLength(0);
    expect(r.loans).toHaveLength(0);
  });
});

// ─── merge semantics ─────────────────────────────────────────────

describe("mergePlan", () => {
  const existing: WealthPlan = {
    version: 1,
    currency: "USD",
    inflationRate: 0.03,
    clients: [{ id: "old-client", first: "Manual", last: "User" }],
    children: [{ id: "kid-1", first: "Sam", last: "User", dob: "2015-01-01" }],
    incomes: [{ id: "inc-1", clientId: "old-client", source: "salary", amount: 120_000 }],
    expenses: [{ id: "exp-1", name: "Food", amount: 800 }],
    assets: [
      { id: "manual-1", type: "Coin collection", value: 5_000, liquid: false },
      { id: "avaloq:account:OLD", type: "stale", value: 1, liquid: true },
    ],
    loans: [{ id: "avaloq:credit:OLD", type: "stale", bal: 1, rate: 1, yrs: 1 }],
    goals: [{ id: "goal-1", name: "Retire", amt: 40_000, startYear: 2050, endYear: 2080 }],
    notes: "keep me",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  };

  const mapped = buildPlanFragmentsFromAvaloq({
    partners: [partnerFull],
    accounts: [cashAccount],
    positions: [],
    credits: [mortgage],
  });

  it("preserves user planning inputs (goals, expenses, children, incomes, notes)", () => {
    const out = mergePlan(existing, mapped, NOW);
    expect(out.goals).toEqual(existing.goals);
    expect(out.expenses).toEqual(existing.expenses);
    expect(out.children).toEqual(existing.children);
    expect(out.incomes).toEqual(existing.incomes);
    expect(out.notes).toBe("keep me");
    expect(out.inflationRate).toBe(0.03);
  });

  it("replaces clients with Avaloq data and refreshes currency + timestamp", () => {
    const out = mergePlan(existing, mapped, NOW);
    expect(out.clients).toHaveLength(1);
    expect(out.clients[0].id).toBe("avaloq:partner:P1");
    expect(out.currency).toBe("CHF");
    expect(out.updatedAt).toBe(NOW);
    expect(out.createdAt).toBe(existing.createdAt); // unchanged
  });

  it("keeps manual rows but drops previously-synced avaloq rows", () => {
    const out = mergePlan(existing, mapped, NOW);
    const assetIds = out.assets.map((a) => a.id);
    expect(assetIds).toContain("manual-1"); // manual kept
    expect(assetIds).not.toContain("avaloq:account:OLD"); // stale synced dropped
    expect(assetIds).toContain("avaloq:account:A1"); // fresh synced added

    const loanIds = out.loans.map((l) => l.id);
    expect(loanIds).not.toContain("avaloq:credit:OLD");
    expect(loanIds).toContain("avaloq:credit:C1");
  });

  it("does not mutate the input plan", () => {
    const snapshot = JSON.parse(JSON.stringify(existing));
    mergePlan(existing, mapped, NOW);
    expect(existing).toEqual(snapshot);
  });
});
