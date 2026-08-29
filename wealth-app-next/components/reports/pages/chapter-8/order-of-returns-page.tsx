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
    label: "Strong returns early",
    value: 1180000,
    color: "#0867b9",
  },
  {
    label: "Steady / average",
    value: 840000,
    color: "#0ea5a8",
  },
  {
    label: "Poor returns early",
    value: 430000,
    color: "#c8941f",
  },
];

export function OrderOfReturnsPage({
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
        Why the order of returns matters
      </div>

      <p className="mt-4 text-[9px] text-[#6b7280]">
        Same average return, $1M start, $50k/yr withdrawals — balance after 10
        years
      </p>

      <div className="mt-6 grid grid-cols-[58%_42%] gap-8">
        <div className="h-[255px]">
          <EducationBarChart items={chartItems} format="money" />
        </div>

        <div className="pt-2">
          <ul className="space-y-4 text-[9px] leading-[1.55] text-[#30343b]">
            <Bullet>
              Two portfolios can earn the same average return yet end far apart
              once withdrawals begin.
            </Bullet>

            <Bullet>
              A downturn in the first years of retirement does lasting damage —
              you sell more shares at low prices.
            </Bullet>

            <Bullet>
              A cash-and-bond buffer near retirement reduces the need to sell
              growth assets during a slump.
            </Bullet>
          </ul>
        </div>
      </div>

      <p className="mt-7 text-[7px] italic leading-[1.45] text-[#6b7280]">
        Hypothetical illustration. Both paths assume the same average annual
        return in a different order, with level $50,000 withdrawals from a
        $1,000,000 starting balance. Not a projection.
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
