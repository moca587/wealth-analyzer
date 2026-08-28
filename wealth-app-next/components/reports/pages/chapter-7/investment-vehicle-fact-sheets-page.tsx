"use client";

import type { Proposal } from "@/lib/orders/proposal";
import type { ProposalPosition } from "@/lib/orders/proposal";

import { ReportPage } from "../../report-page";

type Props = {
  proposal: Proposal;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function InvestmentVehicleFactSheetsPage({
  proposal,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const positions = proposal.positions ?? [];

  return (
    <ReportPage
      clientName={clientName}
      title="Investment Vehicle Fact Sheets"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      {/* Morningstar unavailable notice */}
      <div className="mt-4 border border-[#e4c76a] bg-[#fff9df] px-4 py-3 text-[8px] leading-[1.5] text-[#66571e]">
        Fact sheet data unavailable — configure Morningstar Direct proxy in
        admin → API Keys to enable live fact sheets. Falling back to ticker-only
        summary.
      </div>

      {positions.length === 0 ? (
        <p className="mt-5 text-[9px] text-[#6b7280]">
          No proposed investment positions are available.
        </p>
      ) : (
        <div className="mt-5 space-y-7">
          {positions.map((position) => (
            <PositionFactSheet
              key={position.id}
              position={position}
              proposal={proposal}
            />
          ))}
        </div>
      )}
    </ReportPage>
  );
}

function PositionFactSheet({
  position,
  proposal,
}: {
  position: ProposalPosition;
  proposal: Proposal;
}) {
  const ticker = position.ticker?.trim().toUpperCase() || "—";

  const amount = proposal.targetAmount * ((position.weightPct || 0) / 100);

  return (
    <section>
      {/* Position heading */}
      <div className="border-l-[4px] border-[#0867b9] bg-[#dceaf7] px-3 py-2 text-[11px] font-bold text-[#173d60]">
        {position.name || ticker} — {ticker}
      </div>

      {/* Data table */}
      <div className="mt-3">
        <FactRow field="Ticker" value={ticker} />

        <FactRow field="Name" value={position.name || "—"} />

        <FactRow field="Vehicle" value={formatValue(position.vehicle)} />

        <FactRow field="Asset class" value={formatAssetClass(position.cls)} />

        <FactRow field="Region" value={formatValue(position.region)} />

        <FactRow
          field="Allocation"
          value={`${formatPercent(position.weightPct)} (${formatMoney(
            amount,
            proposal.currency,
          )})`}
        />

        <FactRow
          field="Annual yield"
          value={position.yld != null ? formatPercent(position.yld) : "—"}
        />

        <FactRow
          field="Expense ratio"
          value={position.er != null ? formatPercent(position.er) : "—"}
        />

        {/* Morningstar fields - unavailable until live API is wired */}
        <FactRow field="Morningstar rating" value="Not available" />

        <FactRow field="Risk profile" value="Not available" />

        <FactRow field="Trailing P/E" value="—" />

        <FactRow field="1Y return" value="—" />

        <FactRow field="3Y return" value="—" />

        <FactRow field="5Y return" value="—" />
      </div>

      {/* Overview */}
      <div className="mt-4">
        <div className="text-[7.5px] font-bold uppercase tracking-[0.08em] text-[#30343b]">
          Overview (sourced from Morningstar):
        </div>

        <p className="mt-1.5 text-[8px] leading-[1.5] text-[#5f666d]">
          No live overview available for {ticker}. Configure the Morningstar
          Direct proxy in admin → API Keys to populate this section. Position
          data shown above is sourced from the proposal entry.
        </p>
      </div>

      {/* Analyst opinion */}
      <div className="mt-4">
        <div className="text-[7.5px] font-bold uppercase tracking-[0.08em] text-[#30343b]">
          Analyst Opinion:
        </div>

        <p className="mt-1.5 text-[8px] leading-[1.5] text-[#5f666d]">
          No live analyst opinion available for {ticker}. Live Morningstar
          analyst commentary requires an active Direct subscription wired
          through the configured proxy endpoint.
        </p>
      </div>
    </section>
  );
}

function FactRow({ field, value }: { field: string; value: string }) {
  return (
    <div className="grid grid-cols-[32%_68%] border-b border-x border-[#d8dde3] px-3 py-1.5 text-[8px]">
      <span className="font-semibold text-[#30343b]">{field}</span>

      <span className="text-[#5f666d]">{value}</span>
    </div>
  );
}

function formatAssetClass(value?: string) {
  if (!value) {
    return "—";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(value?: string) {
  if (!value?.trim()) {
    return "—";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
