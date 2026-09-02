type AiPortfolioSourcesSectionProps = {
  sources: string[];
};

export function AiPortfolioSourcesSection({
  sources,
}: AiPortfolioSourcesSectionProps) {
  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Powered by research from {sources.length} institutional sources
      </h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {sources.map((source) => (
          <span
            key={source}
            className="rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 text-[11px] font-medium text-[#475569]"
          >
            {formatSourceName(source)}
          </span>
        ))}
      </div>
    </section>
  );
}

function formatSourceName(source: string) {
  const names: Record<string, string> = {
    fidelity: "Fidelity",
    blackrock: "BlackRock",
    schwab: "Charles Schwab",
    jpmorgan: "J.P. Morgan Asset Management",
  };

  return names[source] ?? source;
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";
