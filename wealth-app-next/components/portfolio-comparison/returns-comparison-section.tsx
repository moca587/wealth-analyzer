"use client";

import { useEffect, useRef } from "react";

import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

type ReturnHorizon = {
  oneYear?: number;
  threeYear?: number;
  fiveYear?: number;
  tenYear?: number;
};

type Props = {
  currentTrailing?: ReturnHorizon;
  proposedTrailing?: ReturnHorizon;
  currentExpectedReturn?: number;
  currentVolatility?: number;

  proposedExpectedReturn?: number;
  proposedVolatility?: number;
};

export function ReturnsComparisonSection({
  currentTrailing,
  proposedTrailing,

  currentExpectedReturn,
  currentVolatility,

  proposedExpectedReturn,
  proposedVolatility,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const ctx = canvasRef.current.getContext("2d");

    if (!ctx) {
      return;
    }

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    chartRef.current = new Chart(ctx, {
      type: "bar",

      data: {
        labels: ["1 yr", "3 yr", "5 yr", "10 yr", "Expected"],

        datasets: [
          {
            label: "Current",

            data: [
              currentTrailing?.oneYear ?? null,
              currentTrailing?.threeYear ?? null,
              currentTrailing?.fiveYear ?? null,
              currentTrailing?.tenYear ?? null,
              currentExpectedReturn ?? null,
            ],

            backgroundColor: "#5b9bd5",
            borderRadius: 5,
          },

          {
            label: "Proposed",

            data: [
              proposedTrailing?.oneYear ?? null,
              proposedTrailing?.threeYear ?? null,
              proposedTrailing?.fiveYear ?? null,
              proposedTrailing?.tenYear ?? null,
              proposedExpectedReturn ?? null,
            ],

            backgroundColor: "#7c3aed",
            borderRadius: 5,
          },
        ],
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        interaction: {
          mode: "index",
          intersect: false,
        },

        plugins: {
          legend: {
            position: "top",
          },

          tooltip: {
            callbacks: {
              label: (ctx) => {
                const value = ctx.parsed.y;

                if (value == null) {
                  return `${ctx.dataset.label}: —`;
                }

                return `${ctx.dataset.label}: ${value.toFixed(2)}%`;
              },
            },
          },
        },

        scales: {
          y: {
            beginAtZero: true,

            ticks: {
              callback: (value) => `${value}%`,
            },
          },

          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [
    currentTrailing,
    proposedTrailing,
    currentExpectedReturn,
    proposedExpectedReturn,
  ]);

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Portfolio Returns — Past vs Expected</h2>

      <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
        The <strong className="text-[#16213e]">same two portfolios</strong>,
        shown two ways.{" "}
        <strong className="text-[#16213e]">Left of “today”</strong> is what the
        funds actually returned (annualized) over each past period;{" "}
        <strong className="text-[#16213e]">right of “today”</strong> is the
        long-run return this mix is expected to average, net of fees. They
        differ because the future isn&apos;t a replay of the past.
      </p>

      <div className="mt-5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">
        <span>◀ Looking back · actual returns</span>

        <span>Looking forward · expected ▶</span>
      </div>

      <div className="relative mt-3 h-[360px] rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-5">
        <canvas ref={canvasRef} />
      </div>

      <div className="mt-6">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
          Expected (long-run) — net of fees
        </h3>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <ReturnCard
            label="Current"
            expectedReturn={currentExpectedReturn}
            volatility={currentVolatility}
          />

          <ReturnCard
            label="Proposed"
            expectedReturn={proposedExpectedReturn}
            volatility={proposedVolatility}
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
        <span className="text-[11px] text-[#64748b]">expected</span>

        <strong className="text-[20px] font-extrabold text-[#16213e]">
          {formatPercent(expectedReturn)}
        </strong>

        <span className="text-[11px] text-[#64748b]">/yr net</span>
      </div>

      <div className="mt-1 text-[11px] text-[#64748b]">
        volatility{" "}
        <strong className="text-[#16213e]">
          {formatPercent(volatility, 0)}
        </strong>
      </div>
    </div>
  );
}

function formatPercent(value: number | undefined, digits = 1): string {
  if (value == null) {
    return "—";
  }

  return `${value.toFixed(digits)}%`;
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";
