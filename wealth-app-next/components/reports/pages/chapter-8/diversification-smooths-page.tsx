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
    label: "A single stock",
    value: 55,
    color: "#0867b9",
  },
  {
    label: "One sector",
    value: 42,
    color: "#0ea5a8",
  },
  {
    label: "All stocks (broad)",
    value: 37,
    color: "#c8941f",
  },
  {
    label: "Diversified 60/40",
    value: 24,
    color: "#00875a",
  },
];

export function DiversificationSmoothsPage({
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
        Why diversification smooths the ride
      </div>

      <p className="mt-4 text-[9px] text-[#6b7280]">
        Illustrative depth of the worst one-year decline, by how concentrated
        the portfolio is
      </p>

      <div className="mt-6 grid grid-cols-[58%_42%] gap-8">
        <div className="h-[255px]">
          <EducationBarChart items={chartItems} format="percent" />
        </div>

        <div className="pt-2">
          <ul className="space-y-4 text-[9px] leading-[1.55] text-[#30343b]">
            <Bullet>
              Concentrating in one stock or sector exposes you to losses a
              broader mix would have cushioned.
            </Bullet>

            <Bullet>
              Spreading across many holdings and asset classes narrows the range
              of outcomes.
            </Bullet>

            <Bullet>
              Diversification can lower risk without giving up most of the
              long-run return.
            </Bullet>
          </ul>
        </div>
      </div>

      <p className="mt-7 text-[7px] italic leading-[1.45] text-[#6b7280]">
        Hypothetical, illustrative decline magnitudes for educational purposes.
        Diversification does not ensure a profit or protect against loss in a
        falling market.
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
