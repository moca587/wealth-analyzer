import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// Small reusable schemas
// ─────────────────────────────────────────────────────────────

const nonEmptyId = z.string().min(1);

const numericString = z.string().refine(
  (value) => value.trim() !== "" && Number.isFinite(Number(value)),
  {
    message: "Must be a valid numeric string",
  },
);

const optionalNumericString = z
  .string()
  .refine(
    (value) => value === "" || Number.isFinite(Number(value)),
    {
      message: "Must be empty or a valid numeric string",
    },
  );

const riskProfileSchema = z.enum([
  "very_conservative",
  "conservative",
  "moderately_conservative",
  "moderate",
  "moderately_aggressive",
  "aggressive",
  "very_aggressive",
]);

const timeHorizonSchema = z.enum([
  "0_5",
  "5_10",
  "10_15",
  "15_plus",
]);

const assetClassSchema = z.enum([
  "equity",
  "fixed_income",
  "real_estate",
  "commodity",
  "cash",
  "mixed",
  "alternative",
  "crypto",
]);

// ─────────────────────────────────────────────────────────────
// fields object from the HTML export
// ─────────────────────────────────────────────────────────────

const legacyFieldsSchema = z
  .object({
    // Client 1
    c1f: z.string(),
    c1l: z.string(),
    c1d: z.string(),
    c1r: z.union([riskProfileSchema, z.literal("")]),
    c1h: z.union([timeHorizonSchema, z.literal("")]),
    c1s1: z.string(),
    c1s2: z.string(),
    c1ci: z.string(),
    c1st: z.string(),
    c1zp: z.string(),
    c1co: z.string(),

    // Client 2
    c2f: z.string(),
    c2l: z.string(),
    c2d: z.string(),
    c2r: z.union([riskProfileSchema, z.literal("")]),
    c2h: z.union([timeHorizonSchema, z.literal("")]),
    c2s1: z.string(),
    c2s2: z.string(),
    c2ci: z.string(),
    c2st: z.string(),
    c2zp: z.string(),
    c2co: z.string(),

    rel: z.string(),

    // Income and savings
    inc1: numericString,
    inc2: numericString,
    inc1b: numericString,
    inc2b: numericString,
    raise: numericString,
    savAnnual: numericString,

    // Expenses
    expL: numericString,
    expI: numericString,
    expO: numericString,

    // Inflation
    inf: numericString,
    region: z.string(),

    // Additional property and assets
    aProp: numericString,
    aOther: numericString,

    // Retirement
    retM: numericString,
    retV: numericString,
    retAge: numericString,
    retSpend: numericString,
    retLife: z.string(),
    retLoc: z.string(),

    // Client 1 pension
    penSrc: z.string(),
    penAnnual: numericString,
    penStartAge: numericString,
    penCola: z.string(),

    // Client 2 pension
    penSrc2: z.string(),
    penAnnual2: numericString,
    penStartAge2: numericString,
    penCola2: z.string(),

    // Current and proposed portfolio fees
    pfFeeType: z.string(),
    pfAdvisoryFee: numericString,
    prFeeType: z.string(),
    prAdvisoryFee: numericString,

    // Simulation settings
    simYrs: numericString,
    simN: numericString,
    tgtEquity: numericString,
    rebalFreq: z.string(),
    gpOn: z.string(),
    gpYears: numericString,

    // Estate assumptions
    estExemption: numericString,
    estRate: numericString,

    // Tax assumptions
    taxMode: z.string(),
    taxFlat: numericString,
    cgtRate: numericString,
    cgtTurnover: numericString,
    taxApply: z.string(),
    taxState: z.string(),

    // Percentile bands
    blow: numericString,
    bmid: numericString,
    bhigh: numericString,
  })
  /*
   * Preserve additional fields from newer HTML exports until every
   * possible field has been inventoried.
   */
  .passthrough();

// ─────────────────────────────────────────────────────────────
// Assets
// ─────────────────────────────────────────────────────────────

const legacyAssetSchema = z
  .object({
    id: nonEmptyId,
    type: z.string(),
    group: z.string(),
    label: z.string(),
    baseLabel: z.string().optional(),
    value: z.number().finite().min(0),
    liquid: z.boolean(),
    country: z.string().optional(),
    note: z.string().optional(),
    ccy: z.string().optional(),
    withdrawAge: z.number().finite().nullable().optional(),
  })
  .passthrough();

// ─────────────────────────────────────────────────────────────
// Loans
// ─────────────────────────────────────────────────────────────

const legacyLoanSchema = z
  .object({
    id: nonEmptyId,
    type: z.string(),
    label: z.string().optional(),
    bal: z.number().finite().min(0),
    rate: z.number().finite().min(0),
    yrs: z.number().finite().min(0),
  })
  .passthrough();

// ─────────────────────────────────────────────────────────────
// Goals
// ─────────────────────────────────────────────────────────────

