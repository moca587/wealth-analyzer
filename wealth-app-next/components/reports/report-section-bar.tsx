// components/reports/report-section-bar.tsx

type Props = {
  children: React.ReactNode;
};

export function ReportSectionBar({ children }: Props) {
  return (
    <div className="mt-4 flex min-h-[32px] items-center border-l-[5px] border-[#0874c9] bg-[#dceaf7] px-3">
      <h3 className="text-[14px] font-bold text-[#173d60]">{children}</h3>
    </div>
  );
}
