type Props = {
  currentExpectedReturn?: number;
  currentVolatility?: number;

  proposedExpectedReturn?: number;
  proposedVolatility?: number;
};

export function ReturnsComparisonSection({
  currentExpectedReturn,
  currentVolatility,
  proposedExpectedReturn,
  proposedVolatility,
}: Props) {
  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Portfolio Returns — Past vs Expected
      </h2>

      <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
        The{" "}
        <strong className="text-[#16213e]">
          same two portfolios
        </strong>
        , shown two ways.{" "}
        <strong className="text-[#16213e]">
          Left of “today”
        </strong>{" "}
        is what the funds actually returned
        (annualized) over each past period;{" "}
        <strong className="text-[#16213e]">
          right of “today”
        </strong>{" "}
        is the long-run return this mix is
        expected to average, net of fees.
        They differ because the future
        isn&apos;t a replay of the past.
      </p>

      <div className="mt-5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">
        <span>
          ◀ Looking back · actual returns
        </span>

        <span>
          Looking forward · expected ▶
        </span>
      </div>

      <div className="mt-3 rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-5">
        <div className="flex min-h-[180px] items-center justify-center text-center">
          <div>
            <div className="text-[12px] font-semibold text-[#64748b]">
              Historical vs expected return chart
            </div>

            <div className="mt-1 text-[11px] text-[#9ca3af]">
              Chart will be populated once
              both current and proposed
              portfolio data are available.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
          Expected (long-run) — net of fees
        </h3>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <ReturnCard
            label="Current"
            expectedReturn={
              currentExpectedReturn
            }
            volatility={
              currentVolatility
            }
          />

          <ReturnCard
            label="Proposed"
            expectedReturn={
              proposedExpectedReturn
            }
            volatility={
              proposedVolatility
            }
          />
        </div>
      </div>
    </section>
  );
}

function ReturnCard({
  label,
  expectedReturn,
  volatility,
}: {
  label: string;
  expectedReturn?: number;
  volatility?: number;
}) {
  return (
    <div className="rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]">
        {label}
      </div>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-[11px] text-[#64748b]">
          expected
        </span>

        <strong className="text-[20px] font-extrabold text-[#16213e]">
          {formatPercent(
            expectedReturn
          )}
        </strong>

        <span className="text-[11px] text-[#64748b]">
          /yr net
        </span>
      </div>

      <div className="mt-1 text-[11px] text-[#64748b]">
        volatility{" "}
        <strong className="text-[#16213e]">
          {formatPercent(
            volatility,
            0
          )}
        </strong>
      </div>
    </div>
  );
}

function formatPercent(
  value: number | undefined,
  digits = 1
): string {
  if (value == null) {
    return "—";
  }

  return `${value.toFixed(
    digits
  )}%`;
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";