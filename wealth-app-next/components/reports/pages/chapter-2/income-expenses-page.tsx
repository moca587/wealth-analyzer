import type { WealthPlan } from "@/lib/engine/types";

import {
  formatMoney,
  estimateIncomeTax,
  calcMortgagePayment,
} from "@/lib/engine/financial-math";

import { ReportPage } from "../../report-page";

type Props = {
  plan: WealthPlan;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function IncomeExpensesPage({
  plan,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const annualIncome = plan.incomes.reduce(
    (sum, income) => sum + income.amount,
    0,
  );

  const taxableIncome = plan.incomes
    .filter((income) => income.taxable !== false)
    .reduce((sum, income) => sum + income.amount, 0);

  const incomeTax = estimateIncomeTax(
    taxableIncome,
    plan.clients[0]?.country ?? "US",
  );

  // ExpenseCategory.amount is monthly in WealthPlan.
  const annualLivingExpenses = plan.expenses.reduce(
    (sum, expense) => sum + expense.amount * 12,
    0,
  );

  const annualLoanPayments = plan.loans.reduce((sum, loan) => {
    if (loan.bal <= 0 || loan.yrs <= 0) {
      return sum;
    }

    return sum + calcMortgagePayment(loan.bal, loan.rate, loan.yrs) * 12;
  }, 0);

  const moneyOut = incomeTax + annualLivingExpenses + annualLoanPayments;
  const annualSurplus = annualIncome - moneyOut;

  const maxBar = Math.max(annualIncome, moneyOut, 1);

  console.log("INCOME EXPENSE DEBUG", {
    annualIncome,
    taxableIncome,
    incomeTax,
    annualLivingExpenses,
    annualLoanPayments,
    moneyOut,
    annualSurplus,
    annualSavings: plan.annualSavings,
    expenses: plan.expenses,
    loans: plan.loans,
  });

  return (
    <ReportPage
      clientName={clientName}
      title="Income & Expenses"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <p className="text-[11px] leading-5 text-[#6b7280]">
        In plain terms: What comes in each year, what goes out on living costs
        and obligations, and what is left over to save and invest toward your
        goals.
      </p>

      <div className="mt-6">
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7c828a]">
          Money In vs Money Out
        </div>

        <p className="mt-1 text-[10px] leading-4 text-[#7c828a]">
          What comes in vs what goes out each year. The difference is your
          surplus or shortfall.
        </p>

        <div className="mt-5 space-y-4">
          <MoneyBar
            label="Money in"
            value={annualIncome}
            max={maxBar}
            currency={plan.currency}
          />

          <MoneyBar
            label="Money out"
            value={moneyOut}
            max={maxBar}
            currency={plan.currency}
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <SummaryCard
            label="Money in"
            value={formatMoney(annualIncome, plan.currency)}
          />

          <SummaryCard
            label="Money out"
            value={formatMoney(moneyOut, plan.currency)}
          />

          <SummaryCard
            label={annualSurplus >= 0 ? "Surplus" : "Shortfall"}
            value={`${formatMoney(
              Math.abs(annualSurplus),
              plan.currency,
            )} / yr`}
          />
        </div>

        <p className="mt-3 text-[9px] leading-4 text-[#8a9098]">
          Money out covers living costs, loan payments and other annual
          obligations.
        </p>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-8 border-t border-[#d8dde3] pt-5">
        <div>
          <SectionTitle>Income</SectionTitle>

          <div className="mt-3 space-y-2">
            {plan.incomes.map((income) => (
              <MoneyLine
                key={income.id}
                label={income.source}
                value={formatMoney(income.amount, plan.currency)}
              />
            ))}

            <div className="mt-3 border-t border-[#d8dde3] pt-2">
              <MoneyLine
                label="Total household income"
                value={formatMoney(annualIncome, plan.currency)}
                strong
              />
            </div>
          </div>
        </div>

        <div>
          <SectionTitle>Expenses</SectionTitle>

          <div className="mt-3 space-y-2">
            {plan.expenses.map((expense) => (
              <MoneyLine
                key={expense.id}
                label={expense.name}
                value={formatMoney(expense.amount * 12, plan.currency)}
              />
            ))}

            <div className="mt-3 border-t border-[#d8dde3] pt-2">
              <MoneyLine
                label="Total annual expenses"
                value={formatMoney(annualLivingExpenses, plan.currency)}
                strong
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-7 rounded-lg bg-[#f3f8f5] px-5 py-4">
        <div className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#6d7770]">
          Annual surplus available to invest
        </div>

        <div className="mt-1 text-[20px] font-bold text-[#30343b]">
          {formatMoney(annualSurplus, plan.currency)}{" "}
          <span className="text-[11px] font-medium text-[#737a82]">/ yr</span>
        </div>

        <p className="mt-2 text-[9px] leading-4 text-[#737a82]">
          Of this, your plan sets aside{" "}
          <strong>{formatMoney(plan.annualSavings, plan.currency)}</strong> to
          savings each year.
        </p>

        <p className="mt-2 text-[9px] leading-4 text-[#737a82]">
          Surplus is what remains after living costs, loan repayments and other
          annual obligations — the money your plan puts to work toward your
          goals.
        </p>
      </div>
    </ReportPage>
  );
}

function MoneyBar({
  label,
  value,
  max,
  currency,
}: {
  label: string;
  value: number;
  max: number;
  currency: string;
}) {
  const width = max > 0 ? Math.max(2, Math.min(100, (value / max) * 100)) : 0;

  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px]">
        <span className="font-semibold text-[#30343b]">{label}</span>

        <span className="font-bold text-[#30343b]">
          {formatMoney(value, currency)}
        </span>
      </div>

      <div className="h-5 overflow-hidden rounded-sm bg-[#edf0f3]">
        <div
          className="h-full bg-[#0867b9]"
          style={{
            width: `${width}%`,
          }}
        />
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#f8f9fb] px-4 py-3">
      <div className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#7c828a]">
        {label}
      </div>

      <div className="mt-1 text-[13px] font-bold text-[#30343b]">{value}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#7c828a]">
      {children}
    </div>
  );
}

function MoneyLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 text-[10px]">
      <span className={strong ? "font-bold text-[#30343b]" : "text-[#6b7280]"}>
        {label}
      </span>

      <span
        className={
          strong ? "font-bold text-[#30343b]" : "font-medium text-[#30343b]"
        }
      >
        {value}
      </span>
    </div>
  );
}
