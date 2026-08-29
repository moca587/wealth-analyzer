import type { AiAssetMix } from "@/lib/ai-portfolio/types";

type Props = {
  assetMix: AiAssetMix;
};

const rows = [
  {
    key: "stocks",
    label: "📈 Stocks",
  },
  {
    key: "bonds",
    label: "📊 Bonds",
  },
  {
    key: "realEstate",
    label: "🏠 Real Estate",
  },
  {
    key: "alternatives",
    label: "💎 Alternatives",
  },
  {
    key: "commodities",
    label: "🪙 Commodities",
  },
  {
    key: "cash",
    label: "💵 Cash",
  },
] as const;

export function AiPortfolioAssetMix({ assetMix }: Props) {
  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Your asset mix</h2>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {rows.map((row) => (
          <div
            key={row.key}
            className="rounded-xl border border-[#e8edf4] bg-[#f8faff] p-4"
          >
            <div className="text-[11px] font-semibold text-[#64748b]">
              {row.label}
            </div>

            <div className="mt-2 text-xl font-bold text-[#16213e]">
              {assetMix[row.key]}%
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";
