import type { WealthPlan } from "@/lib/engine/types";
import {
  calcMortgagePayment,
  computeStateTax,
  estimateIncomeTax,
  formatMoney,
} from "@/lib/engine/financial-math";

type Props = {
  plan: WealthPlan;
  update: (patch: Partial<WealthPlan>) => void;
};

export function AnnualExpensesSection({ plan, update }: Props) {
  const living =
    plan.expenses.find((e) => e.name === "Living expenses")?.amount ?? 0;

  const insurance =
    plan.expenses.find((e) => e.name === "Insurance / health")?.amount ?? 0;

  const other =
    plan.expenses.find((e) => e.name === "Other expenses")?.amount ?? 0;

  const annualLiving = living * 12;
  const annualInsurance = insurance * 12;
  const annualOther = other * 12;

  const annualExpenses = annualLiving + annualInsurance + annualOther;

  const grossIncome = plan.incomes.reduce(
    (sum, income) => sum + income.amount,
    0,
  );

  const primaryClient = plan.clients[0];

  const federalTax = estimateIncomeTax(
    grossIncome,
    primaryClient?.country ?? "US",
  );

  const stateTax = computeStateTax(
    grossIncome,
    primaryClient?.country ?? "US",
    primaryClient?.state,
  );

  const totalTax = federalTax + stateTax;

  const debtService = plan.loans.reduce((sum, loan) => {
    const monthlyPayment = calcMortgagePayment(loan.bal, loan.rate, loan.yrs);

    return sum + monthlyPayment * 12;
  }, 0);

  const annualSurplus = grossIncome - totalTax - annualExpenses - debtService;

  function updateExpense(name: string, annualAmount: number) {
    const monthlyAmount = annualAmount / 12;

    const exists = plan.expenses.some((expense) => expense.name === name);

    const expenses = exists
      ? plan.expenses.map((expense) =>
          expense.name === name
            ? { ...expense, amount: monthlyAmount }
            : expense,
        )
      : [
          ...plan.expenses,
          {
            id: crypto.randomUUID(),
            name,
            amount: monthlyAmount,
          },
        ];

    update({ expenses });
  }

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Annual Household Expenses</h2>

      <p className="mb-5 text-[12px] leading-5 text-[#64748b]">
        Enter total annual spending for the entire family — combined across both
        clients, children, and all dependents living in the household.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <ExpenseField
          label="Living expenses (household)"
          value={annualLiving}
          onChange={(value) => updateExpense("Living expenses", value)}
        />

        <ExpenseField
          label="Insurance / health (household)"
          value={annualInsurance}
          onChange={(value) => updateExpense("Insurance / health", value)}
        />

        <ExpenseField
          label="Other expenses (household)"
          value={annualOther}
          onChange={(value) => updateExpense("Other expenses", value)}
        />
      </div>

      <div className="mt-5 rounded-xl bg-[#f8faff] p-5">
        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
          Total annual household expenses
        </div>

        <div className="mt-1 text-[24px] font-extrabold text-[#16213e]">
          {formatMoney(annualExpenses, plan.currency)} / yr
        </div>

        <div className="mt-1 text-[11px] text-[#9ca3af]">
          Updates as you type. Sum of all three categories above.
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-5">
        <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
          How these expenses connect to your income
        </h3>

        <SummaryRow
          label="Gross income / yr"
          value={formatMoney(grossIncome, plan.currency)}
        />

        <SummaryRow
          label="− Income tax"
          value={`−${formatMoney(totalTax, plan.currency)}`}
        />

        <SummaryRow
          label="− Total expenses"
          value={`−${formatMoney(annualExpenses, plan.currency)}`}
        />

        <SummaryRow
          label="− Debt service"
          value={`−${formatMoney(debtService, plan.currency)}`}
        />

        <div className="mt-3 border-t pt-3">
          <SummaryRow
            label="= Annual surplus"
            value={`${formatMoney(annualSurplus, plan.currency)} / yr`}
            strong
          />
        </div>

        <p className="mt-3 text-[11px] text-[#9ca3af]">
          This surplus feeds the savings panel on the Income tab and the
          simulation.
        </p>
      </div>
    </section>
  );
}

function ExpenseField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <span className={labelClass}>{label}</span>

      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={inputClass}
      />
    </label>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between py-1.5 text-[12px]">
      <span className={strong ? "font-bold text-[#16213e]" : "text-[#64748b]"}>
        {label}
      </span>

      <span
        className={
          strong ? "font-bold text-[#0057b8]" : "font-semibold text-[#16213e]"
        }
      >
        {value}
      </span>
    </div>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "mb-4 text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const labelClass = "mb-1.5 block text-[11px] font-semibold text-[#64748b]";

const inputClass =
  "w-full rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[13px] font-medium text-[#16213e] outline-none focus:border-[#0057b8] focus:ring-2 focus:ring-[rgba(0,87,184,.08)]";
