"use client";

import { useEffect, useRef } from "react";

import { formatMoney } from "@/lib/engine/financial-math";

import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";

Chart.register(CategoryScale, LinearScale, BarElement, Tooltip);

type BarItem = {
  label: string;
  value: number;
  color: string;
};

type Props = {
  items: BarItem[];
  format?: "money" | "percent";
};

export function EducationBarChart({ items, format = "money" }: Props) {
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

    chartRef.current?.destroy();

    const valueLabelPlugin = {
      id: "valueLabelPlugin",

      afterDatasetsDraw(chart: Chart) {
        const { ctx } = chart;

        ctx.save();

        const meta = chart.getDatasetMeta(0);

        meta.data.forEach((bar, index) => {
          const value = items[index]?.value ?? 0;
          const color = items[index]?.color ?? "#30343b";

          ctx.font = "bold 8px Arial";
          ctx.fillStyle = color;
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";

          ctx.fillText(formatValue(value, format), bar.x, bar.y - 5);
        });

        ctx.restore();
      },
    };

    chartRef.current = new Chart(ctx, {
      type: "bar",

      plugins: [valueLabelPlugin],

      data: {
        labels: items.map((item) => item.label),

        datasets: [
          {
            data: items.map((item) => item.value),

            backgroundColor: items.map((item) => item.color),

            borderWidth: 0,

            barPercentage: 0.55,
            categoryPercentage: 0.75,
          },
        ],
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,

        plugins: {
          legend: {
            display: false,
          },

          tooltip: {
            callbacks: {
              label: (ctx) => formatValue(Number(ctx.raw ?? 0), format),
            },
          },
        },

        scales: {
          x: {
            grid: {
              display: false,
            },

            ticks: {
              font: {
                size: 7,
              },

              color: "#6b7280",
            },
          },

          y: {
            beginAtZero: true,

            grid: {
              color: "rgba(107,114,128,0.16)",
            },

            ticks: {
              display: false,
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [items, format]);

  return <canvas ref={canvasRef} />;
}

function formatValue(value: number, format: "money" | "percent") {
  if (format === "percent") {
    return `${value.toFixed(1)}%`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
