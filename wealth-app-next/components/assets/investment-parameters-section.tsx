import type { WealthPlan } from "@/lib/engine/types";

type Props = {
  plan: WealthPlan;
  update: (patch: Partial<WealthPlan>) => void;
};

const RISK_ROWS = [
  ["Conservative", 4.5, 7],
  ["Moderately Conservative", 5.5, 9],
  ["Moderate (60/40)", 7.0, 12],
  ["Moderately Aggressive", 8.5, 15],
  ["Aggressive", 10.0, 18],
] as const;

const ASSET_CLASS_ROWS = [
  ["Equity", 8.0, 14],
  ["Fixed Income", 4.5, 5],
  ["Real Estate", 6.5, 11],
  ["Commodity", 5.5, 16],
  ["Alternative", 9.0, 18],
  ["Mixed / Balanced", 6.0, 9],
  ["Cash", 0, 0],
] as const;

export function InvestmentParametersSection({
  plan,
  update,
}: Props) {
  const returnMean = plan.returnMean ?? 0.07;
  const returnVolatility =
    plan.returnVolatility ?? 0.12;

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Investment Parameters
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className={labelClass}>
            Return mean %
          </span>

          <input
            type="number"
            step="0.5"
            value={Number((returnMean * 100).toFixed(2))}
            onChange={(e) =>
              update({
                returnMean:
                  Number(e.target.value) / 100,
              })
            }
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>
            Return volatility %
          </span>

          <input
            type="number"
            step="0.5"
            value={Number((returnVolatility * 100).toFixed(2))}
            onChange={(e) =>
              update({
                returnVolatility:
                  Number(e.target.value) / 100,
              })
            }
            className={inputClass}
          />
        </label>
      </div>

      <p className="my-5 text-[11px] italic leading-5 text-[#9ca3af]">
        Derived from the selected risk profiles and portfolio holdings
        when entered. Editable as a manual override only when no risk
        profile is chosen on the Household tab.
      </p>

      <AssumptionTable
        title="By risk profile"
        firstColumn="Profile"
        rows={RISK_ROWS}
      />

      <div className="mt-6">
        <AssumptionTable
          title="By asset class (portfolio weighted)"
          firstColumn="Asset class"
          rows={ASSET_CLASS_ROWS}
        />
      </div>

      <p className="mt-3 text-[10px] italic text-[#9ca3af]">
        Long-run historical approximations. The portfolio tab
        auto-weights these by holding value when positions are entered.
      </p>
    </section>
  );
}

function AssumptionTable({
  title,
  firstColumn,
  rows,
}: {
  title: string;
  firstColumn: string;
  rows: readonly (readonly [
    string,
    number,
    number
  ])[];
}) {
  return (
    <div>
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
        {title}
      </div>

      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="bg-[#f8faff]">
            <th className={thClass}>
              {firstColumn}
            </th>

            <th className={numberThClass}>
              Mean %
            </th>

            <th className={numberThClass}>
              Volatility %
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map(([name, mean, volatility]) => (
            <tr key={name}>
              <td className={tdClass}>
                {name}
              </td>

              <td className={numberTdClass}>
                {mean.toFixed(1)}
              </td>

              <td className={numberTdClass}>
                {volatility}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "mb-4 text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const labelClass =
  "mb-1.5 block text-[11px] font-semibold text-[#64748b]";

const inputClass =
  "w-full rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[13px] font-medium text-[#16213e] outline-none focus:border-[#0057b8]";

const thClass =
  "border border-[rgba(0,87,184,.10)] px-2 py-1.5 text-left font-semibold text-[#64748b]";

const numberThClass =
  "border border-[rgba(0,87,184,.10)] px-2 py-1.5 text-right font-semibold text-[#64748b]";

const tdClass =
  "border border-[rgba(0,87,184,.10)] px-2 py-1.5 text-[#16213e]";

const numberTdClass =
  "border border-[rgba(0,87,184,.10)] px-2 py-1.5 text-right tabular-nums text-[#16213e]";