import type { WealthPlan } from "@/lib/engine/types";

export function SavingsSection({
  plan,
}: {
  plan: WealthPlan;
}) {
  const grossIncome = plan.incomes.reduce(
    (sum, income) => sum + income.amount,
    0
  );

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Annual Savings</h2>

      <p className="text-[12px] leading-5 text-[#64748b]">
        Committed annual contribution to investments. The simulation
        guarantees at least this amount is funneled into the investment
        portfolio each year.
      </p>

      <div className="mt-5 rounded-xl bg-[#f8faff] p-5">
        <div className="text-[11px] text-[#64748b]">
          Gross household income
        </div>

        <div className="mt-1 text-[20px] font-bold text-[#16213e]">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: plan.currency,
            maximumFractionDigits: 0,
          }).format(grossIncome)}
        </div>
      </div>
    </section>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "mb-4 text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";