import { ReportPage } from "../report-page";

export type ContentsItem = {
  number: string;
  title: string;
  page: number;
  chapter?: boolean;
};

type Props = {
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
  items: ContentsItem[];
};

export function ContentsPage({
  clientName,
  date,
  page,
  totalPages,
  items,
}: Props) {
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
        {items.map((item, index) => (
          <div
            key={`${item.number}-${item.title}-${index}`}
            className={
              item.chapter
                ? "mt-1.5 grid grid-cols-[92px_1fr_24px] items-baseline border-t border-[#d7dce2] pt-1.5"
                : "grid grid-cols-[92px_1fr_24px] items-baseline"
            }
          >
            <div
              className={
                item.chapter
                  ? "text-[9px] font-bold uppercase tracking-[0.07em] text-[#0867b9]"
                  : "text-[9px] font-semibold text-[#7b8189]"
              }
            >
              {item.number}
            </div>

            <div
              className={
                item.chapter
                  ? "text-[9.5px] font-bold text-[#30343b]"
                  : "text-[9px] text-[#4b5563]"
              }
            >
              {item.title}
            </div>

            <div className="text-right text-[8.5px] font-medium text-[#4b5563]">
              {item.page}
            </div>
          </div>
        ))}
      </div>
    </ReportPage>
  );
}
