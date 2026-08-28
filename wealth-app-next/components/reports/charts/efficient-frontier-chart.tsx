"use client";

import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js";

import { Scatter } from "react-chartjs-2";

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip);

type Point = {
  x: number;
  y: number;
};

type Props = {
  profiles: Point[];
  current: Point;
};

export function EfficientFrontierChart({ profiles, current }: Props) {
  const data = {
    datasets: [
      {
        label: "Risk profiles",
        data: profiles,
        pointRadius: 4,
        pointHoverRadius: 4,
        showLine: true,
        borderWidth: 1.5,
        tension: 0.25,
      },

      {
        label: "Your profile",
        data: [current],
        pointRadius: 7,
        pointHoverRadius: 7,
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
        title: {
          display: true,
          text: "Volatility / Risk (sigma %)",
        },

        min: 0,
        max: 28,

        ticks: {
          stepSize: 4,
        },
      },

      y: {
        min: 0,
        max: 15,

        ticks: {
          stepSize: 3,
          callback: (value: string | number) => `${value}%`,
        },
      },
    },
  };

  return (
    <div className="h-[250px] w-full">
      <Scatter data={data} options={options} />
    </div>
  );
}
