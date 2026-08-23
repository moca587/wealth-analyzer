import type { WealthPlan } from "@/lib/engine/types";

import { formatMoney } from "@/lib/engine/financial-math";

import { ReportPage } from "../../report-page";
import { ReportSectionBar } from "../../report-section-bar";

type Props = {
  plan: WealthPlan;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function NetWorthPage({
  plan,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const currency = plan.currency || "USD";

  const money = (value: number) => formatMoney(value, currency);

  /*
   * Split assets into the same three groups shown
   * in the legacy HTML report.
   *
   * You may later want to replace these checks with
   * your existing asset-category helpers if you already
   * have exact classification logic elsewhere.
   */

  const personalAssets = plan.assets.filter((asset) => {
    const type = (asset.type ?? "").toLowerCase();
    const cls = (asset.cls ?? "").toLowerCase();

    return (
      type.includes("property") ||
      type.includes("real_estate") ||
      type.includes("real estate") ||
      type === "other" ||
      type.includes("other_asset") ||
      type.includes("insurance") ||
      cls === "real_estate"
    );
  });

  const retirementAssets = plan.assets.filter((asset) => {
    const text = `${asset.type ?? ""} ${asset.cls ?? ""}`.toLowerCase();

    return (
      text.includes("401") ||
      text.includes("ira") ||
      text.includes("retirement") ||
      text.includes("pension")
    );
  });

  const portfolioAssets = plan.assets.filter((asset) => {
    return !personalAssets.includes(asset) && !retirementAssets.includes(asset);
  });

  const totalPersonalAssets = personalAssets.reduce(
    (sum, asset) => sum + (asset.value || 0),
    0,
  );

  const totalPortfolioAssets = portfolioAssets.reduce(
    (sum, asset) => sum + (asset.value || 0),
    0,
  );

  const totalRetirementAssets = retirementAssets.reduce(
    (sum, asset) => sum + (asset.value || 0),
    0,
  );

  const totalAssets =
    totalPersonalAssets + totalPortfolioAssets + totalRetirementAssets;

  const totalLiabilities = plan.loans.reduce(
    (sum, loan) => sum + (loan.bal || 0),
    0,
  );

  const netWorth = totalAssets - totalLiabilities;

  return (
    <ReportPage
      clientName={clientName}
      title="Net Worth Statement"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <ReportSectionBar>Assets</ReportSectionBar>

      <div className="mt-4 grid grid-cols-2 gap-x-8">
        <div>
          <AssetGroup
            title="Personal Assets"
            assets={personalAssets.map((asset) => ({
              label: formatAssetLabel(asset.type),
              value: asset.value || 0,
            }))}
            totalLabel="Total Personal Assets"
            total={totalPersonalAssets}
            money={money}
          />

          <AssetGroup
            title="Portfolio Assets"
            assets={portfolioAssets.map((asset) => ({
              label: formatAssetLabel(asset.type),
              value: asset.value || 0,
            }))}
            totalLabel="Total Portfolio Assets"
            total={totalPortfolioAssets}
            money={money}
          />
        </div>

        <div>
          <AssetGroup
            title="Retirement & Locked Assets"
            assets={retirementAssets.map((asset) => ({
              label: formatAssetLabel(asset.type),
              value: asset.value || 0,
            }))}
            totalLabel="Total Retirement & Locked"
            total={totalRetirementAssets}
            money={money}
          />

          <div className="mt-6">
            <h3 className="text-[11px] font-bold text-[#30343b]">
              Liabilities
            </h3>

            <div className="mt-2 border-t border-[#d9dee5]">
              {plan.loans.map((loan) => (
                <div
                  key={loan.id}
                  className="flex items-center justify-between border-b border-[#e4e8ed] py-2 text-[10.5px]"
                >
                  <span className="text-[#4b5563]">
                    {loan.label || loan.type || "Liability"}
                  </span>

                  <span className="font-medium tabular-nums text-[#30343b]">
                    {money(loan.bal || 0)}
                  </span>
                </div>
              ))}

              <div className="flex items-center justify-between border-b-2 border-[#30343b] py-2 text-[10.5px] font-bold">
                <span>Total Liabilities</span>

                <span className="tabular-nums">{money(totalLiabilities)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-7 border-t-2 border-[#30343b] pt-4">
        <div className="grid grid-cols-3 gap-4">
          <SummaryValue label="Total Assets" value={money(totalAssets)} />

          <SummaryValue
            label="Total Liabilities"
            value={`(${money(totalLiabilities)})`}
          />

          <SummaryValue label="Net Worth" value={money(netWorth)} strong />
        </div>
      </div>
    </ReportPage>
  );
}

function AssetGroup({
  title,
  assets,
  totalLabel,
  total,
  money,
}: {
  title: string;
  assets: {
    label: string;
    value: number;
  }[];
  totalLabel: string;
  total: number;
  money: (value: number) => string;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-[11px] font-bold text-[#30343b]">{title}</h3>

      <div className="mt-2 border-t border-[#d9dee5]">
        {assets.length === 0 ? (
          <div className="border-b border-[#e4e8ed] py-2 text-[10.5px] text-[#8a9098]">
            None
          </div>
        ) : (
          assets.map((asset, index) => (
            <div
              key={`${asset.label}-${index}`}
              className="flex items-center justify-between border-b border-[#e4e8ed] py-2 text-[10.5px]"
            >
              <span className="text-[#4b5563]">{asset.label}</span>

              <span className="font-medium tabular-nums text-[#30343b]">
                {money(asset.value)}
              </span>
            </div>
          ))
        )}

        <div className="flex items-center justify-between border-b-2 border-[#30343b] py-2 text-[10.5px] font-bold">
          <span>{totalLabel}</span>

          <span className="tabular-nums">{money(total)}</span>
        </div>
      </div>
    </div>
  );
}

function SummaryValue({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div>
      <div className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#7c828a]">
        {label}
      </div>

      <div
        className={`mt-1 ${
          strong
            ? "text-[20px] font-bold text-[#0867b9]"
            : "text-[16px] font-bold text-[#30343b]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function formatAssetLabel(type?: string) {
  if (!type) {
    return "Asset";
  }

  const labels: Record<string, string> = {
    property: "Property / Real estate",
    real_estate: "Property / Real estate",
    checking: "Checking account",
    brokerage: "Taxable brokerage account",
    taxable_brokerage: "Taxable brokerage account",
    retirement: "Retirement account",
    "401k": "401(k) — Traditional",
    other: "Other assets",
  };

  return labels[type] ?? type.replaceAll("_", " ");
}
