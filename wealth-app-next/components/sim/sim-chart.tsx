"use client";

import { useEffect, useRef } from "react";
import {
  Chart, LineController, LineElement, PointElement, LinearScale,
  CategoryScale, Filler, Tooltip, Legend
} from "chart.js";
// import type { SimulationResult } from "@/lib/engine/types";
import type { MonteCarloResult } from "@/lib/engine/monte-carlo";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend);

export function SimChart({ result, currency = "USD" }: { result: MonteCarloResult; currency?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }

    const startYear = new Date().getFullYear();
    const labels = result.realPercentileSeries.p50.map((_, i) => String(startYear + i));

    const fmt = (n: number) => new Intl.NumberFormat("en-US", {
      style: "currency", currency, maximumFractionDigits: 0, notation: "compact"
    }).format(n);

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "P90 (top-decile)", data: result.realPercentileSeries.p90, borderColor: "rgba(0,135,90,0)", backgroundColor: "rgba(0,135,90,0.15)", fill: "+1", pointRadius: 0, borderWidth: 0 },
          { label: "P10 (bottom-decile)", data: result.realPercentileSeries.p10, borderColor: "rgba(0,135,90,0)", backgroundColor: "rgba(0,135,90,0)", fill: false, pointRadius: 0, borderWidth: 0 },
          { label: "P75",  data: result.realPercentileSeries.p75, borderColor: "rgba(0,87,184,0)",  backgroundColor: "rgba(0,87,184,0.18)", fill: "+1", pointRadius: 0, borderWidth: 0 },
          { label: "P25",  data: result.realPercentileSeries.p25, borderColor: "rgba(0,87,184,0)",  backgroundColor: "rgba(0,87,184,0)",    fill: false, pointRadius: 0, borderWidth: 0 },
          { label: "Median (P50)", data: result.realPercentileSeries.p50, borderColor: "#0057b8", backgroundColor: "#0057b8", borderWidth: 2.5, pointRadius: 0, tension: 0.15 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            display: true, position: "top", align: "end",
            labels: { filter: (it) => !["P10 (bottom-decile)","P25"].includes(it.text), boxWidth: 10, font: { size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${fmt(Number(ctx.parsed.y))}`
            }
          }
        },
        scales: {
          y: {
            ticks: { callback: (v) => fmt(Number(v)), font: { size: 11 } },
            grid: { color: "rgba(0,0,0,0.04)" }
          },
          x: { grid: { display: false }, ticks: { maxRotation: 0, font: { size: 11 } } }
        }
      }
    });

    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [result, currency]);

  return (
    <div className="relative h-[420px] w-full">
      <canvas ref={canvasRef} />
    </div>
  );
}
