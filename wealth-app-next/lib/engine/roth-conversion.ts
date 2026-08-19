import type { RothConversionProjection, WealthPlan } from "./types";

import { ageFromDOB } from "./financial-math";

export function buildRothConversionProjection(
  plan: WealthPlan,
): RothConversionProjection {
  const primaryClient = plan.clients[0];

  const currentAge = primaryClient?.dob
    ? (ageFromDOB(primaryClient.dob) ?? 45)
    : 45;

  const retirementAge = plan.retirement?.retirementAge ?? 65;

  const taxDeferredPool = plan.assets
    .filter((asset) => {
      const group = asset.group?.toLowerCase() ?? "";

      const type = asset.type.toLowerCase();

      return group.includes("retirement") && !type.includes("roth");
    })
    .reduce((sum, asset) => sum + Number(asset.value || 0), 0);

  // For the US model, conversions are sized
  // from retirement until RMDs begin.
  const startAge = Math.max(currentAge, retirementAge);

  const endAge = 73;

  const windowYears = Math.max(0, endAge - startAge);

  // Illustrative low-income conversion
  // tax assumption for now.
  const estimatedTaxRate = 0.16;

  const suggestedAnnualConversion =
    windowYears > 0 ? taxDeferredPool / windowYears : 0;

  const estimatedAnnualTax = suggestedAnnualConversion * estimatedTaxRate;

  const estimatedTotalTax = taxDeferredPool * estimatedTaxRate;

  return {
    startAge,
    endAge,
    windowYears,
    taxDeferredPool,
    suggestedAnnualConversion,
    estimatedTaxRate,
    estimatedAnnualTax,
    estimatedTotalTax,
  };
}
