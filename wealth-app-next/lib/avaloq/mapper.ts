// ─────────────────────────────────────────────────────────────────
// Avaloq → WealthPlan mapping (pure, side-effect free, unit-testable)
//
// Avaloq holds the household BALANCE SHEET (partners, cash accounts,
// securities positions, credit facilities). It does NOT hold financial-
// planning inputs such as goals, a monthly expense budget, or children.
// Therefore this mapper produces a PARTIAL plan (clients, assets, loans,
// and — where derivable — income), and `mergePlan()` layers it on top of
// the user's existing plan so user-entered goals/expenses/etc. survive.
// ─────────────────────────────────────────────────────────────────

import type {
  WealthPlan,
  Client,
  Asset,
  Loan,
  AssetClass,
  CountryCode,
  RiskProfile,
} from "@/lib/engine/types";

import type {
  AvaloqHouseholdData,
  AvaloqPartner,
  AvaloqAccount,
  AvaloqPosition,
  AvaloqInstrument,
  AvaloqCredit,
} from "./types";

// ─── Code-list translations ──────────────────────────────────────
// VERIFY every mapping below against your Avaloq tenant's code lists.

const COUNTRY_CODES: ReadonlySet<CountryCode> = new Set([
  "US", "CA", "GB", "AU", "CH", "EU", "JP", "SG", "HK",
  "CN", "TW", "KR", "IN", "ID", "MX", "BR", "SA", "ZA", "OTHER",
]);

/** Normalise an Avaloq ISO country to the app's CountryCode union. */
export function mapCountry(iso?: string): CountryCode | undefined {
  if (!iso) return undefined;
  const up = iso.toUpperCase();
  if (COUNTRY_CODES.has(up as CountryCode)) return up as CountryCode;
  // Euro-zone members collapse to the app's "EU" bucket.
  const EUROZONE = new Set([
    "AT", "BE", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV",
    "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES", "HR",
  ]);
  if (EUROZONE.has(up)) return "EU";
  return "OTHER";
}

/**
 * Map an Avaloq risk classification code to the app's 7-level scale.
 * The left-hand keys are PLACEHOLDERS for common MiFID/FIDLEG buckets —
 * replace them with your tenant's actual `riskClassification` values.
 */
const RISK_MAP: Record<string, RiskProfile> = {
  // numeric-style profiles
  "1": "very_conservative",
  "2": "conservative",
  "3": "moderately_conservative",
  "4": "moderate",
  "5": "moderately_aggressive",
  "6": "aggressive",
  "7": "very_aggressive",
  // text-style profiles
  SECURITY: "very_conservative",
  INCOME: "conservative",
  BALANCED: "moderate",
  GROWTH: "moderately_aggressive",
  EQUITY: "aggressive",
  DYNAMIC: "very_aggressive",
};

export function mapRisk(code?: string): RiskProfile | undefined {
  if (!code) return undefined;
  return RISK_MAP[code] ?? RISK_MAP[code.toUpperCase()] ?? undefined;
}

/**
 * Map an Avaloq instrument class to the app's AssetClass.
 * VERIFY/extend against your tenant's instrument category code list.
 */
const INSTRUMENT_CLASS_MAP: Record<string, AssetClass> = {
  EQUITY: "equity",
  STOCK: "equity",
  SHARE: "equity",
  BOND: "fixed_income",
  FIXED_INCOME: "fixed_income",
  MONEY_MARKET: "cash",
  FUND: "mixed",
  ETF: "mixed",
  STRUCTURED_PRODUCT: "alternative",
  HEDGE_FUND: "alternative",
  PRIVATE_EQUITY: "alternative",
  PRECIOUS_METAL: "commodity",
  COMMODITY: "commodity",
  CRYPTO: "crypto",
  REAL_ESTATE_FUND: "real_estate",
  REAL_ESTATE: "real_estate",
};

export function mapInstrumentClass(code?: string): AssetClass {
  if (!code) return "mixed";
  return INSTRUMENT_CLASS_MAP[code] ?? INSTRUMENT_CLASS_MAP[code.toUpperCase()] ?? "mixed";
}

// ─── Entity mappers ──────────────────────────────────────────────

export function mapPartnerToClient(p: AvaloqPartner): Client {
  const [firstFromLegal, ...restLegal] = (p.legalName ?? "").split(" ");
  return {
    id: `avaloq:partner:${p.partnerId}`,
    first: p.firstName ?? firstFromLegal ?? "",
    last: p.lastName ?? restLegal.join(" ") ?? "",
    dob: p.dateOfBirth,
    country: mapCountry(p.domicileCountry ?? p.address?.country),
    state: p.address?.region,
    city: p.address?.city,
    zip: p.address?.postalCode,
    risk: mapRisk(p.riskClassification),
    // investmentHorizon code-list is too tenant-specific to guess —
    // left undefined so the user can pick it. VERIFY + add mapHorizon().
  };
}

