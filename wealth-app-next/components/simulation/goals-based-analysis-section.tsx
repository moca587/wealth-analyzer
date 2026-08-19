"use client";

import type { AssetClass, WealthPlan } from "@/lib/engine/types";

import { ASSET_CLASS_CMA } from "@/lib/engine/constants";

import {
  geometricMean,
  portfolioReturnParams,
} from "@/lib/engine/financial-math";

type Props = {
  plan: WealthPlan;
};

const CLASS_LABELS: Record<AssetClass, string> = {
  equity: "Equity",
  fixed_income: "Fixed Income",
  real_estate: "Real Estate",
  commodity: "Commodities",
  cash: "Cash",
  mixed: "Mixed",
  alternative: "Alternatives",
  crypto: "Crypto",
};

const CLASS_ORDER: AssetClass[] = [
  "equity",
  "fixed_income",
  "cash",
  "real_estate",
  "commodity",
  "mixed",
  "alternative",
  "crypto",
];

export function GoalsBasedAnalysisSection({ plan }: Props) {
  /*
   * Match the Monte Carlo:
   * real estate is excluded from the investable return portfolio.
   */
  const investableAssets = (plan.assets ?? []).filter(
    (asset) => asset.cls !== "real_estate" && Number(asset.value) > 0,
  );

  const totalInvested = investableAssets.reduce(
    (sum, asset) => sum + Number(asset.value),
    0,
  );

  /*
   * Build class totals so we can display
   * "Your weight" in the table.
   */
  const valueByClass = new Map<AssetClass, number>();

  for (const asset of investableAssets) {
    const cls: AssetClass =
      asset.cls && ASSET_CLASS_CMA[asset.cls] ? asset.cls : "mixed";

    valueByClass.set(cls, (valueByClass.get(cls) ?? 0) + Number(asset.value));
  }

  /*
   * Same portfolio return/risk helper
   * used by the Monte Carlo.
   *
   * Fallback is only used if there is
   * no usable allocation.
   */
  const portfolioParams = portfolioReturnParams(
    investableAssets.map((asset) => ({
      cls: asset.cls,
      value: Number(asset.value),
    })),
    {
      // fallback
      mean: 0.07,
      sigma: 0.12,
    },
  ); // gives expected return and volatility for the portfolio

  const portfolioMean = portfolioParams.mean;

  const portfolioSigma = portfolioParams.sigma;

  const portfolioGeo = geometricMean(portfolioMean, portfolioSigma);

  // one row for each asset class, in a fixed order
  const rows = CLASS_ORDER.map((cls) => {
    const assumption = ASSET_CLASS_CMA[cls];

    const value = valueByClass.get(cls) ?? 0;

    const weight = totalInvested > 0 ? value / totalInvested : 0;

    const geo = geometricMean(assumption.mean, assumption.sigma);

    return {
      cls,
      label: CLASS_LABELS[cls],
      weight,
      mean: assumption.mean,
      sigma: assumption.sigma,
      geo,
    };
  });

  return (
    <section className={sectionClass}>
      <div>
        <h2 className={titleClass}>Goals-Based Analysis</h2>

        <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
          Goals-based analysis using per-asset-class capital market assumptions
          and a full correlation matrix for portfolio risk. These are the same
          return/risk assumptions used by the simulation engine.
        </p>
      </div>

      <div className="mt-5 rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] px-4 py-3">
        <div className="text-[11px] text-[#64748b]">
          <strong className="text-[#00875a]">✓ Analysis complete</strong>
          {" — "}
          portfolio μ{" "}
          <strong className="text-[#16213e]">
            {formatDecimalPercent(portfolioMean)}
          </strong>
          {" · "}σ{" "}
          <strong className="text-[#16213e]">
            {formatDecimalPercent(portfolioSigma)}
          </strong>
          {" · "}
          geometric μ{" "}
          <strong className="text-[#16213e]">
            {formatDecimalPercent(portfolioGeo)}
          </strong>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
          Capital Market Assumptions
        </h3>

        <p className="mt-2 text-[11px] leading-5 text-[#64748b]">
          Per-asset-class long-term arithmetic return and volatility assumptions
          used to derive the portfolio&apos;s expected return and risk.
        </p>

        <p className="mt-1 text-[10px] text-[#9ca3af]">
          Geometric mean = arithmetic return − ½σ².
        </p>

        <p className="mt-1 text-[10px] text-[#9ca3af]">
          Plan inflation assumption:{" "}
          <strong className="text-[#64748b]">
            {formatDecimalPercent(plan.inflationRate)}
          </strong>
        </p>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[rgba(0,87,184,.10)] bg-[#f8faff]">
              <th className={thClass}>Asset class</th>

              <th className={numberThClass}>Your weight</th>

              <th className={numberThClass}>Arith μ</th>

              <th className={numberThClass}>σ</th>

              <th className={numberThClass}>Geo μ</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr
                key={row.cls}
                className="border-b border-[rgba(0,87,184,.07)]"
              >
                <td className={tdClass}>
                  <span className="font-semibold text-[#16213e]">
                    {row.label}
                  </span>
                </td>

                <td className={numberTdClass}>
                  <span
                    className={
                      row.weight > 0
                        ? "font-bold text-[#16213e]"
                        : "text-[#9ca3af]"
                    }
                  >
                    {(row.weight * 100).toFixed(1)}%
                  </span>
                </td>

                <td className={numberTdClass}>
                  {formatDecimalPercent(row.mean)}
                </td>

                <td className={numberTdClass}>
                  {formatDecimalPercent(row.sigma)}
                </td>

                <td className={numberTdClass}>
                  {formatDecimalPercent(row.geo)}
                </td>
              </tr>
            ))}

            <tr className="bg-[#f8faff]">
              <td className={`${tdClass} font-bold text-[#16213e]`}>
                YOUR PORTFOLIO
                <span className="ml-1 font-normal text-[#64748b]">
                  (covariance-based)
                </span>
              </td>

              <td className={`${numberTdClass} font-bold text-[#16213e]`}>
                {totalInvested > 0 ? "100.0%" : "—"}
              </td>

              <td className={`${numberTdClass} font-bold text-[#16213e]`}>
                {formatDecimalPercent(portfolioMean)}
              </td>

              <td className={`${numberTdClass} font-bold text-[#16213e]`}>
                {formatDecimalPercent(portfolioSigma)}
              </td>

              <td className={`${numberTdClass} font-bold text-[#16213e]`}>
                {formatDecimalPercent(portfolioGeo)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[10px] leading-5 text-[#64748b]">
        Portfolio σ uses the full correlation matrix rather than a weighted
        average of individual asset-class volatilities, so diversification is
        reflected in total portfolio risk.
      </p>

      <p className="mt-4 border-t border-[rgba(0,87,184,.08)] pt-4 text-[10px] leading-5 text-[#9ca3af]">
        <strong>Educational projection only — not financial advice.</strong>{" "}
        Capital market assumptions are hypothetical forward-looking inputs.
        Actual investment outcomes will differ.
      </p>
    </section>
  );
}

function formatDecimalPercent(value: number | undefined): string {
  if (value == null) {
    return "—";
  }

  return `${(value * 100).toFixed(2)}%`;
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const thClass =
  "px-3 py-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]";

const numberThClass =
  "px-3 py-2 text-right text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]";

const tdClass = "px-3 py-3 text-[11px]";

const numberTdClass =
  "px-3 py-3 text-right text-[11px] tabular-nums text-[#64748b]";
