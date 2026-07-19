import johnProfile from "../test-data/john-profile.json";
import { legacyWealthPlanSchema } from "../lib/plan/legacy-schema";

const result = legacyWealthPlanSchema.safeParse(johnProfile);

if (!result.success) {
  console.error("John profile failed validation:");
  console.error(JSON.stringify(result.error.format(), null, 2));
  process.exit(1);
}

console.log("John profile is valid.");
console.log({
  client: `${result.data.fields.c1f} ${result.data.fields.c1l}`,
  assets: result.data.assets.length,
  loans: result.data.loans.length,
  goals: result.data.goals.length,
  investments: result.data.investments.length,
  linkedAccount: result.data.pfLinkedAccountId,
});