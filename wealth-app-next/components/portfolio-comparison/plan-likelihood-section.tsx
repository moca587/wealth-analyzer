import {
  formatSignedPercent,
} from "@/lib/portfolio-comparison/format";

type Props = {
  returnDifference?: number;
  volatilityDifference?: number;
};

export function PlanLikelihoodSection({
  returnDifference,
  volatilityDifference,
}: Props) {
  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Plan Likelihood
      </h2>

      <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
        {returnDifference == null ||
        volatilityDifference == null ? (
          <>
            Comparison results are not
            available yet.
          </>
        ) : returnDifference > 0 &&
          volatilityDifference > 0 ? (
          <>
            <strong className="text-[#16213e]">
              Proposed
            </strong>{" "}
            shows a higher expected return (
            {formatSignedPercent(
              returnDifference
            )}
            ) — at the cost of more volatility.
          </>
        ) : returnDifference > 0 &&
          volatilityDifference <= 0 ? (
          <>
            <strong className="text-[#16213e]">
              Proposed
            </strong>{" "}
            shows a higher expected return (
            {formatSignedPercent(
              returnDifference
            )}
            ) without higher expected volatility.
          </>
        ) : (
          <>
            <strong className="text-[#16213e]">
              Proposed
            </strong>{" "}
            does not show a higher expected return
            than the current portfolio.
          </>
        )}
      </p>
    </section>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";