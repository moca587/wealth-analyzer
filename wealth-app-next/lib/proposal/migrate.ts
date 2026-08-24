import type { Proposal, ProposalPosition } from "@/lib/orders/proposal";

type LegacyProposalPosition = {
  id?: unknown;
  name?: unknown;

  tkr?: unknown;
  ticker?: unknown;

  isin?: unknown;
  cusip?: unknown;
  valor?: unknown;

  vehicle?: unknown;
  cls?: unknown;

  alloc?: unknown;
  weightPct?: unknown;

  exp?: unknown;
  expectedReturn?: unknown;

  er?: unknown;
  yld?: unknown;

  note?: unknown;
};

type LegacyProfile = {
  fields?: Record<string, unknown>;
  proposals?: unknown;
  ccy?: unknown;
};

function stringValue(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }

  const text = String(value).trim();

  return text || undefined;
}

function numberValue(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : undefined;
}

function migratePosition(
  raw: LegacyProposalPosition,
  index: number,
): ProposalPosition {
  return {
    id: stringValue(raw.id) ?? `proposal-${index + 1}`,

    name: stringValue(raw.name) ?? "Unnamed investment",

    ticker: stringValue(raw.ticker ?? raw.tkr)?.toUpperCase(),

    isin: stringValue(raw.isin)?.toUpperCase(),

    cusip: stringValue(raw.cusip)?.toUpperCase(),

    valor: stringValue(raw.valor),

    vehicle: stringValue(raw.vehicle),

    cls: stringValue(raw.cls),

    weightPct: numberValue(raw.weightPct ?? raw.alloc) ?? 0,

    expectedReturn: numberValue(raw.expectedReturn ?? raw.exp),

    er: numberValue(raw.er),

    yld: numberValue(raw.yld),

    note: stringValue(raw.note),
  };
}

export function migrateProposal(raw: unknown): Proposal | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const legacy = raw as LegacyProfile;

  const fields =
    legacy.fields && typeof legacy.fields === "object" ? legacy.fields : {};

  const rawPositions = Array.isArray(legacy.proposals) ? legacy.proposals : [];

  const positions = rawPositions
    .filter((position): position is LegacyProposalPosition =>
      Boolean(position && typeof position === "object"),
    )
    .map(migratePosition);

  const targetAmount = numberValue(fields.prAmount) ?? 0;

  const clientName = stringValue(fields.prClient);

  const advisor = stringValue(fields.prAdvisor);

  const objective = stringValue(fields.prObjective) ?? "balanced";

  const investmentThesis = stringValue(fields.prRationale);

  const feeTypeRaw = stringValue(fields.prFeeType);

  const feeType: "none" | "aum" | "flat" =
    feeTypeRaw === "aum" || feeTypeRaw === "flat" ? feeTypeRaw : "none";

  const feeRate = numberValue(fields.prAdvisoryFee);

  const currency = stringValue(legacy.ccy)?.toUpperCase() ?? "USD";

  // If the legacy file contains no proposal
  // information at all, don't manufacture one.
  const hasProposalData =
    positions.length > 0 ||
    targetAmount > 0 ||
    Boolean(clientName) ||
    Boolean(advisor) ||
    Boolean(investmentThesis);

  if (!hasProposalData) {
    return null;
  }

  return {
    positions,
    targetAmount,
    currency,
    clientName,
    advisor,
    objective,
    investmentThesis,
    feeType,
    feeRate,
  };
}
