// ─────────────────────────────────────────────────────────────────
// Reading a file exported by the single-file HTML app.
//
// WHY THIS EXISTS. `migratePlan()` reads `src.clients`, `src.incomes`,
// `src.expenses` and `src.retirement`. A real legacy export contains none
// of those: the household, income, expenses, retirement, pensions,
// inflation and tax settings all live in a flat `fields` bag of ~88 string
// keys. Only `assets`, `loans`, `goals` and `children` happen to line up.
//
// So importing a genuine client file produced a plan with plausible net
// worth and ZERO cash flow — no client name, no salary, no expenses, no
// retirement — while the UI reported "Imported — 1 client(s), 8 asset(s),
// 4 goal(s)". The Monte Carlo then ran on that and printed a perfectly
// confident median. That is the silently-wrong-number failure the feed
// work was built to prevent, arriving through the front door instead.
//
// The rule here is the same one the feed adapters follow: NEVER invent a
// number. Every field is either read from the file or reported as not
// present. `importLegacyPlan` returns what it could not carry across so a
// human sees the gap instead of a confident total.
//
// Units, because they differ and this is exactly where a silent 12× lives.
// Verified against the shipped HTML, not assumed — the first cut of this
// file got the expense line wrong and turned CHF 78,000 a year into
// CHF 78,000 a month, which makes every imported household look ruined:
//   • legacy expL/expI/expO are ANNUAL — the panel is titled "Annual
//     Household Expenses" and asks for "total annual spending for the
//     entire family". ExpenseCategory.amount is MONTHLY. Divide by 12.
//   • legacy inc1/inc2/inc1b/inc2b are ANNUAL, matching IncomeStream.amount
//   • legacy `inf` is a PERCENT ("2.1"); WealthPlan.inflationRate is a
//     DECIMAL (0.021)
//   • legacy penCola is likewise a PERCENT
// ─────────────────────────────────────────────────────────────────

import { emptyPlan, newId } from "./default-plan";
import type {
  WealthPlan,
  Client,
  IncomeStream,
  ExpenseCategory,
  Asset,
  Loan,
  Goal,
  Pension,
  Holding,
  CountryCode,
  RiskProfile,
  TimeHorizon,
  AssetClass,
} from "@/lib/engine/types";

export interface LegacyImportResult {
  plan: WealthPlan;
  /**
   * What the file did not contain, or what could not be carried across.
   * Shown to the user — an import that quietly drops the client's salary
   * must not read as a success.
   */
  notes: string[];
  /** Counts for the confirmation line, so it describes what actually landed. */
  carried: {
    clients: number;
    children: number;
    incomes: number;
    expenses: number;
    assets: number;
    loans: number;
    goals: number;
    pensions: number;
    holdings: number;
    retirement: boolean;
  };
}

/** A legacy export always carries a `fields` object; a SaaS export never does. */
export function isLegacyExport(input: unknown): boolean {
  if (!input || typeof input !== "object") return false;
  const o = input as Record<string, unknown>;
  return (
    !!o.fields &&
    typeof o.fields === "object" &&
    !Array.isArray(o.fields) &&
    !Array.isArray(o.clients)
  );
}

// ─── Field readers ────────────────────────────────────────────────
// Legacy fields are strings, including the numeric ones, and "" means
// "not filled in" — which must NOT become 0 for anything that would then
// read as a real figure.

const S = (f: Record<string, unknown>, k: string): string =>
  typeof f[k] === "string"
    ? (f[k] as string).trim()
    : typeof f[k] === "number"
      ? String(f[k])
      : "";

