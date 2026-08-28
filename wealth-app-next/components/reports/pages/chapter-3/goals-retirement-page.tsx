import type { WealthPlan } from "@/lib/engine/types";

import { formatMoney } from "@/lib/engine/financial-math";

import { ReportPage } from "../../report-page";

type Props = {
  plan: WealthPlan;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function GoalsRetirementPage({
  plan,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const retirementAge = plan.retirement?.retirementAge;

  const annualSpending = plan.retirement?.annualSpending ?? 0;

  const inflationPct = plan.inflationRate * 100;

  const retirementAssets = plan.assets
    .filter((asset) => {
      const text = [asset.type, asset.group, asset.label]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        text.includes("401") ||
        text.includes("ira") ||
        text.includes("retirement") ||
        text.includes("locked")
      );
    })
    .reduce((sum, asset) => sum + (asset.value || 0), 0);

  const earliestYear =
    plan.goals.length > 0
      ? Math.min(...plan.goals.map((goal) => goal.startYear))
      : new Date().getFullYear();

  const latestGoalYear =
    plan.goals.length > 0
      ? Math.max(...plan.goals.map((goal) => goal.endYear))
      : earliestYear + 10;

  const primary = plan.clients[0];

  const currentAge = primary?.dob ? calculateAge(primary.dob) : undefined;

  const retirementYear =
    currentAge != null && retirementAge != null
      ? new Date().getFullYear() + (retirementAge - currentAge)
      : undefined;

  const timelineEnd = Math.max(
    latestGoalYear,
    retirementYear ?? latestGoalYear,
  );

  return (
    <ReportPage
      clientName={clientName}
      title="Goals & Retirement Plan"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <p className="text-[10px] leading-4 text-[#5f666d]">
        In plain terms: The things you are saving for, laid out on a timeline:
        when each goal starts, how long it lasts, and how much it costs per
        year. Thicker bars are bigger goals.
      </p>

      {/* Goal timeline */}
      <div className="mt-6">
        <h3 className="text-[11px] font-bold text-[#173d60]">Goal Timeline</h3>

        <p className="mt-1 text-[9px] leading-4 text-[#7c828a]">
          Each bar spans a goal&apos;s funding years; thickness reflects its
          annual amount. The dashed line marks planned retirement.
        </p>

        <div className="relative mt-5 h-[130px] border-b border-[#aeb5bd]">
          {/* retirement marker */}
          {retirementYear != null &&
            retirementYear >= earliestYear &&
            retirementYear <= timelineEnd && (
              <div
                className="absolute bottom-0 top-0 border-l border-dashed border-[#777]"
                style={{
                  left: `${yearPct(
                    retirementYear,
                    earliestYear,
                    timelineEnd,
                  )}%`,
                }}
              >
                <div className="absolute -top-4 -translate-x-1/2 whitespace-nowrap text-[7px] text-[#777]">
                  Retirement
                </div>
              </div>
            )}

          {plan.goals.map((goal, index) => {
            const left = yearPct(goal.startYear, earliestYear, timelineEnd);

            const right = yearPct(goal.endYear, earliestYear, timelineEnd);

            const width = Math.max(3, right - left);

            const thickness = Math.max(8, Math.min(22, 8 + goal.amt / 2500));

            return (
              <div
                key={goal.id}
                className="absolute"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  top: `${20 + index * 28}px`,
                }}
              >
                <div className="mb-1 flex items-center gap-2 text-[8px]">
                  <span className="font-bold text-[#30343b]">
                    {goal.startYear}
                  </span>

                  <span className="font-semibold text-[#30343b]">
                    {goal.name}
                  </span>

                  <span className="text-[#6b7280]">
                    {formatMoney(goal.amt, plan.currency)}
                    /yr
                  </span>
                </div>

                <div
                  className={goalBarClass(goal.tier)}
                  style={{
                    height: `${thickness}px`,
                  }}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-5 text-[8px] text-[#6b7280]">
          <span className="font-bold">Priority:</span>

          <PriorityLegend label="Essential" className="bg-[#1265bd]" />

          <PriorityLegend label="Important" className="bg-[#12a7a5]" />

          <PriorityLegend label="Aspirational" className="bg-[#7037e8]" />
        </div>
      </div>

      {/* Goal table */}
      <div className="mt-6">
        <div className="grid grid-cols-[1.5fr_.8fr_.9fr_1.2fr_.8fr] border-b border-[#cfd4da] pb-2 text-[7px] font-bold uppercase tracking-[0.08em] text-[#7c828a]">
          <span>Goal</span>
          <span>Category</span>
          <span>Cost / year</span>
          <span>When</span>
          <span>Priority</span>
        </div>

        {plan.goals.map((goal) => {
          const years = goal.endYear - goal.startYear + 1;

          return (
            <div
              key={goal.id}
              className="grid grid-cols-[1.5fr_.8fr_.9fr_1.2fr_.8fr] border-b border-[#e4e7eb] py-2 text-[8px] text-[#30343b]"
            >
              <span className="font-semibold">{goal.name}</span>

              <span>{goal.cat || "Other"}</span>

              <span>{formatMoney(goal.amt, plan.currency)} / yr</span>

              <span>
                {goal.startYear}–{goal.endYear} ({years} yrs)
              </span>

              <span>{formatTier(goal.tier)}</span>
            </div>
          );
        })}
      </div>

      {/* Retirement parameters */}
      <div className="mt-7">
        <h3 className="text-[11px] font-bold text-[#173d60]">
          Retirement Parameters
        </h3>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <InfoCard
            label="Retire at"
            value={retirementAge != null ? `Age ${retirementAge}` : "—"}
            sublabel="planned"
          />

          <InfoCard
            label="Annual spend"
            value={
              annualSpending > 0
                ? formatMoney(annualSpending, plan.currency)
                : "—"
            }
            sublabel="in today's money"
          />

          <InfoCard
            label="Inflation assumed"
            value={`${inflationPct.toFixed(1)}%`}
            sublabel="per year"
          />
        </div>
      </div>

      {/* Retirement detail */}
      <div className="mt-5">
        <div className="grid grid-cols-[1fr_1fr] border-b border-[#cfd4da] pb-2 text-[7px] font-bold uppercase tracking-[0.08em] text-[#7c828a]">
          <span>Item</span>
          <span>Value</span>
        </div>

        <DetailRow
          label="Retirement savings pool (today)"
          value={formatMoney(retirementAssets, plan.currency)}
        />

        {plan.pensions && plan.pensions.length > 0 ? (
          plan.pensions.map((pension) => (
            <DetailRow
              key={pension.id}
              label="Pension / state benefit"
              value={`${pension.label || "Pension"} · ${formatMoney(
                pension.annualAmount,
                plan.currency,
              )} / yr from age ${pension.startAge}`}
            />
          ))
        ) : (
          <DetailRow label="Pension / state benefit" value="None on file" />
        )}
      </div>
    </ReportPage>
  );
}

function yearPct(year: number, start: number, end: number) {
  if (end <= start) return 0;

  return ((year - start) / (end - start)) * 100;
}

function calculateAge(dob: string): number | undefined {
  const date = new Date(dob);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  const today = new Date();

  let age = today.getFullYear() - date.getFullYear();

  const beforeBirthday =
    today.getMonth() < date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() < date.getDate());

  if (beforeBirthday) {
    age--;
  }

  return age;
}

function goalBarClass(
  tier: "essential" | "important" | "aspirational" | undefined,
) {
  switch (tier) {
    case "essential":
      return "w-full rounded-sm bg-[#1265bd]";

    case "important":
      return "w-full rounded-sm bg-[#12a7a5]";

    case "aspirational":
      return "w-full rounded-sm bg-[#7037e8]";

    default:
      return "w-full rounded-sm bg-[#7c8795]";
  }
}

function formatTier(
  tier: "essential" | "important" | "aspirational" | undefined,
) {
  switch (tier) {
    case "essential":
      return "Essential";

    case "important":
      return "Important";

    case "aspirational":
      return "Aspirational";

    default:
      return "—";
  }
}

function PriorityLegend({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 ${className}`} />
      {label}
    </span>
  );
}

function InfoCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <div className="bg-[#f8f9fb] px-4 py-3">
      <div className="text-[7px] font-bold uppercase tracking-[0.1em] text-[#7c828a]">
        {label}
      </div>

      <div className="mt-1 text-[14px] font-bold text-[#30343b]">{value}</div>

      <div className="mt-0.5 text-[8px] text-[#8a9098]">{sublabel}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[1fr_1fr] border-b border-[#e4e7eb] py-2 text-[8px]">
      <span className="text-[#5f666d]">{label}</span>

      <span className="font-medium text-[#30343b]">{value}</span>
    </div>
  );
}
