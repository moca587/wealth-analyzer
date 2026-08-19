import type {
    WealthPlan,
} from "@/lib/engine/types";

import {
    buildBehaviorGapAnalysis,
} from "@/lib/engine/behavior-gap";

import {
    formatMoney,
} from "@/lib/engine/financial-math";

type Props = {
    plan: WealthPlan;
    years: number;
    sims: number;
};

export function BehaviorGapSection({
    plan,
    years,
    sims,
}: Props) {
    const analysis =
        buildBehaviorGapAnalysis(
            plan,
            years,
            sims
        );

    const currentYear =
        new Date().getFullYear();

    const endYear =
        currentYear + years;

    return (
        <section className={sectionClass}>
            <h2 className={titleClass}>
                Behavior Gap
            </h2>

            <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
                Runs the same simulated market path
                through two investors — one who stays
                invested through downturns, one who
                sells after a crash and re-enters
                gradually — to quantify what
                panic-selling costs, in this
                household&apos;s own numbers, by year{" "}
                <strong>{endYear}</strong>.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
                <ResultCard
                    label="Stays invested"
                    value={formatMoney(
                        analysis.staysInvestedMedian,
                        plan.currency
                    )}
                    description={`Median wealth at ${endYear}`}
                />

                <ResultCard
                    label="Sells & re-enters late"
                    value={formatMoney(
                        analysis.panicMedian,
                        plan.currency
                    )}
                    description={`Median wealth at ${endYear}`}
                />
            </div>

            <div className="mt-5 rounded-xl bg-[#f8faff] p-5">
                <div className="text-[12px] leading-6 text-[#16213e]">
                    Cost of panic:{" "}
                    <strong>
                        {formatMoney(
                            analysis.panicCost,
                            plan.currency
                        )}
                    </strong>{" "}
                    (
                    {(
                        analysis.annualizedGap * 100
                    ).toFixed(1)}
                    {" "}pp/yr) by {endYear}. A
                    panic-triggering decline occurred in{" "}
                    <strong>
                        {(
                            analysis.panicShare * 100
                        ).toFixed(0)}
                        %
                    </strong>{" "}
                    of simulated paths.
                </div>
            </div>

            <p className="mt-5 text-[10px] leading-5 text-[#9ca3af]">
                Model: a decline of 15%+ in a single
                year triggers selling 65% of the
                invested pool to cash; contributions
                pause for 2 years, then phase back
                into the market over 2 more. Both
                investors experience the identical
                simulated market path each run —
                only the reaction differs.
            </p>

            <p className="mt-2 text-[10px] italic leading-5 text-[#9ca3af]">
                Illustrative, not personal advice.
            </p>
        </section>
    );
}

function ResultCard({
    label,
    value,
    description,
}: {
    label: string;
    value: string;
    description: string;
}) {
    return (
        <div className="rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-5">
            <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]">
                {label}
            </div>

            <div className="mt-2 text-[26px] font-extrabold tracking-tight text-[#16213e]">
                {value}
            </div>

            <div className="mt-1 text-[10px] text-[#9ca3af]">
                {description}
            </div>
        </div>
    );
}

const sectionClass =
    "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
    "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";