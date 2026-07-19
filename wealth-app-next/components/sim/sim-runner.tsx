// "use client";

// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Select } from "@/components/ui/select";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { runMonteCarlo } from "@/lib/engine/monte-carlo-old";
// import { runMonteCarlo } from "@/lib/engine/monte-carlo";
// import { formatMoney } from "@/lib/engine/financial-math";
// import { SimChart } from "./sim-chart";
// // import type { WealthPlan, SimulationResult } from "@/lib/engine/types";
// import type { SimulationResult } from "@/lib/engine/types";
// import type { MonteCarloResult } from "@/lib/engine/monte-carlo";
// import type { LegacyWealthPlan } from "@/lib/plan/legacy-schema";

// const currency = "USD"; // TODO: make this dynamic based on the plan's currency

// export function SimRunner({ plan }: { plan: LegacyWealthPlan }) {
//   const [sims, setSims] = useState<200 | 500 | 1000>(1000);
//   const [years, setYears] = useState(30);
//   // const [result, setResult] = useState<SimulationResult | null>(null);
//   const [result, setResult] = useState<MonteCarloResult | null>(null);

//   const [running, setRunning] = useState(false);

//   function run() {
//     setRunning(true);
//     // Use a short timeout so the UI updates before the JS-bound MC runs
//     setTimeout(() => {
//       try {
//         // const r = runMonteCarlo({ plan, sims, years });
//         const r = runMonteCarlo(plan, years, sims);
//         setResult(r);
//       } finally {
//         setRunning(false);
//       }
//     }, 30);
//   }

//   return (
//     <div className="space-y-6">
//       <Card>
//         <CardHeader>
//           <CardTitle>Run simulation</CardTitle>
//         </CardHeader>
//         <CardContent className="flex flex-wrap items-end gap-4">
//           <div className="space-y-1.5">
//             <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paths</label>
//             <Select value={sims} onChange={(e) => setSims(+e.target.value as 200|500|1000)} className="w-32">
//               <option value={200}>200 (fast)</option>
//               <option value={500}>500</option>
//               <option value={1000}>1,000 (recommended)</option>
//             </Select>
//           </div>
//           <div className="space-y-1.5">
//             <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Years</label>
//             <Select value={years} onChange={(e) => setYears(+e.target.value)} className="w-32">
//               {[10, 20, 30, 40].map((y) => <option key={y} value={y}>{y}</option>)}
//             </Select>
//           </div>
//           <Button onClick={run} disabled={running} size="lg">
//             {running ? "Running…" : "Run Monte Carlo"}
//           </Button>
//           {result && <span className="text-xs text-muted-foreground">Ran in {result.runMs}ms</span>}
//         </CardContent>
//       </Card>

//       {result && (
//         <>
//           <Card>
//             <CardHeader>
//               <CardTitle>Net worth projection — {sims.toLocaleString()} paths, {result.years} years</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <SimChart result={result} currency={currency} />
//             </CardContent>
//           </Card>

//           {result.retirement && (() => {
//             const succ = result.retirement.successProbability;
//             const tone = succ >= 0.85 ? "text-emerald-600" : succ >= 0.6 ? "text-amber-500" : "text-destructive";
//             const bar = succ >= 0.85 ? "bg-emerald-500" : succ >= 0.6 ? "bg-amber-500" : "bg-destructive";
//             return (
//               <Card>
//                 <CardHeader><CardTitle>Will your money last?</CardTitle></CardHeader>
//                 <CardContent>
//                   <div className="flex items-center gap-6 flex-wrap">
//                     <div>
//                       <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Success probability</div>
//                       <div className={`font-display text-4xl ${tone}`}>{(succ * 100).toFixed(0)}%</div>
//                     </div>
//                     <div className="flex-1 min-w-[220px]">
//                       <div className="h-3 rounded-full bg-muted overflow-hidden">
//                         <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${Math.min(100, Math.max(0, succ * 100))}%` }} />
//                       </div>
//                       <div className="text-xs text-muted-foreground mt-2">
//                         Retiring at age {result.retirement.retirementAge}, modelled through age {result.retirement.planToAge}.{" "}
//                         {(result.retirement.depletionProbability * 100).toFixed(0)}% of scenarios run the portfolio to zero before then.
//                       </div>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             );
//           })()}

//           <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
//             {[
//               { k: "Median (P50)", v: result.final.p50, cls: "text-foreground" },
//               { k: "P25",          v: result.final.p25, cls: "text-muted-foreground" },
//               { k: "P75",          v: result.final.p75, cls: "text-muted-foreground" },
//               { k: "P10 (worst)",  v: result.final.p10, cls: "text-destructive" },
//               { k: "P90 (best)",   v: result.final.p90, cls: "text-emerald-600" }
//             ].map((s) => (
//               <Card key={s.k}>
//                 <CardContent className="p-4">
//                   <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{s.k}</div>
//                   <div className={`font-display text-2xl ${s.cls}`}>{formatMoney(s.v, currency)}</div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>

//           {result.goalSuccess.length > 0 && (
//             <Card>
//               <CardHeader><CardTitle>Goal probability of success</CardTitle></CardHeader>
//               <CardContent className="space-y-3">
//                 {result.goalSuccess.map((g) => (
//                   <div key={g.goalId}>
//                     <div className="flex items-baseline justify-between mb-1.5">
//                       <span className="font-medium">{g.goalName || "(unnamed goal)"}</span>
//                       <span className={`font-display text-lg ${g.probability >= 0.8 ? "text-emerald-600" : g.probability >= 0.5 ? "text-amber-500" : "text-destructive"}`}>
//                         {(g.probability * 100).toFixed(0)}%
//                       </span>
//                     </div>
//                     <div className="h-2 rounded-full bg-muted overflow-hidden">
//                       <div
//                         className={`h-full rounded-full transition-all ${g.probability >= 0.8 ? "bg-emerald-500" : g.probability >= 0.5 ? "bg-amber-500" : "bg-destructive"}`}
//                         style={{ width: `${Math.min(100, Math.max(0, g.probability * 100))}%` }}
//                       />
//                     </div>
//                   </div>
//                 ))}
//               </CardContent>
//             </Card>
//           )}

