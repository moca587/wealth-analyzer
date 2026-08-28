import { ReportPage } from "../../report-page";

type Props = {
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function DisclosuresPage({ clientName, date, page, totalPages }: Props) {
  return (
    <ReportPage
      clientName={clientName}
      title="Disclosures"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <div className="mt-6">
        <div className="border-l-[4px] border-[#0867b9] bg-[#dceaf7] px-3 py-2 text-[10px] font-bold text-[#173d60]">
          Important Disclosures
        </div>

        <div className="mt-5 space-y-4 text-[9px] leading-[1.7] text-[#4f565e]">
          <p>
            This report has been prepared for educational and planning purposes
            only. It does not constitute investment, tax, or legal advice, and
            does not provide tax advice — consult a qualified tax professional
            regarding your personal situation.
          </p>

          <p>
            The market simulations rely on randomly sampled returns based on
            configurable assumptions and do not predict actual future market
            behaviour.
          </p>

          <p>
            Past performance is not a reliable indicator of future results. All
            projections are estimates and actual results will differ,
            potentially significantly.
          </p>

          <p>
            Inflation, tax, and regulatory changes are not modelled dynamically.
          </p>

          <p>
            Consult a licensed financial professional before making any
            financial decisions.
          </p>

          <p>This document is not a prospectus or offering document.</p>
        </div>
      </div>
    </ReportPage>
  );
}
