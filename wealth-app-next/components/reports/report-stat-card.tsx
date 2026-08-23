// components/reports/report-stat-card.tsx

type Props = {
  label: string;
  value: string;
  note?: string;
};

export function ReportStatCard({ label, value, note }: Props) {
  return (
    <div className="border-t-[5px] border-[#0867b9] bg-[#f8f9fb] px-4 py-3">
      <div className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#7c828a]">
        {label}
      </div>

      <div className="mt-2 text-[20px] font-bold text-[#2f343b]">{value}</div>

      {note && <div className="mt-1 text-[8px] text-[#7d848c]">{note}</div>}
    </div>
  );
}
