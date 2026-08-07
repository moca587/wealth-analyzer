import { emptyPlan, newId } from "./default-plan";
import { importLegacyPlan, isLegacyExport } from "./from-legacy";
import type { Client, WealthPlan } from "@/lib/engine/types";

/**
 * Normalize an arbitrary (possibly legacy or partial) plan-shaped object into
 * the current WealthPlan structure. This runs BEFORE Zod validation on import
 * so that a plan exported from an older version — or from the single-file HTML
 * app, which used slightly different keys — is upgraded rather than rejected.
 *
 * It only fills gaps and renames known legacy keys; it does not fabricate
 * financial data. Anything it can't repair is left for the schema to reject.
 */
export function migratePlan(input: unknown): WealthPlan {
  const base = emptyPlan();
  if (!input || typeof input !== "object") return base;
  const src = input as Record<string, unknown>;

  // A file from the single-file HTML app keeps the household, income,
  // expenses, retirement and pensions in a flat `fields` bag — none of which
  // the key-by-key logic below reads. Left to this function, a real client
  // file imported with plausible net worth and ZERO cash flow, and reported
  // success. from-legacy.ts is the adapter that actually reads that shape.
  if (isLegacyExport(src)) return importLegacyPlan(src).plan;

  const asArray = (v: unknown): Record<string, unknown>[] =>
    Array.isArray(v) ? (v.filter((x) => x && typeof x === "object") as Record<string, unknown>[]) : [];
  const num = (v: unknown, fallback = 0): number => {
    const n = typeof v === "string" ? Number(v) : (v as number);
    return Number.isFinite(n) ? n : fallback;
  };
  const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
  const id = (v: unknown): string => (typeof v === "string" && v ? v : newId());

  const thisYear = new Date().getFullYear();

  const clients: Client[] = asArray(src.clients).slice(0, 2).map((c) => ({
    id: id(c.id),
    first: str(c.first),
    last: str(c.last),
    dob: typeof c.dob === "string" ? c.dob : undefined,
    country: (c.country as WealthPlan["clients"][number]["country"]) || "US",
    state: typeof c.state === "string" ? c.state : undefined,
    city: typeof c.city === "string" ? c.city : undefined,
    zip: typeof c.zip === "string" ? c.zip : undefined,
    risk: (c.risk as WealthPlan["clients"][number]["risk"]) || "moderate",
    horizon: (c.horizon as WealthPlan["clients"][number]["horizon"]) || "15_plus",
  }));
  if (clients.length === 0) clients.push(base.clients[0]);

  const children = asArray(src.children).map((c) => ({
    id: id(c.id),
    first: str(c.first),
    last: str(c.last),
    dob: str(c.dob),
  }));

  const incomes = asArray(src.incomes).map((x) => ({
    id: id(x.id),
    clientId: id(x.clientId ?? clients[0].id),
    source: str(x.source),
    amount: num(x.amount),
    taxable: typeof x.taxable === "boolean" ? x.taxable : undefined,
  }));
  // Reassign any income pointing at a client that didn't survive migration.
  const clientIds = new Set(clients.map((c) => c.id));
  incomes.forEach((i) => { if (!clientIds.has(i.clientId)) i.clientId = clients[0].id; });

  const expenses = asArray(src.expenses).map((x) => ({
    id: id(x.id),
    name: str(x.name),
    amount: num(x.amount),
  }));

  const assets = asArray(src.assets).map((x) => ({
    id: id(x.id),
    type: str(x.type),
    group: typeof x.group === "string" ? x.group : undefined,
    label: typeof x.label === "string" ? x.label : undefined,
    value: num(x.value),
    liquid: typeof x.liquid === "boolean" ? x.liquid : true,
    country: (x.country as WealthPlan["assets"][number]["country"]) || undefined,
    cls: (x.cls as WealthPlan["assets"][number]["cls"]) || undefined,
    note: typeof x.note === "string" ? x.note : undefined,
  }));

  const loans = asArray(src.loans).map((x) => ({
    id: id(x.id),
    type: str(x.type),
    label: typeof x.label === "string" ? x.label : undefined,
    bal: num(x.bal),
    rate: num(x.rate),
    yrs: num(x.yrs),
  }));

  const goals = asArray(src.goals).map((x) => {
    // Legacy HTML app stored a single `targetYear`; the current model uses a
    // startYear/endYear span. Map targetYear onto both ends if present.
    const legacyTarget = num(x.targetYear, 0);
    const startYear = num(x.startYear, legacyTarget || thisYear + 10);
    const endYear = num(x.endYear, startYear);
    return {
      id: id(x.id),
      name: str(x.name),
      cat: typeof x.cat === "string" ? x.cat : undefined,
      tier: (x.tier as WealthPlan["goals"][number]["tier"]) || undefined,
      amt: num(x.amt),
      startYear,
      endYear: endYear >= startYear ? endYear : startYear,
    };
  });

  // Retirement + pensions are optional; carry them through with coercion.
  const rSrc = src.retirement as Record<string, unknown> | undefined;
  const retirement = rSrc && typeof rSrc === "object"
    ? {
        enabled: typeof rSrc.enabled === "boolean" ? rSrc.enabled : undefined,
        retirementAge: num(rSrc.retirementAge, 65),
        annualSpending: num(rSrc.annualSpending, 0),
        planToAge: num(rSrc.planToAge, 90),
      }
    : undefined;

  const pensions = asArray(src.pensions).map((p) => ({
    id: id(p.id),
    label: str(p.label),
    clientId: typeof p.clientId === "string" ? p.clientId : undefined,
    annualAmount: num(p.annualAmount),
    startAge: num(p.startAge, 65),
    colaRate: typeof p.colaRate === "number" || typeof p.colaRate === "string" ? num(p.colaRate, 0) : undefined,
  }));

  // Security positions inside investable accounts. Optional and additive —
  // a plan from before holdings existed simply has none. Carried through so
  // a SaaS export round-trips; feeds and the legacy importer are what
  // usually populate it.
  const holdings = asArray(src.holdings).map((h) => ({
    id: id(h.id),
    name: str(h.name),
    ticker: typeof h.ticker === "string" ? h.ticker : undefined,
    isin: typeof h.isin === "string" ? h.isin : undefined,
    cls: (h.cls as WealthPlan["assets"][number]["cls"]) || undefined,
    value: num(h.value),
    er: typeof h.er === "number" || typeof h.er === "string" ? num(h.er) : undefined,
    yld: typeof h.yld === "number" || typeof h.yld === "string" ? num(h.yld) : undefined,
    region: typeof h.region === "string" ? h.region : undefined,
    ccy: typeof h.ccy === "string" ? h.ccy : undefined,
    accountRef: typeof h.accountRef === "string" ? h.accountRef : undefined,
    feedRef: typeof h.feedRef === "string" ? h.feedRef : undefined,
    note: typeof h.note === "string" ? h.note : undefined,
  }));

  return {
    version: num(src.version, 1) || 1,
    currency: str(src.currency, base.currency),
    inflationRate: num(src.inflationRate, base.inflationRate),
    inflationRegion: typeof src.inflationRegion === "string" ? src.inflationRegion : base.inflationRegion,
    clients,
    children,
    incomes,
    expenses,
    assets,
    loans,
    goals,
    ...(holdings.length ? { holdings } : {}),
    ...(retirement ? { retirement } : {}),
    ...(pensions.length ? { pensions } : {}),
    notes: typeof src.notes === "string" ? src.notes : undefined,
    createdAt: str(src.createdAt, base.createdAt),
    updatedAt: new Date().toISOString(),
  };
}
