import { ReportPage } from "../../report-page";

type Props = {
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function RetirementDividerPage({
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  return (
    <ReportPage
      clientName={clientName}
      title="Retirement"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <div className="flex min-h-[560px] flex-col justify-center">
        <div className="text-[56px] font-light leading-none text-[#0867b9]">
          6
        </div>

        <h1 className="mt-4 text-[30px] font-bold text-[#16213e]">
          Retirement
        </h1>

        <div className="mt-5 h-[3px] w-16 bg-[#0867b9]" />

        <p className="mt-7 max-w-[620px] text-[13px] leading-[1.75] text-[#4f565e]">
          What retirement could look like in numbers: your projected wealth to
          age 90 across many simulated futures, the year-by-year figures behind
          that chart, your cash flow over time, the pensions your plan counts on
          — including the Swiss pillar choices where they apply — and the
          what-if scenarios you asked us to test.
        </p>
      </div>
    </ReportPage>
  );
}
