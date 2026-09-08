"use client";

import type { WealthPlan } from "@/lib/engine/types";
import type { Proposal } from "@/lib/orders/proposal";

type Props = {
  plan: WealthPlan;
  proposal: Proposal;
  update: (patch: Partial<Proposal>) => void;
};

const OBJECTIVES = [
  "Growth",
  "Balanced",
  "Income",
  "Capital preservation",
  "Speculation / opportunistic",
];

export function ProposalSetupSection({ plan, proposal, update }: Props) {
  // console.log("ProposalSetupSection proposal:", proposal);

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Proposal Setup</h2>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Client */}
        {/* <div>
          <label className={labelClass}>Client</label>

          <div className={readOnlyClass}>{proposal.clientName || "—"}</div>
        </div> */}
        {/* Client */}
        <div>
          <label className={labelClass}>Client</label>

          <select
            value={proposal.clientId ?? ""}
            onChange={(e) => {
              const clientId = e.target.value;

              const client = plan.clients.find(
                (client) => client.id === clientId,
              );

              update({
                clientId,
                clientName: client
                  ? `${client.first} ${client.last}`.trim()
                  : "",
              });
            }}
            className={inputClass}
          >
            {plan.clients.map((client) => (
              <option key={client.id} value={client.id}>
                {`${client.first} ${client.last}`.trim() || "Unnamed client"}
              </option>
            ))}
          </select>
        </div>

        {/* Advisor */}
        <div>
          <label className={labelClass}>Advisor name</label>

          <input
            type="text"
            value={proposal.advisor ?? ""}
            onChange={(e) =>
              update({
                advisor: e.target.value,
              })
            }
            className={inputClass}
            placeholder="Advisor name"
          />
        </div>

        {/* Target amount */}
        <div>
          <label className={labelClass}>Target $ amount</label>

          <input
            type="number"
            min="0"
            value={proposal.targetAmount}
            onChange={(e) =>
              update({
                targetAmount: Number(e.target.value) || 0,
              })
            }
            className={inputClass}
          />
        </div>

        {/* Objective */}
        <div>
          <label className={labelClass}>Objective</label>

          <select
            value={proposal.objective ?? "Balanced"}
            onChange={(e) =>
              update({
                objective: e.target.value,
              })
            }
            className={inputClass}
          >
            {OBJECTIVES.map((objective) => (
              <option key={objective} value={objective}>
                {objective}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Investment thesis / overall rationale */}
      <div className="mt-4">
        <label className={labelClass}>
          Investment thesis / overall rationale
        </label>

        <textarea
          value={proposal.investmentThesis ?? ""}
          onChange={(e) =>
            update({
              investmentThesis: e.target.value,
            })
          }
          className={`${inputClass} min-h-[120px] resize-y`}
          placeholder="Describe the overall investment rationale, portfolio construction approach, and key considerations..."
        />
      </div>

      <div className="mt-4 text-[11px] text-[#64748b]">
        Client risk:{" "}
        <span className="font-semibold text-[#16213e]">
          {getRiskLabel(plan)}
        </span>
        {" • "}
        Horizon:{" "}
        <span className="font-semibold text-[#16213e]">
          {getHorizonLabel(plan)}
        </span>
      </div>
    </section>
  );
}

// To do: implement getRiskLabel and getHorizonLabel
function getRiskLabel(plan: WealthPlan): string {
  return "Moderate";
}

function getHorizonLabel(plan: WealthPlan): string {
  return "5–10 years";
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "mb-4 text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const labelClass = "mb-1.5 block text-[11px] font-semibold text-[#64748b]";

const inputClass =
  "w-full rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[13px] font-medium text-[#16213e] outline-none focus:border-[#0057b8]";

const readOnlyClass =
  "rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] px-3 py-2 text-[13px] font-semibold text-[#16213e]";
