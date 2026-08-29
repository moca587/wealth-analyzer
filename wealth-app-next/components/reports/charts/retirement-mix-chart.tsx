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

const labels = [
  "In your 30s",
  "In your 40s",
  "In your 50s",
  "At retirement",
  "In retirement",
];

const values = [90, 80, 65, 50, 35];

export function RetirementMixChart() {
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
      id: "retirementMixValueLabels",

      afterDatasetsDraw(chart: Chart) {
        const { ctx } = chart;
        const meta = chart.getDatasetMeta(0);

        ctx.save();

        meta.data.forEach((point, index) => {
          ctx.font = "bold 8px Arial";
          ctx.fillStyle = "#00875a";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";

          ctx.fillText(`${values[index]}%`, point.x, point.y - 6);
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
            label: "Growth assets",
            data: values,

            borderColor: "#00875a",
            backgroundColor: "rgba(0, 135, 90, 0.20)",

            fill: true,

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

        plugins: {
          legend: {
            display: false,
          },

          tooltip: {
            callbacks: {
              label: (ctx) => `${Number(ctx.raw ?? 0).toFixed(0)}%`,
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
            max: 100,

            grid: {
              color: "rgba(107,114,128,0.16)",
            },

            ticks: {
              stepSize: 25,

              color: "#94a3b8",

              font: {
                size: 7,
              },

              callback: (value) => `${Number(value)}%`,
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
