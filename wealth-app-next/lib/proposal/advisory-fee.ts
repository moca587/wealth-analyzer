import type { Proposal } from "@/lib/orders/proposal";

export function calcAdvisoryFeePct(
  feeType: Proposal["feeType"],
  feeRate: number,
  targetAmount: number,
): number {
  if (feeType === "aum") {
    return feeRate;
  }

  if (feeType === "flat" && targetAmount > 0) {
    return (feeRate / targetAmount) * 100;
  }

  return 0;
}
