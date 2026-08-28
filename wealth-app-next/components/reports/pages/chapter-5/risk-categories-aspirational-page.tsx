"use client";

import type { WealthPlan } from "@/lib/engine/types";

import { ReportPage } from "../../report-page";

type Props = {
  plan: WealthPlan;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

type RiskRow = {
  label: string;
  value: number;
};

export function RiskCategoriesAspirationalPage({
  plan,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  // -------------------------------------------------------
  // Aspirational assets
  // -------------------------------------------------------

  const aspirationalRows: RiskRow[] = [];

  for (const asset of plan.assets) {
    const value = asset.value || 0;

    if (value <= 0) {
      continue;
    }

    const text = [asset.type, asset.group, asset.label]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (
      text.includes("other") ||
      text.includes("crypto") ||
      text.includes("private business") ||
      text.includes("concentrated") ||
      text.includes("stock option")
    ) {
      aspirationalRows.push({
        label: asset.label || asset.type || "Asset",
        value,
      });
    }
  }

  const aspirationalSubtotal = aspirationalRows.reduce(
    (sum, row) => sum + row.value,
    0,
  );

  // -------------------------------------------------------
  // Net worth
  // -------------------------------------------------------

  const totalAssets = plan.assets.reduce(
    (sum, asset) => sum + (asset.value || 0),
    0,
  );

  const totalLiabilities = plan.loans.reduce(
    (sum, loan) => sum + (loan.bal || 0),
    0,
  );

  const totalNetWorth = totalAssets - totalLiabilities;

  return (
    <ReportPage
      clientName={clientName}
      title="Overview: Risk Categories"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      {/* Aspirational section */}
      <div className="mt-4">
        <div className="border-l-[4px] border-[#0867b9] bg-[#dceaf7] px-3 py-2 text-[10px] font-bold uppercase text-[#173d60]">
          Aspirational Assets & Risks
        </div>

        <div className="mt-4">
          <div className="grid grid-cols-[1fr_110px] border-b border-[#d8dde3] pb-1 text-[8px] font-semibold text-[#6b7280]">
            <span>Your assets</span>
            <span className="text-right">Value</span>
          </div>

          <div className="mt-2">
            {aspirationalRows.map((row, index) => (
              <div
                key={`${row.label}-${index}`}
                className="grid grid-cols-[1fr_110px] py-1.5 text-[8px]"
              >
                <span className="text-[#30343b]">{row.label}</span>

                <span className="text-right text-[#30343b]">
                  {formatMoney(row.value, plan.currency)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-[1fr_110px] border-t border-[#bfc7d1] pt-2 text-[8px] font-bold text-[#30343b]">
            <span>Subtotal</span>

            <span className="text-right">
              {formatMoney(aspirationalSubtotal, plan.currency)}
            </span>
          </div>
        </div>

        <p className="mt-4 text-[8px] leading-[1.55] text-[#5f666d]">
          <strong className="text-[#30343b]">Key risks:</strong> Asset
          concentration · Loss of principal · Lack of liquidity · Higher
          taxation / change in tax laws.
        </p>
      </div>

      {/* Total net worth */}
      <div className="mt-8">
        <div className="border-l-[4px] border-[#0867b9] bg-[#dceaf7] px-3 py-2 text-[10px] font-bold text-[#173d60]">
          Total Net Worth
        </div>

        <div className="mt-4">
          <div className="grid grid-cols-[70%_30%] bg-[#0867b9] px-3 py-2 text-[8px] font-bold text-white">
            <span>Amount</span>
            <span className="text-right">Value</span>
          </div>

          <div className="grid grid-cols-[70%_30%] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px]">
            <span className="font-semibold text-[#30343b]">
              Total net worth (all categories, net of liabilities)
            </span>

            <span className="text-right font-semibold text-[#30343b]">
              {formatMoney(totalNetWorth, plan.currency)}
            </span>
          </div>
        </div>
      </div>
    </ReportPage>
  );
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
