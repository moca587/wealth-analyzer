"use client";

import { useEffect, useMemo, useRef } from "react";

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import type { WealthPlan } from "@/lib/engine/types";

import { buildLinearCashFlow } from "@/lib/engine/linear-cash-flow";

import { formatMoney } from "@/lib/engine/financial-math";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
);

type Props = {
  plan: WealthPlan;
};

export function NetWorthComponentsSection({ plan }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const chartRef = useRef<Chart | null>(null);

  const result = useMemo(
    () =>
      buildLinearCashFlow(plan, {
        endAge: plan.retirement?.planToAge ?? 90,

        annualSavingsTarget: plan.annualSavings,

        retirementPoolGrowth: 0.035,

        cashSurplusShare: 0.3,
      }),
    [plan],
  );

  // Insurance cash value is not part of the
  // linear cash-flow engine, so hold today's
  // value flat across the projection.
  const insuranceCashValue = (plan.insurancePolicies ?? []).reduce(
    (sum, policy) => sum + Number(policy.cashValue || 0),
    0,
  );

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const ctx = canvasRef.current.getContext("2d");

    if (!ctx) {
      return;
    }

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const labels = result.rows.map((row) => `${row.year}`);

    const cash = result.rows.map((row) => row.cash);

    const investments = result.rows.map((row) => row.investments);

    const retirementPool = result.rows.map((row) => row.retirementPool);

    const propertyAndOther = result.rows.map(
      (row) => row.propertyValue + row.otherAssets,
    );

    const insurance = result.rows.map(() => insuranceCashValue);

    // row.netWorth currently does not include
    // insurancePolicies.cashValue.
    const totalNetWorth = result.rows.map(
      (row) => row.netWorth + insuranceCashValue,
    );

    chartRef.current = new Chart(ctx, {
      type: "line",

      data: {
        labels,

        datasets: [
          {
            label: "Cash",
            data: cash,
            borderColor: "#5b9bd5",
            backgroundColor: "#5b9bd5",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.15,
          },

          {
            label: "Investments",
            data: investments,
            borderColor: "#0057b8",
            backgroundColor: "#0057b8",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.15,
          },

          {
            label: "Retirement pool",
            data: retirementPool,
            borderColor: "#7c3aed",
            backgroundColor: "#7c3aed",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.15,
          },

          {
            label: "Property & other",
            data: propertyAndOther,
            borderColor: "#00875a",
            backgroundColor: "#00875a",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.15,
          },

          {
            label: "Insurance cash value",
            data: insurance,
            borderColor: "#f59e0b",
            backgroundColor: "#f59e0b",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.15,
          },

          {
            label: "Total net worth",
            data: totalNetWorth,
            borderColor: "#16213e",
            backgroundColor: "#16213e",
            borderWidth: 3,
            borderDash: [6, 5],
            pointRadius: 0,
            tension: 0.15,
          },
        ],
      },

      options: {
        responsive: true,

        maintainAspectRatio: false,

        interaction: {
          mode: "index",
          intersect: false,
        },

        plugins: {
          legend: {
            position: "top",
          },

          tooltip: {
            callbacks: {
              label: (ctx) => {
                const value = ctx.parsed.y;

                if (value == null) {
                  return `${ctx.dataset.label}: —`;
                }

                return `${ctx.dataset.label}: ${formatMoney(
                  value,
                  plan.currency,
                )}`;
              },
            },
          },
        },

        scales: {
          y: {
            ticks: {
              callback: (value) => formatMoney(Number(value), plan.currency),
            },
          },

          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [result, plan.currency, insuranceCashValue]);

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Net Worth by Component</h2>

      <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
        How each part of your wealth — cash, investments, retirement pool,
        property, insurance cash value — evolves along the deterministic
        projection. The dashed line is total net worth after liabilities.
        Retirement pool = locked retirement/pension accounts growing at a fixed
        3.5%/yr independent of your risk profile. Property & other = real estate
        plus any other / miscellaneous assets. Insurance cash value is held flat
        at today&apos;s value.
      </p>

      <div className="relative mt-5 h-[420px] rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4">
        <canvas ref={canvasRef} />
      </div>
    </section>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";
