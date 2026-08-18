import type {
  Asset,
  WealthPlan,
} from "@/lib/engine/types";
import { formatMoney } from "@/lib/engine/financial-math";

type Props = {
  plan: WealthPlan;
  update: (patch: Partial<WealthPlan>) => void;
};

export default function AccountsSection({
  plan,
  update,
}: Props) {
  const primaryClient = plan.clients[0];

  function removeAsset(id: string) {
    update({
      assets: plan.assets.filter(
        (asset) => asset.id !== id
      ),
    });
  }

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Assets & Accounts
      </h2>

      <div className="mb-5">
        <div className={labelClass}>
          Country:
        </div>

        <div className="text-[13px] font-semibold text-[#16213e]">
          {primaryClient?.country ?? "US"}
        </div>
      </div>

      <div className="space-y-5">
        {groupAssets(plan.assets).map(
          ([group, assets]) => (
            <div key={group}>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">
                {group}
              </div>

              <div className="space-y-2">
                {assets.map((asset) => (
                  <AssetRow
                    key={asset.id}
                    asset={asset}
                    currency={plan.currency}
                    onRemove={() =>
                      removeAsset(asset.id)
                    }
                  />
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}

function AssetRow({
  asset,
  currency,
  onRemove,
}: {
  asset: Asset;
  currency: string;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-[#16213e]">
            {asset.label ?? asset.type}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#9ca3af]">
            <span>
              {formatMoney(
                asset.value,
                currency
              )}
            </span>

            <span
              className={
                asset.liquid
                  ? "rounded-full bg-green-50 px-2 py-0.5 text-[#00875a]"
                  : "rounded-full bg-orange-50 px-2 py-0.5 text-[#b45309]"
              }
            >
              {asset.liquid
                ? "Liquid"
                : "Locked"}
            </span>

            {!asset.liquid &&
              asset.withdrawAge != null && (
                <span>
                  Penalty-free at{" "}
                  {asset.withdrawAge}
                </span>
              )}
          </div>
        </div>

        <button
          type="button"
          className="text-[12px] text-[#0057b8]"
        >
          ✎
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="text-[12px] text-[#9ca3af] hover:text-red-500"
        >
          ✕
        </button>
      </div>

      {asset.note && (
        <div className="mt-2 text-[11px] leading-5 text-[#9ca3af]">
          {asset.note}
        </div>
      )}
    </div>
  );
}

// Input: an array of Assets 
// Output: an array of tuples, where each tuple is [groupName, assetsInThatGroup]
function groupAssets(
  assets: Asset[]
): [string, Asset[]][] {
  const groups = assets.reduce<
    Record<string, Asset[]>
  >((acc, asset) => {
    const group =
      asset.group ?? "Other assets";

    if (!acc[group]) {
      acc[group] = [];
    }

    acc[group].push(asset);

    return acc;
  }, {});

  return Object.entries(groups);
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "mb-4 text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const labelClass =
  "mb-1.5 text-[11px] font-semibold text-[#64748b]";