/** A number, or null when the field was blank. Never NaN, never a silent 0. */
function N(f: Record<string, unknown>, k: string): number | null {
  const raw = S(f, k);
  if (raw === "") return null;
  // Legacy inputs are plain numerics, but a hand-edited file can carry
  // separators. Reject anything that is not cleanly numeric rather than
  // guessing — a wrong figure here is a wrong plan.
  const n = Number(raw.replace(/[\s'’]/g, ""));
  return Number.isFinite(n) ? n : null;
}

const N0 = (f: Record<string, unknown>, k: string): number => N(f, k) ?? 0;

const arr = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v)
    ? (v.filter((x) => x && typeof x === "object") as Record<string, unknown>[])
    : [];

const RISKS: RiskProfile[] = [
  "very_conservative",
  "conservative",
  "moderately_conservative",
  "moderate",
  "moderately_aggressive",
  "aggressive",
  "very_aggressive",
];
const HORIZONS: TimeHorizon[] = ["0_5", "5_10", "10_15", "15_plus"];

const COUNTRIES = new Set<string>([
  "US",
  "CA",
  "GB",
  "AU",
  "CH",
  "EU",
  "JP",
  "SG",
  "HK",
  "CN",
  "TW",
  "KR",
  "IN",
  "ID",
  "MX",
  "BR",
  "SA",
  "ZA",
  "OTHER",
  "DE",
  "FR",
  "IT",
  "ES",
  "NL",
  "BE",
  "AT",
  "IE",
  "PT",
  "LU",
  "FI",
  "GR",
  "CY",
  "HR",
  "EE",
  "LV",
  "LT",
  "SK",
  "SI",
  "MT",
]);

/**
 * The legacy country field. Returns null rather than guessing: defaulting a
 * Swiss household to "US" would tax it on US federal brackets and pick the
 * wrong account taxonomy — a wrong answer dressed as a working import.
 */
function country(raw: string): CountryCode | null {
  const c = raw.trim().toUpperCase();
  if (!c) return null;
  if (COUNTRIES.has(c)) return c as CountryCode;
  return null;
}

const ASSET_CLASSES = new Set<AssetClass>([
  "equity",
  "fixed_income",
  "real_estate",
  "commodity",
  "cash",
  "mixed",
  "alternative",
  "crypto",
]);

function normalizeInstrumentType(type: string): string {
  switch (type.toLowerCase()) {
    case "etf":
      return "ETF";

    case "mutual_fund":
    case "mutual fund":
      return "Mutual fund";

    case "stock":
      return "Stock";

    case "bond":
      return "Bond";

    case "alternative":
      return "Alternative";

    case "private_equity":
      return "Private equity fund";

    case "hedge_fund":
      return "Hedge fund";

    case "structured":
      return "Structured product";

    default:
      return "Other";
  }
}

function normalizeRegion(region: string): string {
  switch (region.toLowerCase()) {
    case "us":
      return "US";

    case "dev_intl":
    case "developed":
    case "developed international":
      return "Dev Intl";

    case "em":
    case "emerging":
    case "emerging markets":
      return "EM";

    case "global":
      return "Global";

    default:
      return "Other";
  }
}

// ─── The import ───────────────────────────────────────────────────

export function importLegacyPlan(input: unknown): LegacyImportResult {
  const notes: string[] = [];
  const plan = emptyPlan();
  const src = (input && typeof input === "object" ? input : {}) as Record<
    string,
    unknown
  >;
  const f = (
    src.fields && typeof src.fields === "object" ? src.fields : {}
  ) as Record<string, unknown>;

  // ─── Household ──────────────────────────────────────────────────
  const clients: Client[] = [];
  const mkClient = (p: "c1" | "c2"): Client | null => {
    const first = S(f, `${p}f`),
      last = S(f, `${p}l`);
    // Client 2 is genuinely absent in a single-client household; the legacy
    // app keys that off `c2visible`, and empty names confirm it.
    if (!first && !last) return null;
    const cc = country(S(f, `${p}co`));
    if (!cc)
      notes.push(
        `${first || last || `Client ${p === "c1" ? 1 : 2}`}: no country in the file — set it before running a projection (it drives tax and account types).`,
      );
    const risk = S(f, `${p}r`) as RiskProfile;
    const horizon = S(f, `${p}h`) as TimeHorizon;
    return {
      id: newId(),
      first,
      last,
      dob: S(f, `${p}d`) || undefined,
      country: cc ?? undefined,
      state: S(f, `${p}st`) || undefined,
      city: S(f, `${p}ci`) || undefined,
      zip: S(f, `${p}zp`) || undefined,
      risk: RISKS.includes(risk) ? risk : undefined,
      horizon: HORIZONS.includes(horizon) ? horizon : undefined,
    };
  };
  const c1 = mkClient("c1");
  const c2 = src.c2visible === false ? null : mkClient("c2");
  if (c1) clients.push(c1);
  if (c2) clients.push(c2);
  if (!clients.length) {
    // Keep the blank client the empty plan provides, and say so — an
    // unnamed household is exactly what the old broken import produced.
    clients.push(plan.clients[0]);
    notes.push(
      "No client name in the file — the household was imported unnamed.",
    );
  }
  plan.clients = clients;

  // ─── Children ───────────────────────────────────────────────────
  plan.children = arr(src.children).map((c) => ({
    id: typeof c.id === "string" && c.id ? c.id : newId(),
    first: typeof c.first === "string" ? c.first : "",
    last: typeof c.last === "string" ? c.last : "",
    dob: typeof c.dob === "string" ? c.dob : "",
  }));

  // ─── Income (ANNUAL in both models) ─────────────────────────────
  const incomes: IncomeStream[] = [];
  const addIncome = (owner: Client | null, key: string, label: string) => {
    if (!owner) return;
    const v = N(f, key);
    if (v === null || v === 0) return;
    incomes.push({ id: newId(), clientId: owner.id, source: label, amount: v });
  };
  // addIncome(c1, "inc1", "Salary");
  // addIncome(c1, "inc1b", "Bonus");
  // addIncome(c2, "inc2", "Salary");
  // addIncome(c2, "inc2b", "Bonus");
  addIncome(c1, "inc1", "Primary income");
  addIncome(c1, "inc2", "Secondary income");

  addIncome(c2, "inc1b", "Primary income");
  addIncome(c2, "inc2b", "Secondary income");

  plan.incomes = incomes;
  if (!incomes.length) {
    notes.push(
      "No income in the file. A projection with zero income will look far worse than reality — check this before showing it to the client.",
    );
  }

  // ─── Expenses (legacy ANNUAL → plan MONTHLY) ────────────────────
  const expenses: ExpenseCategory[] = [];
  const addExpense = (key: string, name: string) => {
    const v = N(f, key);
    if (v === null || v === 0) return;
    // The conversion the legacy UI's own heading dictates. Rounded to the
    // cent so a third of a franc does not accumulate across categories.
    expenses.push({
      id: newId(),
      name,
      // amount: Math.round((v / 12) * 100) / 100,
      amount: v / 12,
    });
  };
  addExpense("expL", "Living expenses");
  addExpense("expI", "Insurance / health");
  addExpense("expO", "Other expenses");
  plan.expenses = expenses;
  if (!expenses.length) {
    notes.push(
      "No expenses in the file. Zero spending makes every goal look funded — check this before showing it to the client.",
    );
  }

  // ─── Annual savings ────────────────────────────────────────────────
  const annualSavings = N(f, "savAnnual");

  if (annualSavings !== null) {
    plan.annualSavings = annualSavings;
  }

  const annualRaiseRate = N(f, "raise");

  if (annualRaiseRate !== null) {
    plan.annualRaiseRate = annualRaiseRate;
  }

  // ─── Assets ─────────────────────────────────────────────────────
  const assets: Asset[] = arr(src.assets).map((a) => {
    const cls =
      typeof a.cls === "string" && ASSET_CLASSES.has(a.cls as AssetClass)
        ? (a.cls as AssetClass)
        : undefined;
    return {
      id: typeof a.id === "string" && a.id ? a.id : newId(),
      type: typeof a.type === "string" ? a.type : "",
      group: typeof a.group === "string" ? a.group : undefined,
      label: typeof a.label === "string" ? a.label : undefined,
      value:
        typeof a.value === "number" && Number.isFinite(a.value) ? a.value : 0,
      liquid: a.liquid !== false,
      country:
        country(typeof a.country === "string" ? a.country : "") ?? undefined,
      cls,
      note: typeof a.note === "string" ? a.note : undefined,
    };
  });

  // ─── Holdings (legacy `investments`) ────────────────────────────
  // The legacy app kept security POSITIONS in a separate `investments`
  // array with per-position cost/yield/region — richer than the account
  // rows, and previously dropped on import. They land in the plan's
  // holdings section (analytics only; net worth still sums assets).
  const holdings: Holding[] = arr(src.investments).map((h) => {
    const rawCls = typeof h.cls === "string" ? h.cls : "";
    const cls = ASSET_CLASSES.has(rawCls as AssetClass)
      ? (rawCls as AssetClass)
      : undefined;
    return {
      id: typeof h.id === "string" && h.id ? h.id : newId(),
      name:
        typeof h.name === "string"
          ? h.name
          : typeof h.tkr === "string"
            ? h.tkr
            : "Position",
      ticker: typeof h.tkr === "string" && h.tkr ? h.tkr : undefined,
      instrumentType:
        typeof h.type === "string" && h.type
          ? normalizeInstrumentType(h.type)
          : undefined, // new
      cls,
      value:
        typeof h.val === "number" && Number.isFinite(h.val)
          ? Math.max(0, h.val)
          : 0,
      er: typeof h.er === "number" && Number.isFinite(h.er) ? h.er : undefined,
      yld:
        typeof h.yld === "number" && Number.isFinite(h.yld) ? h.yld : undefined,
      // region: typeof h.region === "string" && h.region ? h.region : undefined,
      region:
        typeof h.region === "string" && h.region
          ? normalizeRegion(h.region)
          : undefined,
      note: typeof h.note === "string" && h.note ? h.note : undefined,
      feedRef: typeof h.tkr === "string" && h.tkr ? `hold:${h.tkr}` : undefined,
    };
  });
  if (holdings.length) plan.holdings = holdings;

  // aProp / aOther are standalone figures on the legacy household screen,
  // NOT rows in `assets`. Dropping them understates net worth.
  const prop = N(f, "aProp");
  if (prop) {
    assets.push({
      id: newId(),
      type: "Property",
      group: "Real estate",
      label: "Primary residence",
      value: prop,
      liquid: false,
      cls: "real_estate",
    });
  }
  const other = N(f, "aOther");
  if (other) {
    assets.push({
      id: newId(),
      type: "Other",
      group: "Other",
      label: "Other assets",
      value: other,
      liquid: false,
      cls: "alternative",
    });
  }
  plan.assets = assets;

  // A currency mismatch is worth flagging loudly: the legacy file records
  // one, and every figure above is denominated in it.
  const ccy = typeof src.ccy === "string" ? src.ccy.trim().toUpperCase() : "";
  if (ccy.length === 3) plan.currency = ccy;
  else
    notes.push(
      "No currency in the file — defaulted to the plan default. Check it: every figure above is denominated in the file's currency.",
    );

  // ─── Loans ──────────────────────────────────────────────────────
  plan.loans = arr(src.loans).map(
    (l): Loan => ({
      id: typeof l.id === "string" && l.id ? l.id : newId(),
      type: typeof l.type === "string" ? l.type : "Loan",
      label: typeof l.label === "string" ? l.label : undefined,
      bal: typeof l.bal === "number" && Number.isFinite(l.bal) ? l.bal : 0,
      rate: typeof l.rate === "number" && Number.isFinite(l.rate) ? l.rate : 0,
      yrs: typeof l.yrs === "number" && Number.isFinite(l.yrs) ? l.yrs : 0,
    }),
  );

  // ─── Goals ──────────────────────────────────────────────────────
  const thisYear = new Date().getFullYear();
  plan.goals = arr(src.goals).map((g): Goal => {
    const start =
      typeof g.startYear === "number"
        ? g.startYear
        : typeof g.targetYear === "number"
          ? g.targetYear
          : thisYear;
    const end = typeof g.endYear === "number" ? g.endYear : start;
    const tier =
      g.tier === "essential" ||
      g.tier === "important" ||
      g.tier === "aspirational"
        ? g.tier
        : undefined; // legacy "legacy" tier has no equivalent
    return {
      id: typeof g.id === "string" && g.id ? g.id : newId(),
      name: typeof g.name === "string" ? g.name : "",
      cat: typeof g.cat === "string" ? g.cat : undefined,
      tier,
      amt: typeof g.amt === "number" && Number.isFinite(g.amt) ? g.amt : 0,
      startYear: start,
      endYear: Math.max(start, end),
    };
  });

  // ─── Inflation (PERCENT → DECIMAL) ──────────────────────────────
  const inf = N(f, "inf");
  if (inf !== null) plan.inflationRate = inf / 100;
  const region = S(f, "region");
  if (region) plan.inflationRegion = region;

  // ─── Retirement ─────────────────────────────────────────────────
  const retAge = N(f, "retAge");
  const retSpend = N(f, "retSpend");
  const retLife = N(f, "retLife");
  if (retAge !== null && retSpend !== null) {
    plan.retirement = {
      enabled: true,
      retirementAge: retAge,
      annualSpending: retSpend,
      // planToAge must exceed retirementAge or the schema rejects the plan
      // (a plan that "succeeds" over a zero-length retirement is a lie).
      planToAge:
        retLife !== null && retLife > retAge
          ? retLife
          : Math.max(retAge + 1, 90),
    };
    if (retLife !== null && retLife <= retAge) {
      notes.push(
        `Retirement horizon in the file (${retLife}) is not after the retirement age (${retAge}); used 90 instead.`,
      );
    }
  } else if (retAge !== null || retSpend !== null) {
    notes.push(
      "Retirement is only half-specified in the file (age or spending missing), so it was left off. Set both to model a drawdown.",
    );
  }

  // ─── Pensions ───────────────────────────────────────────────────
  const pensions: Pension[] = [];
  const addPension = (
    owner: Client | null,
    srcKey: string,
    amtKey: string,
    ageKey: string,
    colaKey: string,
  ) => {
    const amount = N(f, amtKey);
    const startAge = N(f, ageKey);
    if (!amount) return;
    if (startAge === null) {
      notes.push(
        `Pension "${S(f, srcKey) || "unnamed"}" has an amount but no start age — not imported, because a start age cannot be guessed.`,
      );
      return;
    }
    const cola = N(f, colaKey);
    // penSrc is a <select> of "auto" / "manual" — how the legacy app DERIVED
    // the figure, not what the benefit is called. Writing it through as the
    // label put "manual" on the client's pension line in the report.
    const mode = S(f, srcKey).toLowerCase();
    const named =
      mode && mode !== "auto" && mode !== "manual" ? S(f, srcKey) : "";
    const who = owner ? `${owner.first} ${owner.last}`.trim() : "";
    pensions.push({
      id: newId(),
      label: named || (who ? `Pension — ${who}` : "Pension"),
      clientId: owner?.id,
      annualAmount: amount,
      startAge,
      colaRate: cola !== null ? cola / 100 : undefined,
    });
  };
  addPension(c1, "penSrc", "penAnnual", "penStartAge", "penCola");
  addPension(c2, "penSrc2", "penAnnual2", "penStartAge2", "penCola2");
  if (pensions.length) plan.pensions = pensions;

  // ─── Things the SaaS has nowhere to put, said out loud ───────────
  // Silence here is how a demo goes wrong: the advisor assumes the whole
  // file came across.
  const dropped: string[] = [];
  if (arr(src.beneficiaries).length)
    dropped.push(`${arr(src.beneficiaries).length} beneficiar(y/ies)`);
  if (arr(src.equityComp).length)
    dropped.push(`${arr(src.equityComp).length} equity-compensation grant(s)`);
  if (S(f, "taxMode") || S(f, "taxResidency")) dropped.push("tax assumptions");
  if (S(f, "estExemption") || S(f, "estRate"))
    dropped.push("estate assumptions");
  if (dropped.length) {
    notes.push(
      `Not imported (no equivalent in this app yet): ${dropped.join(", ")}.`,
    );
  }

  const now = new Date().toISOString();
  plan.createdAt = typeof src.createdAt === "string" ? src.createdAt : now;
  plan.updatedAt = now;

  console.log("LEGACY HOLDINGS AFTER IMPORT:", holdings);

  return {
    plan,
    notes,
    carried: {
      clients: plan.clients.length,
      children: plan.children.length,
      incomes: plan.incomes.length,
      expenses: plan.expenses.length,
      assets: plan.assets.length,
      loans: plan.loans.length,
      goals: plan.goals.length,
      pensions: pensions.length,
      holdings: (plan.holdings ?? []).length,
      retirement: !!plan.retirement?.enabled,
    },
  };
}
