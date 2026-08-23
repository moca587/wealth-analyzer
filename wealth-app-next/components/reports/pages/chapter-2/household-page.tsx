import type { WealthPlan } from "@/lib/engine/types";

import { ageFromDOB } from "@/lib/engine/financial-math";
import { RISK_PROFILES } from "@/lib/engine/constants";

import { ReportPage } from "../../report-page";

type Props = {
  plan: WealthPlan;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function HouseholdPage({
  plan,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const primary = plan.clients[0];

  const age = primary?.dob ? ageFromDOB(primary.dob) : undefined;

  const riskLabel = primary?.risk
    ? (RISK_PROFILES[primary.risk]?.label ?? primary.risk)
    : "—";

  const initials =
    `${primary?.first?.[0] ?? ""}${primary?.last?.[0] ?? ""}`.toUpperCase() ||
    "—";

  const residence = [primary?.city, primary?.state, primary?.country]
    .filter(Boolean)
    .join(", ");

  return (
    <ReportPage
      clientName={clientName}
      title="Household Profile"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <p className="text-[11px] leading-5 text-[#6b7280]">
        In plain terms: Who this plan is for — the people in the household,
        where they live, and the risk comfort and time horizon every later page
        is built on.
      </p>

      <div className="mt-6 flex items-center gap-5">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-[#e8f1fa] text-[16px] font-bold text-[#0867b9]">
          {initials}
        </div>

        <div>
          <div className="text-[18px] font-bold text-[#30343b]">
            {clientName}
          </div>

          <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.14em] text-[#8a9098]">
            Primary client
          </div>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-4 gap-3">
        <InfoCard label="Age" value={age != null ? `${age} yrs` : "—"} />

        <InfoCard label="Risk Profile" value={riskLabel} />

        <InfoCard
          label="Time Horizon"
          value={
            primary?.horizon
              ? `${primary.horizon.replace("_", "–")} years`
              : "—"
          }
        />
        <InfoCard
          label="Return / Vol"
          value={
            primary?.risk && RISK_PROFILES[primary.risk]
              ? `~${RISK_PROFILES[primary.risk].mu.toFixed(
                  1,
                )}% · vol ${RISK_PROFILES[primary.risk].sigma.toFixed(0)}%`
              : "—"
          }
        />
      </div>

      <div className="mt-7 border-t border-[#d8dde3] pt-5">
        <div className="mb-3 text-[9px] font-bold uppercase tracking-[0.12em] text-[#7c828a]">
          Household
        </div>

        <div className="grid grid-cols-2 gap-x-10 gap-y-5">
          <InfoLine label="Residence" value={residence || "—"} />

          <InfoLine label="Reporting Currency" value={plan.currency || "USD"} />

          {/* add this later */}
          {/* <InfoLine label="Target Retirement" value="—" /> */}

          <InfoLine
            label="Children"
            value={
              plan.children.length > 0
                ? plan.children
                    .map((child) =>
                      [child.first, child.last].filter(Boolean).join(" "),
                    )
                    .join(", ")
                : "None on file"
            }
          />
        </div>
      </div>
    </ReportPage>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#f8f9fb] px-4 py-3">
      <div className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#7c828a]">
        {label}
      </div>

      <div className="mt-2 text-[14px] font-bold text-[#30343b]">{value}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#888f97]">
        {label}
      </div>

      <div className="mt-1 text-[12px] font-medium text-[#30343b]">{value}</div>
    </div>
  );
}
