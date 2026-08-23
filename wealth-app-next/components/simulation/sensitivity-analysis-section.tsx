"use client";

import { useEffect, useState } from "react";

import type { WealthPlan, SimulationResult } from "@/lib/engine/types";

import { runMonteCarlo } from "@/lib/engine/monte-carlo-old";

import { formatMoney } from "@/lib/engine/financial-math";

import {
  calculateSensitivity,
  type SensitivityRow,
} from "@/lib/engine/sensitivity-analysis";

type Props = {
  plan: WealthPlan;
  result: SimulationResult;
  years: number;
};

const SENSITIVITY_SIMS = 200;
const SENSITIVITY_SEED = 20260101;

export function SensitivityAnalysisSection({ plan, result, years }: Props) {
  const [rows, setRows] = useState<SensitivityRow[]>([]);

  const [running, setRunning] = useState(false);

  const baseMedian = result.realFinal.p50;

  useEffect(() => {
    setRunning(true);

    const timer = setTimeout(() => {
      try {
        const nextRows = calculateSensitivity(plan, baseMedian, years);

        setRows(nextRows);
      } finally {
        setRunning(false);
      }
    }, 30);

    return () => clearTimeout(timer);
  }, [plan, baseMedian, years]);

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Sensitivity Analysis</h2>

      <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
        Shows how changes in key inputs shift the median projected wealth at
        year{" "}
        <strong className="text-[#16213e]">
          {new Date().getFullYear() + years}
        </strong>
        . Wider changes indicate greater sensitivity.
      </p>

      <div className="mt-4 rounded-xl bg-[#f8faff] p-4">
        <div className="text-[10px] font-bold uppercase tracking-[0.07em] text-[#64748b]">
          Base median wealth
        </div>

        <div className="mt-1 text-[22px] font-extrabold text-[#16213e]">
          {formatMoney(baseMedian, plan.currency)}
        </div>
      </div>

      {running ? (
        <div className="mt-5 rounded-xl border border-[rgba(0,87,184,.08)] p-6 text-center text-[12px] text-[#64748b]">
          Running sensitivity analysis…
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-xl border border-[rgba(0,87,184,.08)]">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-b border-[rgba(0,87,184,.10)] bg-[#f8faff]">
                <th className={thClass}>Input</th>

                <th className={thClass}>Change</th>

                <th className={numberThClass}>Lower scenario</th>

                <th className={numberThClass}>Higher scenario</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-[rgba(0,87,184,.07)] last:border-b-0"
                >
                  <td className={tdClass}>
                    <span className="font-semibold text-[#16213e]">
                      {row.label}
                    </span>
                  </td>

                  <td className={tdClass}>{row.shift}</td>

                  <SensitivityCell value={row.lower} currency={plan.currency} />

                  <SensitivityCell
                    value={row.higher}
                    currency={plan.currency}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-[11px] leading-5 text-[#9ca3af]">
        Each scenario reruns {SENSITIVITY_SIMS} simulations with only that input
        changed. All other household assumptions remain unchanged.
      </p>
    </section>
  );
}

function SensitivityCell({
  value,
  currency,
}: {
  value?: number;
  currency: string;
}) {
  if (value == null) {
    return <td className={numberTdClass}>—</td>;
  }

  return (
    <td className={numberTdClass}>
      <span
        className={
          value > 0
            ? "font-bold text-[#00875a]"
            : value < 0
              ? "font-bold text-red-500"
              : "font-bold text-[#64748b]"
        }
      >
        {value > 0 ? "+" : ""}
        {formatMoney(value, currency)}
      </span>
    </td>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const thClass =
  "px-3 py-3 text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]";

const numberThClass =
  "px-3 py-3 text-right text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]";

const tdClass = "px-3 py-3 text-[#64748b]";

const numberTdClass = "px-3 py-3 text-right tabular-nums text-[#16213e]";
