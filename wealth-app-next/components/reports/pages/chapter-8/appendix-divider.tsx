import { ReportPage } from "../../report-page";

type Props = {
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function AppendixDivider({ clientName, date, page, totalPages }: Props) {
  return (
    <ReportPage
      clientName={clientName}
      title="Appendix"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <div className="flex min-h-[540px] flex-col justify-center">
        <div className="text-[64px] font-light leading-none text-[#0867b9]">
          8
        </div>

        <h1 className="mt-5 text-[30px] font-bold tracking-[-0.02em] text-[#30343b]">
          Appendix
        </h1>

        <p className="mt-5 max-w-[720px] text-[14px] leading-6 text-[#555d66]">
          Reference material behind the numbers: educational charts, the
          capital-market assumptions, methodology, a glossary of terms, and
          important disclosures.
        </p>
      </div>
    </ReportPage>
  );
}
