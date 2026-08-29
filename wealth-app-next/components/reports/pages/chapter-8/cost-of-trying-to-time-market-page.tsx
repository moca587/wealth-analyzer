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
    label: "Fully invested",
    value: 32400,
    color: "#0867b9",
  },

  {
    label: "Missed 10 best days",
    value: 16200,
    color: "#0ea5a8",
  },

  {
    label: "Missed 20 best days",
    value: 9900,
    color: "#c8941f",
  },

  {
    label: "Missed 30 best days",
    value: 6400,
    color: "#00875a",
  },
];

export function CostOfTryingToTimeMarketPage({
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
        The cost of trying to time the market
      </div>

      <p className="mt-4 text-[9px] text-[#6b7280]">
        Hypothetical $10,000 in a broad stock index over 20 years
      </p>

      <div className="mt-6 grid grid-cols-[58%_42%] gap-8">
        <div className="h-[255px]">
          <EducationBarChart items={chartItems} format="money" />
        </div>

        <div className="pt-2">
          <ul className="space-y-4 text-[9px] leading-[1.55] text-[#30343b]">
            <Bullet>
              The market&apos;s best days often occur close to its worst days,
              in the middle of volatility.
            </Bullet>

            <Bullet>
              Missing only a handful of the strongest days can cut the end
              result roughly in half.
            </Bullet>

            <Bullet>
              Historically, staying invested has beaten attempts to move in and
              out of the market.
            </Bullet>
          </ul>
        </div>
      </div>

      <p className="mt-7 text-[7px] italic leading-[1.45] text-[#6b7280]">
        Hypothetical, illustrative figures reflecting long-run U.S. equity index
        behaviour. Past performance is no guarantee of future results; an
        investor cannot invest directly in an index.
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
