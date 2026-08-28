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

export function RiskCategoriesPage({
  plan,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const personalRows: RiskRow[] = [];
  const marketRows: RiskRow[] = [];

  // -------------------------------------------------------
  // Assets
  // -------------------------------------------------------

  for (const asset of plan.assets) {
    const value = asset.value || 0;

    const text = [asset.type, asset.group, asset.label]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    // Personal assets
    if (
      text.includes("checking") ||
      text.includes("savings") ||
      text.includes("cash") ||
      text.includes("home") ||
      text.includes("real estate") ||
      text.includes("residence")
    ) {
      personalRows.push({
        label: asset.label || asset.type || "Asset",
        value,
      });

      continue;
    }

    // Aspirational / other assets are NOT part of the Market subtotal
    if (
      text.includes("other") ||
      text.includes("crypto") ||
      text.includes("private business") ||
      text.includes("concentrated") ||
      text.includes("stock option")
    ) {
      continue;
    }

    // Remaining investment accounts → Market
    marketRows.push({
      label: asset.label || asset.type || "Asset",
      value,
    });
  }

  // -------------------------------------------------------
  // Liabilities
  // -------------------------------------------------------

  for (const loan of plan.loans) {
    const value = loan.bal || 0;

    if (value <= 0) {
      continue;
    }

    const text = [loan.type, loan.label]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (text.includes("mortgage") || text.includes("home")) {
      personalRows.push({
        label: loan.label?.trim() || loan.type?.trim() || "Liability",
        value: -value,
      });
    } else {
      marketRows.push({
        label: loan.label?.trim() || loan.type?.trim() || "Liability",
        value: -value,
      });
    }
  }

  // -------------------------------------------------------
  // Holdings
  // -------------------------------------------------------

  for (const holding of plan.holdings ?? []) {
    marketRows.push({
      label: holding.ticker || holding.name || "Holding",
      value: holding.value || 0,
    });
  }

  const personalSubtotal = personalRows.reduce(
    (sum, row) => sum + row.value,
    0,
  );

  const marketSubtotal = marketRows.reduce((sum, row) => sum + row.value, 0);

  return (
    <ReportPage
      clientName={clientName}
      title="Overview: Risk Categories"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <p className="mt-4 max-w-[96%] text-[9px] leading-[1.55] text-[#4f565e]">
        Understanding the individual components of your total wealth — and the
        expected role each asset or liability plays — is critical to achieving
        your financial goals. Below, your own balance sheet is organized into
        the framework&apos;s risk categories, alongside the principal risks each
        category carries.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-7">
        <RiskCategoryBlock
          title="Personal Assets & Risks"
          rows={personalRows}
          subtotal={personalSubtotal}
          currency={plan.currency}
          risks="Death / disability · Outliving your assets (longevity) · Loss of purchasing power (inflation) · Loss of job · Catastrophic illness · Lawsuits & legal liabilities · Lack of liquidity."
        />

        <RiskCategoryBlock
          title="Market Assets & Risks"
          rows={marketRows}
          subtotal={marketSubtotal}
          currency={plan.currency}
          risks="Portfolio volatility · Sustained market downturn · Market shocks · geopolitical events · Sector & interest-rate conditions · Currency fluctuation · Higher taxation / change in tax laws."
        />
      </div>
    </ReportPage>
  );
}

function RiskCategoryBlock({
  title,
  rows,
  subtotal,
  currency,
  risks,
}: {
  title: string;
  rows: RiskRow[];
  subtotal: number;
  currency: string;
  risks: string;
}) {
  return (
    <div>
      <div className="border-l-[4px] border-[#0867b9] bg-[#dceaf7] px-3 py-2 text-[10px] font-bold uppercase text-[#173d60]">
        {title}
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-[1fr_95px] border-b border-[#d8dde3] pb-1 text-[8px] font-semibold text-[#6b7280]">
          <span>Your assets</span>
          <span className="text-right">Value</span>
        </div>

        <div className="mt-2">
          {rows.map((row, index) => (
            <div
              key={`${row.label}-${index}`}
              className="grid grid-cols-[1fr_95px] py-1.5 text-[8px]"
            >
              <span className="text-[#30343b]">{row.label}</span>

              <span className="text-right text-[#30343b]">
                {formatMoney(row.value, currency)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-[1fr_95px] border-t border-[#bfc7d1] pt-2 text-[8px] font-bold text-[#30343b]">
          <span>Subtotal</span>

          <span className="text-right">{formatMoney(subtotal, currency)}</span>
        </div>
      </div>

      <p className="mt-4 text-[8px] leading-[1.55] text-[#5f666d]">
        <strong className="text-[#30343b]">Key risks:</strong> {risks}
      </p>
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
