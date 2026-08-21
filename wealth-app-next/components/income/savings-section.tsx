import type { WealthPlan } from "@/lib/engine/types";
import { formatMoney } from "@/lib/engine/financial-math";

type Props = {
  plan: WealthPlan;
  update: (patch: Partial<WealthPlan>) => void;
};

export function SavingsSection({ plan, update }: Props) {
  const grossIncome = plan.incomes.reduce(
    (sum, income) => sum + income.amount,
    0,
  );

  const annualSavings = plan.annualSavings;

  const savingsRate = grossIncome > 0 ? (annualSavings / grossIncome) * 100 : 0;

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Annual Savings</h2>

      <p className="text-[12px] leading-5 text-[#64748b]">
        Committed annual contribution to investments. The simulation guarantees
        at least this amount is funneled into the investment portfolio each
        year.
      </p>

      {/* Annual savings input */}
      <div className="mt-5">
        <label>
          <span className={labelClass}>Annual savings ($/yr)</span>

          <input
            type="number"
            min={0}
            value={annualSavings}
            onChange={(e) =>
              update({
                annualSavings: Number(e.target.value),
              })
            }
            className={inputClass}
          />
        </label>
      </div>

      {/* Savings rate */}
      <div className="mt-5 rounded-xl bg-[#f8faff] p-5">
        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
          Savings rate & coverage
        </div>

        <div className="mt-1 text-[20px] font-bold text-[#16213e]">
          {formatMoney(annualSavings, plan.currency)}
          /yr{" "}
          <span className="text-[13px] font-medium text-[#64748b]">
            (savings rate {savingsRate.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* Gross income */}
      <div className="mt-5 rounded-xl bg-[#f8faff] p-5">
        <div className="text-[11px] text-[#64748b]">Gross household income</div>

        <div className="mt-1 text-[20px] font-bold text-[#16213e]">
          {formatMoney(grossIncome, plan.currency)}
        </div>
      </div>
    </section>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "mb-4 text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const labelClass = "mb-1.5 block text-[11px] font-semibold text-[#64748b]";

const inputClass =
  "w-full rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[13px] font-medium text-[#16213e] outline-none focus:border-[#0057b8]";
