"use client";

import type {
  Proposal,
  ProposalPosition,
} from "@/lib/orders/proposal";

type Props = {
  proposal: Proposal;
  updateProposal: (
    patch: Partial<Proposal>
  ) => void;
};

export function ProposedPositionsSection({
  proposal,
  updateProposal,
}: Props) {
  const positions = proposal.positions ?? [];

  function removePosition(id: string) {
    updateProposal({
      positions: positions.filter(
        (position) =>
          position.id !== id
      ),
    });
  }

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Proposed Positions
      </h2>

      {positions.length === 0 ? (
        <div className="text-[12px] italic text-[#9ca3af]">
          No positions added yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-[rgba(0,87,184,.10)] bg-[#f8faff]">
                <th className={thClass}>
                  Vehicle
                </th>

                <th className={thClass}>
                  Fund Name
                </th>

                <th className={thClass}>
                  Ticker
                </th>

                <th className={thClass}>
                  Asset Class
                </th>

                <th className={thClass}>
                  Weight
                </th>

                <th className={thClass}>
                  Avg Expected Return 10yr
                </th>

                <th className={thClass}>
                  Expense Ratio
                </th>

                <th className={thClass}>
                  Yield
                </th>

                <th className={thClass}>
                  Rationale
                </th>

                <th className={thClass} />
              </tr>
            </thead>

            <tbody>
              {positions.map((position) => (
                <PositionRow
                  key={position.id}
                  position={position}
                  onRemove={() =>
                    removePosition(
                      position.id
                    )
                  }
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
  onRemove,
}: {
  position: ProposalPosition;
  onRemove: () => void;
}) {
  return (
    <tr className="border-b border-[rgba(0,87,184,.07)] last:border-b-0">
      <td className={tdClass}>
        {position.vehicle ?? "—"}
      </td>

      <td className={tdClass}>
        <span className="font-semibold text-[#16213e]">
          {position.name || "—"}
        </span>
      </td>

      <td className={tdClass}>
        {position.ticker ?? "—"}
      </td>

      <td className={tdClass}>
        {position.cls ?? "—"}
      </td>

      <td className={tdClass}>
        <span className="font-semibold text-[#16213e]">
          {position.weightPct.toFixed(
            1
          )}
          %
        </span>
      </td>

      <td className={tdClass}>
        {formatOptionalPct(
          position.expectedReturn
        )}
      </td>

      <td className={tdClass}>
        {formatOptionalPct(
          position.er
        )}
      </td>

      <td className={tdClass}>
        {formatOptionalPct(
          position.yld
        )}
      </td>

      <td className={tdClass}>
        {position.note ?? "—"}
      </td>

      <td className={tdClass}>
        <button
          type="button"
          onClick={onRemove}
          className="text-[12px] text-[#9ca3af] hover:text-red-500"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}

function formatOptionalPct(
  value: number | undefined
): string {
  return value != null
    ? `${value.toFixed(2)}%`
    : "—";
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "mb-4 text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const thClass =
  "px-3 py-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]";

const tdClass =
  "px-3 py-3 align-middle text-[11px] text-[#64748b]";