"use client";

import type { WealthPlan } from "@/lib/engine/types";

import { ReportPage } from "../../report-page";

import type { CashFlowProjectionRow } from "../../charts/net-worth-components-chart";

import {
  CashFlowTableHeader,
  CashFlowTableRow,
} from "./cash-flow-projection-page";

type Props = {
  plan: WealthPlan;
  rows: CashFlowProjectionRow[];

  startIndex: number;
  endIndex?: number;

  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function CashFlowProjectionContinuationPage({
  plan,
  rows,
  startIndex,
  endIndex,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const pageRows = rows.slice(startIndex, endIndex);

  return (
    <ReportPage
      clientName={clientName}
      title="Cash-Flow Projection"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <div className="mt-5">
        <CashFlowTableHeader />

        {pageRows.map((row) => (
          <CashFlowTableRow key={row.year} row={row} currency={plan.currency} />
        ))}
      </div>
    </ReportPage>
  );
}
