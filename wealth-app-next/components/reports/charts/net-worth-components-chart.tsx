"use client";

import { useEffect, useRef } from "react";

import { formatMoney } from "@/lib/engine/financial-math";

import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

export type CashFlowProjectionRow = {
  year: number;
  age: number | null;
  phase: "Working" | "Retired";
  earnedIncome: number;
  pensionIncome: number;
  expenses: number;
  debtService: number;
  savingsTarget: number;
  surplus: number;
  goalOutflow: number;
  cash: number;
  investments: number;
  retirementPool: number;
  propertyOther: number;
  netWorth: number;
  notes?: string;
};

type Props = {
  rows: CashFlowProjectionRow[];
  currency: string;
};

export function NetWorthComponentsChart({ rows, currency }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    chartRef.current?.destroy();

    chartRef.current = new Chart(ctx, {
      type: "line",

      data: {
        labels: rows.map((row) =>
          row.age != null ? `${row.year}\nage ${row.age}` : String(row.year),
        ),

        datasets: [
          {
            label: "Cash",
            data: rows.map((row) => row.cash),
            fill: true,
            pointRadius: 0,
            borderWidth: 1,
            borderColor: "#7dd3fc",
            backgroundColor: "rgba(125, 211, 252, 0.35)",
          },
          {
            label: "Investments",
            data: rows.map((row) => row.investments),
            fill: true,
            pointRadius: 0,
            borderWidth: 1,
            borderColor: "#0867b9",
            backgroundColor: "rgba(8, 103, 185, 0.30)",
          },
          {
            label: "Retirement pool",
            data: rows.map((row) => row.retirementPool),
            fill: true,
            pointRadius: 0,
            borderWidth: 1,
            borderColor: "#12a7a5",
            backgroundColor: "rgba(18, 167, 165, 0.30)",
          },
          {
            label: "Property & other",
            data: rows.map((row) => row.propertyOther),
            fill: true,
            pointRadius: 0,
            borderWidth: 1,
            borderColor: "#df8b17",
            backgroundColor: "rgba(223, 139, 23, 0.28)",
          },
          {
            label: "Net worth",
            data: rows.map((row) => row.netWorth),
            fill: false,
            pointRadius: 0,
            borderWidth: 3,
            borderColor: "#202938",
            backgroundColor: "#202938",
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
                size: 7,
              },

              // Don't try to print 45 year labels.
              callback: (_, index) =>
                index % 6 === 0 ? (rows[index]?.year ?? "") : "",
            },
          },

          y: {
            grace: "5%",

            ticks: {
              font: {
                size: 7,
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

function compactMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}
