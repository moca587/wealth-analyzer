import type {
  AssetClass,
  WealthPlan,
} from "@/lib/engine/types";

import {
  buildAssetLocationAnalysis,
} from "@/lib/engine/asset-location";

import {
  formatMoney,
} from "@/lib/engine/financial-math";

type Props = {
  plan: WealthPlan;
};

export function AssetLocationSection({
  plan,
}: Props) {
  const analysis =
    buildAssetLocationAnalysis(plan);

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Tax Efficiency Overlay
      </h2>

      <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
        Asset location analysis: growth-heavy assets sitting in taxable
        accounts create a persistent drag on compound returns. This
        engine classifies your accounts by tax treatment and estimates
        the drag of capital gains taxes over a 30-year horizon.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Tax-Free"
          value={formatMoney(
            analysis.taxFree,
            plan.currency
          )}
          description="Roth, ISA, TFSA, NISA"
        />

        <SummaryCard
          label="Tax-Deferred"
          value={formatMoney(
            analysis.taxDeferred,
            plan.currency
          )}
          description="401k, IRA, RRSP, SIPP"
        />

        <SummaryCard
          label="Taxable"
          value={formatMoney(
            analysis.taxable,
            plan.currency
          )}
          description="Brokerage, cash, other"
        />
      </div>

      <div className="mt-5 rounded-xl bg-[#f8faff] p-5">
        <div className="text-[10px] font-bold uppercase tracking-[0.07em] text-[#64748b]">
          Asset Location Score
        </div>

        <div className="mt-1 text-[28px] font-extrabold text-[#16213e]">
          {analysis.score.toFixed(0)}/100
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Metric
            label="Annual tax drag"
            value={`−${formatMoney(
              analysis.annualTaxDrag,
              plan.currency
            )}/yr`}
          />

          <Metric
            label="30-yr cumulative drag"
            value={`−${formatMoney(
              analysis.cumulativeTaxDrag,
              plan.currency
            )}`}
          />

          <Metric
            label="Shortfall cost-basis tax"
            value={
              analysis.shortfallCostBasisTax > 0
                ? formatMoney(
                    analysis.shortfallCostBasisTax,
                    plan.currency
                  )
                : "—"
            }
          />
        </div>
      </div>

      <p className="mt-4 text-[10px] leading-5 text-[#9ca3af]">
        Score methodology: 100 = all growth assets in tax-free accounts.
        Tax-deferred accounts score 70% because gains grow without annual
        taxation but withdrawals may later be taxable. Taxable accounts
        score 0%.
      </p>

      <div className="mt-6">
        <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
          Asset location — which holdings belong where
        </div>

        <div className="overflow-x-auto rounded-xl border border-[rgba(0,87,184,.08)]">
          <table className="w-full border-collapse text-[12px]">
            <thead className="bg-[#f8faff]">
              <tr>
                <th className={thClass}>
                  Asset class
                </th>

                <th className={numberThClass}>
                  Value
                </th>

                <th className={thClass}>
                  Recommended location
                </th>

                <th className={thClass}>
                  Why
                </th>
              </tr>
            </thead>

            <tbody>
              {analysis.recommendations.map(
                (row) => (
                  <tr key={row.assetClass}>
                    <td className={tdClass}>
                      {formatAssetClass(
                        row.assetClass
                      )}
                    </td>

                    <td className={numberTdClass}>
                      {formatMoney(
                        row.value,
                        plan.currency
                      )}
                    </td>

                    <td className={tdClass}>
                      {row.recommendedLocation}
                    </td>

                    <td className={tdClass}>
                      {row.reason}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-[10px] italic leading-5 text-[#9ca3af]">
        Assumes holdings can be freely relocated between accounts — an
        actual move may trigger transaction costs or realize gains.
        General guidance, not personal tax advice.
      </p>

      <WithdrawalOrderSection
        taxFreeShare={
          analysis.taxFree /
          Math.max(
            1,
            analysis.taxFree +
              analysis.taxDeferred +
              analysis.taxable
          )
        }
      />
    </section>
  );
}

function WithdrawalOrderSection({
  taxFreeShare,
}: {
  taxFreeShare: number;
}) {
  return (
    <div className="mt-7 rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-5">
      <h3 className="text-[12px] font-bold text-[#16213e]">
        Recommended withdrawal order in retirement
      </h3>

      <ol className="mt-4 space-y-3 text-[11px] leading-5 text-[#64748b]">
        <li>
          <strong className="text-[#16213e]">
            1. Required minimums first.
          </strong>{" "}
          Take any mandatory withdrawals from tax-deferred accounts.
        </li>

        <li>
          <strong className="text-[#16213e]">
            2. Then taxable accounts.
          </strong>{" "}
          Spend from taxable brokerage and cash while sheltered accounts
          continue compounding.
        </li>

        <li>
          <strong className="text-[#16213e]">
            3. Then tax-deferred.
          </strong>{" "}
          Manage withdrawals to stay within lower income-tax brackets
          where possible.
        </li>

        <li>
          <strong className="text-[#16213e]">
            4. Tax-free last.
          </strong>{" "}
          Preserve Roth-style accounts for longer tax-free compounding.
        </li>
      </ol>

      {taxFreeShare < 0.1 && (
        <p className="mt-4 text-[11px] text-[#64748b]">
          • Low tax-free share (
          {(taxFreeShare * 100).toFixed(0)}
          %). Building Roth-style tax-free capacity may improve future
          tax-bracket flexibility.
        </p>
      )}

      <p className="mt-4 text-[10px] italic leading-5 text-[#9ca3af]">
        General sequencing guidance, not personal tax advice.
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]">
        {label}
      </div>

      <div className="mt-2 text-[22px] font-extrabold text-[#16213e]">
        {value}
      </div>

      <div className="mt-1 text-[10px] text-[#9ca3af]">
        {description}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-[10px] text-[#64748b]">
        {label}
      </div>

      <div className="mt-1 text-[14px] font-bold text-[#16213e]">
        {value}
      </div>
    </div>
  );
}

function formatAssetClass(
  cls: AssetClass
): string {
  switch (cls) {
    case "fixed_income":
      return "Fixed Income";

    case "real_estate":
      return "Real Estate";

    default:
      return (
        cls.charAt(0).toUpperCase() +
        cls.slice(1)
      );
  }
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const thClass =
  "border-b border-[rgba(0,87,184,.10)] px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.05em] text-[#64748b]";

const numberThClass =
  "border-b border-[rgba(0,87,184,.10)] px-3 py-2 text-right text-[10px] font-bold uppercase tracking-[0.05em] text-[#64748b]";

const tdClass =
  "border-b border-[rgba(0,87,184,.06)] px-3 py-2 text-[#16213e]";

const numberTdClass =
  "border-b border-[rgba(0,87,184,.06)] px-3 py-2 text-right tabular-nums text-[#16213e]";