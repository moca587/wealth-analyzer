import type {
  RequiredWithdrawalProjection,
  RequiredWithdrawalRow,
  WealthPlan,
} from "./types";

import { IRS_UNIFORM_LIFETIME, RRIF_RATES } from "./constants";

import { ageFromDOB } from "./financial-math";

export function buildRequiredMinimumWithdrawals(
  plan: WealthPlan,
): RequiredWithdrawalProjection {
  const primaryClient = plan.clients[0];

  const country = primaryClient?.country ?? "US";

  const currentAge = primaryClient?.dob
    ? (ageFromDOB(primaryClient.dob) ?? 45)
    : 45;

  const currentYear = new Date().getFullYear();

  // Retirement / locked accounts.
  const retirementPool = plan.assets
    .filter((asset) => {
      const group = asset.group?.toLowerCase() ?? "";

      return group.includes("retirement") || asset.withdrawAge != null;
    })
    .reduce((sum, asset) => sum + Number(asset.value || 0), 0);

  // Conservative growth assumption used
  // by the legacy retirement reserve.
  const growthRate = 0.035;

  // Simplified effective tax estimate.
  const withdrawalTaxRate = 0.22;

  if (country === "CA") {
    return buildCanadaProjection({
      currentAge,
      currentYear,
      retirementPool,
      growthRate,
      withdrawalTaxRate,
    });
  }

  // Default to US rules for now.
  return buildUSProjection({
    currentAge,
    currentYear,
    retirementPool,
    growthRate,
    withdrawalTaxRate,
  });
}

function buildUSProjection({
  currentAge,
  currentYear,
  retirementPool,
  growthRate,
  withdrawalTaxRate,
}: {
  currentAge: number;
  currentYear: number;
  retirementPool: number;
  growthRate: number;
  withdrawalTaxRate: number;
}): RequiredWithdrawalProjection {
  const startAge = 73;

  let pool = retirementPool;

  const rows: RequiredWithdrawalRow[] = [];

  // Grow from today until the
  // first mandatory-withdrawal age.
  for (let age = currentAge; age < startAge; age++) {
    pool *= 1 + growthRate;
  }

  for (let age = startAge; age <= 90; age++) {
    const divisor = IRS_UNIFORM_LIFETIME[age];

    if (!divisor) {
      continue;
    }

    const poolStart = pool;

    const requiredRate = 1 / divisor;

    const withdrawal = poolStart / divisor;

    const estimatedTax = withdrawal * withdrawalTaxRate;

    // Grow remaining account
    // after the required withdrawal.
    const poolEnd = Math.max(0, (poolStart - withdrawal) * (1 + growthRate));

    const year = currentYear + (age - currentAge);

    rows.push({
      age,
      year,
      poolStart,
      requiredRate,
      withdrawal,
      estimatedTax,
      poolEnd,
    });

    pool = poolEnd;
  }

  return {
    rule: "US Required Minimum Distributions",

    startAge,

    totalRequired: rows.reduce((sum, row) => sum + row.withdrawal, 0),

    estimatedTax: rows.reduce((sum, row) => sum + row.estimatedTax, 0),

    rows,
  };
}

function buildCanadaProjection({
  currentAge,
  currentYear,
  retirementPool,
  growthRate,
  withdrawalTaxRate,
}: {
  currentAge: number;
  currentYear: number;
  retirementPool: number;
  growthRate: number;
  withdrawalTaxRate: number;
}): RequiredWithdrawalProjection {
  const startAge = 71;

  let pool = retirementPool;

  const rows: RequiredWithdrawalRow[] = [];

  for (let age = currentAge; age < startAge; age++) {
    pool *= 1 + growthRate;
  }

  for (let age = startAge; age <= 90; age++) {
    const ratePercent = RRIF_RATES[age];

    if (ratePercent == null) {
      continue;
    }

    const requiredRate = ratePercent / 100;

    const poolStart = pool;

    const withdrawal = poolStart * requiredRate;

    const estimatedTax = withdrawal * withdrawalTaxRate;

    const poolEnd = Math.max(0, (poolStart - withdrawal) * (1 + growthRate));

    const year = currentYear + (age - currentAge);

    rows.push({
      age,
      year,
      poolStart,
      requiredRate,
      withdrawal,
      estimatedTax,
      poolEnd,
    });

    pool = poolEnd;
  }

  return {
    rule: "Canada RRIF Minimum Withdrawals",

    startAge,

    totalRequired: rows.reduce((sum, row) => sum + row.withdrawal, 0),

    estimatedTax: rows.reduce((sum, row) => sum + row.estimatedTax, 0),

    rows,
  };
}
