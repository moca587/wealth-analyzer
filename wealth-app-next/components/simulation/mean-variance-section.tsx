"use client";

import { useEffect, useMemo, useRef } from "react";

import {
  Chart,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

import type { WealthPlan } from "@/lib/engine/types";
import { RISK_PROFILES } from "@/lib/engine/constants";

Chart.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

type Props = {
  plan: WealthPlan;
};

const PROFILE_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
  }
> = {
  very_conservative: {
    label: "Very Conservative",
    color: "#60a5fa",
  },
  conservative: {
    label: "Conservative",
    color: "#5b9bd5",
  },
  moderately_conservative: {
    label: "Mod. Conservative",
    color: "#34d399",
  },
  moderate: {
    label: "Moderate",
    color: "#10b981",
  },
  moderately_aggressive: {
    label: "Mod. Aggressive",
    color: "#1d4ed8",
  },
  aggressive: {
    label: "Aggressive",
    color: "#f59e0b",
  },
  very_aggressive: {
    label: "Very Aggressive",
    color: "#ef4444",
  },
};

export function MeanVarianceSection({ plan }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const chartRef = useRef<Chart | null>(null);

  const currentRisk = plan.clients[0]?.risk ?? "moderate";

  const points = useMemo(
    () =>
      Object.entries(RISK_PROFILES).map(([key, profile]) => ({
        key,

        label: PROFILE_CONFIG[key]?.label ?? key,

        color: PROFILE_CONFIG[key]?.color ?? "#94a3b8",

        x: profile.sigma,
        y: profile.mu,
      })),
    [],
  );

  const currentPoint = points.find((point) => point.key === currentRisk);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const ctx = canvasRef.current.getContext("2d");

    if (!ctx) {
      return;
    }

    chartRef.current?.destroy();

    chartRef.current = new Chart(ctx, {
      type: "scatter",

      data: {
        datasets: [
          // Dashed risk / return curve
          {
            label: "Efficient frontier",

            data: points.map((point) => ({
              x: point.x,
              y: point.y,
            })),

            showLine: true,

            borderColor: "#0057b8",

            backgroundColor: "transparent",

            borderDash: [7, 5],

            borderWidth: 2,

            // The colored profile dots are rendered below,
            // so don't draw points on this line.
            pointRadius: 0,

            pointHoverRadius: 0,

            tension: 0.25,
          },

          // One colored dot per risk profile
          ...points.map((point) => ({
            label: point.label,

            data: [
              {
                x: point.x,
                y: point.y,
              },
            ],

            showLine: false,

            backgroundColor: point.color,

            borderColor: "#ffffff",

            pointRadius: 8,

            pointHoverRadius: 10,

            pointBorderWidth: 2,
          })),

          // Larger ring around the client's selected profile
          ...(currentPoint
            ? [
                {
                  label: "Your profile",

                  data: [
                    {
                      x: currentPoint.x,
                      y: currentPoint.y,
                    },
                  ],

                  showLine: false,

                  backgroundColor: "transparent",

                  borderColor: "#0057b8",

                  pointRadius: 14,

                  pointHoverRadius: 16,

                  pointBorderWidth: 5,
                },
              ]
            : []),
        ],
      },

      options: {
        responsive: true,

        maintainAspectRatio: false,

        parsing: false,

        interaction: {
          mode: "nearest",
          intersect: true,
        },

        plugins: {
          legend: {
            position: "bottom",

            labels: {
              filter: (item) => item.text !== "Efficient frontier",
            },
          },

          tooltip: {
            callbacks: {
              label: (ctx) => {
                const x = ctx.parsed.x;
                const y = ctx.parsed.y;

                if (x == null || y == null) {
                  return `${ctx.dataset.label}`;
                }

                return `${ctx.dataset.label}: return ${y.toFixed(
                  1,
                )}% · volatility ${x.toFixed(1)}%`;
              },
            },
          },
        },

        scales: {
          x: {
            title: {
              display: true,
              text: "Volatility / Risk (σ %)",
            },

            suggestedMin: 0,
            suggestedMax: 28,
          },

          y: {
            title: {
              display: true,
              text: "Expected Return (μ %)",
            },

            suggestedMin: 0,
            suggestedMax: 15,
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [points, currentPoint]);

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Mean-Variance Optimization — Efficient Frontier
      </h2>

      <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
        <strong className="text-[#16213e]">
          The trade-off between risk and reward, in one picture.
        </strong>{" "}
        Each point represents an investment risk profile. Moving right means
        greater expected volatility; moving upward means a higher expected
        long-run return.
      </p>

      <div className="mt-5 relative h-[430px] rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4">
        <canvas ref={canvasRef} />
      </div>

      <div className="mt-5 rounded-xl bg-[#f8faff] p-4 text-[11px] leading-5 text-[#64748b]">
        <strong className="text-[#16213e]">How to read it:</strong> σ (sigma) is
        annual volatility and μ (mu) is expected arithmetic annual return. The
        larger point identifies the household&apos;s selected risk profile.
      </div>
    </section>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";
