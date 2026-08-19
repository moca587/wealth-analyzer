import type {
  EstateTaxDefaults,
  EstateTransferSummary,
  SimulationResult,
  WealthPlan,
} from "./types";

import { ESTATE_TAX_DEFAULTS } from "./constants";

export function buildEstateTransferSummary(
  plan: WealthPlan,
  result: SimulationResult,
): EstateTransferSummary {
  const country = plan.clients[0]?.country ?? "US";

  const defaults = ESTATE_TAX_DEFAULTS[country] ?? {
    exemption: 0,
    rate: 0,
    label: "Estate transfer",
    description: "No country-specific estate-tax default configured.",
  }; // country's default estate-tax assumptions, if any, or a generic fallback.

  const estateTaxExemption = plan.estateTaxExemption ?? defaults.exemption;

  const estateTaxRate = plan.estateTaxRate ?? defaults.rate;

  // Use real final median if available,
  // otherwise fall back to nominal median.
  const medianProjectedEstate = result.realFinal?.p50 ?? result.final?.p50 ?? 0;

  const lifeInsuranceBenefit = (plan.insurancePolicies ?? [])
    .filter(
      (policy) =>
        policy.type === "term_life" ||
        policy.type === "whole_life" ||
        policy.type === "universal_life",
    )
    .reduce((sum, policy) => sum + Number(policy.benefit || 0), 0);

  const grossEstate = medianProjectedEstate + lifeInsuranceBenefit; // adds projected net worth and insurance benefits

  const taxableEstate = Math.max(0, grossEstate - estateTaxExemption);

  const estimatedEstateTax = taxableEstate * estateTaxRate;

  const netToBeneficiaries = Math.max(0, grossEstate - estimatedEstateTax);

  return {
    medianProjectedEstate,
    lifeInsuranceBenefit,
    grossEstate,

    estateTaxExemption,
    estateTaxRate,
    taxableEstate,
    estimatedEstateTax,

    netToBeneficiaries,
  };
}

export function getEstateTaxDefaults(country: string): EstateTaxDefaults {
  return (
    ESTATE_TAX_DEFAULTS[country] ?? {
      exemption: 0,
      rate: 0,
      label: "Estate transfer",
      description: "No country-specific estate-tax default configured.",
    }
  );
}
