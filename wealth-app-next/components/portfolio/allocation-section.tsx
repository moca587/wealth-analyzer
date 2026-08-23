import type { WealthPlan } from "@/lib/engine/types";

import { Donut } from "@/components/portfolio/donut";

import {
  calcAllocationByClass,
  calcAllocationByInstrumentType,
  calcAllocationByRegion,
} from "@/lib/portfolio/portfolio-metrics";

import { CLASS_COLOR, type AssetClass } from "@/lib/portfolio/asset-class";

import { formatMoney } from "@/lib/engine/financial-math";

type Props = {
  plan: WealthPlan;
};

const TYPE_COLORS: Record<string, string> = {
  ETF: "#0057b8",
  "Mutual fund": "#5b9bd5",
  Stock: "#7c3aed",
  Bond: "#00875a",
  Alternative: "#f59e0b",
  "Private equity fund": "#ef4444",
  "Hedge fund": "#14b8a6",
  "Structured product": "#64748b",
};

const REGION_COLORS: Record<string, string> = {
  US: "#0057b8",
  "Dev Intl": "#5b9bd5",
  EM: "#7c3aed",
  Global: "#00875a",
  Other: "#f59e0b",
};

export function AllocationSection({ plan }: Props) {
  const holdings = plan.holdings ?? [];

  const byClass = calcAllocationByClass(holdings);

  const byInstrument = calcAllocationByInstrumentType(holdings);

  const byRegion = calcAllocationByRegion(holdings);

  const classSlices = byClass.map((item) => ({
    key: item.name,

    pct: item.pct,

    color: CLASS_COLOR[item.key as AssetClass] ?? "#94a3b8",
  }));

  const instrumentSlices = byInstrument.map((item) => ({
    key: item.key,
    pct: item.pct,
    color: TYPE_COLORS[item.key] ?? "#94a3b8",
  }));

  const regionSlices = byRegion.map((item) => ({
    key: item.key,
    pct: item.pct,
    color: REGION_COLORS[item.key] ?? "#94a3b8",
  }));

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Portfolio Allocation & Asset Class Breakdown
      </h2>

      <div className="grid gap-6 lg:grid-cols-3">
        <AllocationCard
          title="By Asset Class"
          data={byClass.map((item) => ({
            ...item,
            color: CLASS_COLOR[item.key as AssetClass] ?? "#94a3b8",
          }))}
          currency={plan.currency}
        >
          <Donut slices={classSlices} size={150} stroke={18} />
        </AllocationCard>

        <AllocationCard
          title="By Instrument Type"
          data={byInstrument.map((item) => ({
            ...item,
            color: TYPE_COLORS[item.key] ?? "#94a3b8",
          }))}
          currency={plan.currency}
        >
          <Donut slices={instrumentSlices} size={150} stroke={18} />
        </AllocationCard>

        <AllocationCard
          title="By Geographic Region"
          data={byRegion.map((item) => ({
            ...item,
            color: REGION_COLORS[item.key] ?? "#94a3b8",
          }))}
          currency={plan.currency}
        >
          <Donut slices={regionSlices} size={150} stroke={18} />
        </AllocationCard>
      </div>
    </section>
  );
}

function AllocationCard({
  title,
  data,
  currency,
  children,
}: {
  title: string;

  data: {
    name: string;
    value: number;
    pct: number;
    color?: string;
  }[];

  currency: string;

  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4">
      <h3 className="mb-4 text-[11px] font-bold text-[#64748b]">{title}</h3>

      <div className="flex justify-center">{children}</div>

      <div className="mt-5 space-y-2">
        {data.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between gap-3 text-[11px]"
          >
            <span className="flex items-center gap-2 font-semibold text-[#16213e]">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: item.color ?? "#94a3b8",
                }}
              />

              {item.name}
            </span>
            <span className="text-right text-[#64748b]">
              {formatMoney(item.value, currency)}{" "}
              <span className="font-semibold text-[#16213e]">
                {item.pct.toFixed(1)}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "mb-4 text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";
