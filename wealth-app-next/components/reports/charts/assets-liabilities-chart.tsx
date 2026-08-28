"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";

import { Bar } from "react-chartjs-2";

// CategoryScale = x-axis categories
// LinearScale = numerical y-axis
// BarElement = ability to draw bars
ChartJS.register(CategoryScale, LinearScale, BarElement);

type Props = {
  assets: number;
  liabilities: number;
  netWorth: number;
  currency: string;
};

export function AssetsLiabilitiesChart({
  assets,
  liabilities,
  netWorth,
  currency,
}: Props) {
  const values = [assets, liabilities, netWorth];

  const data = {
    labels: ["Assets", "Liabilities", "Net Worth"],

    datasets: [
      {
        data: values,

        backgroundColor: ["#12a7a5", "#df8b17", "#1265bd"],

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

    // Gives the dollar labels room above the tallest bar.
    layout: {
      padding: {
        top: 20,
      },
    },

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

        border: {
          color: "#9ca3af",
        },

        ticks: {
          color: "#70777e",

          font: {
            size: 8,
          },
        },
      },

      y: {
        beginAtZero: true,

        suggestedMax: Math.max(...values) * 1.15,

        grid: {
          color: "#e1e4e8",
          lineWidth: 1,
        },

        border: {
          color: "#9ca3af",
        },

        ticks: {
          display: false,
        },

        title: {
          display: true,
          text: "$ value",
          color: "#70777e",

          font: {
            size: 8,
            style: "italic" as const,
          },
        },
      },
    },
  };

  const valueLabelPlugin = {
    id: "netWorthValueLabels",

    afterDatasetsDraw(chart: any) {
      const { ctx } = chart;

      const meta = chart.getDatasetMeta(0);

      ctx.save();

      ctx.font = "bold 9px Arial";

      ctx.textAlign = "center";

      ctx.textBaseline = "bottom";

      meta.data.forEach((bar: any, index: number) => {
        ctx.fillStyle = ["#078f8f", "#c8790d", "#0b58a7"][index];

        ctx.fillText(formatMoney(values[index], currency), bar.x, bar.y - 6);
      });

      ctx.restore();
    },
  };

  return (
    <div className="h-[255px] w-full">
      <Bar data={data} options={options} plugins={[valueLabelPlugin]} />
    </div>
  );
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
