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
  Filler,
} from "chart.js";

import type { AnnualWealthRow } from "../pages/chapter-6/annual-potential-wealth-page";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

type Props = {
  rows: AnnualWealthRow[];
  currency: string;
  retirementAge?: number;
};

export function AnnualPotentialWealthChart({ rows, currency }: Props) {
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

    chartRef.current = new Chart(ctx, {
      type: "line",

      data: {
        labels: rows.map((row) =>
          row.age != null ? `${row.year}\nage ${row.age}` : String(row.year),
        ),

        datasets: [
          {
            label: "80% likelihood (conservative)",

            data: rows.map((row) => row.conservative),

            borderColor: "#287a52",
            backgroundColor: "rgba(40,122,82,.12)",

            pointRadius: 0,
            borderWidth: 2,
            tension: 0.25,
          },

          {
            label: "50% likelihood (expected)",

            data: rows.map((row) => row.expected),

            borderColor: "#0867b9",
            backgroundColor: "rgba(8,103,185,.10)",

            pointRadius: 0,
            borderWidth: 3,
            tension: 0.25,
          },

          {
            label: "30% likelihood (optimistic)",

            data: rows.map((row) => row.optimistic),

            borderColor: "#7c3aed",
            backgroundColor: "rgba(124,58,237,.08)",

            pointRadius: 0,
            borderWidth: 2,
            tension: 0.25,
          },
        ],
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,

        plugins: {
          legend: {
            position: "bottom",

            labels: {
              font: {
                size: 8,
              },
            },
          },

          tooltip: {
            callbacks: {
              label: (ctx) =>
                `${ctx.dataset.label}: ${formatMoney(
                  Number(ctx.raw ?? 0),
                  currency,
                )}`,
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
            },
          },

          y: {
            beginAtZero: true,

            ticks: {
              font: {
                size: 8,
              },

              callback: (value) => compactMoney(Number(value), currency),
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [rows, currency]);

  return <canvas ref={canvasRef} />;
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function compactMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(value);
}
