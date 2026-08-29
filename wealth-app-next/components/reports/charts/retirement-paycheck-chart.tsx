"use client";

import { useEffect, useRef } from "react";

import { Chart, ArcElement, Tooltip, Legend } from "chart.js";

Chart.register(ArcElement, Tooltip, Legend);

const items = [
  {
    label: "State / Social Security",
    value: 30000,
    color: "#0867b9",
  },
  {
    label: "Workplace pension",
    value: 18000,
    color: "#0ea5a8",
  },
  {
    label: "Portfolio withdrawals",
    value: 36000,
    color: "#c8941f",
  },
  {
    label: "Part-time & other",
    value: 6000,
    color: "#00875a",
  },
];

const total = items.reduce((sum, item) => sum + item.value, 0);

export function RetirementPaycheckChart() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tell TypeScript this is specifically a doughnut chart.
  const chartRef = useRef<Chart<"doughnut"> | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const ctx = canvasRef.current.getContext("2d");

    if (!ctx) {
      return;
    }

    chartRef.current?.destroy();

    // Draw "Total" and "$90,000" in the middle.
    const centerLabelPlugin = {
      id: "retirementPaycheckCenterLabel",

      afterDraw(chart: Chart<"doughnut">) {
        const { ctx } = chart;

        const meta = chart.getDatasetMeta(0);
        const firstArc = meta.data[0];

        if (!firstArc) {
          return;
        }

        const x = firstArc.x;
        const y = firstArc.y;

        ctx.save();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillStyle = "#6b7280";
        ctx.font = "8px Arial";

        ctx.fillText("Total", x, y - 8);

        ctx.fillStyle = "#30343b";
        ctx.font = "bold 10px Arial";

        ctx.fillText(formatMoney(total), x, y + 7);

        ctx.restore();
      },
    };

    chartRef.current = new Chart<"doughnut">(ctx, {
      type: "doughnut",

      plugins: [centerLabelPlugin],

      data: {
        labels: items.map((item) => item.label),

        datasets: [
          {
            data: items.map((item) => item.value),

            backgroundColor: items.map((item) => item.color),

            borderWidth: 0,

            hoverOffset: 0,
          },
        ],
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,

        // This now works because Chart is typed as "doughnut".
        cutout: "55%",

        layout: {
          padding: {
            top: 5,
            right: 5,
            bottom: 5,
            left: 5,
          },
        },

        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const value = Number(ctx.raw ?? 0);

                const percent =
                  total > 0 ? Math.round((value / total) * 100) : 0;

                return `${ctx.label}: ${formatMoney(value)} · ${percent}%`;
              },
            },
          },

          legend: {
            position: "right",

            labels: {
              boxWidth: 10,
              boxHeight: 10,

              padding: 12,

              font: {
                size: 8,
              },

              generateLabels: () => {
                return items.map((item, index) => {
                  const percent =
                    total > 0 ? Math.round((item.value / total) * 100) : 0;

                  return {
                    text: `${item.label}  ${formatMoney(
                      item.value,
                    )} · ${percent}%`,

                    fillStyle: item.color,

                    strokeStyle: item.color,

                    lineWidth: 0,

                    hidden: false,

                    index,
                  };
                });
              },
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  return <canvas ref={canvasRef} />;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
