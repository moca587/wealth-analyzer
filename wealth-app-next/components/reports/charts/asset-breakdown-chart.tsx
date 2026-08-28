"use client";

import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";

import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip);

type Item = {
  label: string;
  value: number;
  color: string;
};

export function AssetBreakdownChart({ items }: { items: Item[] }) {
  const filtered = items.filter((item) => item.value > 0);

  const data = {
    labels: filtered.map((item) => item.label),

    datasets: [
      {
        data: filtered.map((item) => item.value),

        backgroundColor: filtered.map((item) => item.color),

        borderWidth: 0,
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
  };

  return <Pie data={data} options={options} />;
}
