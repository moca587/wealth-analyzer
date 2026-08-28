"use client";

import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";

import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip);

type Props = {
  allocation: {
    equity: number;
    fixed_income: number;
    real_estate: number;
    alternative: number;
    cash: number;
  };
};

export function IpsAllocationChart({ allocation }: Props) {
  const data = {
    labels: [
      "Global Equity",
      "Fixed Income",
      "Real Assets / REITs",
      "Alternatives",
      "Cash & Equivalents",
    ],

    datasets: [
      {
        data: [
          allocation.equity,
          allocation.fixed_income,
          allocation.real_estate,
          allocation.alternative,
          allocation.cash,
        ],

        backgroundColor: [
          "#0867b9",
          "#12a7a5",
          "#7037e8",
          "#df8b17",
          "#7c8795",
        ],

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
