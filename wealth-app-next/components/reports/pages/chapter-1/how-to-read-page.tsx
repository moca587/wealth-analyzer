import { ReportPage } from "../../report-page";
import { ReportSectionBar } from "../../report-section-bar";

type Props = {
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function HowToReadPage({ clientName, date, page, totalPages }: Props) {
  return (
    <ReportPage
      clientName={clientName}
      title="How to Read This Report"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      {/* Introduction */}
      <p className="text-[10.5px] leading-[1.6] text-[#555d66]">
        This report looks at your finances from many angles, but the core ideas
        are simple. This page explains them in plain terms so every chart that
        follows makes sense.
      </p>

      {/* Market simulation */}
      <ReportSectionBar>What is a market simulation?</ReportSectionBar>

      <p className="mt-3 text-[10.5px] leading-[1.6] text-[#454b53]">
        Instead of assuming one fixed rate of return, we replay your financial
        life across a thousand simulated futures, each with a different,
        randomly drawn sequence of good and bad market years based on long-term
        market behaviour.
      </p>

      <p className="mt-2 text-[10.5px] leading-[1.6] text-[#454b53]">
        The result is not one prediction but a{" "}
        <strong>RANGE of realistic outcomes</strong> — some strong, some
        average, some poor.
      </p>

      {/* Fan chart */}
      <ReportSectionBar>How to read the fan chart</ReportSectionBar>

      <p className="mt-3 text-[10.5px] leading-[1.6] text-[#454b53]">
        The dark middle line is the <strong>MEDIAN</strong>: half of the
        simulated futures end above it, half below. The inner shaded band covers
        the middle half of outcomes (25th to 75th percentile). The outer band
        covers the low-to-high range selected for this report.
      </p>

      <p className="mt-2 text-[10.5px] leading-[1.6] text-[#454b53]">
        Falling outside it is possible, just unlikely. A dashed vertical line
        marks the planned retirement age.
      </p>

      {/* Goal success */}
      <ReportSectionBar>What does goal success mean?</ReportSectionBar>

      <p className="mt-3 text-[10.5px] leading-[1.6] text-[#454b53]">
        A goal &quot;succeeds&quot; in one simulated future when the plan can
        pay for it from available liquid wealth when it comes due.
      </p>

      <p className="mt-2 text-[10.5px] leading-[1.6] text-[#454b53]">
        A goal with <strong>85% success</strong> was funded in 850 of 1,000
        simulated futures. Higher is better — and 100% is not a guarantee; it
        means the goal was funded in every future we simulated.
      </p>

      {/* Keep in mind callout */}
      <div className="mt-6 border-l-[5px] border-[#0867b9] bg-[#eef5fb] px-5 py-4">
        <div className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#0867b9]">
          KEEP IN MIND
        </div>

        <p className="mt-2 text-[10.5px] leading-[1.6] text-[#454b53]">
          Projections are estimates built from assumptions, not predictions.
          Their value is in comparing choices — retiring earlier versus later,
          saving more versus less — not in forecasting any exact number.
        </p>
      </div>
    </ReportPage>
  );
}
