import type { AiPortfolioResult } from "@/lib/ai-portfolio/types";

type Props = {
  investmentAmount: number;
  recommendation: AiPortfolioResult;
};

export function AiPortfolioGrowthProjections({
  investmentAmount,
  recommendation,
}: Props) {
  const years = [1, 3, 5, 10];

  return (
    <section className={sectionClass}>
      <h2 className="text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]">
        What might your {formatMoney(investmentAmount)} grow into?
      </h2>

      <div className="mt-5 grid grid-cols-4 gap-4">
        {years.map((year) => {
          const value = calculateFutureValue(
            investmentAmount,
            recommendation.expectedReturnGross,
            year,
          );

          return (
            <div
              key={year}
              className="rounded-xl border border-[#e8edf4] bg-[#f8faff] p-5 text-center"
            >
              <div className="text-[11px] font-semibold text-[#64748b]">
                In {year} {year === 1 ? "year" : "years"}
              </div>

              <div className="mt-2 text-xl font-bold text-[#16213e]">
                {formatMoneyShort(value)}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[10px] italic leading-5 text-[#64748b]">
        ⚠ Projections assume your portfolio achieves its expected return every
        year. Real outcomes vary — markets go up and down.
      </p>
    </section>
  );
}

function calculateFutureValue(
  amount: number,
  annualReturnPct: number,
  years: number,
) {
  return amount * Math.pow(1 + annualReturnPct / 100, years);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMoneyShort(value: number) {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `$${Math.round(value / 1_000)}k`;
  }

  return formatMoney(value);
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass = "text-[13px] font-bold text-[#16213e]";
