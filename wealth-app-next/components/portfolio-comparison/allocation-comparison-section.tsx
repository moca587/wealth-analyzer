import { Donut } from "@/components/portfolio/donut";
import {
  formatSignedPercent,
  percentToneClass,
} from "@/lib/portfolio-comparison/format";

type AllocationItem = {
  name: string;
  pct: number;
  color: string;
};

type Props = {
  current: AllocationItem[];
  proposed: AllocationItem[];
};

export function AllocationComparisonSection({
  current,
  proposed,
}: Props) {
  const diffRows = buildDiffRows(
    current,
    proposed
  );

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Asset Class Allocation — Side by Side
      </h2>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <AllocationCard
          title="Current Portfolio"
          items={current}
        />

        <AllocationCard
          title="Proposed Portfolio"
          items={proposed}
        />
      </div>

      <div className="mt-6 border-t border-[rgba(0,87,184,.08)] pt-5">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
          Allocation Diff — Current vs Proposed
        </h3>

        {diffRows.length === 0 ? (
          <p className="mt-3 text-[11px] italic text-[#9ca3af]">
            Proposed portfolio allocation
            is not available yet.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {diffRows.map((row) => (
              <div
                key={row.name}
                className="flex items-center justify-between rounded-lg bg-[#f8faff] px-4 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        row.color,
                    }}
                  />

                  <span className="text-[11px] font-semibold text-[#16213e]">
                    {row.name}
                  </span>
                </div>

                <span
                  className={
                    row.diff > 0
                      ? "text-[11px] font-bold text-[#00875a]"
                      : row.diff < 0
                        ? "text-[11px] font-bold text-red-500"
                        : "text-[11px] font-bold text-[#64748b]"
                  }
                >
                  {formatSignedPercent(row.diff, 1)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function AllocationCard({
  title,
  items,
}: {
  title: string;
  items: AllocationItem[];
}) {
  const slices = items.map(
    (item) => ({
      key: item.name,
      pct: item.pct,
      color: item.color,
    })
  );

  return (
    <div className="rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-5">
      <h3 className="mb-4 text-[11px] font-bold text-[#64748b]">
        {title}
      </h3>

      {items.length === 0 ? (
        <div className="flex min-h-[190px] items-center justify-center text-[11px] italic text-[#9ca3af]">
          No allocation available.
        </div>
      ) : (
        <>
          <div className="flex justify-center">
            <Donut
              slices={slices}
              size={150}
              stroke={18}
            />
          </div>

          <div className="mt-5 space-y-2">
            {items.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-[11px]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        item.color,
                    }}
                  />

                  <span className="font-semibold text-[#16213e]">
                    {item.name}
                  </span>
                </div>

                <span className="font-semibold text-[#64748b]">
                  {item.pct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function buildDiffRows(
  current: AllocationItem[],
  proposed: AllocationItem[]
) {
  if (proposed.length === 0) {
    return [];
  }

  const names = new Set([
    ...current.map(
      (item) => item.name
    ),
    ...proposed.map(
      (item) => item.name
    ),
  ]);

  return Array.from(names).map(
    (name) => {
      const currentItem =
        current.find(
          (item) =>
            item.name === name
        );

      const proposedItem =
        proposed.find(
          (item) =>
            item.name === name
        );

      const currentPct =
        currentItem?.pct ?? 0;

      const proposedPct =
        proposedItem?.pct ?? 0;

      return {
        name,

        diff:
          proposedPct -
          currentPct,

        color:
          proposedItem?.color ??
          currentItem?.color ??
          "#94a3b8",
      };
    }
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";