type Props = {
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function WhereYouStandDivider({
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  return (
    <section className="report-page relative mx-auto h-[210mm] w-[297mm] overflow-hidden bg-white px-[11mm] pb-[13mm] pt-[8mm] text-[#30343b] shadow-xl print:shadow-none">
      {/* top header */}
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[#6b7280]">{clientName}</span>

        <span className="font-bold text-[#0867b9]">
          Private Wealth Intelligence
        </span>
      </div>

      {/* top title */}
      <h2 className="mt-3 text-[21px] font-bold leading-none text-[#2e333a]">
        Where You Stand Today
      </h2>

      <div className="mt-2 border-b-2 border-[#454c54]" />

      {/* chapter content */}
      <div className="mt-[22mm]">
        <div className="text-[72px] font-light leading-none text-[#0867b9]">
          2
        </div>

        <h1 className="mt-5 text-[28px] font-bold tracking-[-0.02em] text-[#30343b]">
          Where You Stand Today
        </h1>

        <p className="mt-4 max-w-[760px] text-[15px] leading-6 text-[#555d66]">
          The starting point: who is in the household, what you own and owe,
          what comes in and goes out each year, and the headline numbers of your
          plan today.
        </p>
      </div>

      {/* footer */}
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
