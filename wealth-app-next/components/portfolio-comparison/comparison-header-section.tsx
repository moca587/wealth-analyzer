"use client";

type Props = {
  simulations: number;
  years: number;
  isRunning: boolean;
  onRefresh: () => void;
};

export function ComparisonHeaderSection({
  simulations,
  years,
  isRunning,
  onRefresh,
}: Props) {
  return (
    <section className={sectionClass}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className={titleClass}>
            Portfolio vs Proposal
          </h2>

          <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
            <span className="font-semibold text-[#16213e]">
              Comparison ready.
            </span>{" "}
            {simulations.toLocaleString()} paths × {years}y horizon.
            Current vs Proposed evaluated under the same household,
            expense, savings, and tax assumptions.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRunning}
          className={buttonClass}
        >
          {isRunning
            ? "Refreshing..."
            : "Refresh comparison"}
        </button>
      </div>
    </section>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const buttonClass =
  "rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-4 py-2 text-[11px] font-semibold text-[#0057b8] transition hover:border-[#0057b8] hover:bg-[#f8faff] disabled:cursor-not-allowed disabled:opacity-50";