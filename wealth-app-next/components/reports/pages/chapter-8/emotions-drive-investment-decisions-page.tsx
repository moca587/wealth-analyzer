"use client";

import { ReportPage } from "../../report-page";
import { InvestorEmotionCycleChart } from "../../charts/investor-emotion-cycle-chart";

type Props = {
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function EmotionsDriveInvestmentDecisionsPage({
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
        How emotions drive investment decisions
      </div>

      <p className="mt-4 text-[9px] text-[#6b7280]">
        The same market cycle, felt as a rollercoaster of emotion
      </p>

      <div className="mt-6 grid grid-cols-[58%_42%] gap-8">
        <div className="h-[255px]">
          <InvestorEmotionCycleChart />
        </div>

        <div className="pt-2">
          <ul className="space-y-4 text-[9px] leading-[1.55] text-[#30343b]">
            <Bullet>
              Confidence runs highest near market peaks — the point of greatest
              risk and lowest future return.
            </Bullet>

            <Bullet>
              Fear runs deepest near market lows — the point of greatest
              opportunity, just when selling feels safest.
            </Bullet>

            <Bullet>
              Acting on emotion tends to mean buying high and selling low; a
              written plan keeps you steady through both.
            </Bullet>
          </ul>
        </div>
      </div>

      <p className="mt-7 text-[7px] italic leading-[1.45] text-[#6b7280]">
        Conceptual illustration of a common investor sentiment cycle. Emotions,
        timing, and outcomes vary widely; shown for education only, not as a
        forecast of any market.
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
