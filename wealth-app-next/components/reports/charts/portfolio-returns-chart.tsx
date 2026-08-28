"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type Returns = {
  oneYear?: number;
  threeYear?: number;
  fiveYear?: number;
  tenYear?: number;
  expected?: number;
};

type Props = {
  current: Returns;
  proposed?: Returns;
};

export function PortfolioReturnsChart({ current, proposed }: Props) {
  const labels = ["1 Yr", "3 Yr", "5 Yr", "10 Yr", "Expected"];

  const data = {
    labels,

    datasets: [
      {
        label: "Current portfolio",
        data: [
          current.oneYear ?? null,
          current.threeYear ?? null,
          current.fiveYear ?? null,
          current.tenYear ?? null,
          current.expected ?? null,
        ],
        backgroundColor: "#5b9bd5",

        borderWidth: 0,
      },

      ...(proposed
        ? [
            {
              label: "Proposed portfolio",
              data: [
                proposed.oneYear ?? null,
                proposed.threeYear ?? null,
                proposed.fiveYear ?? null,
                proposed.tenYear ?? null,
                proposed.expected ?? null,
              ],
              backgroundColor: "#7c3aed",

              borderWidth: 0,
            },
          ]
        : []),
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,

    plugins: {
      legend: {
        position: "bottom" as const,
      },

      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;

            if (value == null) {
              return `${context.dataset.label}: —`;
            }

            return `${context.dataset.label}: ${Number(value).toFixed(1)}%`;
          },
        },
      },
    },

    scales: {
      y: {
        beginAtZero: true,

        ticks: {
          callback: (value: string | number) => `${value}%`,
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
