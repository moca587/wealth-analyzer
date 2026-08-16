"use client";

import { useState } from "react";
import type { WealthPlan } from "@/lib/engine/types";

type Props = {
  plan: WealthPlan;
};

export function ScenariosSection({ plan }: Props) {
  const primaryClient = plan.clients[0];

  const [scenarioName, setScenarioName] = useState("");
  const [retireAge, setRetireAge] = useState(
    plan.retirement?.retirementAge ?? 65
  );
  const [incomeChangePct, setIncomeChangePct] = useState(0);
  const [extraAnnualExpense, setExtraAnnualExpense] = useState(0);

  const [goalName, setGoalName] = useState("");
  const [goalAmount, setGoalAmount] = useState(0);
  const [goalYear, setGoalYear] = useState(new Date().getFullYear());

  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [withdrawAge, setWithdrawAge] = useState(
    plan.retirement?.retirementAge ?? 65
  );
  const [penaltyPct, setPenaltyPct] = useState(10);

  return (
    <section className="rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm">
      <p className="text-[12px] leading-5 text-[#64748b]">
        Model alternative futures — earlier retirement, a second home,
        education costs, income changes — and compare each scenario&apos;s
        median wealth and goal success against the baseline plan.
      </p>

      <div className="mt-4 rounded-xl border border-dashed border-[#dbe3ef] bg-[#fafcff] px-5 py-6 text-center text-[12px] text-[#9ca3af]">
        No scenarios added yet. Define a scenario below and click Run.
      </div>

      <div className="mt-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]">
            Add Scenario
          </h2>

          <div className="h-px flex-1 bg-[rgba(0,87,184,.10)]" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Scenario name">
            <input
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className={inputClass}
              placeholder="Earlier retirement"
            />
          </Field>

          <Field label="Override retire age" suffix="yrs">
            <input
              type="number"
              value={retireAge}
              onChange={(e) => setRetireAge(Number(e.target.value))}
              className={inputClass}
            />
          </Field>

          <Field
            label="Income change %"
            suffix="% of current gross (neg = reduction)"
          >
            <input
              type="number"
              value={incomeChangePct}
              onChange={(e) => setIncomeChangePct(Number(e.target.value))}
              className={inputClass}
            />
          </Field>

          <Field
            label="Extra annual expense"
            suffix="per year (ongoing)"
          >
            <input
              type="number"
              value={extraAnnualExpense}
              onChange={(e) =>
                setExtraAnnualExpense(Number(e.target.value))
              }
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-6 rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-5">
          <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
            One-Time Goal (optional)
          </h3>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Goal name">
              <input
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                className={inputClass}
                placeholder="Second home"
              />
            </Field>

            <Field label="Goal amount">
              <input
                type="number"
                value={goalAmount}
                onChange={(e) => setGoalAmount(Number(e.target.value))}
                className={inputClass}
              />
            </Field>

            <Field label="Goal year">
              <input
                type="number"
                value={goalYear}
                onChange={(e) => setGoalYear(Number(e.target.value))}
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-5">
          <div className="mb-4 flex items-center gap-2">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
              Early Pension Withdrawal (optional)
            </h3>

            <span
              className="flex h-4 w-4 items-center justify-center rounded-full border border-[#9ca3af] text-[9px] font-bold text-[#64748b]"
              title="Model an optional early withdrawal from a pension or retirement account."
            >
              i
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Amount to withdraw">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) =>
                  setWithdrawAmount(Number(e.target.value))
                }
                className={inputClass}
              />
            </Field>

            <Field
              label="Taken at age"
              suffix={
                primaryClient
                  ? `${primaryClient.first || "Client 1"}'s age`
                  : "client 1's age"
              }
            >
              <input
                type="number"
                value={withdrawAge}
                onChange={(e) =>
                  setWithdrawAge(Number(e.target.value))
                }
                className={inputClass}
              />
            </Field>

            <Field
              label="Lost to tax & penalty"
              suffix="% · auto-estimated, edit to override"
            >
              <input
                type="number"
                value={penaltyPct}
                onChange={(e) =>
                  setPenaltyPct(Number(e.target.value))
                }
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        <button
          type="button"
          className="mt-6 rounded-lg bg-[#0057b8] px-5 py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#004a9d]"
          onClick={() => {
            console.log({
              scenarioName,
              retireAge,
              incomeChangePct,
              extraAnnualExpense,
              oneTimeGoal: {
                name: goalName,
                amount: goalAmount,
                year: goalYear,
              },
              earlyWithdrawal: {
                amount: withdrawAmount,
                age: withdrawAge,
                penaltyPct,
              },
            });
          }}
        >
          ▶ Run Scenario
        </button>
      </div>
    </section>
  );
}

function Field({
  label,
  suffix,
  children,
}: {
  label: string;
  suffix?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="text-[11px] font-semibold text-[#64748b]">
          {label}
        </span>

        {suffix && (
          <span className="text-[10px] text-[#9ca3af]">
            {suffix}
          </span>
        )}
      </div>

      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[13px] font-medium text-[#16213e] outline-none focus:border-[#0057b8] focus:ring-2 focus:ring-[rgba(0,87,184,.08)]";