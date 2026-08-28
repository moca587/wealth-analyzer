"use client";

import { useEffect, useRef } from "react";

import {
  Chart,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

type Props = {
  expectedReturn: number;
  volatility: number;
  riskLabel: string;
  riskMin: number;
  riskMax: number;
};

export function PortfolioEfficiencyChart({
  expectedReturn,
  volatility,
  riskLabel,
  riskMin,
  riskMax,
}: Props) {
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

    const riskBandPlugin = {
      id: "riskBand",

      beforeDatasetsDraw(chart: Chart) {
        const { ctx, chartArea, scales } = chart;

        if (!chartArea) {
          return;
        }

        const xScale = scales.x;

        const left = xScale.getPixelForValue(riskMin);

        const right = xScale.getPixelForValue(riskMax);

        ctx.save();

        ctx.fillStyle = "rgba(170, 174, 145, 0.55)";

        ctx.fillRect(
          left,
          chartArea.top,
          right - left,
          chartArea.bottom - chartArea.top,
        );

        ctx.restore();
      },
    };

    chartRef.current = new Chart(ctx, {
      type: "scatter",

      plugins: [riskBandPlugin],

      data: {
        datasets: [
          // horizontal dashed line
          {
            label: "Return guide",

            data: [
              {
                x: 0,
                y: expectedReturn,
              },
              {
                x: volatility,
                y: expectedReturn,
              },
            ],

            showLine: true,

            borderColor: "#6b7280",

            borderDash: [5, 5],

            borderWidth: 1,

            pointRadius: 0,
          },

          // vertical dashed line
          {
            label: "Risk guide",

            data: [
              {
                x: volatility,
                y: 0,
              },
              {
                x: volatility,
                y: expectedReturn,
              },
            ],

            showLine: true,

            borderColor: "#6b7280",

            borderDash: [5, 5],

            borderWidth: 1,

            pointRadius: 0,
          },

          // current portfolio
          {
            label: `Current allocation — return ${expectedReturn.toFixed(
              1,
            )}% · risk ${volatility.toFixed(1)}%`,

            data: [
              {
                x: volatility,
                y: expectedReturn,
              },
            ],

            showLine: false,

            backgroundColor: "#202938",

            borderColor: "#202938",

            pointRadius: 7,

            pointHoverRadius: 8,

            // Makes the point a diamond.
            pointStyle: "rectRot",
          },
        ],
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,
        parsing: false,

        plugins: {
          legend: {
            position: "bottom",

            labels: {
              filter: (item) =>
                !["Return guide", "Risk guide"].includes(item.text),
            },
          },

          tooltip: {
            callbacks: {
              label: () =>
                `Current allocation: return ${expectedReturn.toFixed(
                  1,
                )}% · risk ${volatility.toFixed(1)}%`,
            },
          },
        },

        scales: {
          x: {
            min: 0,
            max: 20,

            title: {
              display: true,
              text: "Risk (standard deviation, %)",
            },

            ticks: {
              stepSize: 4,
            },
          },

          y: {
            min: 0,
            max: 10,

            title: {
              display: true,
              text: "Return (%)",
            },

            ticks: {
              stepSize: 2,
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [expectedReturn, volatility, riskLabel, riskMin, riskMax]);

  return (
    <div className="relative h-full w-full">
      {/* Risk profile label */}
      <div
        className="pointer-events-none absolute top-0 z-10 text-[8px] text-[#555]"
        style={{
          left: `${((riskMin + riskMax) / 2 / 20) * 100}%`,
          transform: "translateX(-50%)",
        }}
      >
        {riskLabel}
      </div>

      <canvas ref={canvasRef} />
    </div>
  );
}
