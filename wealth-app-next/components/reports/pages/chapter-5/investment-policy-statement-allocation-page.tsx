import type { WealthPlan } from "@/lib/engine/types";

import { ageFromDOB, formatMoney } from "@/lib/engine/financial-math";

import { calcIpsPortfolioMetrics } from "@/lib/portfolio/ips-metrics";

import { ReportPage } from "../../report-page";

type Props = {
  plan: WealthPlan;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function InvestmentPolicyStatementAllocationPage({
  plan,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const primary = plan.clients[0];

  const age = primary?.dob ? ageFromDOB(primary.dob) : undefined;

  const retirementAge = plan.retirement?.retirementAge ?? 65;

  const yearsToRetirement =
    age != null ? Math.max(0, retirementAge - age) : undefined;

  const ipsMetrics = calcIpsPortfolioMetrics(primary?.risk ?? "moderate");

  const expectedReturn = ipsMetrics.geometricReturn * 100;

  const volatility = ipsMetrics.volatility * 100;

  // Monthly expenses -> annual expenses
  const annualExpenses = plan.expenses.reduce(
    (sum, expense) => sum + expense.amount * 12,
    0,
  );

  const sixMonthsExpenses = annualExpenses / 2;

  const twelveMonthsExpenses = annualExpenses;

  // Liquid assets
  const liquidAssets = plan.assets
    .filter((asset) => asset.liquid)
    .reduce((sum, asset) => sum + (asset.value || 0), 0);

  // Total investable portfolio.
  // Prefer holdings when available.
  const holdings = plan.holdings ?? [];

  const totalHoldings = holdings.reduce(
    (sum, holding) => sum + (holding.value || 0),
    0,
  );

  const concentratedHoldings =
    totalHoldings > 0
      ? holdings
          .map((holding) => ({
            name: holding.ticker || holding.name || "Holding",

            percentage: (holding.value / totalHoldings) * 100,
          }))
          .filter((holding) => holding.percentage > 20)
      : [];

  const concentratedText =
    concentratedHoldings.length > 0
      ? `Concentrated holdings: ${concentratedHoldings
          .map(
            (holding) => `${holding.name} (${holding.percentage.toFixed(0)}%)`,
          )
          .join(", ")} (each >20% of portfolio).`
      : "No individual holding exceeds 20% of the portfolio.";

  const jurisdiction = formatCountry(primary?.country);

  return (
    <ReportPage
      clientName={clientName}
      title="Investment Policy Statement"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      {/* 3. Constraints */}
      <div className="mt-3">
        <SectionTitle>3. Constraints</SectionTitle>

        <div className="mt-3">
          <TableHeader left="Dimension" right="Policy" />

          <PolicyRow
            label="Time horizon"
            value={
              yearsToRetirement != null
                ? `~${yearsToRetirement} yrs to retirement (age ${retirementAge}), then a multi-decade decumulation horizon.`
                : `Retirement planned at age ${retirementAge}, followed by a multi-decade decumulation horizon.`
            }
          />

          <PolicyRow
            label="Liquidity"
            value={`Cash reserve ~6–12 months' expenses (${formatMoney(
              sixMonthsExpenses,
              plan.currency,
            )}–${formatMoney(
              twelveMonthsExpenses,
              plan.currency,
            )}). Goals due within 3 yrs should generally be funded from cash / short fixed income. Current liquid assets: ${formatMoney(
              liquidAssets,
              plan.currency,
            )}.`}
          />

          <PolicyRow
            label="Legal/regulatory"
            value={`Managed under the laws of ${jurisdiction}. A planning framework, not a discretionary mandate; the client retains decision authority.`}
          />

          <PolicyRow
            label="Unique circumstances"
            value={`${concentratedText} Held-away assets and ESG/values preferences recorded as applicable.`}
          />
        </div>
      </div>

      {/* 4. Strategic Asset Allocation */}
      <div className="mt-7">
        <SectionTitle>4. Strategic asset allocation (policy)</SectionTitle>

        <div className="mt-3">
          <div className="grid grid-cols-[30%_15%_18%_37%] bg-[#e7eff8] px-3 py-2 text-[8px] font-bold text-[#173d60]">
            <span>Asset class</span>

            <span className="text-right">Target</span>

            <span className="text-right">Policy range</span>

            <span className="pl-5">Role</span>
          </div>

          <AllocationRow
            label="Global Equity"
            target={ipsMetrics.allocation.equity}
            role="Long-term growth engine"
          />

          <AllocationRow
            label="Fixed Income"
            target={ipsMetrics.allocation.fixed_income}
            role="Income & volatility dampener"
          />

          <AllocationRow
            label="Real Assets / REITs"
            target={ipsMetrics.allocation.real_estate}
            role="Inflation hedge & diversification"
          />

          <AllocationRow
            label="Alternatives"
            target={ipsMetrics.allocation.alternative}
            role="Non-correlated return sources"
          />

          <AllocationRow
            label="Cash & Equivalents"
            target={ipsMetrics.allocation.cash}
            role="Liquidity & reserve"
          />

          <div className="grid grid-cols-[30%_15%_18%_37%] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px] font-bold text-[#30343b]">
            <span>Total</span>

            <span className="text-right">100%</span>

            <span />

            <span />
          </div>
        </div>

        <p className="mt-4 text-[9px] leading-[1.6] text-[#4f565e]">
          Policy portfolio: expected return{" "}
          <strong>{expectedReturn.toFixed(1)}%</strong> (geometric), volatility{" "}
          <strong>{volatility.toFixed(1)}%</strong>.
        </p>

        <p className="mt-2 text-[9px] leading-[1.6] text-[#5f666d]">
          Ranges follow the 5/25 rule (±5 pts or ±25% of target, whichever is
          greater).
        </p>
      </div>
    </ReportPage>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-[3px] border-[#0867b9] bg-[#e7eff8] px-3 py-2 text-[10px] font-bold text-[#173d60]">
      {children}
    </div>
  );
}

function TableHeader({ left, right }: { left: string; right: string }) {
  return (
    <div className="grid grid-cols-[25%_75%] bg-[#e7eff8] px-3 py-2 text-[8px] font-bold text-[#173d60]">
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}

function PolicyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[25%_75%] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px] leading-[1.5]">
      <span className="font-semibold text-[#5f666d]">{label}</span>

      <span className="text-[#30343b]">{value}</span>
    </div>
  );
}

function AllocationRow({
  label,
  target,
  role,
}: {
  label: string;
  target: number;
  role: string;
}) {
  const range = calculatePolicyRange(target);

  return (
    <div className="grid grid-cols-[30%_15%_18%_37%] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px] text-[#30343b]">
      <span>{label}</span>

      <span className="text-right font-semibold">{target}%</span>

      <span className="text-right">
        {range.min}%–{range.max}%
      </span>

      <span className="pl-5 text-[#5f666d]">{role}</span>
    </div>
  );
}

function calculatePolicyRange(target: number) {
  // 5/25 rule:
  // use the larger of ±5 percentage points
  // or ±25% of the target allocation.
  const tolerance = Math.max(5, target * 0.25);

  return {
    min: Math.max(0, Math.round(target - tolerance)),

    max: Math.min(100, Math.round(target + tolerance)),
  };
}

function formatCountry(country?: string) {
  switch (country?.toUpperCase()) {
    case "US":
    case "USA":
      return "United States";

    case "GB":
    case "GBR":
    case "UK":
      return "United Kingdom";

    default:
      return country || "—";
  }
}
