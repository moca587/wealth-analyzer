"use client";

import { useEffect, useRef } from "react";

import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

type Series = {
  label: string;
  values: number[];
  color: string;
};

type Props = {
  startYear: number;
  years: number;
  series: Series[];
};

export function AllocationPerformanceChart({
  startYear,
  years,
  series,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    chartRef.current?.destroy();

    const labels = Array.from({ length: years + 1 }, (_, i) =>
      String(startYear + i),
    );

    chartRef.current = new Chart(ctx, {
      type: "line",

      data: {
        labels,

        datasets: series.map((item) => ({
          label: item.label,
          data: item.values,
          borderColor: item.color,
          backgroundColor: item.color,
          borderWidth: item.label === "Your target allocation" ? 3 : 2,
          pointRadius: 0,
          pointHoverRadius: 3,
          tension: 0.2,
        })),
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
            position: "bottom",

            labels: {
              boxWidth: 20,
              boxHeight: 2,
              font: {
                size: 8,
              },
            },
          },

          tooltip: {
            callbacks: {
              label: (ctx) => {
                const value = Number(ctx.raw ?? 0);

                return `${ctx.dataset.label}: ${new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                }).format(value)}`;
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
              font: {
                size: 8,
              },

              callback: (_, index) => {
                // Show roughly every 3 years like legacy.
                return index % 3 === 0 ? labels[index] : "";
              },
            },
          },

          y: {
            beginAtZero: true,

            ticks: {
              font: {
                size: 8,
              },

              callback: (value) =>
                new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                }).format(Number(value)),
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [startYear, years, series]);

  return <canvas ref={canvasRef} />;
}
