"use client";

import type { WealthPlan } from "@/lib/engine/types";

import { ReportPage } from "../../report-page";
import { AssetBreakdownChart } from "../../charts/asset-breakdown-chart";

type Props = {
  plan: WealthPlan;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

const COLORS = ["#0867b9", "#12a7a5", "#b7791f"];

export function WealthRiskCurrentStatusPage({
  plan,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  /*
   * TODO: PARITY
   * Replace these temporary bucket values with the same
   * Wealth Allocation Framework calculation used on pages 32–34.
   */
  const personalAssets = 320000;
  const marketAssets = 130000;
  const aspirationalAssets = 10000;

  const liabilities = plan.loans.reduce(
    (sum, loan) => sum + (loan.bal || 0),
    0,
  );

  const totalAssets = personalAssets + marketAssets + aspirationalAssets;

  const totalNetWorth = totalAssets - liabilities;

  const personalPct =
    totalAssets > 0 ? (personalAssets / totalAssets) * 100 : 0;

  const marketPct = totalAssets > 0 ? (marketAssets / totalAssets) * 100 : 0;

  const aspirationalPct =
    totalAssets > 0 ? (aspirationalAssets / totalAssets) * 100 : 0;

  const liabilitiesPct =
    totalAssets > 0 ? (liabilities / totalAssets) * 100 : 0;

  // -------------------------------------------------------
  // Current holdings pie
  // -------------------------------------------------------

  const holdings = plan.holdings ?? [];

  const equityValue = holdings
    .filter((holding) => holding.cls === "equity")
    .reduce((sum, holding) => sum + (holding.value || 0), 0);

  const fixedValue = holdings
    .filter((holding) => holding.cls === "fixed_income")
    .reduce((sum, holding) => sum + (holding.value || 0), 0);

  const holdingsTotal = equityValue + fixedValue;

  const pieItems = [
    {
      label: "Equities",
      value: equityValue,
      color: COLORS[0],
    },
    {
      label: "Fixed income",
      value: fixedValue,
      color: COLORS[1],
    },
  ].filter((item) => item.value > 0);

  return (
    <ReportPage
      clientName={clientName}
      title="Wealth & Risk Allocation: Current Status"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <div className="mt-3 border-l-[4px] border-[#0867b9] bg-[#dceaf7] px-3 py-2 text-[10px] font-bold text-[#173d60]">
        Wealth & Risk Allocation: Your Current Status
      </div>

      {/* Top risk summaries */}
      <div className="mt-4 grid grid-cols-3 gap-5">
        <RiskSummary
          label="Personal Risk"
          pct={personalPct}
          value={personalAssets}
          currency={plan.currency}
        />

        <RiskSummary
          label="Market Risk"
          pct={marketPct}
          value={marketAssets}
          currency={plan.currency}
        />

        <RiskSummary
          label="Idiosyncratic Risk"
          pct={aspirationalPct}
          value={aspirationalAssets}
          currency={plan.currency}
        />
      </div>

      {/* Pie + legend */}
      <div className="mt-6 grid grid-cols-[48%_52%] items-center">
        <div className="flex justify-center">
          <div className="h-[165px] w-[165px]">
            <AssetBreakdownChart items={pieItems} />
          </div>
        </div>

        <div>
          <div className="grid grid-cols-[1fr_90px_45px] border-b border-[#d8dde3] pb-2 text-[8px] text-[#70777e]">
            <span />
            <span className="text-right">Amount</span>
            <span className="text-right">%</span>
          </div>

          {pieItems.map((item, index) => {
            const pct =
              holdingsTotal > 0 ? (item.value / holdingsTotal) * 100 : 0;

            return (
              <div
                key={item.label}
                className="grid grid-cols-[1fr_90px_45px] items-center py-1.5 text-[8px]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5"
                    style={{
                      backgroundColor: item.color,
                    }}
                  />

                  <span>{item.label}</span>
                </div>

                <span className="text-right">
                  {formatMoney(item.value, plan.currency)}
                </span>

                <span className="text-right">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category detail */}
      <div className="mt-6 border-l-[4px] border-[#0867b9] bg-[#dceaf7] px-3 py-2 text-[10px] font-bold text-[#173d60]">
        Category detail
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-[55%_23%_22%] bg-[#0867b9] px-3 py-2 text-[8px] font-bold text-white">
          <span>Category</span>
          <span>Amount</span>
          <span>% of total</span>
        </div>

        <CategoryRow
          label="Personal assets"
          value={personalAssets}
          pct={personalPct}
          currency={plan.currency}
        />

        <CategoryRow
          label="Market assets"
          value={marketAssets}
          pct={marketPct}
          currency={plan.currency}
        />

        <CategoryRow
          label="Aspirational assets"
          value={aspirationalAssets}
          pct={aspirationalPct}
          currency={plan.currency}
        />

        <CategoryRow
          label="Liabilities"
          value={-liabilities}
          pct={liabilitiesPct}
          currency={plan.currency}
        />

        <div className="grid grid-cols-[55%_23%_22%] border-b border-x border-[#d8dde3] bg-[#f8f9fb] px-3 py-2 text-[8px] font-bold text-[#30343b]">
          <span>TOTAL ASSETS & LIABILITIES</span>

          <span>{formatMoney(totalNetWorth, plan.currency)}</span>

          <span />
        </div>
      </div>

      <p className="mt-4 text-[7.5px] leading-[1.5] text-[#6b7280]">
        Percentages are of total assets across all three categories. Liabilities
        are shown against Personal risk following the framework convention.
      </p>
    </ReportPage>
  );
}

function RiskSummary({
  label,
  pct,
  value,
  currency,
}: {
  label: string;
  pct: number;
  value: number;
  currency: string;
}) {
  return (
    <div>
      <div className="bg-[#eef1f4] px-2 py-1 text-[8px] font-bold uppercase text-[#4f565e]">
        {label}
      </div>

      <div className="mt-2 flex items-center justify-between text-[9px]">
        <span className="font-bold text-[#30343b]">{pct.toFixed(2)}%</span>

        <span className="font-bold text-[#30343b]">
          {formatMoney(value, currency)}
        </span>
      </div>
    </div>
  );
}

function CategoryRow({
  label,
  value,
  pct,
  currency,
}: {
  label: string;
  value: number;
  pct: number;
  currency: string;
}) {
  return (
    <div className="grid grid-cols-[55%_23%_22%] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px] text-[#30343b]">
      <span>{label}</span>

      <span>{formatMoney(value, currency)}</span>

      <span>{pct.toFixed(2)}%</span>
    </div>
  );
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
