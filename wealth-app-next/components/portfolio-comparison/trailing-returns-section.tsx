import {
  formatPercent,
  formatSignedPercent,
  percentToneClass,
} from "@/lib/portfolio-comparison/format";

type ReturnHorizon = {
  oneYear?: number;
  threeYear?: number;
  fiveYear?: number;
  tenYear?: number;
};

type Props = {
  current?: ReturnHorizon;
  proposed?: ReturnHorizon;
  benchmark?: ReturnHorizon;

  benchmarkName?: string;
  benchmarkDescription?: string;
};

export function TrailingReturnsSection({
  current,
  proposed,
  benchmark,

  benchmarkName = "S&P 500 Index",

  benchmarkDescription =
    "Large-cap US equity benchmark.",
}: Props) {
  const difference =
    current && proposed
      ? {
          oneYear: differenceValue(
            proposed.oneYear,
            current.oneYear
          ),

          threeYear: differenceValue(
            proposed.threeYear,
            current.threeYear
          ),

          fiveYear: differenceValue(
            proposed.fiveYear,
            current.fiveYear
          ),

          tenYear: differenceValue(
            proposed.tenYear,
            current.tenYear
          ),
        }
      : undefined;

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Average Annualized Return
        1Y / 3Y / 5Y / 10Y — Detailed Table
      </h2>

      <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
        Average annualized return at each
        horizon. Uses actual trailing
        returns for individual holdings
        where available; otherwise the
        portfolio comparison engine can
        provide an estimated historical
        return for the asset-class mix.
      </p>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[rgba(0,87,184,.10)] bg-[#f8faff]">
              <th className={thClass}>
                Portfolio
              </th>

              <th className={numberThClass}>
                1 Year
              </th>

              <th className={numberThClass}>
                3 Years
              </th>

              <th className={numberThClass}>
                5 Years
              </th>

              <th className={numberThClass}>
                10 Years
              </th>
            </tr>
          </thead>

          <tbody>
            <ReturnRow
              name="Current Portfolio"
              sublabel="Per-holding trailing"
              values={current}
            />

            <ReturnRow
              name="Proposed Portfolio"
              sublabel="Per-holding trailing"
              values={proposed}
            />

            <ReturnRow
              name={benchmarkName}
              sublabel="Index reference"
              values={benchmark}
            />

            <ReturnRow
              name="Δ (Prop vs Cur)"
              sublabel="Outperformance"
              values={difference}
              difference
            />
          </tbody>
        </table>
      </div>

      <div className="mt-5 rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] px-4 py-3 text-[11px] leading-5 text-[#64748b]">
        <strong className="text-[#16213e]">
          Benchmark: {benchmarkName}
        </strong>

        {" — "}

        {benchmarkDescription}
      </div>
    </section>
  );
}

function ReturnRow({
  name,
  sublabel,
  values,
  difference = false,
}: {
  name: string;
  sublabel: string;
  values?: ReturnHorizon;
  difference?: boolean;
}) {
  return (
    <tr className="border-b border-[rgba(0,87,184,.07)] last:border-b-0">
      <td className={tdClass}>
        <div className="font-semibold text-[#16213e]">
          {name}
        </div>

        <div className="mt-0.5 text-[10px] text-[#9ca3af]">
          {sublabel}
        </div>
      </td>

      <ReturnCell
        value={values?.oneYear}
        difference={difference}
      />

      <ReturnCell
        value={values?.threeYear}
        difference={difference}
      />

      <ReturnCell
        value={values?.fiveYear}
        difference={difference}
      />

      <ReturnCell
        value={values?.tenYear}
        difference={difference}
      />
    </tr>
  );
}

function ReturnCell({
  value,
  difference,
}: {
  value?: number;
  difference: boolean;
}) {
  return (
    <td className={numberTdClass}>
      <span
        className={
          difference
            ? percentToneClass(value)
            : "font-semibold text-[#16213e]"
        }
      >
        {difference
          ? formatSignedPercent(value)
          : formatPercent(value)}
      </span>
    </td>
  );
}

function differenceValue(
  proposed: number | undefined,
  current: number | undefined
): number | undefined {
  if (
    proposed == null ||
    current == null
  ) {
    return undefined;
  }

  return proposed - current;
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const thClass =
  "px-3 py-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]";

const numberThClass =
  "px-3 py-2 text-right text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]";

const tdClass =
  "px-3 py-3 text-[11px]";

const numberTdClass =
  "px-3 py-3 text-right text-[11px] tabular-nums";