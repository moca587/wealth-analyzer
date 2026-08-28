"use client";

import type { WealthPlan, SimulationResult } from "@/lib/engine/types";

import { ReportPage } from "../../report-page";

import {
  buildAnnualWealthRows,
  WealthRow,
} from "./annual-potential-wealth-page";

type Props = {
  plan: WealthPlan;
  result: SimulationResult;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function AnnualPotentialWealthContinuationPage({
  plan,
  result,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const rows = buildAnnualWealthRows(plan, result);

  const remainingRows = rows.slice(7);

  return (
    <ReportPage
      clientName={clientName}
      title="Annual Potential Wealth"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <div className="mt-5">
        <div className="grid grid-cols-[11%_10%_26%_26%_27%] bg-[#0867b9] px-3 py-2 text-[8px] font-bold text-white">
          <span>Year</span>
          <span>Age</span>
          <span>Conservative (80%)</span>
          <span>Expected (50%)</span>
          <span>Optimistic (30%)</span>
        </div>

        {remainingRows.map((row) => (
          <WealthRow key={row.year} row={row} currency={plan.currency} />
        ))}
      </div>
    </ReportPage>
  );
}
