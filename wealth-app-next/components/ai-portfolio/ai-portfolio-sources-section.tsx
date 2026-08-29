const SOURCES = [
  "Bank of America",
  "JPMorgan AM",
  "Morgan Stanley",
  "Goldman Sachs",
  "Citi Private Bank",
  "UBS Wealth",
  "Julius Baer",
  "Pictet AM",
  "Vontobel",
  "BlackRock",
  "Eaton Vance",
  "Morningstar",
  "FactSet",
  "Bloomberg",
  "Oppenheimer",
  "Seeking Alpha",
];

export function AiPortfolioSourcesSection() {
  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Powered by research from {SOURCES.length} institutional sources
      </h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {SOURCES.map((source) => (
          <span
            key={source}
            className="rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 text-[11px] font-medium text-[#475569]"
          >
            {source}
          </span>
        ))}
      </div>
    </section>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";
