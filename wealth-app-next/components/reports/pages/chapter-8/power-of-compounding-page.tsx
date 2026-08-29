"use client";

import { ReportPage } from "../../report-page";
import { CompoundingChart } from "../../charts/compounding-chart";

type Props = {
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function PowerOfCompoundingPage({
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
        The power of compounding
      </div>

      <p className="mt-4 text-[9px] text-[#6b7280]">
        Growth of $500 invested every month over 30 years
      </p>

      <div className="mt-6 grid grid-cols-[58%_42%] gap-8">
        <div className="h-[255px]">
          <CompoundingChart />
        </div>

        <div className="pt-2">
          <ul className="space-y-4 text-[9px] leading-[1.55] text-[#30343b]">
            <Bullet>
              Compounding accelerates over time — most of the growth arrives in
              the final years.
            </Bullet>

            <Bullet>
              A higher annual return compounds into a dramatically larger end
              result.
            </Bullet>

            <Bullet>
              Starting early and contributing consistently matters more than
              trying to time the market.
            </Bullet>
          </ul>
        </div>
      </div>

      <p className="mt-7 text-[7px] italic leading-[1.45] text-[#6b7280]">
        Illustrative only. Assumes level monthly contributions and full
        reinvestment; ignores taxes, fees, and withdrawals. Not a projection of
        any actual investment.
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
