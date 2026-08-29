"use client";

import { useEffect, useRef } from "react";

import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
);

const labels = ["Today", "Yr 5", "Yr 10", "Yr 15", "Yr 20", "Yr 25", "Yr 30"];

const years = [0, 5, 10, 15, 20, 25, 30];

const values = years.map((year) => purchasingPower(100000, 0.03, year));

export function InflationPurchasingPowerChart() {
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

    const valueLabelPlugin = {
      id: "inflationValueLabels",

      afterDatasetsDraw(chart: Chart) {
        const { ctx } = chart;
        const meta = chart.getDatasetMeta(0);

        ctx.save();

        meta.data.forEach((point, index) => {
          // Only label the first and last points.
          if (index !== 0 && index !== values.length - 1) {
            return;
          }

          ctx.font = "bold 8px Arial";
          ctx.fillStyle = "#c84b45";
          ctx.textBaseline = "bottom";

          let x = point.x;

          // First point: move label slightly right.
          if (index === 0) {
            ctx.textAlign = "left";
            x += 4;
          }

          // Last point: move label slightly left.
          else {
            ctx.textAlign = "right";
            x -= 4;
          }

          ctx.fillText(
            formatMoney(roundToNearestThousand(values[index])),
            x,
            point.y - 6,
          );
        });

        ctx.restore();
      },
    };

    chartRef.current = new Chart(ctx, {
      type: "line",

      plugins: [valueLabelPlugin],

      data: {
        labels,

        datasets: [
          {
            label: "Purchasing power",
            data: values,

            borderColor: "#c84b45",
            backgroundColor: "rgba(200, 75, 69, 0.20)",

            fill: true,

            borderWidth: 2.5,

            pointRadius: 2,
            pointHoverRadius: 3,

            tension: 0.15,
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
              label: (ctx) => formatMoney(Number(ctx.raw ?? 0)),
            },
          },
        },

        scales: {
          x: {
            grid: {
              display: false,
            },

            ticks: {
              color: "#6b7280",

              font: {
                size: 7,
              },
            },
          },

          y: {
            beginAtZero: true,
            suggestedMax: 110000,

            grid: {
              color: "rgba(107,114,128,0.16)",
            },

            ticks: {
              color: "#94a3b8",

              font: {
                size: 7,
              },

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

function purchasingPower(
  startingAmount: number,
  inflationRate: number,
  years: number,
) {
  return startingAmount / Math.pow(1 + inflationRate, years);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function roundToNearestThousand(value: number) {
  return Math.round(value / 1000) * 1000;
}
