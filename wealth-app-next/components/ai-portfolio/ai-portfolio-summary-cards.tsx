import type { AiPortfolioResult } from "@/lib/ai-portfolio/types";

type Props = {
  recommendation: AiPortfolioResult;
};

export function AiPortfolioSummaryCards({ recommendation }: Props) {
  return (
    <section className="rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]">
        Portfolio Overview
      </h3>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <StatCard
          label="Expected yearly return"
          value={`${recommendation.expectedReturnGross.toFixed(2)}%`}
          subtext={`Net: ${recommendation.expectedReturnNet.toFixed(2)}% after ${recommendation.feePct.toFixed(2)}% fee`}
        />

        <StatCard
          label="Expected volatility"
          value={`${recommendation.expectedVolatility.toFixed(1)}%`}
          subtext="Typical year-to-year swing"
        />

        <StatCard
          label="Funds in portfolio"
          value={String(recommendation.funds.length)}
          subtext="Diversified across asset classes"
        />
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="rounded-xl border border-[#e8edf4] bg-[#f8faff] p-5">
      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#94a3b8]">
        {label}
      </div>

      <div className="mt-2 text-[24px] font-extrabold text-[#16213e]">
        {value}
      </div>

      <div className="mt-1 text-[11px] leading-5 text-[#64748b]">{subtext}</div>
    </div>
  );
}
