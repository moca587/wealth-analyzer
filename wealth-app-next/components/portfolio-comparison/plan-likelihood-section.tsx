type Props = {
  currentReturn?: number;
  currentVolatility?: number;
  proposedReturn?: number;
  proposedVolatility?: number;
};

export function PlanLikelihoodSection({
  currentReturn,
  currentVolatility,
  proposedReturn,
  proposedVolatility,
}: Props) {
  const message = getLikelihoodMessage({
    currentReturn,
    currentVolatility,
    proposedReturn,
    proposedVolatility,
  });

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Plan Likelihood</h2>

      <p className="mt-3 text-[13px] leading-6 text-[#64748b]">{message}</p>
    </section>
  );
}

function getLikelihoodMessage({
  currentReturn,
  currentVolatility,
  proposedReturn,
  proposedVolatility,
}: Props): string {
  if (currentReturn == null || proposedReturn == null) {
    return "Comparison results are not available yet.";
  }

  const difference = proposedReturn - currentReturn;

  // Legacy threshold:
  // 0.005 in decimal return = 0.5 percentage points.
  if (Math.abs(difference) <= 0.5) {
    return "Both portfolios are roughly equivalent on these inputs.";
  }

  if (difference > 0.5) {
    const volatilityText =
      proposedVolatility != null &&
      currentVolatility != null &&
      proposedVolatility > currentVolatility
        ? "more"
        : "comparable";

    return (
      `Proposed shows a higher expected return ` +
      `(+${difference.toFixed(2)}%) — at the cost of ` +
      `${volatilityText} volatility.`
    );
  }

  return (
    "Current has the higher expected return — " +
    "Proposed appears more conservative."
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";
