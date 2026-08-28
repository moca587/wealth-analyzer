import type { SimulationResult } from "@/lib/engine/types";
import { formatMoney } from "@/lib/engine/financial-math";

type Props = {
  result: SimulationResult;
  currency: string;

  startYear: number;
  startAge: number;

  // displayYears: number;

  step?: number;
};

export function AnnualWealthSection({
  result,
  currency,
  startYear,
  startAge,
  // displayYears,
  step = 5,
}: Props) {
  const p80 = result.realPercentiles["p80"] ?? [];

  const p50 = result.realPercentiles["p50"] ?? [];

  const p30 = result.realPercentiles["p30"] ?? [];

  const rows = Array.from(
    {
      length: result.years,
    },
    (_, index) => ({
      index,

      year: startYear + index,

      age: startAge + index,

      p80: p80[index],

      p50: p50[index],

      p30: p30[index],
    }),
  ).filter(
    (row) =>
      row.index === 0 ||
      row.index % step === 0 ||
      row.index === result.years - 1,
  );

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Annual Potential Wealth — to Age 90</h2>

      <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
        Projected portfolio value each year from today until age 90
        (today&apos;s money), at <strong className="text-[#16213e]">80%</strong>
        {" / "}
        <strong className="text-[#16213e]">50%</strong>
        {" / "}
        <strong className="text-[#16213e]">30%</strong> likelihood — the data
        behind the chart above.
      </p>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[rgba(0,87,184,.10)] bg-[#f8faff]">
              <th className={thClass}>Year</th>

              <th className={numberThClass}>Age</th>

              <th className={numberThClass}>80%</th>

              <th className={numberThClass}>50%</th>

              <th className={numberThClass}>30%</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr
                key={row.index}
                className="border-b border-[rgba(0,87,184,.07)] last:border-b-0"
              >
                <td className={tdClass}>{row.year}</td>

                <td className={numberTdClass}>{row.age}</td>

                <td className={numberTdClass}>
                  {formatValue(row.p80, currency)}
                </td>

                <td className={`${numberTdClass} font-bold text-[#16213e]`}>
                  {formatValue(row.p50, currency)}
                </td>

                <td className={numberTdClass}>
                  {formatValue(row.p30, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatValue(value: number | undefined, currency: string): string {
  if (value == null) {
    return "—";
  }

  return formatMoney(value, currency);
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const thClass =
  "px-3 py-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]";

const numberThClass =
  "px-3 py-2 text-right text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]";

const tdClass = "px-3 py-3 text-[11px] text-[#16213e]";

const numberTdClass =
  "px-3 py-3 text-right text-[11px] tabular-nums text-[#64748b]";
