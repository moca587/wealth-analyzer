type Props = {
  onApply?: () => void;
};

export function AiPortfolioNextSteps({ onApply }: Props) {
  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>What&apos;s next?</h2>

      <ol className="mt-4 space-y-3 text-[12px] leading-5 text-[#475569]">
        <li className="flex gap-3">
          <span className="font-bold text-[#0057b8]">1.</span>

          <span>Apply these positions to your Investment Proposal.</span>
        </li>

        <li className="flex gap-3">
          <span className="font-bold text-[#0057b8]">2.</span>

          <span>
            Run a market simulation to see how this portfolio might perform over
            time.
          </span>
        </li>

        <li className="flex gap-3">
          <span className="font-bold text-[#0057b8]">3.</span>

          <span>
            Generate a PDF report to share with family or your advisor.
          </span>
        </li>
      </ol>

      <button
        type="button"
        onClick={onApply}
        className="mt-6 rounded-full bg-[#0057b8] px-6 py-3 text-[12px] font-bold text-white hover:bg-[#0069d9]"
      >
        Apply to Investment Proposal
      </button>
    </section>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";
