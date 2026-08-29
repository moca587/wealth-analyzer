"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";

import { Bar } from "react-chartjs-2";

import { formatMoney } from "@/lib/engine/financial-math";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

type Point = {
  age: number;
  spending: number;
};

type Props = {
  points: Point[];
  currency: string;
};

export function AchievableLifestyleChart({ points, currency }: Props) {
  const data = {
    labels: points.map((point) => point.age),

    datasets: [
      {
        label: "Expected (50%) sustainable annual spending",
        data: points.map((point) => point.spending),

        backgroundColor: "#0867b9",

        borderWidth: 0,

        barPercentage: 0.65,
        categoryPercentage: 0.9,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    animation: false as const,

    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
      },

      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `Sustainable spending: ${formatMoney(
              Number(context.raw),
              currency,
            )} / yr`;
          },
        },
      },
    },

    scales: {
      x: {
        title: {
          display: true,
          text: "Retirement age",
        },

        grid: {
          display: false,
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
    <div className="h-[260px] w-full">
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

  if (Math.abs(value) >= 1_000) {
    return `${symbol}${Math.round(value / 1000)}k`;
  }

  return `${symbol}${Math.round(value)}`;
}
