import { ReportPage } from "../../report-page";

type Props = {
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

const CONTINUED_TERMS = [
  {
    term: "Time Horizon",
    definition:
      "How long until the money is needed. Longer horizons can support more volatility because there is more time to recover from downturns.",
  },
  {
    term: "Wealth Allocation Framework",
    definition:
      "Classification of assets into Personal (preserve lifestyle), Market (balance risk and return), and Aspirational (concentrated upside) buckets.",
  },
  {
    term: "Yield",
    definition:
      "Annual income (dividends or interest) produced by an investment, expressed as a percentage of its price.",
  },
];

export function GlossaryContinuationPage({
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  return (
    <ReportPage
      clientName={clientName}
      title="Glossary of Terms"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <div className="mt-4 border-l-[4px] border-[#0867b9] bg-[#dceaf7] px-3 py-2 text-[10px] font-bold text-[#173d60]">
        Glossary of Terms (continued)
      </div>

      <div className="mt-5 space-y-4">
        {CONTINUED_TERMS.map((item) => (
          <GlossaryItem
            key={item.term}
            term={item.term}
            definition={item.definition}
          />
        ))}
      </div>
    </ReportPage>
  );
}

function GlossaryItem({
  term,
  definition,
}: {
  term: string;
  definition: string;
}) {
  return (
    <div>
      <div className="text-[8px] font-bold text-[#30343b]">{term}</div>

      <p className="mt-0.5 text-[7.5px] leading-[1.45] text-[#5f666d]">
        {definition}
      </p>
    </div>
  );
}
