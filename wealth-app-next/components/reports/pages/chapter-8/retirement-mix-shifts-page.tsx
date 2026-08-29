"use client";

import { ReportPage } from "../../report-page";
import { RetirementMixChart } from "../../charts/retirement-mix-chart";

type Props = {
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function RetirementMixShiftsPage({
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
        How your mix shifts as you near retirement
      </div>

      <p className="mt-4 text-[9px] text-[#6b7280]">
        Illustrative growth-asset (stock) weighting across life stages
      </p>

      <div className="mt-6 grid grid-cols-[58%_42%] gap-8">
        <div className="h-[255px]">
          <RetirementMixChart />
        </div>

        <div className="pt-2">
          <ul className="space-y-4 text-[9px] leading-[1.55] text-[#30343b]">
            <Bullet>
              Early on, a long horizon lets the portfolio hold mostly growth
              assets and ride out volatility.
            </Bullet>

            <Bullet>
              As retirement nears, the mix gradually tilts toward bonds and cash
              to protect what you have built.
            </Bullet>

            <Bullet>
              The goal is to reduce exposure to a poorly-timed downturn just as
              withdrawals are about to begin.
            </Bullet>
          </ul>
        </div>
      </div>

      <p className="mt-7 text-[7px] italic leading-[1.45] text-[#6b7280]">
        Illustrative life-stage allocation for educational purposes. A personal
        allocation depends on your goals, resources, and tolerance for risk, and
        should be set with an advisor.
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
