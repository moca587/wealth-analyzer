// lib/portfolio/wealth-allocation-framework.ts

import type { AssetClass, WealthPlan } from "@/lib/engine/types";
import { ASSET_CLASS_CMA } from "@/lib/engine/constants";

export type WealthBucket = "personal" | "market" | "aspirational";

export function calculateWealthAllocationFramework(plan: WealthPlan) {
  const wealthByBucket: Record<WealthBucket, number> = {
    personal: 0,
    market: 0,
    aspirational: 0,
  };

  for (const asset of plan.assets ?? []) {
    const value = Number(asset.value);

    if (value <= 0) {
      continue;
    }

    const cls: AssetClass =
      asset.cls && ASSET_CLASS_CMA[asset.cls] ? asset.cls : "mixed";

    const bucket = getWealthBucket(cls);

    wealthByBucket[bucket] += value;
  }

  const total =
    wealthByBucket.personal +
    wealthByBucket.market +
    wealthByBucket.aspirational;

  return {
    personal: wealthByBucket.personal,
    market: wealthByBucket.market,
    aspirational: wealthByBucket.aspirational,
    total,
  };
}

function getWealthBucket(cls: AssetClass): WealthBucket {
  if (cls === "cash" || cls === "real_estate") {
    return "personal";
  }

  if (cls === "crypto" || cls === "alternative") {
    return "aspirational";
  }

  return "market";
}
