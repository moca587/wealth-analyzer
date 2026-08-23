import type { WealthPlan, SimulationResult } from "@/lib/engine/types";

import { formatMoney } from "@/lib/engine/financial-math";
import { calcAllocationByClass } from "@/lib/portfolio/portfolio-metrics";
import { RISK_PROFILES } from "@/lib/engine/constants";

import { ReportPage } from "../../report-page";
import { ReportSectionBar } from "../../report-section-bar";
import { ReportStatCard } from "../../report-stat-card";

type Props = {
  plan: WealthPlan;
  result: SimulationResult;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;

  annualSurplus: number;
  sustainableSpend?: number;
};

export function ExecutiveSummaryPage({
  plan,
  result,
  clientName,
  date,
  page,
  totalPages,
  annualSurplus,
  sustainableSpend,
}: Props) {
  const currency = plan.currency || "USD";

  const money = (value: number) => formatMoney(value, currency);

  const totalAssets = plan.assets.reduce(
    (sum, asset) => sum + (asset.value || 0),
    0,
  );

  const totalLiabilities = plan.loans.reduce(
    (sum, loan) => sum + (loan.bal || 0),
    0,
  );

  const netWorth = totalAssets - totalLiabilities;

  /*
   * Working/investment assets:
   * cash + taxable portfolio + retirement/locked accounts.
   *
   * Adjust this helper if your WealthPlan has a cleaner existing
   * calculation for investable assets.
   */
  const personalAssets = plan.assets
    .filter((asset) => {
      const text = `${asset.type ?? ""} ${asset.cls ?? ""}`.toLowerCase();

      return (
        text.includes("real estate") ||
        text.includes("property") ||
        text.includes("insurance")
      );
    })
    .reduce((sum, asset) => sum + (asset.value || 0), 0);

  const investmentAssets = totalAssets - personalAssets;

  const retirementAssets = plan.assets
    .filter((asset) => {
      const text = `${asset.type ?? ""} ${asset.cls ?? ""}`.toLowerCase();

      return (
        text.includes("401") ||
        text.includes("ira") ||
        text.includes("retirement") ||
        text.includes("pension")
      );
    })
    .reduce((sum, asset) => sum + (asset.value || 0), 0);

  const investmentPct =
    totalAssets > 0 ? (investmentAssets / totalAssets) * 100 : 0;

  const personalPct =
    totalAssets > 0 ? (personalAssets / totalAssets) * 100 : 0;

  const liabilityPct =
    totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;

  const allocation = calcAllocationByClass(plan.holdings ?? []);

  const equityPct = allocation.find((item) => item.key === "equity")?.pct ?? 0;

  const fixedPct =
    allocation.find(
      (item) => item.key === "fixed" || item.key === "fixed_income",
    )?.pct ?? 0;

  const cashPct = allocation.find((item) => item.key === "cash")?.pct ?? 0;

  const realAltPct = allocation
    .filter(
      (item) =>
        item.key === "real" ||
        item.key === "real_assets" ||
        item.key === "alternative",
    )
    .reduce((sum, item) => sum + item.pct, 0);

  const riskKey = plan.clients[0]?.risk;

  const riskLabel = riskKey ? (RISK_PROFILES[riskKey]?.label ?? riskKey) : "—";

  return (
    <ReportPage
      clientName={clientName}
      title="Executive Summary: Key Findings"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <p className="text-[10.5px] leading-[1.55] text-[#555d66]">
        In plain terms: One page with the numbers that matter most: what you are
        worth today, how much of it is working for you in investments, and
        whether more money comes in than goes out each year.
      </p>

      <div className="mt-5 grid grid-cols-4 gap-3">
        <ReportStatCard
          label="NET WORTH"
          value={money(netWorth)}
          note="Assets minus liabilities"
        />

        <ReportStatCard
          label="TOTAL ASSETS"
          value={money(totalAssets)}
          note="Investment + personal"
        />

        <ReportStatCard
          label="INVESTMENT ASSETS"
          value={money(investmentAssets)}
          note={`${investmentPct.toFixed(0)}% of total`}
        />

        <ReportStatCard
          label="ANNUAL SURPLUS"
          value={`${money(annualSurplus)}/yr`}
          note="Net cash flow"
        />
      </div>

      <ReportSectionBar>Your Net Worth Statement</ReportSectionBar>

      <div className="mt-3 text-[10.5px] leading-[1.55] text-[#454b53]">
        <p>
          A review of your net worth statement identifies the following key
          findings:
        </p>

        <ul className="mt-2 space-y-1 pl-4">
          <li className="list-disc">
            You have a combined net worth of <strong>{money(netWorth)}</strong>.
          </li>

          <li className="list-disc">
            You have <strong>{money(investmentAssets)}</strong> in investment
            assets. These are your working assets, representing{" "}
            {investmentPct.toFixed(1)}% of your total assets
            {retirementAssets > 0 && (
              <>
                {" "}
                (of which <strong>{money(retirementAssets)}</strong> sits in
                retirement accounts)
              </>
            )}
            .
          </li>

          <li className="list-disc">
            Your investment assets are currently allocated as{" "}
            {equityPct.toFixed(1)}% equity, {fixedPct.toFixed(1)}% fixed income,{" "}
            {cashPct.toFixed(1)}% cash and {realAltPct.toFixed(1)}% real assets
            / alternatives.
          </li>

          <li className="list-disc">
            You have <strong>{money(personalAssets)}</strong> in personal assets
            (residence, insurance cash value). These are non-working assets
            representing {personalPct.toFixed(1)}% of your total assets.
          </li>

          <li className="list-disc">
            Your total liabilities of <strong>{money(totalLiabilities)}</strong>{" "}
            represent {liabilityPct.toFixed(1)}% of your total asset base.
          </li>
        </ul>
      </div>

      <ReportSectionBar>Your Asset Allocation Analysis</ReportSectionBar>

      <div className="mt-3 text-[10.5px] leading-[1.55] text-[#454b53]">
        <p>
          A review of your investments identifies the following key findings:
        </p>

        <ul className="mt-2 pl-4">
          <li className="list-disc">
            The risk associated with your asset allocation is consistent with
            the risk corresponding to your investor profile ({riskLabel}).
          </li>
        </ul>
      </div>

      <ReportSectionBar>Your Retirement Analysis</ReportSectionBar>

      <div className="mt-3 text-[10.5px] leading-[1.55] text-[#454b53]">
        <ul className="pl-4">
          <li className="list-disc">
            {sustainableSpend != null ? (
              <>
                Based on the information in this analysis, a retirement
                lifestyle of approximately{" "}
                <strong>{money(sustainableSpend)} per year</strong> (in
                today&apos;s money, including projected pension income) may be
                attainable.
              </>
            ) : (
              <>
                Retirement sustainability is evaluated using the
                household&apos;s projected portfolio, retirement age, spending
                assumptions and simulated market outcomes.
              </>
            )}
          </li>
        </ul>
      </div>
    </ReportPage>
  );
}
