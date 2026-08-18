import type {
  AssetClass,
  WealthPlan,
} from "@/lib/engine/types";

import {
  ASSET_CLASS_CMA,
} from "@/lib/engine/constants";

import {
  formatMoney,
} from "@/lib/engine/financial-math";

type Props = {
  plan: WealthPlan;
};

type WealthBucket =
  | "personal"
  | "market"
  | "aspirational";

// Human-readable information for the three wealth buckets.
const WEALTH_BUCKETS: Record<
  WealthBucket,
  {
    label: string;
    description: string;
  }
> = {
  personal: {
    label: "Personal Assets",
    description:
      "Preserve lifestyle · safety",
  },

  market: {
    label: "Market Assets",
    description:
      "Balance risk & return",
  },

  aspirational: {
    label: "Aspirational Assets",
    description:
      "Idiosyncratic upside",
  },
};

export function WealthAllocationFrameworkSection({
  plan,
}: Props) {
  // Start all three bucket totals at zero.
  const wealthByBucket: Record<
    WealthBucket,
    number
  > = {
    personal: 0,
    market: 0,
    aspirational: 0,
  };

  // Go through each asset in the client's plan
  // and assign its value to one of the three buckets.
  for (const asset of plan.assets ?? []) {
    const value =
      Number(asset.value);

    // Ignore assets with no positive value.
    if (value <= 0) {
      continue;
    }

    // Use the asset's valid AssetClass.
    // Unknown / missing classes fall back to "mixed".
    const cls: AssetClass =
      asset.cls &&
      ASSET_CLASS_CMA[asset.cls]
        ? asset.cls
        : "mixed";

    // Decide which wealth-allocation bucket
    // this asset belongs to.
    const bucket =
      getWealthBucket(cls);

    // Add this asset's value to the running
    // total for that bucket.
    wealthByBucket[bucket] +=
      value;
  }

  // Total value of all assets that were categorized.
  const totalCategorized =
    wealthByBucket.personal +
    wealthByBucket.market +
    wealthByBucket.aspirational;

  // Convert the bucket totals into objects
  // that are easy to render in the UI.
  const rows =
    (
      Object.entries(
        WEALTH_BUCKETS
      ) as [
        WealthBucket,
        {
          label: string;
          description: string;
        }
      ][]
    ).map(
      ([bucket, info]) => {
        const value =
          wealthByBucket[bucket];

        const weight =
          totalCategorized > 0
            ? value /
              totalCategorized
            : 0;

        return {
          bucket,
          label: info.label,
          description:
            info.description,
          value,
          weight,
        };
      }
    );

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Wealth Allocation Framework
      </h2>

      <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
        The three-bucket wealth allocation
        framework organizes assets by
        risk-return role:{" "}

        <strong className="text-[#16213e]">
          Personal
        </strong>{" "}
        assets preserve lifestyle and
        provide safety,{" "}

        <strong className="text-[#16213e]">
          Market
        </strong>{" "}
        assets balance risk and return,
        and{" "}

        <strong className="text-[#16213e]">
          Aspirational
        </strong>{" "}
        assets provide higher-risk,
        idiosyncratic upside.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {rows.map((row) => (
          <div
            key={row.bucket}
            className="rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-5"
          >
            <div className="text-[11px] font-bold text-[#16213e]">
              {row.label}
            </div>

            <div className="mt-1 text-[10px] text-[#64748b]">
              {row.description}
            </div>

            <div className="mt-4 text-[24px] font-extrabold tracking-tight text-[#16213e]">
              {formatMoney(
                row.value,
                plan.currency
              )}
            </div>

            <div className="mt-1 text-[10px] text-[#64748b]">
              {(
                row.weight * 100
              ).toFixed(1)}
              % of total
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 text-[11px] text-[#64748b]">
        Total categorized:{" "}

        <strong className="text-[#16213e]">
          {formatMoney(
            totalCategorized,
            plan.currency
          )}
        </strong>
        .
      </p>

      <p className="mt-2 text-[10px] leading-5 text-[#9ca3af]">
        Concentrated or idiosyncratic
        positions may carry substantially
        greater risk than diversified
        market assets. The current
        classification is based on the
        asset information available in
        the plan.
      </p>
    </section>
  );
}

// Temporary framework classification.
//
// Asset class alone cannot perfectly distinguish
// things such as:
//   - primary residence vs investment property
//   - diversified ETF vs concentrated stock
//
// This can be made more precise later when the
// Asset model contains that additional information.
function getWealthBucket(
  cls: AssetClass
): WealthBucket {
  // Cash and real estate are currently treated
  // as lifestyle / safety assets.
  if (
    cls === "cash" ||
    cls === "real_estate"
  ) {
    return "personal";
  }

  // Crypto and alternatives are currently treated
  // as higher-risk aspirational assets.
  if (
    cls === "crypto" ||
    cls === "alternative"
  ) {
    return "aspirational";
  }

  // Equity, fixed income, mixed and commodities
  // default to the diversified market bucket.
  return "market";
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";