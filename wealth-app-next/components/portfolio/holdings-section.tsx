"use client";
import { useState } from "react";

import type { Holding, WealthPlan } from "@/lib/engine/types";

import { formatMoney } from "@/lib/engine/financial-math";
import { CLASS_LABEL, type AssetClass } from "@/lib/portfolio/asset-class";

type Props = {
  plan: WealthPlan;
  update: (patch: Partial<WealthPlan>) => void;
};

export function HoldingsSection({ plan, update }: Props) {
  const holdings = plan.holdings ?? [];
  const currency = plan.currency || "USD";

  function removeHolding(id: string) {
    update({
      holdings: holdings.filter((holding) => holding.id !== id),
    });
  }

  function updateHolding(updatedHolding: Holding) {
    update({
      holdings: holdings.map((holding) =>
        holding.id === updatedHolding.id ? updatedHolding : holding,
      ),
    });
  }

  return (
    <section className={sectionClass}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className={titleClass}>Holdings</h2>

        <div className="flex items-center gap-2">
          <button type="button" className={smallButtonClass}>
            🔌 Data feeds
          </button>

          <button type="button" className={smallButtonClass}>
            ⭳ Import statement
          </button>

          <button type="button" className={smallButtonClass}>
            ✦ AI Data Agent
          </button>
        </div>
      </div>

      {holdings.length === 0 ? (
        <div className="text-[12px] italic text-[#9ca3af]">
          No holdings added.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-[rgba(0,87,184,.10)] bg-[#f8faff]">
                <th className={thClass}>Name</th>

                <th className={thClass}>Ticker</th>

                <th className={thClass}>Class</th>

                <th className={thClass}>Value</th>

                <th className={thClass}>Region</th>

                <th className={thClass}>Exp. Ratio</th>

                <th className={thClass}>Yield</th>

                <th className={thClass}>Notes</th>

                <th className={thClass} />
              </tr>
            </thead>

            <tbody>
              {holdings.map((holding) => (
                <HoldingRow
                  key={holding.id}
                  holding={holding}
                  currency={currency}
                  onSave={updateHolding}
                  onRemove={() => removeHolding(holding.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function HoldingRow({
  holding,
  currency,
  onSave,
  onRemove,
}: {
  holding: Holding;
  currency: string;
  onSave: (holding: Holding) => void;
  onRemove: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  const [draft, setDraft] = useState<Holding>(holding);

  function startEditing() {
    setDraft(holding);
    setIsEditing(true);
  }

  function saveEditing() {
    onSave(draft);
    setIsEditing(false);
  }

  function cancelEditing() {
    setDraft(holding);
    setIsEditing(false);
  }

  const classLabel = holding.cls ? CLASS_LABEL[holding.cls as AssetClass] : "—";

  if (isEditing) {
    return (
      <tr className="border-b border-[rgba(0,87,184,.07)]">
        <td className={tdClass}>
          <input
            value={draft.name}
            onChange={(e) =>
              setDraft({
                ...draft,
                name: e.target.value,
              })
            }
            className={inputClass}
          />
        </td>

        <td className={tdClass}>
          <input
            value={draft.ticker ?? ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                ticker: e.target.value || undefined,
              })
            }
            className={inputClass}
          />
        </td>

        <td className={tdClass}>
          <select
            value={draft.cls ?? ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                cls:
                  e.target.value === ""
                    ? undefined
                    : (e.target.value as AssetClass),
              })
            }
            className={inputClass}
          >
            <option value="">—</option>

            {Object.entries(CLASS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </td>

        <td className={tdClass}>
          <input
            type="number"
            value={draft.value}
            onChange={(e) =>
              setDraft({
                ...draft,
                value: Number(e.target.value),
              })
            }
            className={inputClass}
          />
        </td>

        <td className={tdClass}>
          <input
            value={draft.region ?? ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                region: e.target.value || undefined,
              })
            }
            className={inputClass}
          />
        </td>

        <td className={tdClass}>
          <input
            type="number"
            value={draft.er ?? ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                er: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            className={inputClass}
          />
        </td>

        <td className={tdClass}>
          <input
            type="number"
            value={draft.yld ?? ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                yld: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            className={inputClass}
          />
        </td>

        <td className={tdClass}>
          <input
            value={draft.note ?? ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                note: e.target.value || undefined,
              })
            }
            className={inputClass}
          />
        </td>

        <td className={tdClass}>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={saveEditing}
              className="text-[11px] font-semibold text-[#0057b8]"
            >
              Save
            </button>

            <button
              type="button"
              onClick={cancelEditing}
              className="text-[11px] text-[#9ca3af]"
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-[rgba(0,87,184,.07)] last:border-b-0">
      <td className={tdClass}>
        <div className="font-semibold text-[#16213e]">
          {holding.name || "—"}
        </div>
      </td>

      <td className={tdClass}>{holding.ticker ?? "—"}</td>

      <td className={tdClass}>{classLabel}</td>

      <td className={tdClass}>
        <strong className="text-[#16213e]">
          {formatMoney(holding.value, currency)}
        </strong>
      </td>

      <td className={tdClass}>{holding.region ?? "—"}</td>

      <td className={tdClass}>
        {holding.er != null ? `${holding.er.toFixed(2)}%` : "—"}
      </td>

      <td className={tdClass}>
        {holding.yld != null ? `${holding.yld.toFixed(2)}%` : "—"}
      </td>

      <td className={tdClass}>{holding.note ?? "—"}</td>

      <td className={tdClass}>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={startEditing}
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
      </td>
    </tr>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const thClass =
  "px-3 py-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]";

const tdClass = "px-3 py-3 align-middle text-[11px] text-[#64748b]";

const smallButtonClass =
  "rounded-full border border-[rgba(0,87,184,.14)] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#0057b8] hover:bg-[#f8faff]";

const inputClass =
  "w-full min-w-[80px] rounded-md border border-[rgba(0,87,184,.14)] bg-white px-2 py-1.5 text-[11px] text-[#16213e] outline-none focus:border-[#0057b8]";
