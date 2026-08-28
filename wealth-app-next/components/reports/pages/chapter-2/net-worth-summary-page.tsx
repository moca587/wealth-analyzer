"use client";

import type { WealthPlan } from "@/lib/engine/types";

import { ReportPage } from "../../report-page";

import { AssetsLiabilitiesChart } from "../../charts/assets-liabilities-chart";
import { AssetBreakdownChart } from "../../charts/asset-breakdown-chart";

type Props = {
  plan: WealthPlan;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function NetWorthSummaryPage({
  plan,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const totalAssets = plan.assets.reduce(
    (sum, asset) => sum + (asset.value || 0),
    0,
  );

  const totalLiabilities = plan.loans.reduce(
    (sum, loan) => sum + (loan.bal || 0),
    0,
  );

  const netWorth = totalAssets - totalLiabilities;

  let portfolioLiquid = 0;
  let retirementLocked = 0;
  let propertyRealEstate = 0;
  let otherInsurance = 0;

  for (const asset of plan.assets) {
    const value = asset.value || 0;

    const text = [asset.type, asset.group, asset.label]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (
      text.includes("401") ||
      text.includes("ira") ||
      text.includes("retirement") ||
      text.includes("locked")
    ) {
      retirementLocked += value;
      continue;
    }

    if (
      text.includes("property") ||
      text.includes("real estate") ||
      text.includes("home") ||
      text.includes("residence")
    ) {
      propertyRealEstate += value;
      continue;
    }

    if (
      text.includes("checking") ||
      text.includes("savings") ||
      text.includes("cash") ||
      text.includes("brokerage") ||
      text.includes("investment")
    ) {
      portfolioLiquid += value;
      continue;
    }

    otherInsurance += value;
  }

  const assetBreakdown = [
    {
      label: "Portfolio (liquid)",
      value: portfolioLiquid,
      color: "#12a7a5",
    },
    {
      label: "Retirement & locked",
      value: retirementLocked,
      color: "#1265bd",
    },
    {
      label: "Property / real estate",
      value: propertyRealEstate,
      color: "#7037e8",
    },
    {
      label: "Other & insurance",
      value: otherInsurance,
      color: "#7c8795",
    },
  ].filter((item) => item.value > 0);

  const liabilityBreakdown = plan.loans
    .filter((loan) => loan.bal > 0)
    .map((loan) => ({
      label: loan.label?.trim() || loan.type?.trim() || "Liability",
      value: loan.bal,
      color: "#ef7f1a",
    }));

  return (
    <ReportPage
      clientName={clientName}
      title="Net Worth Summary"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <p className="mt-3 max-w-[96%] text-[10px] leading-[1.55] text-[#5f666d]">
        A visual summary of your balance sheet. The bar chart compares total
        assets, total liabilities and the resulting net worth. The two pie
        charts break down what your assets are made of and where your debts sit,
        so you can see your biggest concentrations at a glance.
      </p>

      <div className="mt-6 grid grid-cols-[41%_59%] gap-8">
        {/* LEFT */}
        <div className="pt-1">
          <AssetsLiabilitiesChart
            assets={totalAssets}
            liabilities={totalLiabilities}
            netWorth={netWorth}
            currency={plan.currency}
          />
        </div>

        {/* RIGHT */}
        <div className="space-y-7">
          <BreakdownBlock
            title="Assets"
            items={assetBreakdown}
            currency={plan.currency}
          />

          <BreakdownBlock
            title="Liabilities"
            items={liabilityBreakdown}
            currency={plan.currency}
          />
        </div>
      </div>
    </ReportPage>
  );
}

type BreakdownItem = {
  label: string;
  value: number;
  color: string;
};

function BreakdownBlock({
  title,
  items,
  currency,
}: {
  title: string;
  items: BreakdownItem[];
  currency: string;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div>
      <div className="mb-2 text-[10px] font-bold text-[#173d60]">{title}</div>

      <div className="grid grid-cols-[135px_1fr] items-center gap-5">
        <div className="h-[120px] w-[120px]">
          <AssetBreakdownChart items={items} />
        </div>

        <div>
          <div className="grid grid-cols-[1fr_78px_34px] border-b border-[#d8dde3] pb-1 text-[7px] text-[#70777e]">
            <span />
            <span className="text-right">Amount</span>
            <span className="text-right">%</span>
          </div>

          <div className="mt-2 space-y-2">
            {items.map((item) => {
              const pct = total > 0 ? (item.value / total) * 100 : 0;

              return (
                <div
                  key={item.label}
                  className="grid grid-cols-[1fr_78px_34px] items-center text-[8px]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0"
                      style={{
                        backgroundColor: item.color,
                      }}
                    />

                    <span className="text-[#30343b]">{item.label}</span>
                  </div>

                  <span className="text-right text-[#30343b]">
                    {formatMoney(item.value, currency)}
                  </span>

                  <span className="text-right text-[#6b7280]">
                    {Math.round(pct)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
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