/** Cash/savings account → a liquid cash Asset. */
export function mapAccountToAsset(a: AvaloqAccount): Asset {
  return {
    id: `avaloq:account:${a.accountId}`,
    type: a.accountType ?? "Cash account",
    group: "Cash",
    label: a.iban ?? a.accountType ?? "Cash account",
    value: a.balance.amount,
    liquid: a.available ?? true,
    cls: "cash",
    note: `Avaloq account ${a.accountId} · ${a.balance.currency}`,
  };
}

/** Securities position → an Asset valued at market value. */
export function mapPositionToAsset(
  pos: AvaloqPosition,
  instruments?: Record<string, AvaloqInstrument>,
): Asset {
  const inst = pos.instrument ?? instruments?.[pos.instrumentId];
  const cls = mapInstrumentClass(inst?.instrumentClass);
  return {
    id: `avaloq:position:${pos.positionId}`,
    type: inst?.name ?? inst?.isin ?? "Security",
    group: "Portfolio",
    label: inst?.name ?? inst?.isin ?? pos.instrumentId,
    value: pos.marketValue.amount,
    // Securities are liquid; real-estate funds are treated as illiquid
    // so the engine excludes them from the investable pool like property.
    liquid: cls !== "real_estate",
    cls,
    note:
      `Avaloq position ${pos.positionId}` +
      (pos.quantity != null ? ` · qty ${pos.quantity}` : "") +
      ` · ${pos.marketValue.currency}`,
  };
}

/** Credit facility → a Loan for the amortization engine. */
export function mapCreditToLoan(c: AvaloqCredit): Loan {
  return {
    id: `avaloq:credit:${c.creditId}`,
    type: c.creditType ? titleCase(c.creditType) : "Loan",
    label: `Avaloq ${c.creditType?.toLowerCase() ?? "credit"} ${c.creditId}`,
    bal: c.outstanding.amount,
    rate: c.interestRatePct ?? 0,
    yrs: c.remainingTermYears ?? 0,
  };
}

// ─── Aggregate build + merge ─────────────────────────────────────

export interface MappedAvaloqPlan {
  clients: Client[];
  assets: Asset[];
  loans: Loan[];
  /** Currency inferred from the primary partner's cash account, if any. */
  inferredCurrency?: string;
  /** Non-fatal data-quality notes surfaced to the caller/UI. */
  warnings: string[];
}

/**
 * Build the plan fragments Avaloq can authoritatively supply.
 * Does NOT touch goals, expenses, children, inflation — those are the
 * user's planning inputs and are preserved by mergePlan().
 */
export function buildPlanFragmentsFromAvaloq(data: AvaloqHouseholdData): MappedAvaloqPlan {
  const warnings: string[] = [];

  const clients = (data.partners ?? []).slice(0, 2).map(mapPartnerToClient);
  if ((data.partners ?? []).length > 2) {
    warnings.push(
      `Household has ${data.partners.length} partners; the model supports 2 — extras were dropped.`,
    );
  }

  const assets: Asset[] = [
    ...(data.accounts ?? []).map(mapAccountToAsset),
    ...(data.positions ?? []).map((p) => mapPositionToAsset(p, data.instruments)),
  ];

  const loans = (data.credits ?? []).map(mapCreditToLoan);

  // Currency: warn if the household mixes currencies (engine is single-ccy).
  const currencies = new Set<string>([
    ...(data.accounts ?? []).map((a) => a.balance.currency),
    ...(data.positions ?? []).map((p) => p.marketValue.currency),
    ...(data.credits ?? []).map((c) => c.outstanding.currency),
  ]);
  currencies.delete("");
  if (currencies.size > 1) {
    warnings.push(
      `Multiple currencies detected (${[...currencies].join(", ")}). ` +
        `The engine is single-currency — values are NOT FX-normalised yet. ` +
        `Add FX conversion in the mapper before relying on totals.`,
    );
  }
  const inferredCurrency =
    data.accounts?.[0]?.balance.currency ?? [...currencies][0];

  return { clients, assets, loans, inferredCurrency, warnings };
}

/**
 * Merge Avaloq-sourced balance-sheet data into an existing plan.
 *
 * Strategy:
 *  • clients / assets / loans  → REPLACED with Avaloq data (system of record)
 *  • goals / expenses / children / incomes / notes / inflation → PRESERVED
 *  • Avaloq-sourced rows are id-prefixed "avaloq:", so any manual rows the
 *    user added are kept; only previously-synced "avaloq:" rows are refreshed.
 */
export function mergePlan(existing: WealthPlan, mapped: MappedAvaloqPlan, nowIso: string): WealthPlan {
  const keepManual = <T extends { id: string }>(rows: T[]) =>
    rows.filter((r) => !r.id.startsWith("avaloq:"));

  return {
    ...existing,
    currency: mapped.inferredCurrency || existing.currency,
    // Replace clients entirely (Avaloq is the source of truth for KYC).
    clients: mapped.clients.length ? mapped.clients : existing.clients,
    // Refresh synced rows, keep user-added manual rows.
    assets: [...keepManual(existing.assets), ...mapped.assets],
    loans: [...keepManual(existing.loans), ...mapped.loans],
    updatedAt: nowIso,
  };
}

// ─── helpers ─────────────────────────────────────────────────────

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/[\s_]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
