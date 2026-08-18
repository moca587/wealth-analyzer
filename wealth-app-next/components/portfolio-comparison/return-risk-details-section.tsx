type Props = {
  currentGrossReturn?: number;
  currentAdvisoryFee?: number;
  currentNetReturn?: number;
  currentVolatility?: number;

  proposedGrossReturn?: number;
  proposedAdvisoryFee?: number;
  proposedNetReturn?: number;
  proposedVolatility?: number;
};

export function ReturnRiskDetailsSection({
  currentGrossReturn,
  currentAdvisoryFee,
  currentNetReturn,
  currentVolatility,

  proposedGrossReturn,
  proposedAdvisoryFee,
  proposedNetReturn,
  proposedVolatility,
}: Props) {
  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Return & Risk Profile — Detailed Figures
      </h2>

      <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
        Gross return, advisory fee, net return and volatility for each
        portfolio. These are the{" "}
        <strong className="text-[#16213e]">
          forward-looking expected
        </strong>{" "}
        figures — not historical trailing returns.
      </p>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[rgba(0,87,184,.10)] bg-[#f8faff]">
              <th className={thClass}>
                Metric
              </th>

              <th className={thClass}>
                Current portfolio
              </th>

              <th className={thClass}>
                Proposed portfolio
              </th>

              <th className={thClass}>
                Variance
              </th>
            </tr>
          </thead>

          <tbody>
            <MetricRow
              label="Gross return"
              current={currentGrossReturn}
              proposed={proposedGrossReturn}
            />

            <MetricRow
              label="Advisory fee"
              current={currentAdvisoryFee}
              proposed={proposedAdvisoryFee}
            />

            <MetricRow
              label="Net return"
              current={currentNetReturn}
              proposed={proposedNetReturn}
              emphasize
            />

            <MetricRow
              label="Volatility"
              current={currentVolatility}
              proposed={proposedVolatility}
            />
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MetricRow({
  label,
  current,
  proposed,
  emphasize = false,
}: {
  label: string;
  current?: number;
  proposed?: number;
  emphasize?: boolean;
}) {
  const variance =
    current != null &&
    proposed != null
      ? proposed - current
      : undefined;

  return (
    <tr className="border-b border-[rgba(0,87,184,.07)] last:border-b-0">
      <td className={tdClass}>
        <span className="font-semibold text-[#64748b]">
          {label}
        </span>
      </td>

      <td className={tdClass}>
        <span
          className={
            emphasize
              ? "font-bold text-[#16213e]"
              : "text-[#16213e]"
          }
        >
          {formatPercent(current)}
        </span>
      </td>

      <td className={tdClass}>
        <span
          className={
            emphasize
              ? "font-bold text-[#16213e]"
              : "text-[#16213e]"
          }
        >
          {formatPercent(proposed)}
        </span>
      </td>

      <td className={tdClass}>
        <span className={varianceClass(variance)}>
          {formatVariance(variance)}
        </span>
      </td>
    </tr>
  );
}

function formatPercent(
  value: number | undefined
): string {
  if (value == null) {
    return "—";
  }

  return `${value.toFixed(2)}%`;
}

function formatVariance(
  value: number | undefined
): string {
  if (value == null) {
    return "—";
  }

  const sign =
    value > 0
      ? "+"
      : "";

  return `${sign}${value.toFixed(2)}%`;
}

function varianceClass(
  value: number | undefined
): string {
  if (value == null) {
    return "text-[#9ca3af]";
  }

  if (value > 0) {
    return "font-semibold text-[#00875a]";
  }

  if (value < 0) {
    return "font-semibold text-red-500";
  }

  return "font-semibold text-[#64748b]";
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const thClass =
  "px-3 py-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]";

const tdClass =
  "px-3 py-3 text-[11px]";