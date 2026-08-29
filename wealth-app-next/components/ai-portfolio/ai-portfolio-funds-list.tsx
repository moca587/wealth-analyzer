import type { AiPortfolioFund } from "@/lib/ai-portfolio/types";

type Props = {
  funds: AiPortfolioFund[];
};

export function AiPortfolioFundsList({ funds }: Props) {
  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>The funds we picked for you</h2>

      <p className="mt-2 text-[11px] text-[#94a3b8]">
        Hover over any fund to see the reasoning and why it fits your profile.
      </p>

      <div className="mt-5 space-y-3">
        {funds.map((fund, index) => (
          <div
            key={fund.ticker}
            className="rounded-xl border border-[#e8edf4] bg-[#f8faff] p-5"
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <div className="text-sm font-bold text-[#16213e]">
                  {index + 1}. {fund.name}
                </div>

                <div className="mt-1 text-[11px] text-[#64748b]">
                  {fund.ticker} · {fund.provider}
                </div>

                <div className="mt-2 text-[11px] font-medium text-[#64748b]">
                  {fund.reasoning}
                  {fund.esg ? " · ESG" : ""}
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold text-[#16213e]">
                  {fund.weightPct.toFixed(1)}%
                </div>

                <div className="mt-1 text-[11px] text-[#64748b]">
                  {formatMoney(fund.amount)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";
