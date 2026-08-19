import type { WealthPlan, SimulationResult } from "@/lib/engine/types";

import { buildEstateTransferSummary } from "@/lib/engine/estate-transfer";

import { ESTATE_TAX_DEFAULTS } from "@/lib/engine/constants";

import { formatMoney } from "@/lib/engine/financial-math";

type Props = {
  plan: WealthPlan;
  result: SimulationResult;
  update: (patch: Partial<WealthPlan>) => void;
};

export function EstateTransferSection({ plan, result, update }: Props) {
  const summary = buildEstateTransferSummary(plan, result);

  const country = plan.clients[0]?.country ?? "US";

  const defaults = ESTATE_TAX_DEFAULTS[country];

  function useCountryDefaults() {
    if (!defaults) {
      return;
    }

    update({
      estateTaxExemption: defaults.exemption,

      estateTaxRate: defaults.rate,
    });
  }

  function addBeneficiary() {
    const beneficiaries = plan.beneficiaries ?? [];

    update({
      beneficiaries: [
        ...beneficiaries,
        {
          id: crypto.randomUUID(),
          name: "",
          relationship: "",
          share: 0,
        },
      ],
    });
  }

  function updateBeneficiary(
    id: string,
    patch: Partial<{
      name: string;
      relationship: string;
      share: number;
    }>,
  ) {
    const beneficiaries = (plan.beneficiaries ?? []).map((beneficiary) =>
      beneficiary.id === id
        ? {
            ...beneficiary,
            ...patch,
          }
        : beneficiary,
    );

    update({
      beneficiaries,
    });
  }

  function removeBeneficiary(id: string) {
    update({
      beneficiaries: (plan.beneficiaries ?? []).filter(
        (beneficiary) => beneficiary.id !== id,
      ),
    });
  }

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Estate Transfer Summary</h2>

      <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
        A simplified look at what transfers to your beneficiaries at the end of
        the projection: median projected net worth plus life-insurance death
        benefits, less a configurable estate tax.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label>
          <span className={labelClass}>Estate tax exemption</span>

          <input
            type="number"
            value={summary.estateTaxExemption}
            onChange={(e) =>
              update({
                estateTaxExemption: Number(e.target.value),
              })
            }
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>Estate tax rate %</span>

          <input
            type="number"
            step="0.1"
            value={summary.estateTaxRate * 100}
            onChange={(e) =>
              update({
                estateTaxRate: Number(e.target.value) / 100,
              })
            }
            className={inputClass}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={useCountryDefaults}
        className="mt-4 rounded-lg border border-[rgba(0,87,184,.14)] bg-white px-4 py-2 text-[12px] font-semibold text-[#0057b8] hover:bg-[#f8faff]"
      >
        ↺ Use country defaults
      </button>

      {defaults && (
        <div className="mt-4 rounded-xl bg-[#f8faff] p-4">
          <div className="text-[11px] font-bold text-[#16213e]">
            {defaults.label}
          </div>

          <p className="mt-1 text-[10px] leading-5 text-[#64748b]">
            {defaults.description}
          </p>
        </div>
      )}

      <div className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h3 className={subTitleClass}>Beneficiaries</h3>

          <button
            type="button"
            onClick={addBeneficiary}
            className="rounded-lg border border-[rgba(0,87,184,.14)] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#0057b8] hover:bg-[#f8faff]"
          >
            + Add
          </button>
        </div>

        {(plan.beneficiaries ?? []).length === 0 ? (
          <div className="rounded-xl bg-[#f8faff] px-4 py-5 text-[11px] italic text-[#9ca3af]">
            No beneficiaries added.
          </div>
        ) : (
          <div className="space-y-3">
            {(plan.beneficiaries ?? []).map((beneficiary) => (
              <div
                key={beneficiary.id}
                className="grid gap-3 rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4 md:grid-cols-[1fr_1fr_160px_auto]"
              >
                <label>
                  <span className={labelClass}>Name</span>

                  <input
                    value={beneficiary.name}
                    onChange={(e) =>
                      updateBeneficiary(beneficiary.id, {
                        name: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </label>

                <label>
                  <span className={labelClass}>Relationship</span>

                  <input
                    value={beneficiary.relationship ?? ""}
                    placeholder="child, spouse..."
                    onChange={(e) =>
                      updateBeneficiary(beneficiary.id, {
                        relationship: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </label>

                <label>
                  <span className={labelClass}>Share %</span>

                  <input
                    type="number"
                    step="1"
                    value={beneficiary.share * 100}
                    onChange={(e) =>
                      updateBeneficiary(beneficiary.id, {
                        share: Number(e.target.value) / 100,
                      })
                    }
                    className={inputClass}
                  />
                </label>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeBeneficiary(beneficiary.id)}
                    className="rounded-lg border border-red-100 bg-white px-3 py-2 text-[11px] font-semibold text-red-500"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-4">
        <SummaryCard
          label="Median projected estate"
          value={formatMoney(summary.medianProjectedEstate, plan.currency)}
        />

        <SummaryCard
          label="+ Life insurance"
          value={formatMoney(summary.lifeInsuranceBenefit, plan.currency)}
        />

        <SummaryCard
          label="- Estate tax"
          value={formatMoney(summary.estimatedEstateTax, plan.currency)}
        />

        <SummaryCard
          label="Net to beneficiaries"
          value={formatMoney(summary.netToBeneficiaries, plan.currency)}
          strong
        />
      </div>

      <p className="mt-5 text-[10px] italic leading-5 text-[#9ca3af]">
        Simplified estimate: uses the median simulated net worth at the end of
        the projection plus life-insurance death benefits. It ignores probate,
        state/inheritance taxes, trusts, basis step-up, and exemption
        portability. Verify assumptions with a qualified local professional.
      </p>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]">
        {label}
      </div>

      <div
        className={
          strong
            ? "mt-2 text-[22px] font-extrabold text-[#0057b8]"
            : "mt-2 text-[20px] font-extrabold text-[#16213e]"
        }
      >
        {value}
      </div>
    </div>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const subTitleClass =
  "text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748b]";

const labelClass = "mb-1.5 block text-[11px] font-semibold text-[#64748b]";

const inputClass =
  "w-full rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[13px] font-medium text-[#16213e] outline-none focus:border-[#0057b8] focus:ring-2 focus:ring-[rgba(0,87,184,.08)]";
