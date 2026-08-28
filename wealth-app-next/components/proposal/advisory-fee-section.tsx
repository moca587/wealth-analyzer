"use client";

import type { Proposal } from "@/lib/orders/proposal";

import { calcAdvisoryFeePct } from "@/lib/proposal/advisory-fee";

type Props = {
  proposal: Proposal;
  updateProposal: (patch: Partial<Proposal>) => void;

  grossReturn: number;
};

export function AdvisoryFeeSection({
  proposal,
  updateProposal,
  grossReturn,
}: Props) {
  const feeType = proposal.feeType ?? "none";

  const feeRate = proposal.feeRate ?? 0;

  const advisoryFeePct = calcAdvisoryFeePct(
    feeType,
    feeRate,
    proposal.targetAmount,
  );

  const netReturn = grossReturn - advisoryFeePct;

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Advisory Fee</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className={labelClass}>Fee type</span>

          <select
            value={feeType}
            onChange={(e) =>
              updateProposal({
                feeType: e.target.value as Proposal["feeType"],
              })
            }
            className={inputClass}
          >
            <option value="none">None</option>

            <option value="aum">AUM % (annual)</option>

            <option value="flat">Flat $ per year</option>
          </select>
        </label>

        <label>
          <span className={labelClass}>Rate</span>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={feeRate}
              onChange={(e) =>
                updateProposal({
                  feeRate: Number(e.target.value) || 0,
                })
              }
              className={inputClass}
              disabled={feeType === "none"}
            />

            <span className="whitespace-nowrap text-[11px] text-[#64748b]">
              {feeType === "flat" ? "$/yr" : "%/yr"}
            </span>
          </div>
        </label>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Metric label="Gross return" value={`${grossReturn.toFixed(2)}%`} />

        <Metric
          label="Advisory fee"
          value={formatAdvisoryFee(feeType, feeRate)}
        />

        <Metric label="Net return" value={`${netReturn.toFixed(2)}%`} />
      </div>

      <p className="mt-4 text-[11px] leading-5 text-[#9ca3af]">
        Deducted from the proposal&apos;s gross return in the Portfolio
        Comparison simulation. Shown separately from the current portfolio fee
        so you can model the net-of-fee impact side by side.
      </p>
    </section>
  );
}

function formatAdvisoryFee(
  feeType: Proposal["feeType"],
  feeRate: number,
): string {
  if (feeType === "aum") {
    return `${feeRate.toFixed(2)}%`;
  }

  if (feeType === "flat") {
    return `$${feeRate.toLocaleString("en-US")}/yr`;
  }

  return "None (0%)";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]">
        {label}
      </div>

      <div className="mt-1 text-[17px] font-extrabold text-[#16213e]">
        {value}
      </div>
    </div>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "mb-4 text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const labelClass = "mb-1.5 block text-[11px] font-semibold text-[#64748b]";

const inputClass =
  "w-full rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[13px] font-medium text-[#16213e] outline-none focus:border-[#0057b8]";
