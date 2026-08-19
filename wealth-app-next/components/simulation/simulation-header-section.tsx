type Props = {
  running: boolean;
  onRun: () => void;
};

export function SimulationHeaderSection({ running, onRun }: Props) {
  return (
    <section className={sectionClass}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className={titleClass}>Run Simulation</h2>

          <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
            Fine-tune projection years, simulations, probability bands and
            stress scenarios in the{" "}
            <strong className="text-[#16213e]">Settings</strong> panel (gear,
            top-right).
          </p>
        </div>

        <button
          type="button"
          onClick={onRun} // run monte carlo
          disabled={running}
          className={buttonClass}
        >
          {running ? "Running simulation..." : "Run Simulation"}
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
  "rounded-full bg-[#0057b8] px-5 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#0069d9] disabled:cursor-not-allowed disabled:opacity-50";
