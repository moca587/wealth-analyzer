"use client";

import type { WealthPlan } from "@/lib/engine/types";
import { formatMoney } from "@/lib/engine/financial-math";

type Props = {
  plan: WealthPlan;
  update: (patch: Partial<WealthPlan>) => void;
};

export function LinkedAccountSection({ plan, update }: Props) {
  const linkedAssetId = plan.linkedPortfolioAssetId ?? "";

  const linkedAsset = plan.assets.find((asset) => asset.id === linkedAssetId);

  const holdingsTotal = (plan.holdings ?? []).reduce(
    (sum, holding) => sum + (Number(holding.value) || 0),
    0,
  );

  const accountValue = linkedAsset?.value ?? 0;

  const excess = holdingsTotal - accountValue;

  const excessPct = accountValue > 0 ? (excess / accountValue) * 100 : 0;

  const holdingsExceedAccount =
    linkedAsset != null && holdingsTotal > accountValue;

  const linkableAssets = plan.assets.filter(
    (asset) => asset.type !== "Property" && asset.type !== "Other",
  );

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Linked Account</h2>

      <label>
        <span className={labelClass}>This portfolio represents</span>

        <select
          value={linkedAssetId}
          onChange={(e) =>
            update({
              linkedPortfolioAssetId: e.target.value || undefined,
            })
          }
          className={inputClass}
        >
          <option value="">— None (track separately from Assets) —</option>

          {linkableAssets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.label ?? asset.type}
              {" — "}
              {formatMoney(asset.value, plan.currency)}
            </option>
          ))}
        </select>
        {holdingsExceedAccount && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] leading-5 text-amber-800">
            Holdings ({formatMoney(holdingsTotal, plan.currency)}) exceed
            account value ({formatMoney(accountValue, plan.currency)}) by{" "}
            {formatMoney(excess, plan.currency)} ({excessPct.toFixed(1)}%).
            Consider updating the account value on the Assets tab.
          </div>
        )}
      </label>

      <p className="mt-3 text-[11px] leading-5 text-[#9ca3af]">
        Select the account from your Assets tab that these holdings belong to.
        The linked account will be excluded from the Assets total to avoid
        double-counting — the detailed holdings here replace it.
      </p>
    </section>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "mb-4 text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const labelClass = "mb-1.5 block text-[11px] font-semibold text-[#64748b]";

const inputClass =
  "w-full rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[13px] font-medium text-[#16213e] outline-none focus:border-[#0057b8]";
