import type {
  WealthPlan,
} from "@/lib/engine/types";

import {
  COUNTRY_LABELS,
} from "@/lib/engine/constants";

import {
  computeStateTax,
  estimateIncomeTax,
  formatMoney,
} from "@/lib/engine/financial-math";

type Props = {
  plan: WealthPlan;
  update: (
    patch: Partial<WealthPlan>
  ) => void;
};

export function TaxSection({
  plan,
  update,
}: Props) {
  const grossIncome =
    plan.incomes.reduce(
      (sum, income) =>
        sum +
        Number(
          income.amount || 0
        ),
      0
    );

  const primaryClient =
    plan.clients[0];

  const country =
    primaryClient?.country ??
    "US";

  const state =
    primaryClient?.state;

  // ─────────────────────────────────────────────
  // Tax settings
  // ─────────────────────────────────────────────

  const taxJurisdiction =
    plan.taxJurisdiction ??
    country;

  const incomeTaxSource =
    plan.incomeTaxSource ??
    "auto";

  const flatIncomeTaxRate =
    plan.flatIncomeTaxRate ??
    0.25;

  const capitalGainsTaxRate =
    plan.capitalGainsTaxRate ??
    0.15;

  const portfolioTurnover =
    plan.portfolioTurnover ??
    0.10;

  const applyTaxToSimulation =
    plan.applyTaxToSimulation ??
    true;

  // ─────────────────────────────────────────────
  // Income tax
  // ─────────────────────────────────────────────

  let federalTax = 0;

  if (
    incomeTaxSource ===
    "auto"
  ) {
    federalTax =
      estimateIncomeTax(
        grossIncome,
        taxJurisdiction
      );
  }

  if (
    incomeTaxSource ===
    "manual"
  ) {
    federalTax =
      grossIncome *
      flatIncomeTaxRate;
  }

  if (
    incomeTaxSource ===
    "none"
  ) {
    federalTax = 0;
  }

  // State tax is based on the
  // household residence state.
  const stateTax =
    computeStateTax(
      grossIncome,
      country,
      state
    );

  const totalTax =
    federalTax +
    stateTax;

  const netIncome =
    grossIncome -
    totalTax;

  const effectiveRate =
    grossIncome > 0
      ? (
          totalTax /
          grossIncome
        ) *
        100
      : 0;

  // ─────────────────────────────────────────────
  // Investment tax drag
  // ─────────────────────────────────────────────

  const grossReturn =
    plan.returnMean ??
    0.07;

  const capitalGainsDrag =
    capitalGainsTaxRate *
    portfolioTurnover;

  const afterTaxReturn =
    grossReturn *
    (
      1 -
      capitalGainsDrag
    );

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Tax
      </h2>

      {/* Residence information */}

      <div className="grid gap-4 md:grid-cols-2">
        <DisplayField
          label="Country (from Household)"
          value={country}
        />

        <DisplayField
          label="State"
          value={
            state ?? "—"
          }
        />
      </div>

      {/* Tax settings */}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label>
          <span className={labelClass}>
            Tax jurisdiction
          </span>

          <select
            value={
              taxJurisdiction
            }
            onChange={(e) =>
              update({
                taxJurisdiction:
                  e.target
                    .value as WealthPlan["taxJurisdiction"],
              })
            }
            className={inputClass}
          >
            {Object.entries(
              COUNTRY_LABELS
            ).map(
              ([
                code,
                label,
              ]) => (
                <option
                  key={code}
                  value={code}
                >
                  {label}
                </option>
              )
            )}
          </select>

          <p className="mt-1.5 text-[10px] leading-4 text-[#9ca3af]">
            Income-tax brackets use this jurisdiction. Defaults to the
            client&apos;s residence country.
          </p>
        </label>

        <label>
          <span className={labelClass}>
            Income-tax source
          </span>

          <select
            value={
              incomeTaxSource
            }
            onChange={(e) =>
              update({
                incomeTaxSource:
                  e.target
                    .value as WealthPlan["incomeTaxSource"],
              })
            }
            className={inputClass}
          >
            <option value="auto">
              Auto — brackets by country
            </option>

            <option value="manual">
              Manual flat rate
            </option>

            <option value="none">
              None — no income tax
            </option>
          </select>
        </label>
      </div>

      {/* Tax rate inputs */}

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label>
          <span className={labelClass}>
            Flat income-tax rate %
          </span>

          <input
            type="number"
            step="0.1"
            disabled={
              incomeTaxSource !==
              "manual"
            }
            value={Number(
              (
                flatIncomeTaxRate *
                100
              ).toFixed(2)
            )}
            onChange={(e) =>
              update({
                flatIncomeTaxRate:
                  Number(
                    e.target.value
                  ) /
                  100,
              })
            }
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>
            Capital gains rate %
          </span>

          <input
            type="number"
            step="0.1"
            value={Number(
              (
                capitalGainsTaxRate *
                100
              ).toFixed(2)
            )}
            onChange={(e) =>
              update({
                capitalGainsTaxRate:
                  Number(
                    e.target.value
                  ) /
                  100,
              })
            }
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>
            Portfolio turnover %
          </span>

          <input
            type="number"
            step="0.1"
            value={Number(
              (
                portfolioTurnover *
                100
              ).toFixed(2)
            )}
            onChange={(e) =>
              update({
                portfolioTurnover:
                  Number(
                    e.target.value
                  ) /
                  100,
              })
            }
            className={inputClass}
          />
        </label>
      </div>

      <p className="mt-2 text-[10px] leading-4 text-[#9ca3af]">
        Share of portfolio that realizes taxable gains each year.
        Applied as a return drag: effective return ≈ gross ×
        (1 − CGT × turnover).
      </p>

      {/* Simulation tax setting */}

      <div className="mt-5">
        <label>
          <span className={labelClass}>
            Apply tax to simulation
          </span>

          <select
            value={
              applyTaxToSimulation
                ? "yes"
                : "no"
            }
            onChange={(e) =>
              update({
                applyTaxToSimulation:
                  e.target.value ===
                  "yes",
              })
            }
            className={inputClass}
          >
            <option value="yes">
              Yes — use net income & after-tax returns
            </option>

            <option value="no">
              No — gross values (pre-tax)
            </option>
          </select>
        </label>
      </div>

      {/* Tax results */}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <TaxCard
          label="Gross household income"
          value={formatMoney(
            grossIncome,
            plan.currency
          )}
        />

        <TaxCard
          label={
            incomeTaxSource ===
            "manual"
              ? "Income tax"
              : "Federal income tax"
          }
          value={formatMoney(
            federalTax,
            plan.currency
          )}
        />

        <TaxCard
          label={`${state ?? "State"} tax`}
          value={formatMoney(
            stateTax,
            plan.currency
          )}
        />

        <TaxCard
          label="Net household income"
          value={formatMoney(
            netIncome,
            plan.currency
          )}
        />

        <TaxCard
          label="After-tax expected investment return"
          value={`${(
            afterTaxReturn *
            100
          ).toFixed(2)}% / yr`}
        />

        <TaxCard
          label="Capital gains drag"
          value={`${(
            capitalGainsDrag *
            100
          ).toFixed(2)}%`}
        />
      </div>

      {/* Effective tax rate */}

      <div className="mt-5 rounded-xl bg-[#f8faff] p-4">
        <div className="text-[11px] text-[#64748b]">
          Combined effective rate
        </div>

        <div className="mt-1 text-[20px] font-bold text-[#16213e]">
          {effectiveRate.toFixed(
            1
          )}
          %
        </div>
      </div>
    </section>
  );
}

function DisplayField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className={labelClass}>
        {label}
      </div>

      <div className="rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-[#f8faff] px-3 py-2 text-[13px] font-medium text-[#16213e]">
        {value}
      </div>
    </div>
  );
}

function TaxCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4">
      <div className="text-[11px] text-[#64748b]">
        {label}
      </div>

      <div className="mt-1 text-[18px] font-bold text-[#16213e]">
        {value}
      </div>
    </div>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "mb-4 text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const labelClass =
  "mb-1.5 block text-[11px] font-semibold text-[#64748b]";

const inputClass =
  "w-full rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[13px] font-medium text-[#16213e] outline-none focus:border-[#0057b8] focus:ring-2 focus:ring-[rgba(0,87,184,.08)] disabled:cursor-not-allowed disabled:bg-[#f4f6fb] disabled:text-[#9ca3af]";