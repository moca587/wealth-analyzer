"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import { Line } from "react-chartjs-2";

import type { SimulationResult } from "@/lib/engine/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

type Props = {
  result: SimulationResult;
  currency: string;
  startYear: number;
  startAge: number;
};

export function WealthProjectionChart({
  result,
  currency,
  startYear,
  startAge,
}: Props) {
  const years = Array.from(
    {
      length: result.years + 1,
    },
    (_, index) => startYear + index,
  );

  const p80 = result.realPercentiles["p80"] ?? [];

  const p50 = result.realPercentiles["p50"] ?? [];

  const p30 = result.realPercentiles["p30"] ?? [];

  const data = {
    labels: years,

    datasets: [
      {
        label: "80% likelihood (conservative)",
        data: p80,
        borderColor: "#16734f",
        backgroundColor: "rgba(22,115,79,0.08)",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.25,
        fill: false,
      },

      {
        label: "50% likelihood (expected)",
        data: p50,
        borderColor: "#0068c9",
        backgroundColor: "rgba(0,104,201,0.20)",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.25,

        // Fill down toward p80
        fill: "-1",
      },

      {
        label: "30% likelihood (optimistic)",
        data: p30,
        borderColor: "#7137e8",
        backgroundColor: "rgba(113,55,232,0.15)",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.25,

        // Fill down toward p50
        fill: "-1",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    interaction: {
      mode: "index" as const,
      intersect: false,
    },

    plugins: {
      legend: {
        position: "top" as const,
      },

      tooltip: {
        callbacks: {
          title: (items: any[]) => {
            const index = items[0]?.dataIndex ?? 0;

            const year = startYear + index;

            const age = startAge + index;

            return `Year ${year} · age ${age}`;
          },

          label: (context: any) => {
            const label = context.dataset.label ?? "";

            const value = Number(context.raw);

            return `${label}: ${formatMoney(value, currency)}`;
          },
        },
      },
    },

    scales: {
      x: {
        ticks: {
          maxTicksLimit: 10,
        },

        grid: {
          display: false,
        },
      },

      y: {
        ticks: {
          callback: (value: string | number) =>
            formatCompactMoney(Number(value), currency),
        },
      },
    },
  };

  return (
    <div className="h-[460px] w-full">
      <Line data={data} options={options} />
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
  const symbol =
    currency === "USD"
      ? "$"
      : currency === "EUR"
        ? "€"
        : currency === "GBP"
          ? "£"
          : `${currency} `;

  const sign = value < 0 ? "-" : "";

  const abs = Math.abs(value);

  if (abs >= 1_000_000) {
    return `${sign}${symbol}${(abs / 1_000_000).toFixed(1)}M`;
  }

  if (abs >= 1_000) {
    return `${sign}${symbol}${(abs / 1_000).toFixed(0)}k`;
  }

  return `${sign}${symbol}${abs.toFixed(0)}`;
}
