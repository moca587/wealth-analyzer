import type { WealthPlan } from "@/lib/engine/types";

import { buildRequiredMinimumWithdrawals } from "@/lib/engine/required-minimum-withdrawals";

import { formatMoney } from "@/lib/engine/financial-math";

type Props = {
  plan: WealthPlan;
};

export function RequiredMinimumWithdrawalsSection({ plan }: Props) {
  const projection = buildRequiredMinimumWithdrawals(plan); // whole projection to age 90

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Required Minimum Withdrawals</h2>

      <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
        Many countries force a minimum annual withdrawal from tax-deferred
        retirement accounts once you reach a set age. This projects that
        mandatory schedule from your retirement pool and estimates the tax it
        triggers.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <SummaryCard label="Rule" value={projection.rule} />

        <SummaryCard
          label="Starts at age"
          value={String(projection.startAge)}
        />

        <SummaryCard
          label="Total required (to 90)"
          value={formatMoney(projection.totalRequired, plan.currency)}
        />

        <SummaryCard
          label="Est. tax on withdrawals"
          value={formatMoney(projection.estimatedTax, plan.currency)}
        />
      </div>

      <p className="mt-5 text-[11px] leading-5 text-[#64748b]">
        Retirement pool projected at 3.5% per year. Withdrawal tax is currently
        estimated using a simplified 22% effective rate. Illustrative only — not
        tax advice.
      </p>

      <div className="mt-5 overflow-x-auto rounded-xl border border-[rgba(0,87,184,.08)]">
        <table className="w-full border-collapse text-[12px]">
          <thead className="bg-[#f8faff]">
            <tr>
              <th className={thClass}>Age</th>

              <th className={thClass}>Year</th>

              <th className={numberThClass}>Pool (start)</th>

              <th className={numberThClass}>Required %</th>

              <th className={numberThClass}>Withdrawal</th>

              <th className={numberThClass}>Est. tax</th>

              <th className={numberThClass}>Pool (end)</th>
            </tr>
          </thead>

          <tbody>
            {projection.rows.map((row) => (
              <tr key={row.age}>
                <td className={tdClass}>{row.age}</td>

                <td className={tdClass}>{row.year}</td>

                <td className={numberTdClass}>
                  {formatMoney(row.poolStart, plan.currency)}
                </td>

                <td className={numberTdClass}>
                  {(row.requiredRate * 100).toFixed(2)}%
                </td>

                <td className={numberTdClass}>
                  {formatMoney(row.withdrawal, plan.currency)}
                </td>

                <td className={numberTdClass}>
                  {formatMoney(row.estimatedTax, plan.currency)}
                </td>

                <td className={numberTdClass}>
                  {formatMoney(row.poolEnd, plan.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]">
        {label}
      </div>

      <div className="mt-2 text-[18px] font-extrabold text-[#16213e]">
        {value}
      </div>
    </div>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const thClass =
  "border-b border-[rgba(0,87,184,.10)] px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.05em] text-[#64748b]";

const numberThClass =
  "border-b border-[rgba(0,87,184,.10)] px-3 py-2 text-right text-[10px] font-bold uppercase tracking-[0.05em] text-[#64748b]";

const tdClass = "border-b border-[rgba(0,87,184,.06)] px-3 py-2 text-[#16213e]";

const numberTdClass =
  "border-b border-[rgba(0,87,184,.06)] px-3 py-2 text-right tabular-nums text-[#16213e]";
