type Props = {
  risks: string[];
};

export function AiPortfolioRisks({ risks }: Props) {
  if (risks.length === 0) {
    return null;
  }

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>⚠ Things to keep in mind</h2>

      <ul className="mt-4 space-y-2">
        {risks.map((risk, index) => (
          <li
            key={`${risk}-${index}`}
            className="flex gap-3 text-[12px] leading-5 text-[#475569]"
          >
            <span className="mt-[2px] text-[#c2410c]">•</span>

            <span>{risk}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";
