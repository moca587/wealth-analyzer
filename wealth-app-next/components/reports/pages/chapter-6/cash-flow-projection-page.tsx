"use client";

import type { WealthPlan } from "@/lib/engine/types";

import { ReportPage } from "../../report-page";

import {
  NetWorthComponentsChart,
  type CashFlowProjectionRow,
} from "../../charts/net-worth-components-chart";

type Props = {
  plan: WealthPlan;
  rows: CashFlowProjectionRow[];
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function CashFlowProjectionPage({
  plan,
  rows,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  // Page 41: first 10 years
  const pageRows = rows.slice(0, 10);

  return (
    <ReportPage
      clientName={clientName}
      title="Cash-Flow Projection"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <p className="mt-3 text-[8px] italic leading-[1.45] text-[#6b7280]">
        In plain terms: Your financial life, year by year: income while you
        work, pensions and withdrawals after you retire, and what each year adds
        to — or takes from — your wealth.
      </p>

      <div className="mt-4 border-l-[4px] border-[#0867b9] bg-[#dceaf7] px-3 py-2 text-[10px] font-bold text-[#173d60]">
        Net Worth by Component
      </div>

      <p className="mt-2 text-[7.5px] leading-[1.45] text-[#5f666d]">
        How total household net worth builds over time by source — cash,
        investments, the retirement pool and property — with liabilities netted
        out. The dark line is net worth.
      </p>

      {/* Fixed height keeps chart inside report page */}
      <div className="mt-3 h-[190px]">
        <NetWorthComponentsChart rows={rows} currency={plan.currency} />
      </div>

      <div className="mt-3">
        <CashFlowTableHeader />

        {pageRows.map((row) => (
          <CashFlowTableRow key={row.year} row={row} currency={plan.currency} />
        ))}
      </div>
    </ReportPage>
  );
}

export function CashFlowTableHeader() {
  return (
    <div className="grid grid-cols-[5%_4%_7%_8%_9%_7%_7%_7%_7%_7%_7%_7%_7%_8%] bg-[#1682bd] px-1 py-1.5 text-[5.5px] font-bold leading-tight text-white">
      <span>Year</span>
      <span>Age</span>
      <span>Phase</span>
      <span>Earned income</span>
      <span>Pension / SS / RMD</span>
      <span>Expenses</span>
      <span>Debt service</span>
      <span>Savings target</span>
      <span>Surplus</span>
      <span>Goal outflow</span>
      <span>Cash</span>
      <span>Investments</span>
      <span>Ret. pool</span>
      <span>Net worth / Notes</span>
    </div>
  );
}

export function CashFlowTableRow({
  row,
  currency,
}: {
  row: CashFlowProjectionRow;
  currency: string;
}) {
  return (
    <div className="grid grid-cols-[5%_4%_7%_8%_9%_7%_7%_7%_7%_7%_7%_7%_7%_8%] border-b border-x border-[#e1e5ea] px-1 py-[3px] text-[5.5px] leading-tight text-[#30343b]">
      <span>{row.year}</span>
      <span>{row.age ?? "—"}</span>
      <span>{row.phase}</span>

      <span>{shortMoney(row.earnedIncome, currency)}</span>
      <span>{shortMoney(row.pensionIncome, currency)}</span>
      <span>{shortMoney(row.expenses, currency)}</span>
      <span>{shortMoney(row.debtService, currency)}</span>
      <span>{shortMoney(row.savingsTarget, currency)}</span>
      <span>{shortMoney(row.surplus, currency)}</span>
      <span>{shortMoney(row.goalOutflow, currency)}</span>
      <span>{shortMoney(row.cash, currency)}</span>
      <span>{shortMoney(row.investments, currency)}</span>
      <span>{shortMoney(row.retirementPool, currency)}</span>

      <span>
        {shortMoney(row.netWorth, currency)}
        {row.notes ? ` · ${row.notes}` : ""}
      </span>
    </div>
  );
}

function shortMoney(value: number, currency: string) {
  if (Math.abs(value) < 0.5) {
    return "$0";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(value);
}
