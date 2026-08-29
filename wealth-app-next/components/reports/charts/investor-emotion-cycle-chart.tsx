"use client";

import { useEffect, useRef } from "react";

import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js";

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

const labels = ["Optimism", "Euphoria", "Anxiety", "Panic", "Hope", "Relief"];

// These values are only used to create the conceptual shape.
const values = [55, 95, 60, 15, 45, 70];

export function InvestorEmotionCycleChart() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart<"line"> | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const ctx = canvasRef.current.getContext("2d");

    if (!ctx) {
      return;
    }

    chartRef.current?.destroy();

    const emotionLabelPlugin = {
      id: "emotionLabels",

      afterDatasetsDraw(chart: Chart<"line">) {
        const { ctx } = chart;
        const meta = chart.getDatasetMeta(0);

        ctx.save();

        meta.data.forEach((point, index) => {
          ctx.font = "bold 8px Arial";
          ctx.fillStyle = "#30343b";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";

          ctx.fillText(labels[index], point.x, point.y - 7);
        });

        const peak = meta.data[1];
        const trough = meta.data[3];

        if (peak) {
          ctx.font = "bold 7px Arial";
          ctx.fillStyle = "#c84b45";
          ctx.textAlign = "center";

          ctx.fillText("maximum risk", peak.x, peak.y - 23);
        }

        if (trough) {
          ctx.font = "bold 7px Arial";
          ctx.fillStyle = "#00875a";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";

          ctx.fillText("maximum opportunity", trough.x, trough.y + 13);
        }

        ctx.restore();
      },
    };

    chartRef.current = new Chart<"line">(ctx, {
      type: "line",

      plugins: [emotionLabelPlugin],

      data: {
        labels: ["", "", "", "", "", ""],

        datasets: [
          {
            label: "Market cycle",
            data: values,

            borderColor: "#0867b9",
            backgroundColor: "#0867b9",

            borderWidth: 2.5,

            pointRadius: 3,
            pointHoverRadius: 4,

            tension: 0.4,
          },
        ],
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,

        layout: {
          padding: {
            top: 30,
            bottom: 25,
            left: 10,
            right: 10,
          },
        },

        plugins: {
          legend: {
            display: false,
          },

          tooltip: {
            callbacks: {
              title: (items) => {
                const index = items[0]?.dataIndex ?? 0;
                return labels[index];
              },

              label: () => "",
            },
          },
        },

        scales: {
          x: {
            grid: {
              display: false,
            },

            border: {
              display: true,
            },

            ticks: {
              display: false,
            },

            title: {
              display: true,
              text: "market cycle (time →)",

              font: {
                size: 7,
              },

              color: "#6b7280",
            },
          },

          y: {
            display: false,

            min: 0,
            max: 110,
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
