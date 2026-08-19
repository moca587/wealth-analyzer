import type { WealthPlan } from "@/lib/engine/types";

import { buildRothConversionProjection } from "@/lib/engine/roth-conversion";

import { formatMoney } from "@/lib/engine/financial-math";

type Props = {
  plan: WealthPlan;
};

export function RothConversionSection({ plan }: Props) {
  const projection = buildRothConversionProjection(plan);

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Roth-Style Conversion Window</h2>

      <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
        Converting tax-deferred savings to a{" "}
        <strong className="text-[#16213e]">tax-free</strong> account in
        low-income years — the gap between retiring and when mandatory
        withdrawals or pensions begin — locks in today&apos;s lower tax rate and
        shrinks future required withdrawals. This sizes that window from your
        retirement pool. Illustrative — not tax advice.
      </p>

      {/* <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg border border-[rgba(0,87,184,.14)] bg-white px-4 py-2 text-[12px] font-semibold text-[#0057b8]"
        >
          ▶ Analyze conversion window
        </button>

        <span className="text-[11px] font-semibold text-[#00875a]">
          ✓ done
        </span>
      </div> */}

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <SummaryCard
          label="Conversion window"
          value={`age ${projection.startAge}–${projection.endAge} (${projection.windowYears} yrs)`}
        />

        <SummaryCard
          label="Suggested / yr"
          value={formatMoney(
            projection.suggestedAnnualConversion,
            plan.currency,
          )}
        />

        <SummaryCard
          label={`Tax / yr (~${(projection.estimatedTaxRate * 100).toFixed(
            0,
          )}%)`}
          value={formatMoney(projection.estimatedAnnualTax, plan.currency)}
        />

        <SummaryCard
          label="Total converted"
          value={formatMoney(projection.taxDeferredPool, plan.currency)}
        />
      </div>

      <div className="mt-5 rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-5">
        <p className="text-[11px] leading-5 text-[#64748b]">
          <strong className="text-[#16213e]">
            United States — Roth conversion.
          </strong>{" "}
          Convert a Traditional IRA/401(k) to a Roth IRA, paying income tax now
          so future growth and withdrawals are tax-free — most valuable in
          low-income years before RMDs and Social Security begin.
        </p>

        <p className="mt-3 text-[11px] leading-5 text-[#64748b]">
          Spreading your{" "}
          <strong className="text-[#16213e]">
            {formatMoney(projection.taxDeferredPool, plan.currency)}
          </strong>{" "}
          tax-deferred pool across the {projection.windowYears}-year window (~
          {formatMoney(projection.suggestedAnnualConversion, plan.currency)}
          /yr) moves it into the tax-free bucket at an estimated{" "}
          {(projection.estimatedTaxRate * 100).toFixed(0)}% rate (~
          {formatMoney(projection.estimatedTotalTax, plan.currency)} total tax).
        </p>
      </div>

      <p className="mt-4 text-[10px] italic leading-5 text-[#9ca3af]">
        Illustrative, level-conversion estimate — not tax advice. The optimal
        amount depends on filling specific tax brackets, benefit/credit
        thresholds and your other income. Confirm with a tax professional.
      </p>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]">
        {label}
      </div>

      <div className="mt-2 text-[18px] font-extrabold text-[#16213e]">
        {value}
      </div>
    </div>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";