const legacyGoalSchema = z
  .object({
    id: nonEmptyId,
    name: z.string(),
    amt: z.number().finite().min(0),
    homePrice: z.number().finite().nullable().optional(),
    startYear: z.number().int(),
    endYear: z.number().int(),
    cat: z.string().optional(),
    tier: z
      .enum([
        "essential",
        "important",
        "aspirational",
        "legacy",
      ])
      .optional(),
  })
  .passthrough()
  .refine(
    (goal) => goal.endYear >= goal.startYear,
    {
      message: "endYear must be greater than or equal to startYear",
      path: ["endYear"],
    },
  );

// ─────────────────────────────────────────────────────────────
// Children
// Update it after checking how the HTML creates child objects.
// ─────────────────────────────────────────────────────────────

const legacyChildSchema = z
  .object({
    id: nonEmptyId,
    first: z.string().optional(),
    last: z.string().optional(),
    dob: z.string().optional(),
  })
  .passthrough();

// ─────────────────────────────────────────────────────────────
// Current portfolio holdings
// ─────────────────────────────────────────────────────────────

const legacyInvestmentSchema = z
  .object({
    id: nonEmptyId,
    name: z.string(),
    tkr: z.string(),
    type: z.string(),
    cls: assetClassSchema.or(z.string()),
    region: z.string(),
    val: z.number().finite().min(0),
    er: z.number().finite().min(0),
    yld: z.number().finite(),
    note: z.string(),
    metrics: z.unknown().nullable(),
  })
  .passthrough();

// ─────────────────────────────────────────────────────────────
// Arrays that are empty in John's profile
//
// We know they contain objects with ids, but not their complete
// structures yet. Passthrough preserves the remaining fields.
// ─────────────────────────────────────────────────────────────

const legacyIdObjectSchema = z
  .object({
    id: nonEmptyId,
  })
  .passthrough();

// ─────────────────────────────────────────────────────────────
// Complete HTML export schema
// ─────────────────────────────────────────────────────────────

export const legacyWealthPlanSchema = z
  .object({
    v: z.string(),
    savedAt: z.string().datetime(),

    fields: legacyFieldsSchema,

    c2visible: z.boolean(),

    assets: z.array(legacyAssetSchema),
    loans: z.array(legacyLoanSchema),
    goals: z.array(legacyGoalSchema),
    children: z.array(legacyChildSchema),

    investments: z.array(legacyInvestmentSchema),
    proposals: z.array(legacyIdObjectSchema),
    insurances: z.array(legacyIdObjectSchema),
    equityComp: z.array(legacyIdObjectSchema),
    beneficiaries: z.array(legacyIdObjectSchema),

    assetSeq: z.number().int().min(0),
    loanSeq: z.number().int().min(0),
    goalSeq: z.number().int().min(0),
    childSeq: z.number().int().min(0),
    invSeq: z.number().int().min(0),
    propSeq: z.number().int().min(0),
    insSeq: z.number().int().min(0),
    eqSeq: z.number().int().min(0),
    benSeq: z.number().int().min(0),

    pfLinkedAccountId: z.string(),
  })
  .passthrough()
  .superRefine((plan, ctx) => {
    validateUniqueIds(plan.assets, "assets", ctx);
    validateUniqueIds(plan.loans, "loans", ctx);
    validateUniqueIds(plan.goals, "goals", ctx);
    validateUniqueIds(plan.children, "children", ctx);
    validateUniqueIds(plan.investments, "investments", ctx);

    // If no asset has the same ID as pfLinkedAccountId, report an error.
    if (
      plan.pfLinkedAccountId &&
      !plan.assets.some(
        (asset) => asset.id === plan.pfLinkedAccountId,
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pfLinkedAccountId"],
        message:
          `Portfolio account "${plan.pfLinkedAccountId}" ` +
          "does not match an asset id",
      });
    }
  });

// Check that every object has a unique ID 
function validateUniqueIds(
  items: Array<{ id: string }>,
  fieldName: string,
  ctx: z.RefinementCtx,
): void {
  const seen = new Set<string>();

  items.forEach((item, index) => {
    if (seen.has(item.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [fieldName, index, "id"],
        message: `Duplicate id "${item.id}"`,
      });
    }

    seen.add(item.id);
  });
}

// TypeScript type for the legacy wealth plan schema
export type LegacyWealthPlan = z.infer<
  typeof legacyWealthPlanSchema
>;

export function parseLegacyPlan(input: unknown) {
  const result = legacyWealthPlanSchema.safeParse(input);

  if (result.success) {
    return {
      ok: true as const,
      plan: result.data,
    };
  }

  const fieldErrors: Record<string, string> = {};

  for (const issue of result.error.issues) {
    const path = issue.path.join(".") || "(root)";

    if (!fieldErrors[path]) {
      fieldErrors[path] = issue.message;
    }
  }

  return {
    ok: false as const,
    fieldErrors,
  };
}