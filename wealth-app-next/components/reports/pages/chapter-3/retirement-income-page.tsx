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

export function RetirementIncomePage({
  plan,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const annualNeed = plan.retirement?.annualSpending ?? 0;

  const pensionIncome = (plan.pensions ?? []).reduce(
    (sum, pension) => sum + (pension.annualAmount || 0),
    0,
  );

  const portfolioDraw = Math.max(0, annualNeed - pensionIncome);

  const pensionPct =
    annualNeed > 0 ? Math.min(100, (pensionIncome / annualNeed) * 100) : 0;

  const portfolioPct =
    annualNeed > 0 ? Math.min(100, (portfolioDraw / annualNeed) * 100) : 0;

  return (
    <ReportPage
      clientName={clientName}
      title="Goals & Retirement Plan"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <div className="mt-4">
        <h2 className="text-[17px] font-bold text-[#30343b]">
          Where Retirement Income Comes From
        </h2>

        <p className="mt-2 text-[10px] leading-4 text-[#6b7280]">
          A representative retirement year in today&apos;s money: pensions
          first, the portfolio covers the rest.
        </p>
      </div>

      {/* Annual need */}
      <div className="mt-8">
        <div className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#7c828a]">
          Annual retirement need
        </div>

        <div className="mt-1 text-[25px] font-bold text-[#30343b]">
          Need {formatMoney(annualNeed, plan.currency)}
          <span className="text-[12px] font-medium text-[#737a82]">/yr</span>
        </div>
      </div>

      {/* Income sources */}
      <div className="mt-7">
        <div className="mb-3 text-[9px] font-bold uppercase tracking-[0.12em] text-[#7c828a]">
          Sources
        </div>

        <div className="space-y-5">
          <IncomeSourceBar
            label="Pension / state benefits"
            value={pensionIncome}
            pct={pensionPct}
            currency={plan.currency}
            barClass="bg-[#0867b9]"
          />

          <IncomeSourceBar
            label="Drawn from portfolio"
            value={portfolioDraw}
            pct={portfolioPct}
            currency={plan.currency}
            barClass="bg-[#12a7a5]"
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="mt-8 grid grid-cols-3 gap-3">
        <SummaryCard
          label="Annual need"
          value={formatMoney(annualNeed, plan.currency)}
        />

        <SummaryCard
          label="Pension income"
          value={formatMoney(pensionIncome, plan.currency)}
        />

        <SummaryCard
          label="Portfolio draw"
          value={formatMoney(portfolioDraw, plan.currency)}
        />
      </div>

      {/* Explanation */}
      <div className="mt-8 rounded-lg bg-[#f3f8f5] px-5 py-4">
        <div className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#6d7770]">
          What this means for you
        </div>

        <p className="mt-2 text-[10px] leading-5 text-[#5f666d]">
          Pensions cover{" "}
          <strong>{formatMoney(pensionIncome, plan.currency)}</strong> of your{" "}
          <strong>{formatMoney(annualNeed, plan.currency)}</strong> annual
          retirement need. The remaining{" "}
          <strong>{formatMoney(portfolioDraw, plan.currency)}</strong> per year
          must come from your savings and investments — that drawdown is what
          the wealth-projection pages stress-test.
        </p>
      </div>
    </ReportPage>
  );
}

function IncomeSourceBar({
  label,
  value,
  pct,
  currency,
  barClass,
}: {
  label: string;
  value: number;
  pct: number;
  currency: string;
  barClass: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[10px]">
        <span className="font-semibold text-[#30343b]">{label}</span>

        <span className="font-bold text-[#30343b]">
          {formatMoney(value, currency)}/yr
        </span>
      </div>

      <div className="h-7 overflow-hidden rounded-sm bg-[#edf0f3]">
        <div
          className={`h-full ${barClass}`}
          style={{
            width: `${pct}%`,
          }}
        />
      </div>

      <div className="mt-1 text-right text-[8px] text-[#8a9098]">
        {pct.toFixed(0)}% of retirement need
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#f8f9fb] px-4 py-3">
      <div className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#7c828a]">
        {label}
      </div>

      <div className="mt-1 text-[14px] font-bold text-[#30343b]">{value}</div>
    </div>
  );
}
