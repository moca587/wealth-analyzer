import { ReportPage } from "../../report-page";

type Props = {
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function GoalFundingStreamsPage({
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  return (
    <ReportPage
      clientName={clientName}
      title="Key Factors: Goal Funding Status"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <p className="mt-3 max-w-[96%] text-[10px] leading-[1.6] text-[#5f666d]">
        Income and savings streams feeding the plan, as entered in the
        application. Salary grows with the assumed raise rate; pensions apply
        their own start age and indexation.
      </p>
    </ReportPage>
  );
}
