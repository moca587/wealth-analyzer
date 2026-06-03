// ─────────────────────────────────────────────────────────────────
// Avaloq core-banking domain types (integration boundary)
//
// These mirror the *shape* of Avaloq's documented business-object
// model — Partner, Account, Position, Instrument, Credit — as exposed
// through the modern Avaloq REST API (a.k.a. "Avaloq API" / Engine API
// on the avaloq.one platform).
//
// ⚠️  VERIFY: Field names and enum values below are modelled from
//     Avaloq's published domain concepts, NOT copied from a specific
//     tenant's OpenAPI document. Before going live you MUST diff these
//     against YOUR tenant's `/openapi.json` (or the partner-portal API
//     reference) and adjust. The mapper (./mapper.ts) is the single
//     place that depends on these shapes, so corrections are localised.
// ─────────────────────────────────────────────────────────────────

/** ISO-3166 alpha-2 country code as returned by Avaloq (e.g. "CH"). */
export type AvaloqCountry = string;

/** A monetary amount in a specific ISO-4217 currency. */
export interface AvaloqMoney {
  amount: number;
  currency: string; // ISO-4217, e.g. "CHF", "USD", "EUR"
}

/**
 * Partner = the natural person or legal entity in Avaloq.
 * In a household, each adult client is typically a separate Partner.
 */
export interface AvaloqPartner {
  partnerId: string;
  firstName?: string;
  lastName?: string;
  legalName?: string;          // for non-natural persons
  dateOfBirth?: string;        // ISO YYYY-MM-DD
  domicileCountry?: AvaloqCountry;
  address?: {
    city?: string;
    region?: string;           // state / province / canton
    postalCode?: string;
    country?: AvaloqCountry;
  };
  /**
   * Suitability / investor risk classification from the bank's MiFID/
   * FIDLEG profiling. Avaloq tenants use their own code list here.
   * VERIFY against your tenant's value set.
   */
  riskClassification?: string;
  /** Investment horizon code, if captured in the suitability profile. */
  investmentHorizon?: string;
}

/** Cash / current / savings account held by a partner. */
export interface AvaloqAccount {
  accountId: string;
  partnerId: string;
  iban?: string;
  /** Account product type, e.g. "CURRENT", "SAVINGS", "CALL". */
  accountType?: string;
  balance: AvaloqMoney;
  /** True for accounts that are immediately spendable. */
  available?: boolean;
}

/** Financial instrument master data (the "what" behind a position). */
export interface AvaloqInstrument {
  instrumentId: string;
  isin?: string;
  name?: string;
  /**
   * Avaloq instrument category / asset type. Tenant-specific code list.
   * Examples seen in the wild: "EQUITY", "BOND", "FUND", "ETF",
   * "STRUCTURED_PRODUCT", "PRECIOUS_METAL", "CRYPTO", "REAL_ESTATE_FUND".
   * VERIFY and extend the mapping in ./mapper.ts accordingly.
   */
  instrumentClass?: string;
  currency?: string;
}

/** A holding/position inside a securities (custody) account or portfolio. */
export interface AvaloqPosition {
  positionId: string;
  partnerId: string;
  portfolioId?: string;
  instrumentId: string;
  quantity?: number;
  /** Current market valuation of the position. */
  marketValue: AvaloqMoney;
  /** Optionally embedded instrument master to avoid a second lookup. */
  instrument?: AvaloqInstrument;
}

/** Credit facility: mortgage, lombard loan, consumer credit, etc. */
export interface AvaloqCredit {
  creditId: string;
  partnerId: string;
  /** e.g. "MORTGAGE", "LOMBARD", "CONSUMER", "STUDENT". */
  creditType?: string;
  outstanding: AvaloqMoney;
  /** Nominal annual interest rate in percent (e.g. 2.5 = 2.5%). */
  interestRatePct?: number;
  /** Remaining term in years. */
  remainingTermYears?: number;
}

/**
 * Aggregate payload the client assembles for one household before
 * mapping. `partners[0]` is treated as the primary client.
 */
export interface AvaloqHouseholdData {
  partners: AvaloqPartner[];
  accounts: AvaloqAccount[];
  positions: AvaloqPosition[];
  credits: AvaloqCredit[];
  /** Instrument master keyed by instrumentId (for positions w/o embed). */
  instruments?: Record<string, AvaloqInstrument>;
}
