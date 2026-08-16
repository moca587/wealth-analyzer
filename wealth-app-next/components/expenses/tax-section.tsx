import type { WealthPlan } from "@/lib/engine/types";
import {
  computeStateTax,
  estimateIncomeTax,
  formatMoney,
} from "@/lib/engine/financial-math";

export function TaxSection({ plan }: { plan: WealthPlan }) {
  const grossIncome = plan.incomes.reduce(
    (sum, income) => sum + income.amount,
    0
  );

  const primaryClient = plan.clients[0];

  const country = primaryClient?.country ?? "US";
  const state = primaryClient?.state;

  const federalTax = estimateIncomeTax(
    grossIncome,
    country
  );

  const stateTax = computeStateTax(
    grossIncome,
    country,
    state
  );

  const totalTax = federalTax + stateTax;
  const netIncome = grossIncome - totalTax;

  const effectiveRate =
    grossIncome > 0
      ? (totalTax / grossIncome) * 100
      : 0;

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Tax</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <DisplayField
          label="Country (from Household)"
          value={country}
        />

        <DisplayField
          label="State"
          value={state ?? "—"}
        />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <TaxCard
          label="Gross household income"
          value={formatMoney(grossIncome, plan.currency)}
        />

        <TaxCard
          label="Federal income tax"
          value={formatMoney(federalTax, plan.currency)}
        />

        <TaxCard
          label={`${state ?? "State"} tax`}
          value={formatMoney(stateTax, plan.currency)}
        />

        <TaxCard
          label="Net household income"
          value={formatMoney(netIncome, plan.currency)}
        />
      </div>

      <div className="mt-5 rounded-xl bg-[#f8faff] p-4">
        <div className="text-[11px] text-[#64748b]">
          Combined effective rate
        </div>

        <div className="mt-1 text-[20px] font-bold text-[#16213e]">
          {effectiveRate.toFixed(1)}%
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
      <div className="mb-1.5 text-[11px] font-semibold text-[#64748b]">
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
