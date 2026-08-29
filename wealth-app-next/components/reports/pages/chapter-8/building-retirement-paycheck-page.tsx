"use client";

import { ReportPage } from "../../report-page";
import { RetirementPaycheckChart } from "../../charts/retirement-paycheck-chart";

type Props = {
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function BuildingRetirementPaycheckPage({
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
        Building your retirement paycheck
      </div>

      <p className="mt-4 text-[9px] text-[#6b7280]">
        Illustrative annual retirement income by source, for a sample household
      </p>

      <div className="mt-6 grid grid-cols-[58%_42%] gap-8">
        <div className="h-[270px]">
          <RetirementPaycheckChart />
        </div>

        <div className="pt-2">
          <ul className="space-y-4 text-[9px] leading-[1.55] text-[#30343b]">
            <Bullet>
              In retirement your salary is replaced by a paycheck assembled from
              several sources.
            </Bullet>

            <Bullet>
              Guaranteed income — state and workplace pensions — covers
              essentials; the portfolio funds the rest.
            </Bullet>

            <Bullet>
              Coordinating when to draw from each source can meaningfully extend
              how long your savings last.
            </Bullet>
          </ul>
        </div>
      </div>

      <p className="mt-7 text-[7px] italic leading-[1.45] text-[#6b7280]">
        Illustrative income mix for a sample household. Your own sources,
        amounts, and timing will differ; figures are for education only.
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
