"use client";

import type { WealthPlan } from "@/lib/engine/types";
import { formatMoney } from "@/lib/engine/financial-math";

type Props = {
  plan: WealthPlan;
  update: (patch: Partial<WealthPlan>) => void;
};

export function LinkedAccountSection({
  plan,
  update,
}: Props) {
  const linkedAssetId =
    plan.linkedPortfolioAssetId ?? "";

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Linked Account
      </h2>

      <label>
        <span className={labelClass}>
          This portfolio represents
        </span>

        <select
          value={linkedAssetId}
          onChange={(e) =>
            update({
              linkedPortfolioAssetId:
                e.target.value ||
                undefined,
            })
          }
          className={inputClass}
        >
          <option value="">
            — None (track separately from Assets) —
          </option>

          {plan.assets.map((asset) => (
            <option
              key={asset.id}
              value={asset.id}
            >
              {asset.label ??
                asset.type}
              {" — "}
              {formatMoney(
                asset.value,
                plan.currency
              )}
            </option>
          ))}
        </select>
      </label>

      <p className="mt-3 text-[11px] leading-5 text-[#9ca3af]">
        Select the account from your Assets
        tab that these holdings belong to.
        The linked account will be excluded
        from the Assets total to avoid
        double-counting — the detailed
        holdings here replace it.
      </p>
    </section>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "mb-4 text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const labelClass =
  "mb-1.5 block text-[11px] font-semibold text-[#64748b]";

const inputClass =
  "w-full rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[13px] font-medium text-[#16213e] outline-none focus:border-[#0057b8]";