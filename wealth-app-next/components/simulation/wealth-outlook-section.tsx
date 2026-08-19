import type { SimulationResult } from "@/lib/engine/types";

import { WealthProjectionChart } from "./wealth-projection-chart";

type Props = {
  result: SimulationResult;
  currency: string;
  startYear: number;
  startAge: number;
};

export function WealthOutlookSection({
  result,
  currency,
  startYear,
  startAge,
}: Props) {
  const endAge = startAge + result.years;

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>What Could Your Wealth Look Like?</h2>

      <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
        Your projected portfolio wealth from today until age{" "}
        <strong className="text-[#16213e]">{endAge}</strong>, in{" "}
        <strong className="text-[#16213e]">today&apos;s money</strong>{" "}
        (inflation-adjusted), at three likelihood levels —{" "}
        <strong className="text-[#16213e]">80%</strong> (conservative),{" "}
        <strong className="text-[#16213e]">50%</strong> (expected) and{" "}
        <strong className="text-[#16213e]">30%</strong> (optimistic).
      </p>

      <div className="mt-6">
        <WealthProjectionChart
          result={result}
          currency={currency}
          startYear={startYear}
          startAge={startAge}
        />
      </div>
    </section>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";
