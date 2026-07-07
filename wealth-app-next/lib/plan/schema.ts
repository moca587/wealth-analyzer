import { z } from "zod";

// ─────────────────────────────────────────────────────────────────
// Runtime validation for WealthPlan (lib/engine/types.ts). The
// TypeScript interfaces only constrain compile-time code paths —
// they do nothing for JSON coming off the wire (API body) or out of
// Postgres JSONB (which can hold anything, including hand-edited or
// stale-schema rows). This is the single source of truth both the
// API route and the plan page validate against.
// ─────────────────────────────────────────────────────────────────

const money = z.number().finite().min(0);
const finiteNumber = z.number().finite();
const nonEmptyId = z.string().min(1);

const riskProfileEnum = z.enum([
  "very_conservative", "conservative", "moderately_conservative", "moderate",
  "moderately_aggressive", "aggressive", "very_aggressive",
]);

const timeHorizonEnum = z.enum(["0_5", "5_10", "10_15", "15_plus"]);

const countryCodeEnum = z.enum([
  "US", "CA", "GB", "AU", "CH", "EU", "JP", "SG", "HK",
  "CN", "TW", "KR", "IN", "ID", "MX", "BR", "SA", "ZA", "OTHER",
  // Individual eurozone members — each has its own account taxonomy.
  "DE", "FR", "IT", "ES", "NL", "BE", "AT", "IE", "PT", "LU",
  "FI", "GR", "CY", "HR", "EE", "LV", "LT", "SK", "SI", "MT",
]);

const assetClassEnum = z.enum([
  "equity", "fixed_income", "real_estate", "commodity",
  "cash", "mixed", "alternative", "crypto",
]);

const clientSchema = z.object({
  id: nonEmptyId,
  first: z.string(),
  last: z.string(),
  dob: z.string().optional(),
  country: countryCodeEnum.optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  risk: riskProfileEnum.optional(),
  horizon: timeHorizonEnum.optional(),
});

const childSchema = z.object({
  id: nonEmptyId,
  first: z.string(),
  last: z.string(),
  dob: z.string(),
});

const incomeStreamSchema = z.object({
  id: nonEmptyId,
  clientId: nonEmptyId,
  source: z.string(),
  amount: money,
  taxable: z.boolean().optional(),
});

const expenseCategorySchema = z.object({
  id: nonEmptyId,
  name: z.string(),
  amount: money,
});

const assetSchema = z.object({
  id: nonEmptyId,
  type: z.string(),
  group: z.string().optional(),
  label: z.string().optional(),
  value: money,
  liquid: z.boolean(),
  country: countryCodeEnum.optional(),
  cls: assetClassEnum.optional(),
  note: z.string().optional(),
});

const loanSchema = z.object({
  id: nonEmptyId,
  type: z.string(),
  label: z.string().optional(),
  bal: money,
  rate: finiteNumber.min(0).max(100),
  yrs: finiteNumber.min(0).max(100),
});

const goalSchema = z
  .object({
    id: nonEmptyId,
    name: z.string(),
    cat: z.string().optional(),
    tier: z.enum(["essential", "important", "aspirational"]).optional(),
    amt: money,
    startYear: z.number().int(),
    endYear: z.number().int(),
  })
  .refine((g) => g.endYear >= g.startYear, {
    message: "endYear must be >= startYear",
    path: ["endYear"],
  });

// Historical 50-year averages range from ~2% (Switzerland/Japan) to Brazil's
// hyperinflation-skewed 58.5%. A flat cap would reject Brazil outright, so
// allow a wider ceiling specifically when inflationRegion is "BR"; every
// other region is capped well below that as a sanity bound against typos
// (e.g. entering "38" instead of "0.038").
const MAX_INFLATION_DEFAULT = 0.30;
const MAX_INFLATION_BR = 0.60;
const MIN_INFLATION = -0.02;

export const wealthPlanSchema = z
  .object({
    version: z.number().int().min(1),
    currency: z.string().min(1),
    inflationRate: finiteNumber,
    inflationRegion: z.string().optional(),
    clients: z.array(clientSchema).min(1).max(2),
    children: z.array(childSchema),
    incomes: z.array(incomeStreamSchema),
    expenses: z.array(expenseCategorySchema),
    assets: z.array(assetSchema),
    loans: z.array(loanSchema),
    goals: z.array(goalSchema),
    notes: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .superRefine((plan, ctx) => {
    const max = plan.inflationRegion === "BR" ? MAX_INFLATION_BR : MAX_INFLATION_DEFAULT;
    if (plan.inflationRate < MIN_INFLATION || plan.inflationRate > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `inflationRate must be between ${MIN_INFLATION} and ${max} for region ${plan.inflationRegion ?? "(none)"}`,
        path: ["inflationRate"],
      });
    }

    const clientIds = new Set(plan.clients.map((c) => c.id));
    plan.incomes.forEach((income, i) => {
      if (!clientIds.has(income.clientId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `incomes[${i}].clientId "${income.clientId}" does not match any client`,
          path: ["incomes", i, "clientId"],
        });
      }
    });
  });

export type WealthPlanParsed = z.infer<typeof wealthPlanSchema>;

/** Safe parse helper returning a flat field->message error map on failure. */
export function parsePlan(input: unknown) {
  const result = wealthPlanSchema.safeParse(input);
  if (result.success) return { ok: true as const, plan: result.data };
  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    fieldErrors[issue.path.join(".") || "(root)"] = issue.message;
  }
  return { ok: false as const, fieldErrors };
}
