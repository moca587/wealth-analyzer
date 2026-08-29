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
    label: "Average investor",
    value: 3.5,
    color: "#0867b9",
  },

  {
    label: "60/40 portfolio",
    value: 6.4,
    color: "#0ea5a8",
  },

  {
    label: "Broad stock index",
    value: 7.5,
    color: "#c8941f",
  },
];

export function BehaviourGapPage({
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
        The behaviour gap
      </div>

      <p className="mt-4 text-[9px] text-[#6b7280]">
        Illustrative 20-year annualised returns
      </p>

      <div className="mt-6 grid grid-cols-[58%_42%] gap-8">
        <div className="h-[255px]">
          <EducationBarChart items={chartItems} format="percent" />
        </div>

        <div className="pt-2">
          <ul className="space-y-4 text-[9px] leading-[1.55] text-[#30343b]">
            <Bullet>
              Emotional decisions — buying after gains, selling after losses —
              quietly erode returns.
            </Bullet>

            <Bullet>
              The gap between the average investor and the market is the cost of
              poor timing.
            </Bullet>

            <Bullet>
              A disciplined, rules-based plan helps close that gap over the long
              run.
            </Bullet>
          </ul>
        </div>
      </div>

      <p className="mt-7 text-[7px] italic leading-[1.45] text-[#6b7280]">
        Illustrative annualised returns for educational purposes. Actual
        investor results vary widely.
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
