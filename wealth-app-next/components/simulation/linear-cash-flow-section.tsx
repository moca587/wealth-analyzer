"use client";

import type { WealthPlan } from "@/lib/engine/types";
import { buildLinearCashFlow } from "@/lib/engine/linear-cash-flow";
import { formatMoney } from "@/lib/engine/financial-math";

type Props = {
  plan: WealthPlan;
};

export function LinearCashFlowSection({ plan }: Props) {
  const result = buildLinearCashFlow(plan, {
    endAge: plan.retirement?.planToAge ?? 90,

    annualSavingsTarget: plan.annualSavings,

    retirementPoolGrowth: 0.035,

    cashSurplusShare: 0.3, // 30% of leftover positive cash flow is kept in cash
  });

  return (
    <section className="rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]">
          Linear Cash Flow Analysis
        </h2>

        <div className="mt-2 text-[12px] text-[#64748b]">
          Deterministic projection — age {result.startAge} to {result.endAge} (
          {result.rows.length} years)
        </div>
      </div>

      {/* Projection assumptions */}
      <div className="mb-5 rounded-xl bg-[#f8faff] p-4 text-[11px] leading-5 text-[#64748b]">
        Investment return:{" "}
        <strong className="text-[#16213e]">
          {(result.investmentReturn * 100).toFixed(1)}%/yr
        </strong>
        {" • "}
        Holdings-weighted mean:{" "}
        <strong className="text-[#16213e]">
          {(result.portfolioMean * 100).toFixed(1)}%
        </strong>
        {" • "}
        Volatility:{" "}
        <strong className="text-[#16213e]">
          {(result.portfolioSigma * 100).toFixed(1)}%
        </strong>
        {" • "}
        Property:{" "}
        <strong className="text-[#16213e]">
          {(result.propertyGrowth * 100).toFixed(1)}%/yr
        </strong>
        {" • "}
        Retirement pool:{" "}
        <strong className="text-[#16213e]">
          {(result.retirementPoolGrowth * 100).toFixed(1)}%/yr
        </strong>
      </div>

      {/* Cash-flow table */}
      <div className="overflow-x-auto">
        <table className="min-w-[1500px] w-full border-collapse text-left text-[11px]">
          <thead>
            <tr className="border-b bg-[#f8faff] text-[10px] uppercase tracking-[0.05em] text-[#64748b]">
              <th className={thClass}>Year</th>
              <th className={thClass}>Age</th>
              <th className={thClass}>Phase</th>
              <th className={numberThClass}>Earned income</th>
              <th className={numberThClass}>Pension / SS / RMD</th>
              <th className={numberThClass}>Income tax</th>
              <th className={numberThClass}>Expenses</th>
              <th className={numberThClass}>Debt service</th>
              <th className={numberThClass}>Savings target</th>
              <th className={numberThClass}>Surplus / Deficit</th>
              <th className={numberThClass}>Goal outflow</th>
              <th className={numberThClass}>Cash</th>
              <th className={numberThClass}>Investments</th>
              <th className={numberThClass}>Ret. pool</th>
              <th className={numberThClass}>Net worth</th>
              <th className={thClass}>Notes</th>
            </tr>
          </thead>

          <tbody>
            {result.rows.map((row) => (
              <tr
                key={row.year}
                className="border-b border-[rgba(0,87,184,.06)]"
              >
                <td className={tdClass}>{row.year}</td>

                <td className={tdClass}>{row.age}</td>

                <td className={tdClass}>{row.phase}</td>

                <MoneyCell value={row.earnedIncome} currency={plan.currency} />

                <MoneyCell
                  value={row.pensionRmdIncome}
                  currency={plan.currency}
                />

                <MoneyCell value={row.incomeTax} currency={plan.currency} />

                <MoneyCell value={row.expenses} currency={plan.currency} />

                <MoneyCell value={row.debtService} currency={plan.currency} />

                <MoneyCell value={row.savingsTarget} currency={plan.currency} />

                <MoneyCell
                  value={row.surplusDeficit}
                  currency={plan.currency}
                />

                <MoneyCell value={row.goalOutflow} currency={plan.currency} />

                <MoneyCell value={row.cash} currency={plan.currency} />

                <MoneyCell value={row.investments} currency={plan.currency} />

                <MoneyCell
                  value={row.retirementPool}
                  currency={plan.currency}
                />

                <td className={`${numberTdClass} font-bold`}>
                  {formatMoney(row.netWorth, plan.currency)}
                </td>

                <td className={tdClass}>{row.notes.join(" • ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[11px] leading-5 text-[#9ca3af]">
        Deterministic projection using the household&apos;s expected portfolio
        return. Deficits drain cash first, then investments. Retirement-account
        withdrawals and mandatory distributions are included where applicable.
      </p>
    </section>
  );
}

function MoneyCell({ value, currency }: { value: number; currency: string }) {
  return (
    <td className={numberTdClass}>
      {Math.abs(value) < 0.005 ? "—" : formatMoney(value, currency)}
    </td>
  );
}

const thClass = "px-3 py-2 font-bold whitespace-nowrap";

const numberThClass = "px-3 py-2 text-right font-bold whitespace-nowrap";

const tdClass = "px-3 py-2 text-[#64748b] whitespace-nowrap";

const numberTdClass =
  "px-3 py-2 text-right tabular-nums text-[#16213e] whitespace-nowrap";
