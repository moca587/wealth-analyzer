"use client";

import type { Proposal } from "@/lib/orders/proposal";

import { formatMoney } from "@/lib/engine/financial-math";

import { ReportPage } from "../../report-page";

type Props = {
  proposal: Proposal;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function ProposedPortfolioPage({
  proposal,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const positions = proposal.positions ?? [];

  const totalAllocation = positions.reduce(
    (sum, position) => sum + (Number(position.weightPct) || 0),
    0,
  );

  const totalAllocatedAmount = positions.reduce((sum, position) => {
    const weight = Number(position.weightPct) || 0;

    return sum + proposal.targetAmount * (weight / 100);
  }, 0);

  const weightedYield =
    totalAllocation > 0
      ? positions.reduce((sum, position) => {
          const weight = Number(position.weightPct) || 0;

          const yieldPct = Number(position.yld) || 0;

          return sum + yieldPct * (weight / totalAllocation);
        }, 0)
      : 0;

  const weightedCost =
    totalAllocation > 0
      ? positions.reduce((sum, position) => {
          const weight = Number(position.weightPct) || 0;

          const expenseRatio = Number(position.er) || 0;

          return sum + expenseRatio * (weight / totalAllocation);
        }, 0)
      : 0;

  return (
    <ReportPage
      clientName={clientName}
      title="Proposed Portfolio"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <p className="mt-3 text-[10px] leading-[1.6] text-[#5f666d]">
        In plain terms: The portfolio we propose for you: the target holdings,
        how they divide across asset classes, and how that compares with what
        you hold today.
      </p>

      <div className="mt-6">
        <SectionTitle>Proposed holdings</SectionTitle>

        <div className="mt-4">
          {/* Header */}
          <div className="grid grid-cols-[20%_12%_18%_13%_15%_11%_11%] bg-[#0867b9] px-3 py-2 text-[8px] font-bold text-white">
            <span>Position</span>

            <span>Ticker</span>

            <span>Asset class</span>

            <span className="text-right">Allocation</span>

            <span className="text-right">Amount</span>

            <span className="text-right">Yield</span>

            <span className="text-right">Cost</span>
          </div>

          {/* Positions */}
          {positions.map((position) => {
            const weight = Number(position.weightPct) || 0;

            const amount = proposal.targetAmount * (weight / 100);

            const yieldPct = Number(position.yld);

            const costPct = Number(position.er);

            return (
              <div
                key={position.id}
                className="grid grid-cols-[20%_12%_18%_13%_15%_11%_11%] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px] text-[#30343b]"
              >
                <span>{position.name || position.ticker || "—"}</span>

                <span>{position.ticker || "—"}</span>

                <span>{formatAssetClass(position.cls)}</span>

                <span className="text-right">{weight.toFixed(1)}%</span>

                <span className="text-right">
                  {formatMoney(amount, proposal.currency)}
                </span>

                <span className="text-right">
                  {Number.isFinite(yieldPct) ? `${yieldPct.toFixed(2)}%` : "—"}
                </span>

                <span className="text-right">
                  {Number.isFinite(costPct) ? `${costPct.toFixed(2)}%` : "—"}
                </span>
              </div>
            );
          })}

          {/* Total */}
          <div className="grid grid-cols-[20%_12%_18%_13%_15%_11%_11%] border-b border-x border-[#d8dde3] bg-[#f8f9fb] px-3 py-2 text-[8px] font-bold text-[#30343b]">
            <span>Total</span>

            <span />

            <span />

            <span className="text-right">{totalAllocation.toFixed(1)}%</span>

            <span className="text-right">
              {formatMoney(totalAllocatedAmount, proposal.currency)}
            </span>

            <span className="text-right">{weightedYield.toFixed(2)}%</span>

            <span className="text-right">{weightedCost.toFixed(2)}%</span>
          </div>
        </div>

        {positions.length === 0 && (
          <p className="mt-4 text-[9px] italic text-[#8a9098]">
            No proposed positions have been added yet.
          </p>
        )}
      </div>
    </ReportPage>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-[3px] border-[#0867b9] bg-[#e7eff8] px-3 py-2 text-[10px] font-bold text-[#173d60]">
      {children}
    </div>
  );
}

function formatAssetClass(cls?: string) {
  switch (cls) {
    case "equity":
      return "Equity";

    case "fixed_income":
      return "Fixed Income";

    case "real_estate":
      return "Real Estate";

    case "commodity":
      return "Commodity";

    case "cash":
      return "Cash";

    case "alternative":
      return "Alternative";

    case "crypto":
      return "Crypto";

    case "mixed":
      return "Mixed";

    default:
      return cls
        ? cls.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
        : "Other";
  }
}
