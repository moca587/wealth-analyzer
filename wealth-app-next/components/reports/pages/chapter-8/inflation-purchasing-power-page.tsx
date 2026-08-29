"use client";

import { ReportPage } from "../../report-page";
import { InflationPurchasingPowerChart } from "../../charts/inflation-purchasing-power-chart";

type Props = {
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function InflationPurchasingPowerPage({
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
        What inflation does to your purchasing power
      </div>

      <p className="mt-4 text-[9px] text-[#6b7280]">
        What $100,000 still buys over time at 3% annual inflation
      </p>

      <div className="mt-6 grid grid-cols-[58%_42%] gap-8">
        <div className="h-[255px]">
          <InflationPurchasingPowerChart />
        </div>

        <div className="pt-2">
          <ul className="space-y-4 text-[9px] leading-[1.55] text-[#30343b]">
            <Bullet>
              At just 3% inflation, money loses roughly a quarter of its value
              every decade it sits idle.
            </Bullet>

            <Bullet>
              Across a 30-year retirement, today&apos;s $100,000 may buy closer
              to $40,000 worth of goods.
            </Bullet>

            <Bullet>
              Holding some growth assets helps your savings keep pace with
              steadily rising prices.
            </Bullet>
          </ul>
        </div>
      </div>

      <p className="mt-7 text-[7px] italic leading-[1.45] text-[#6b7280]">
        Illustrative purchasing power at a constant 3% annual inflation rate.
        Actual inflation varies year to year; figures are rounded and for
        education only.
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
