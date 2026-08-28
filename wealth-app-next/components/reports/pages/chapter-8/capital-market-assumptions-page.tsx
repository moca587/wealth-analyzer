"use client";

import type { WealthPlan } from "@/lib/engine/types";
import { ASSET_CLASS_CMA } from "@/lib/engine/constants";

import { portfolioReturnParams } from "@/lib/engine/financial-math";

import { ReportPage } from "../../report-page";

type Props = {
  plan: WealthPlan;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

const ASSET_CLASS_LABELS: Record<string, string> = {
  equity: "Equity",
  fixed_income: "Fixed Income",
  real_estate: "Real Assets / REITs",
  commodity: "Commodities",
  cash: "Cash",
  mixed: "Mixed",
  alternative: "Alternatives",
  crypto: "Crypto",
};

export function CapitalMarketAssumptionsPage({
  plan,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const weights = calculatePortfolioWeights(plan);

  const rows = Object.entries(ASSET_CLASS_CMA).map(([assetClass, cma]) => {
    const weight = weights[assetClass] ?? 0;

    /*
     * Geometric approximation:
     *
     * geo mu = arithmetic mu - 1/2 sigma²
     */
    const geometricMean = cma.mean - 0.5 * cma.sigma * cma.sigma;

    return {
      assetClass,
      label: ASSET_CLASS_LABELS[assetClass] ?? formatAssetClass(assetClass),

      weight,
      mean: cma.mean,
      sigma: cma.sigma,
      geometricMean,
    };
  });

  // -------------------------------------------------------
  // Portfolio arithmetic expected return
  // -------------------------------------------------------

  const holdings = plan.holdings ?? [];

  const portfolioMetrics = portfolioReturnParams(
    holdings.map((holding) => ({
      cls: holding.cls,
      value: holding.value,
    })),
    {
      mean: 0.07,
      sigma: 0.12,
    },
  );

  const portfolioMean = portfolioMetrics.mean;

  const portfolioSigma = portfolioMetrics.sigma;

  const portfolioGeometricMean =
    portfolioMean - 0.5 * portfolioSigma * portfolioSigma;

  return (
    <ReportPage
      clientName={clientName}
      title="Capital Market Assumptions"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      {/* Intro */}
      <p className="mt-4 text-[9px] leading-[1.55] text-[#4f565e]">
        Long-term capital market assumptions underpinning all projections in
        this report. Arithmetic mu is the expected annual return; sigma is
        annual volatility; geometric mu (= arithmetic - ½sigma²) is the
        compounding return used for multi-year projections.
      </p>

      {/* Inflation */}
      <p className="mt-4 text-[9px] font-semibold text-[#30343b]">
        Core inflation assumption: {formatPercent(plan.inflationRate ?? 0)} /
        yr.
      </p>

      {/* CMA table */}
      <div className="mt-5">
        {/* Header */}
        <div className="grid grid-cols-[30%_17%_18%_17%_18%] bg-[#0867b9] px-3 py-2 text-[8px] font-bold text-white">
          <span>Asset class</span>
          <span>Your weight</span>
          <span>Arith mu</span>
          <span>sigma</span>
          <span>Geo mu</span>
        </div>

        {/* Asset-class rows */}
        {rows.map((row) => (
          <div
            key={row.assetClass}
            className="grid grid-cols-[30%_17%_18%_17%_18%] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px] text-[#30343b]"
          >
            <span>{row.label}</span>

            <span>{formatPercent(row.weight)}</span>

            <span>{formatPercent(row.mean)}</span>

            <span>{formatPercent(row.sigma)}</span>

            <span>{formatPercent(row.geometricMean)}</span>
          </div>
        ))}

        {/* Portfolio row */}
        <div className="grid grid-cols-[30%_17%_18%_17%_18%] bg-[#e7eff8] px-3 py-2 text-[8px] font-bold text-[#173d60]">
          <span>YOUR PORTFOLIO</span>

          <span>
            {formatPercent(rows.reduce((sum, row) => sum + row.weight, 0))}
          </span>

          <span>{formatPercent(portfolioMean)}</span>

          <span>
            {portfolioSigma != null ? formatPercent(portfolioSigma) : "—"}
          </span>

          <span>
            {portfolioGeometricMean != null
              ? formatPercent(portfolioGeometricMean)
              : "—"}
          </span>
        </div>
      </div>

      {/* Explanation */}
      <p className="mt-5 text-[8px] leading-[1.55] text-[#5f666d]">
        Portfolio sigma is computed from the full asset-class correlation matrix
        rather than a naive weighted average of individual volatilities, so
        diversification correctly reduces total portfolio risk.
      </p>
    </ReportPage>
  );
}

/**
 * Calculates the current portfolio weights using detailed holdings.
 *
 * Example:
 *
 * VOO $60k equity
 * BND $20k fixed income
 *
 * total = $80k
 *
 * equity       = 75%
 * fixed income = 25%
 */
function calculatePortfolioWeights(plan: WealthPlan) {
  const weights: Record<string, number> = {};

  const holdings = plan.holdings ?? [];

  const total = holdings.reduce(
    (sum, holding) => sum + Math.max(0, holding.value || 0),
    0,
  );

  if (total <= 0) {
    return weights;
  }

  for (const holding of holdings) {
    const value = Math.max(0, holding.value || 0);

    if (value <= 0) {
      continue;
    }

    const assetClass = holding.cls ?? "alternative";

    weights[assetClass] = (weights[assetClass] ?? 0) + value / total;
  }

  return weights;
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function formatAssetClass(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
