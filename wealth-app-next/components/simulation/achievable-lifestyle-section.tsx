"use client";

import { useEffect, useRef } from "react";

import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  Tooltip,
} from "chart.js";

import type { AchievableLifestyleSummary } from "@/lib/engine/achievable-lifestyle";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

type Props = {
  data: AchievableLifestyleSummary;
  currency: string;
  asOfYear: number;
};

export function AchievableLifestyleSection({
  data,
  currency,
  asOfYear,
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

    // Destroy old chart before creating
    // a new one.
    chartRef.current?.destroy();

    chartRef.current = new Chart(ctx, {
      type: "bar",

      data: {
        labels: data.chart.map((point) => String(point.retirementAge)),

        datasets: [
          {
            label: "Expected achievable annual lifestyle",

            // The visible bars use the
            // expected / 50% case.
            data: data.chart.map((point) => point.expected),

            backgroundColor: "#c9a96e",

            borderWidth: 0,

            borderRadius: 4,

            barPercentage: 0.72,

            categoryPercentage: 0.9,
          },
        ],
      },

      options: {
        responsive: true,

        maintainAspectRatio: false,

        animation: false,

        interaction: {
          mode: "index",
          intersect: false,
        },

        plugins: {
          legend: {
            display: false,
          },

          tooltip: {
            callbacks: {
              title: (items) => {
                const index = items[0]?.dataIndex ?? 0;

                const point = data.chart[index];

                if (!point) {
                  return "";
                }

                const retirementYear =
                  asOfYear + Math.max(0, point.retirementAge - data.currentAge);

                return (
                  `Retire at age ` +
                  `${point.retirementAge} ` +
                  `(≈ ${retirementYear})`
                );
              },

              label: (context) => {
                const point = data.chart[context.dataIndex];

                if (!point) {
                  return "";
                }

                return (
                  `Expected (50%): ` +
                  `${formatMoney(point.expected, currency)}/yr`
                );
              },

              afterBody: (items) => {
                const index = items[0]?.dataIndex ?? 0;

                const point = data.chart[index];

                if (!point) {
                  return [];
                }

                return [
                  `Optimistic (30%): ${formatMoney(
                    point.optimistic,
                    currency,
                  )}/yr`,

                  `Conservative (80%): ${formatMoney(
                    point.conservative,
                    currency,
                  )}/yr`,
                ];
              },
            },
          },
        },

        scales: {
          x: {
            grid: {
              display: false,
            },

            ticks: {
              color: "#64748b",

              font: {
                size: 10,
              },
            },

            title: {
              display: true,

              text: "Retirement age",

              color: "#64748b",

              font: {
                size: 10,
                weight: "bold",
              },
            },
          },

          y: {
            beginAtZero: true,

            grid: {
              color: "rgba(0,87,184,.06)",
            },

            ticks: {
              color: "#64748b",

              font: {
                size: 10,
              },

              callback: (value) => formatCompactMoney(Number(value), currency),
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();

      chartRef.current = null;
    };
  }, [data, currency, asOfYear]);

  return (
    <section className={sectionClass}>
      {/* Header */}
      <h2 className={titleClass}>Potentially Achievable Annual Lifestyle</h2>

      <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
        Estimated sustainable annual retirement spending in today&apos;s
        dollars.
      </p>

      {/* Chart */}
      <div className="mt-6">
        <div className="mb-3 text-[11px] font-semibold text-[#64748b]">
          Expected achievable annual lifestyle by retirement age
        </div>

        <div className="h-[330px] rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4">
          <canvas ref={canvasRef} />
        </div>

        <p className="mt-3 text-[10px] leading-4 text-[#9ca3af]">
          Each bar is the <strong className="text-[#64748b]">expected</strong>{" "}
          sustainable annual spending in today&apos;s dollars if you retired at
          that age. Hover a bar for the optimistic and conservative cases.
        </p>
      </div>

      {/* Three scenarios */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <LifestyleCard
          label="Conservative"
          confidence="80%"
          amount={data.conservative.annualSpending}
          wealth={data.conservative.wealthAtRetirement}
          planToAge={data.planToAge}
          currency={currency}
        />

        <LifestyleCard
          label="Expected"
          confidence="50%"
          amount={data.expected.annualSpending}
          wealth={data.expected.wealthAtRetirement}
          planToAge={data.planToAge}
          currency={currency}
        />

        <LifestyleCard
          label="Optimistic"
          confidence="30%"
          amount={data.optimistic.annualSpending}
          wealth={data.optimistic.wealthAtRetirement}
          planToAge={data.planToAge}
          currency={currency}
        />
      </div>

      {/* Footer */}
      <div className="mt-5 rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] px-4 py-3">
        <p className="text-[10px] leading-5 text-[#64748b]">
          Figures are shown in today&apos;s money and estimate the annual
          spending supported by projected investable wealth through age{" "}
          {data.planToAge}.
        </p>
      </div>
    </section>
  );
}

function LifestyleCard({
  label,
  confidence,
  amount,
  wealth,
  planToAge,
  currency,
}: {
  label: string;
  confidence: string;
  amount: number;
  wealth: number;
  planToAge: number;
  currency: string;
}) {
  return (
    <div className="rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-5">
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
          {label} ({confidence})
        </span>

        <span
          className="cursor-help text-[10px] text-[#94a3b8]"
          title={`${confidence} confidence case`}
        >
          ⓘ
        </span>
      </div>

      <div className="mt-3 text-[27px] font-extrabold tracking-tight text-[#16213e]">
        {formatCompactMoney(amount, currency)}
      </div>

      <div className="mt-1 text-[11px] text-[#64748b]">
        per year, to age {planToAge} · today&apos;s money
      </div>

      <div className="mt-4 border-t border-[rgba(0,87,184,.08)] pt-3 text-[10px] leading-5 text-[#64748b]">
        Wealth at retirement{" "}
        <strong className="text-[#16213e]">
          {formatCompactMoney(wealth, currency)}
        </strong>
      </div>
    </div>
  );
}

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactMoney(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(value);
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass = "text-[16px] font-bold text-[#16213e]";
