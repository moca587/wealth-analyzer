"use client";

import { useEffect, useRef } from "react";

import { formatMoney } from "@/lib/engine/financial-math";

import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js";

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

export function CompoundingChart() {
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

    const years = [0, 5, 10, 15, 20, 25, 30];

    const fourPercent = years.map((year) =>
      futureValueOfMonthlyContributions(500, 0.04, year),
    );

    const sixPercent = years.map((year) =>
      futureValueOfMonthlyContributions(500, 0.06, year),
    );

    const eightPercent = years.map((year) =>
      futureValueOfMonthlyContributions(500, 0.08, year),
    );

    const endLabelPlugin = {
      id: "endLabelPlugin",

      afterDatasetsDraw(chart: Chart) {
        const { ctx } = chart;

        ctx.save();

        chart.data.datasets.forEach((dataset, datasetIndex) => {
          const meta = chart.getDatasetMeta(datasetIndex);

          const lastPoint = meta.data[meta.data.length - 1];

          if (!lastPoint) return;

          ctx.font = "bold 8px Arial";

          ctx.fillStyle =
            typeof dataset.borderColor === "string"
              ? dataset.borderColor
              : "#30343b";

          ctx.textAlign = "right";
          ctx.textBaseline = "middle";

          ctx.fillText(dataset.label ?? "", lastPoint.x - 3, lastPoint.y - 8);
        });

        ctx.restore();
      },
    };

    chartRef.current = new Chart(ctx, {
      type: "line",

      plugins: [endLabelPlugin],

      data: {
        labels: ["Now", "Yr 5", "Yr 10", "Yr 15", "Yr 20", "Yr 25", "Yr 30"],

        datasets: [
          {
            label: "4% / yr",
            data: fourPercent,

            borderColor: "#00875a",
            backgroundColor: "#00875a",

            borderWidth: 2.5,

            pointRadius: 2,
            pointHoverRadius: 3,

            tension: 0,
          },

          {
            label: "6% / yr",
            data: sixPercent,

            borderColor: "#0867b9",
            backgroundColor: "#0867b9",

            borderWidth: 2.5,

            pointRadius: 2,
            pointHoverRadius: 3,

            tension: 0,
          },

          {
            label: "8% / yr",
            data: eightPercent,

            borderColor: "#c8941f",
            backgroundColor: "#c8941f",

            borderWidth: 2.5,

            pointRadius: 2,
            pointHoverRadius: 3,

            tension: 0,
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
            display: false,
          },

          tooltip: {
            callbacks: {
              label: (ctx) => {
                const value = Number(ctx.raw ?? 0);

                return `${ctx.dataset.label}: ${formatMoney(value)}`;
              },
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

              color: "#6b7280",
            },
          },

          y: {
            beginAtZero: true,

            grid: {
              color: "rgba(107,114,128,0.16)",
            },

            ticks: {
              font: {
                size: 7,
              },

              color: "#94a3b8",

              callback: (value) => formatMoney(Number(value)),
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();

      chartRef.current = null;
    };
  }, []);

  return <canvas ref={canvasRef} />;
}

function futureValueOfMonthlyContributions(
  monthlyContribution: number,
  annualReturn: number,
  years: number,
) {
  if (years === 0) {
    return 0;
  }

  const monthlyRate = annualReturn / 12;

  const numberOfMonths = years * 12;

  return (
    monthlyContribution *
    ((Math.pow(1 + monthlyRate, numberOfMonths) - 1) / monthlyRate)
  );
}
