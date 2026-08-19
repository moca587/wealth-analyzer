import type { WealthPlan, GoalFundingMetric } from "@/lib/engine/types";

export function calculateGoalFundingMetrics(
  plan: WealthPlan,
): GoalFundingMetric[] {
  const currentYear = new Date().getFullYear();

  const discountRate = plan.returnMean ?? 0.07;

  const availableResources = plan.assets
    .filter((asset) => asset.liquid && asset.cls !== "real_estate")
    .reduce((sum, asset) => sum + Number(asset.value || 0), 0);

  return plan.goals.map((goal) => {
    let presentValueCost = 0;

    for (let year = goal.startYear; year <= goal.endYear; year++) {
      const yearsAway = Math.max(0, year - currentYear);

      const presentValue = goal.amt / Math.pow(1 + discountRate, yearsAway);

      presentValueCost += presentValue;
    }

    const fundingRatio =
      presentValueCost > 0 ? availableResources / presentValueCost : 0;

    return {
      goalId: goal.id,
      presentValueCost,
      allocatedResources: availableResources,
      fundingRatio,
    };
  });
}
