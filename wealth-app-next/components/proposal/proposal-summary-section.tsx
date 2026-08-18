import type { Proposal } from "@/lib/orders/proposal";
import { formatMoney } from "@/lib/engine/financial-math";

type Props = {
  proposal: Proposal;
};

export function ProposalSummarySection({
  proposal,
}: Props) {
  const positions = proposal.positions ?? [];

  // Sum of all the proposed position weights
  const allocationPct = positions.reduce(
    (sum, position) =>
      sum + (Number(position.weightPct) || 0),
    0
  );

  const targetMatch =
    positions.length === 0
      ? "Awaiting allocation"
      : Math.abs(allocationPct - 100) <= 0.1
        ? "Fully allocated"
        : "Incomplete allocation";

  const byClass = groupByField(
    positions,
    (position) =>
      position.cls ?? "Other"
  );

  const byVehicle = groupByField(
    positions,
    (position) =>
      position.vehicle ?? "Other"
  );

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Allocation Summary & Asset Class Breakdown
      </h2>

      <div className="mb-5 space-y-1 text-[11px] text-[#64748b]">
        <div>
          Prepared for:{" "}
          <strong className="text-[#16213e]">
            {proposal.clientName || "—"}
          </strong>
        </div>

        <div>
          Prepared by:{" "}
          <strong className="text-[#16213e]">
            {proposal.advisor || "—"}
          </strong>
        </div>

        <div>
          Objective:{" "}
          <strong className="text-[#16213e]">
            {proposal.objective || "—"}
          </strong>
        </div>

        <div>
          Target amount:{" "}
          <strong className="text-[#16213e]">
            {proposal.targetAmount > 0
              ? formatMoney(
                  proposal.targetAmount,
                  proposal.currency
                )
              : "Not set"}
          </strong>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Target amount"
          value={
            proposal.targetAmount > 0
              ? formatMoney(
                  proposal.targetAmount,
                  proposal.currency
                )
              : "Not set"
          }
        />

        <Metric
          label="Positions"
          value={String(
            positions.length
          )}
        />

        <Metric
          label="Allocation"
          value={`${allocationPct.toFixed(
            1
          )}%`}
        />

        <Metric
          label="Target match"
          value={targetMatch}
        />

        <Metric
          label="Gross return"
          value="—"
        />

        <Metric
          label="Advisory fee"
          value="—"
        />

        <Metric
          label="Net return"
          value="—"
        />

        <Metric
          label="Wtd expense ratio"
          value="—"
        />

        <Metric
          label="Wtd yield"
          value="—"
        />

        <Metric
          label="Risk score"
          value="—"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <BreakdownCard
          title="By Asset Class"
          rows={byClass}
        />

        <BreakdownCard
          title="By Vehicle Type"
          rows={byVehicle}
        />

        <BreakdownCard
          title="By Geographic Region"
          rows={[]}
        />
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]">
        {label}
      </div>

      <div className="mt-1 text-[17px] font-extrabold text-[#16213e]">
        {value}
      </div>
    </div>
  );
}

function BreakdownCard({
  title,
  rows,
}: {
  title: string;
  rows: {
    name: string;
    pct: number;
  }[];
}) {
  return (
    <div className="rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4">
      <h3 className="mb-4 text-[11px] font-bold text-[#64748b]">
        {title}
      </h3>

      {rows.length === 0 ? (
        <div className="text-[11px] italic text-[#9ca3af]">
          No positions to chart yet.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between text-[11px]"
            >
              <span className="font-semibold text-[#16213e]">
                {row.name}
              </span>

              <span className="text-[#64748b]">
                {row.pct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function groupByField(
  positions: Proposal["positions"],
  getGroup: (
    position: Proposal["positions"][number]
  ) => string
): {
  name: string;
  pct: number;
}[] {
  const groups =
    positions.reduce<
      Record<string, number>
    >((acc, position) => {
      const group =
        getGroup(position);

      acc[group] =
        (acc[group] ?? 0) +
        (Number(
          position.weightPct
        ) || 0);

      return acc;
    }, {});

  return Object.entries(groups).map(
    ([name, pct]) => ({
      name,
      pct,
    })
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "mb-4 text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";