"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement);

type Props = {
  assets: number;
  goalCost: number;
  currency: string;
};

export function GoalFundingChart({ assets, goalCost, currency }: Props) {
  const data = {
    labels: ["Assets", "Goals"],

    datasets: [
      {
        data: [assets, goalCost],

        backgroundColor: ["#1265bd", "#99a7b6"],

        borderWidth: 0,
        barPercentage: 0.5,
        categoryPercentage: 0.7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    animation: false as const,

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        enabled: false,
      },
    },

    scales: {
      x: {
        grid: {
          display: false,
        },

        ticks: {
          font: {
            size: 10,
            weight: "bold" as const,
          },
        },
      },

      y: {
        beginAtZero: true,

        ticks: {
          callback: (value: string | number) =>
            formatCompactMoney(Number(value), currency),
        },
      },
    },
  };

  return (
    <div className="h-[245px] w-full">
      <Bar data={data} options={options} />
    </div>
  );
}

function formatCompactMoney(value: number, currency: string) {
  const symbol =
    currency === "USD"
      ? "$"
      : currency === "EUR"
        ? "€"
        : currency === "GBP"
          ? "£"
          : `${currency} `;

  if (value >= 1_000_000) {
    return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${symbol}${(value / 1_000).toFixed(0)}k`;
  }

  return `${symbol}${value.toFixed(0)}`;
}
