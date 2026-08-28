import type { WealthPlan, SimulationResult } from "@/lib/engine/types";

import { ReportPage } from "../../report-page";

import { AchievableLifestyleChart } from "../../charts/achievable-lifestyle-chart";

import { calculateAchievableLifestyle } from "@/lib/engine/achievable-lifestyle";
import { portfolioReturnParams } from "@/lib/engine/financial-math";

type Props = {
  plan: WealthPlan;
  result: SimulationResult;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function AchievableLifestylePage({
  plan,
  result,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  /*
   * DON'T hard-code these numbers.
   *
   * We need to connect this to the same sustainable-spending
   * calculation used by your lifestyle panel / legacy engine.
   *
   * Temporary example shape:
   */
  const investableAssets = plan.assets.filter(
    (asset) => asset.cls !== "real_estate" && asset.value > 0,
  );

  const portfolio = portfolioReturnParams(
    investableAssets.map((asset) => ({
      cls: asset.cls,
      value: asset.value,
    })),
    {
      mean: 0.07,
      sigma: 0.12,
    },
  );

  const lifestyle = calculateAchievableLifestyle(plan, {
    paths: result.paths,
    years: result.paths[0]?.length ? result.paths[0].length - 1 : 0,
    mu: portfolio.mean,
    sigma: portfolio.sigma,
  });

  const lifestylePoints =
    lifestyle?.chart.map((point) => ({
      age: point.retirementAge,
      spending: point.expected,
    })) ?? [];

  return (
    <ReportPage
      clientName={clientName}
      title="Potentially Achievable Lifestyle"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <p className="mt-3 text-[10px] leading-[1.6] text-[#5f666d]">
        This estimates the sustainable annual spending you could support
        throughout retirement (to age 90), at three confidence levels — shown in
        today&apos;s money and inclusive of your projected pension /
        state-benefit income. Higher confidence assumes a more conservative
        return; lower confidence assumes more favourable markets.
      </p>

      <div className="mt-5">
        <AchievableLifestyleChart
          points={lifestylePoints}
          currency={plan.currency}
        />
      </div>

      {lifestyle && (
        <>
          <div className="mt-6 overflow-hidden rounded-md border border-[#d7dde5]">
            <table className="w-full border-collapse text-[9px]">
              <thead>
                <tr className="bg-[#0b63b6] text-white">
                  <th className="px-3 py-2 text-left font-semibold">
                    Scenario
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Market assumption
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Wealth at retirement
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Sustainable spend (today&apos;s $)
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr className="border-b border-[#d7dde5]">
                  <td className="px-3 py-2">Conservative (80% confidence)</td>

                  <td className="px-3 py-2">If markets are weaker</td>

                  <td className="px-3 py-2">
                    {formatCurrency(
                      lifestyle.conservative.wealthAtRetirement,
                      plan.currency,
                    )}
                  </td>

                  <td className="px-3 py-2">
                    {formatCurrency(
                      lifestyle.conservative.annualSpending,
                      plan.currency,
                    )}{" "}
                    / yr
                  </td>
                </tr>

                <tr className="border-b border-[#d7dde5]">
                  <td className="px-3 py-2">Expected (50% confidence)</td>

                  <td className="px-3 py-2">If markets are typical</td>

                  <td className="px-3 py-2">
                    {formatCurrency(
                      lifestyle.expected.wealthAtRetirement,
                      plan.currency,
                    )}
                  </td>

                  <td className="px-3 py-2">
                    {formatCurrency(
                      lifestyle.expected.annualSpending,
                      plan.currency,
                    )}{" "}
                    / yr
                  </td>
                </tr>

                <tr>
                  <td className="px-3 py-2">Optimistic (30% confidence)</td>

                  <td className="px-3 py-2">If markets are stronger</td>

                  <td className="px-3 py-2">
                    {formatCurrency(
                      lifestyle.optimistic.wealthAtRetirement,
                      plan.currency,
                    )}
                  </td>

                  <td className="px-3 py-2">
                    {formatCurrency(
                      lifestyle.optimistic.annualSpending,
                      plan.currency,
                    )}{" "}
                    / yr
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-[8.5px] leading-[1.6] text-[#6b7280]">
            Sustainable spend is shown in today&apos;s money and includes your
            projected pension / state-benefit income — the portfolio only funds
            spending above what pensions cover. It targets a 90% probability of
            the money lasting to age 90. Wealth at retirement is shown in future
            (at-retirement) dollars.
          </p>
        </>
      )}

      {/* Scenario table goes here */}
    </ReportPage>
  );
}

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
