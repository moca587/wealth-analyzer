"use client";

import { ReportPage } from "../../report-page";
import { EducationBarChart } from "../../charts/education-bar-chart";

type Props = {
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

const chartItems = [
  {
    label: "Begin at 25",
    value: 1312407,
    color: "#0867b9",
  },
  {
    label: "Begin at 35",
    value: 609985,
    color: "#0ea5a8",
  },
  {
    label: "Begin at 45",
    value: 260463,
    color: "#c8941f",
  },
  {
    label: "Begin at 55",
    value: 86542,
    color: "#00875a",
  },
];

export function CostOfWaitingToStartPage({
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  return (
    <ReportPage
      clientName={clientName}
      title="Investor Education"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <div className="mt-3 border-l-[4px] border-[#0867b9] bg-[#dceaf7] px-3 py-2 text-[13px] font-bold text-[#173d60]">
        The cost of waiting to start
      </div>

      <p className="mt-4 text-[9px] text-[#6b7280]">
        Portfolio at age 65 from $500 invested monthly at 7% — by the age you
        begin
      </p>

      <div className="mt-6 grid grid-cols-[58%_42%] gap-8">
        <div className="h-[255px]">
          <EducationBarChart items={chartItems} format="money" />
        </div>

        <div className="pt-2">
          <ul className="space-y-4 text-[9px] leading-[1.55] text-[#30343b]">
            <Bullet>
              Begin at 25 instead of 35 and the end result more than doubles —
              the extra decade does most of the work.
            </Bullet>

            <Bullet>
              Each ten-year delay roughly halves the final balance, even with
              the same monthly contribution.
            </Bullet>

            <Bullet>
              Time in the market, not the size of any single deposit, is the
              most powerful lever you control.
            </Bullet>
          </ul>
        </div>
      </div>

      <p className="mt-7 text-[7px] italic leading-[1.45] text-[#6b7280]">
        Illustrative only. Assumes a level $500 monthly contribution earning 7%
        annually until age 65, with full reinvestment and no taxes, fees, or
        withdrawals. Not a projection of any actual investment.
      </p>
    </ReportPage>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-[5px] h-[5px] w-[5px] shrink-0 rounded-full bg-[#0867b9]" />
      <span>{children}</span>
    </li>
  );
}
