"use client";

import { useState } from "react";

import type { Proposal, ProposalPosition } from "@/lib/orders/proposal";

type Props = {
  proposal: Proposal;
  updateProposal: (patch: Partial<Proposal>) => void;
};

export function ProposedPositionsSection({ proposal, updateProposal }: Props) {
  const positions = proposal.positions ?? [];

  function removePosition(id: string) {
    updateProposal({
      positions: positions.filter((position) => position.id !== id),
    });
  }

  function updatePosition(updatedPosition: ProposalPosition) {
    updateProposal({
      positions: positions.map((position) =>
        position.id === updatedPosition.id ? updatedPosition : position,
      ),
    });
  }

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Proposed Positions</h2>

      {positions.length === 0 ? (
        <div className="text-[12px] italic text-[#9ca3af]">
          No positions added yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-[rgba(0,87,184,.10)] bg-[#f8faff]">
                <th className={thClass}>Vehicle</th>

                <th className={thClass}>Fund Name</th>

                <th className={thClass}>Ticker</th>

                <th className={thClass}>Asset Class</th>

                <th className={thClass}>Weight</th>

                <th className={thClass}>Avg Expected Return 10yr</th>

                <th className={thClass}>Expense Ratio</th>

                <th className={thClass}>Yield</th>

                <th className={thClass}>Rationale</th>

                <th className={thClass} />
              </tr>
            </thead>

            <tbody>
              {positions.map((position) => (
                <PositionRow
                  key={position.id}
                  position={position}
                  onSave={updatePosition}
                  onRemove={() => removePosition(position.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function PositionRow({
  position,
  onSave,
  onRemove,
}: {
  position: ProposalPosition;
  onSave: (updatedPosition: ProposalPosition) => void;
  onRemove: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  const [draft, setDraft] = useState<ProposalPosition>(position);

  function startEditing() {
    setDraft(position);
    setIsEditing(true);
  }

  function saveEditing() {
    onSave(draft);
    setIsEditing(false);
  }

  function cancelEditing() {
    setDraft(position);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <tr className="border-b border-[rgba(0,87,184,.07)]">
        <td className={tdClass}>
          <input
            value={draft.vehicle ?? ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                vehicle: e.target.value || undefined,
              })
            }
            className={inputClass}
          />
        </td>

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
          <input
            value={draft.cls ?? ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                cls: e.target.value || undefined,
              })
            }
            className={inputClass}
          />
        </td>

        <td className={tdClass}>
          <input
            type="number"
            value={draft.weightPct}
            onChange={(e) =>
              setDraft({
                ...draft,
                weightPct: Number(e.target.value),
              })
            }
            className={inputClass}
          />
        </td>

        <td className={tdClass}>
          <input
            type="number"
            value={draft.expectedReturn ?? ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                expectedReturn:
                  e.target.value === "" ? undefined : Number(e.target.value),
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
      <td className={tdClass}>{position.vehicle ?? "—"}</td>

      <td className={tdClass}>
        <span className="font-semibold text-[#16213e]">
          {position.name || "—"}
        </span>
      </td>

      <td className={tdClass}>{position.ticker ?? "—"}</td>

      <td className={tdClass}>{position.cls ?? "—"}</td>

      <td className={tdClass}>
        <span className="font-semibold text-[#16213e]">
          {position.weightPct.toFixed(1)}%
        </span>
      </td>

      <td className={tdClass}>{formatOptionalPct(position.expectedReturn)}</td>

      <td className={tdClass}>{formatOptionalPct(position.er)}</td>

      <td className={tdClass}>{formatOptionalPct(position.yld)}</td>

      <td className={tdClass}>{position.note ?? "—"}</td>

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

function formatOptionalPct(value: number | undefined): string {
  return value != null ? `${value.toFixed(2)}%` : "—";
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "mb-4 text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const thClass =
  "px-3 py-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]";

const tdClass = "px-3 py-3 align-middle text-[11px] text-[#64748b]";

const inputClass =
  "w-full min-w-[80px] rounded-md border border-[rgba(0,87,184,.14)] bg-white px-2 py-1.5 text-[11px] text-[#16213e] outline-none focus:border-[#0057b8]";
