// components/reports/report-page.tsx

type Props = {
  clientName: string;
  title: string;
  date: string;
  page: number;
  totalPages: number;
  children: React.ReactNode;
};

export function ReportPage({
  clientName,
  title,
  date,
  page,
  totalPages,
  children,
}: Props) {
  return (
    <section className={pageClass}>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[#6b7280]">{clientName}</span>

        <span className="font-bold text-[#0867b9]">
          Private Wealth Intelligence
        </span>
      </div>

      <h2 className="mt-3 text-[21px] font-bold leading-none text-[#2e333a]">
        {title}
      </h2>

      <div className="mt-2 border-b-2 border-[#454c54]" />

      <div className="pt-4">{children}</div>

      <footer className="absolute bottom-[6mm] left-[11mm] right-[11mm] border-t border-[#d9dee5] pt-2 text-[8px] text-[#777e87]">
        <div className="grid grid-cols-3 items-center">
          <span>Prepared by: Self-directed analysis</span>

          <span className="text-center font-bold text-[#0867b9]">
            CONFIDENTIAL
          </span>

          <span className="text-right">
            Date: {date}
            <span className="mx-3">|</span>
            {page} of {totalPages}
          </span>
        </div>
      </footer>
    </section>
  );
}

const pageClass =
  "report-page relative mx-auto h-[210mm] w-[297mm] overflow-hidden bg-white px-[11mm] pb-[13mm] pt-[8mm] text-[#30343b] shadow-xl print:shadow-none";
