import { ReportPage } from "../report-page";

type Props = {
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

const contents = [
  ["CHAPTER 1", "How to Read This Report", "3"],
  ["01", "How to Read This Report", "3"],

  ["CHAPTER 2", "Where You Stand Today", "4"],
  ["02", "Household Profile", "5"],
  ["03", "Executive Summary: Key Findings", "6"],
  ["04", "Income & Expenses", "7"],
  ["05", "Net Worth Statement", "8"],

  ["CHAPTER 3", "Your Goals & Retirement Plan", "10"],
  ["06", "Goals & Retirement Plan", "11"],
  ["07", "Plan Strategies", "13"],

  ["CHAPTER 4", "What the Future May Hold", "14"],
  ["08", "Goal Success Probability", "15"],
  ["09", "Key Factors: Goal Funding Status", "16"],
  ["10", "Potentially Achievable Lifestyle", "18"],

  ["CHAPTER 5", "Your Investments", "19"],
  ["11", "Investment Policy Statement", "20"],
  ["12", "Portfolio Analysis", "25"],
  ["13", "A View of Your Total Portfolio", "27"],
  ["14", "Evaluating Portfolio Efficiency", "28"],
  ["15", "Asset Class & Allocation Performance", "29"],
  ["16", "Overview: Wealth Allocation Framework", "30"],
  ["17", "Overview: Risk Categories", "31"],
  ["18", "Wealth & Risk Allocation: Current Status", "33"],

  ["CHAPTER 6", "Retirement", "34"],
  ["19", "What Could Your Wealth Look Like", "35"],
  ["20", "Annual Potential Wealth", "37"],
  ["21", "Cash-Flow Projection", "39"],
  ["22", "Retirement Pensions", "42"],

  ["CHAPTER 7", "Appendix", "43"],
  ["23", "Capital Market Assumptions", "44"],
  ["24", "Methodology & Assumptions", "45"],
  ["25", "Glossary of Terms", "46"],
  ["26", "Disclosures", "48"],
];

export function ContentsPage({ clientName, date, page, totalPages }: Props) {
  return (
    <ReportPage
      clientName={clientName}
      title="Contents"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <p className="mt-1 text-[9.5px] leading-5 text-[#6b7280]">
        What this report covers, chapter by chapter, with page numbers.
      </p>

      <div className="mt-3 space-y-[1px]">
        {" "}
        {contents.map(([number, title, pageNumber], index) => {
          const chapter = number.startsWith("CHAPTER");

          return (
            <div
              key={`${number}-${title}-${index}`}
              className={
                chapter
                  ? "mt-1.5 grid grid-cols-[92px_1fr_24px] items-baseline border-t border-[#d7dce2] pt-1.5"
                  : "grid grid-cols-[92px_1fr_24px] items-baseline"
              }
            >
              <div
                className={
                  chapter
                    ? "text-[9px] font-bold uppercase tracking-[0.07em] text-[#0867b9]"
                    : "text-[9px] font-semibold text-[#7b8189]"
                }
              >
                {number}
              </div>

              <div
                className={
                  chapter
                    ? "text-[9.5px] font-bold text-[#30343b]"
                    : "text-[9px] text-[#4b5563]"
                }
              >
                {title}
              </div>

              <div className="text-right text-[8.5px] font-medium text-[#4b5563]">
                {pageNumber}
              </div>
            </div>
          );
        })}
      </div>
    </ReportPage>
  );
}
