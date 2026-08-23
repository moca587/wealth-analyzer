import type { ReportSettings } from "@/lib/report/report-settings";

type Props = {
  clientName: string;
  date: string;
  settings: ReportSettings;
};

export function CoverPage({ clientName, date, settings }: Props) {
  return (
    <section className="report-page relative mx-auto h-[210mm] w-[297mm] overflow-hidden bg-[#08285a] text-white shadow-xl print:shadow-none">
      {/* Lighter blue upper section */}
      <div className="absolute inset-x-0 top-0 h-[112mm] bg-[#10428a]" />

      {/* Main content */}
      <div className="relative z-10 flex h-full flex-col px-[22mm] py-[16mm]">
        {/* Branding */}
        <div>
          <div className="text-[11px] font-bold tracking-[0.18em] text-white">
            PRIVATE WEALTH INTELLIGENCE
          </div>

          <div className="mt-1 text-[8px] font-medium tracking-[0.28em] text-[#9bb5d4]">
            WEALTH PLANNING &amp; ADVISORY
          </div>
        </div>

        {/* Main title area */}
        <div className="mt-[43mm]">
          <div className="text-[9px] font-bold tracking-[0.32em] text-[#79b7ef]">
            ◆ FINANCIAL PLANNING REPORT
          </div>

          <h1 className="mt-3 text-[46px] font-bold leading-[1.05] tracking-[-0.02em] text-white">
            Personal Wealth <span className="text-[#70aef0]">Review</span>
          </h1>

          <div className="mt-7 h-[2px] w-[105px] bg-[#75b5e9]" />

          <p className="mt-4 text-[15px] italic leading-6 text-[#d5dce6]">
            A long-term roadmap for your household&apos;s wealth, portfolio, and
            goals.
          </p>
        </div>

        {/* Prepared for */}
        <div className="mt-auto">
          <div className="text-[8px] font-bold tracking-[0.34em] text-[#89a9cf]">
            PREPARED FOR
          </div>

          <div className="mt-2 text-[20px] font-medium text-white">
            {clientName}
          </div>

          {/* Bottom line / date / confidential */}
          <div className="mt-10 border-t border-[#274e7e] pt-3">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[8px] font-bold tracking-[0.34em] text-[#89a9cf]">
                  DATE
                </div>

                <div className="mt-1 text-[11px] italic text-[#7ba8da]">
                  {date}
                </div>
              </div>

              <div className="text-[8px] font-bold tracking-[0.34em] text-[#89a9cf]">
                CONFIDENTIAL
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