//           <div className="text-xs text-muted-foreground border-t border-border pt-4">
//             <strong>Important:</strong> Monte Carlo results are illustrative projections based on the inputs you provided
//             and assumed risk/return parameters. They are not predictions, guarantees, or financial, tax, or investment
//             advice. Tax figures are simplified estimates — this tool does not provide tax advice. Real outcomes
//             will differ. Consult a licensed advisor and a tax professional before making decisions.
//           </div>
//         </>
//       )}
//     </div>
//   );
// }


"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

import { formatMoney } from "@/lib/engine/financial-math";
import {
  runMonteCarlo,
  type MonteCarloResult,
} from "@/lib/engine/monte-carlo";
import type { LegacyWealthPlan } from "@/lib/plan/legacy-schema";

import { SimChart } from "./sim-chart";
import type { WealthPlan, SimulationResult } from "@/lib/engine/types";

/**
 * The same seed the report uses (report-view.tsx).
 *
 * These two screens MUST agree. Without a seed here, the median on the
 * simulation tab and the median on the client's report were different
 * numbers for the same unchanged plan — an advisor quoting one and handing
 * over the other, in front of the client. A projection may be uncertain;
 * it may not be inconsistent with itself.
 *
 * Re-running should also be reproducible: pressing Run twice on an
 * untouched plan and getting two answers reads as a broken tool, not as
 * sampling error.
 */
export const REPORT_SEED = 20260101;

export function SimRunner({
  plan,
}: {
  plan: LegacyWealthPlan;
}) {
  const [sims, setSims] =
    useState<200 | 500 | 1000>(1000);

  const [years, setYears] = useState(30);

  const [result, setResult] =
    useState<MonteCarloResult | null>(null);

  const [running, setRunning] = useState(false);

  function run() {
    setRunning(true);

    // Allow React to render the loading state before
    // the synchronous Monte Carlo calculation begins.
    setTimeout(() => {
      try {
        const r = runMonteCarlo({ plan, sims, years, seed: REPORT_SEED });
        setResult(r);
      } finally {
        setRunning(false);
      }
    }, 30);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Run simulation</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Paths
            </label>

            <Select
              value={sims}
              onChange={(event) =>
                setSims(
                  Number(event.target.value) as
                    | 200
                    | 500
                    | 1000,
                )
              }
              className="w-32"
            >
              <option value={200}>
                200 (fast)
              </option>

              <option value={500}>
                500
              </option>

              <option value={1000}>
                1,000 (recommended)
              </option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Years
            </label>

            <Select
              value={years}
              onChange={(event) =>
                setYears(
                  Number(event.target.value),
                )
              }
              className="w-32"
            >
              {[10, 20, 30, 40].map(
                (projectionYears) => (
                  <option
                    key={projectionYears}
                    value={projectionYears}
                  >
                    {projectionYears}
                  </option>
                ),
              )}
            </Select>
          </div>

          <Button
            onClick={run}
            disabled={running}
            size="lg"
          >
            {running
              ? "Running…"
              : "Run Monte Carlo"}
          </Button>

          {result && !running && (
            <span className="text-xs text-muted-foreground">
              Simulation complete
            </span>
          )}
        </CardContent>
      </Card>

      {result && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                Net worth projection —{" "}
                {sims.toLocaleString()} paths,{" "}
                {years} years
              </CardTitle>
            </CardHeader>

            <CardContent>
              <SimChart
                result={result}
                currency={currency}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {result.requestedPercentiles.map(
              (percentile) => {
                const key = `p${percentile}`;

                const value =
                  result.realFinalPercentiles[key];

                const isMedian =
                  percentile === 50;

                const isLowest =
                  percentile ===
                  result.requestedPercentiles[0];

                const isHighest =
                  percentile ===
                  result.requestedPercentiles[
                    result.requestedPercentiles
                      .length - 1
                  ];

                let textClass =
                  "text-muted-foreground";

                if (isMedian) {
                  textClass =
                    "text-foreground";
                } else if (isLowest) {
                  textClass =
                    "text-destructive";
                } else if (isHighest) {
                  textClass =
                    "text-emerald-600";
                }

                return (
                  <Card key={key}>
                    <CardContent className="p-4">
                      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        P{percentile}
                      </div>

                      <div
                        className={`font-display text-2xl ${textClass}`}
                      >
                        {formatMoney(
                          value ?? 0,
                          currency,
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              },
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                Portfolio depletion
              </CardTitle>
            </CardHeader>

            <CardContent>
              <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
                {JSON.stringify(
                  result.depletion,
                  null,
                  2,
                )}
              </pre>
            </CardContent>
          </Card>

          <div className="border-t border-border pt-4 text-xs text-muted-foreground">
            <strong>Important:</strong>{" "}
            Monte Carlo results are illustrative
            projections based on the inputs you
            provided and assumed risk and return
            parameters. They are not predictions,
            guarantees, or financial, tax, or
            investment advice. Tax figures are
            simplified estimates. Real outcomes
            will differ. Consult a licensed advisor
            and tax professional before making
            decisions.
          </div>
        </>
      )}
    </div>
  );
}