"use client";

import { useMemo } from "react";

import type { WealthPlan, LinearCashFlowResult } from "@/lib/engine/types";

import { buildLinearCashFlow } from "@/lib/engine/linear-cash-flow";

import { formatMoney } from "@/lib/engine/financial-math";

type Props = {
  plan: WealthPlan;

  // Add this later when the proposed portfolio
  // is connected to the simulation page.
  proposedReturn?: number;

  proposedLabel?: string;
};

export function ThreeScenarioSection({
  plan,
  proposedReturn,
  proposedLabel = "Proposed portfolio",
}: Props) {
  const scenarios = useMemo(() => {
    const commonOptions = {
      endAge: plan.retirement?.planToAge ?? 90,

      annualSavingsTarget: plan.annualSavings,

      retirementPoolGrowth: 0.035,

      cashSurplusShare: 0.3,
    };

    // Current portfolio:
    // normal holdings-weighted deterministic return.
    const current = buildLinearCashFlow(plan, commonOptions);

    // No-investment scenario:
    // same household assumptions, but
    // investment growth is forced to 0%.
    const noInvestments = buildLinearCashFlow(plan, {
      ...commonOptions,

      investmentReturnOverride: 0,
    });

    // Proposed scenario only exists once
    // a proposed portfolio return is supplied.
    const proposed =
      proposedReturn != null
        ? buildLinearCashFlow(plan, {
            ...commonOptions,

            investmentReturnOverride: proposedReturn,
          })
        : null;

    return {
      noInvestments,
      current,
      proposed,
    };
  }, [plan, proposedReturn]);

  const { noInvestments, current, proposed } = scenarios;

  const hasProposed = proposed != null;

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Three-Scenario Comparison</h2>

      <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
        Same household profile, income, expenses, pensions and goals. Only the
        investment-return assumption changes between scenarios.
      </p>

      {/* Scenario summary */}

      <div
        className={`mt-5 grid gap-4 ${
          hasProposed ? "md:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        <ScenarioCard
          title="No investments"
          returnRate={0}
          description="0% investment return"
        />

        <ScenarioCard
          title="Current portfolio"
          returnRate={current.investmentReturn}
          description={`CF rate · mean ${(current.portfolioMean * 100).toFixed(2)}%`}
        />

        {proposed && (
          <ScenarioCard
            title={proposedLabel}
            returnRate={proposed.investmentReturn}
            description="Proposed portfolio assumption"
          />
        )}
      </div>

      <p className="mt-4 text-[11px] leading-5 text-[#9ca3af]">
        Δ columns show the additional projected net worth versus the previous
        scenario. Income, expenses, taxes, debt, retirement, pensions, goals and
        other household assumptions remain unchanged.
      </p>

      {/* Year-by-year comparison */}

      <div className="mt-5 overflow-x-auto rounded-xl border border-[rgba(0,87,184,.08)]">
        <table className="min-w-[900px] w-full border-collapse text-left text-[11px]">
          <thead>
            <tr className="border-b border-[rgba(0,87,184,.10)] bg-[#f8faff]">
              <th className={thClass}>Year</th>

              <th className={thClass}>Age</th>

              <th className={thClass}>Phase</th>

              <th className={numberThClass}>No-Inv NW</th>

              <th className={numberThClass}>Current NW</th>

              <th className={numberThClass}>Δ Cur − No-Inv</th>

              {hasProposed && (
                <>
                  <th className={numberThClass}>Proposed NW</th>

                  <th className={numberThClass}>Δ Prop − Cur</th>
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {current.rows.map((currentRow, index) => {
              const noInvRow = noInvestments.rows[index];

              const proposedRow = proposed?.rows[index];

              if (!noInvRow) {
                return null;
              }

              const currentDelta = currentRow.netWorth - noInvRow.netWorth;

              const proposedDelta = proposedRow
                ? proposedRow.netWorth - currentRow.netWorth
                : undefined;

              const isToday = index === 0;

              return (
                <tr
                  key={currentRow.year}
                  className={
                    isToday
                      ? "border-b border-[rgba(0,87,184,.07)] bg-[#eef5ff]"
                      : "border-b border-[rgba(0,87,184,.07)]"
                  }
                >
                  <td className={`${tdClass} ${isToday ? "font-bold" : ""}`}>
                    {currentRow.year}
                  </td>

                  <td className={tdClass}>{currentRow.age}</td>

                  <td className={tdClass}>{currentRow.phase}</td>

                  <MoneyCell
                    value={noInvRow.netWorth}
                    currency={plan.currency}
                  />

                  <MoneyCell
                    value={currentRow.netWorth}
                    currency={plan.currency}
                    strong
                  />

                  <DeltaCell value={currentDelta} currency={plan.currency} />

                  {hasProposed && (
                    <>
                      <MoneyCell
                        value={proposedRow?.netWorth ?? 0}
                        currency={plan.currency}
                        strong
                      />

                      <DeltaCell
                        value={proposedDelta ?? 0}
                        currency={plan.currency}
                      />
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Goal comparison */}

      {plan.goals.length > 0 && (
        <GoalScenarioTable
          plan={plan}
          noInvestments={noInvestments}
          current={current}
          proposed={proposed}
        />
      )}

      <div className="mt-5 rounded-xl bg-[#f8faff] p-4 text-[11px] leading-5 text-[#64748b]">
        <strong className="text-[#16213e]">No investments</strong> — investment
        assets earn 0%.{" "}
        <strong className="text-[#16213e]">Current portfolio</strong> — uses the
        current holdings-weighted deterministic return.
        {proposed && (
          <>
            {" "}
            <strong className="text-[#16213e]">{proposedLabel}</strong> — uses
            the proposed portfolio&apos;s deterministic return.
          </>
        )}
      </div>
    </section>
  );
}

function ScenarioCard({
  title,
  returnRate,
  description,
}: {
  title: string;
  returnRate: number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.07em] text-[#64748b]">
        {title}
      </div>

      <div className="mt-2 text-[22px] font-extrabold text-[#16213e]">
        {(returnRate * 100).toFixed(1)}
        %/yr
      </div>

      <div className="mt-1 text-[11px] text-[#9ca3af]">{description}</div>
    </div>
  );
}

function GoalScenarioTable({
  plan,
  noInvestments,
  current,
  proposed,
}: {
  plan: WealthPlan;
  noInvestments: LinearCashFlowResult;
  current: LinearCashFlowResult;
  proposed: LinearCashFlowResult | null;
}) {
  return (
    <div className="mt-7">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
        Goal Funding at Target Year — Deterministic Scenario
      </h3>

      <div className="mt-3 overflow-x-auto rounded-xl border border-[rgba(0,87,184,.08)]">
        <table className="min-w-[850px] w-full border-collapse text-left text-[11px]">
          <thead>
            <tr className="border-b border-[rgba(0,87,184,.10)] bg-[#f8faff]">
              <th className={thClass}>Goal</th>

              <th className={numberThClass}>Yr</th>

              <th className={numberThClass}>Amount</th>

              <th className={numberThClass}>No investments</th>

              <th className={numberThClass}>Current</th>

              <th className={numberThClass}>Δ Cur − NI</th>

              {proposed && (
                <>
                  <th className={numberThClass}>Proposed</th>

                  <th className={numberThClass}>Δ Prop − Cur</th>
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {plan.goals.map((goal) => {
              // Use the final year of the
              // goal's funding period as
              // the comparison year.
              const targetYear = goal.endYear ?? goal.startYear;

              const noInvRow = findRowForYear(noInvestments, targetYear);

              const currentRow = findRowForYear(current, targetYear);

              const proposedRow = proposed
                ? findRowForYear(proposed, targetYear)
                : undefined;

              const noInvNW = noInvRow?.netWorth;

              const currentNW = currentRow?.netWorth;

              const proposedNW = proposedRow?.netWorth;

              const currentDelta =
                noInvNW != null && currentNW != null
                  ? currentNW - noInvNW
                  : undefined;

              const proposedDelta =
                currentNW != null && proposedNW != null
                  ? proposedNW - currentNW
                  : undefined;

              return (
                <tr
                  key={goal.id}
                  className="border-b border-[rgba(0,87,184,.07)] last:border-b-0"
                >
                  <td className={tdClass}>
                    <span className="font-semibold text-[#16213e]">
                      {goal.name || "Unnamed goal"}
                    </span>
                  </td>

                  <td className={numberTdClass}>{targetYear}</td>

                  <td className={numberTdClass}>
                    {formatMoney(goal.amt, plan.currency)}
                  </td>

                  <GoalValue value={noInvNW} currency={plan.currency} />

                  <GoalValue value={currentNW} currency={plan.currency} />

                  <DeltaCell value={currentDelta} currency={plan.currency} />

                  {proposed && (
                    <>
                      <GoalValue value={proposedNW} currency={plan.currency} />

                      <DeltaCell
                        value={proposedDelta}
                        currency={plan.currency}
                      />
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GoalValue({
  value,
  currency,
}: {
  value: number | undefined;
  currency: string;
}) {
  if (value == null) {
    return <td className={numberTdClass}>—</td>;
  }

  return (
    <td className={numberTdClass}>
      <div
        className={
          value >= 0
            ? "font-semibold text-[#00875a]"
            : "font-semibold text-red-500"
        }
      >
        {value >= 0 ? "✓ Funded" : "✕ Shortfall"}
      </div>

      <div className="mt-0.5 text-[#64748b]">
        {formatMoney(value, currency)}
      </div>
    </td>
  );
}

function MoneyCell({
  value,
  currency,
  strong = false,
}: {
  value: number;
  currency: string;
  strong?: boolean;
}) {
  return (
    <td
      className={`${numberTdClass} ${strong ? "font-bold text-[#16213e]" : ""}`}
    >
      {formatMoney(value, currency)}
    </td>
  );
}

function DeltaCell({
  value,
  currency,
}: {
  value: number | undefined;
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

function findRowForYear(result: LinearCashFlowResult, year: number) {
  return result.rows.find((row) => row.year === year);
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const thClass = "px-3 py-3 font-bold whitespace-nowrap text-[#64748b]";

const numberThClass =
  "px-3 py-3 text-right font-bold whitespace-nowrap text-[#64748b]";

const tdClass = "px-3 py-3 whitespace-nowrap text-[#64748b]";

const numberTdClass =
  "px-3 py-3 text-right whitespace-nowrap tabular-nums text-[#16213e]";
