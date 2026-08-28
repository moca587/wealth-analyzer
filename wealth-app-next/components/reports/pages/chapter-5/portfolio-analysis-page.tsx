"use client";

import type { WealthPlan } from "@/lib/engine/types";
import { useEffect, useState } from "react";

import type { TrailingReturns } from "@/lib/portfolio/trailing-returns";

import { loadPortfolioTrailingReturns } from "@/lib/portfolio/load-portfolio-trailing-returns";
import { calcProposalReturnRiskMetrics } from "@/lib/portfolio/portfolio-metrics";
import { calcAdvisoryFeePct } from "@/lib/proposal/advisory-fee";

import type { Proposal } from "@/lib/orders/proposal";

import {
  formatMoney,
  portfolioReturnParams,
  geometricMean,
} from "@/lib/engine/financial-math";

import { ReportPage } from "../../report-page";

import { PortfolioReturnsChart } from "../../charts/portfolio-returns-chart";

type Props = {
  plan: WealthPlan;
  proposal: Proposal | null;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function PortfolioAnalysisPage({
  plan,
  proposal,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const holdings = plan.holdings ?? [];

  const [currentTrailing, setCurrentTrailing] = useState<TrailingReturns>();

  const [proposedTrailing, setProposedTrailing] = useState<TrailingReturns>();

  const totalPortfolioValue = holdings.reduce(
    (sum, holding) => sum + (holding.value || 0),
    0,
  );

  useEffect(() => {
    if (!proposal) {
      setProposedTrailing(undefined);
      return;
    }

    const currentProposal = proposal;

    let cancelled = false;

    async function load() {
      const trailing = await loadPortfolioTrailingReturns(
        currentProposal.positions.map((position) => ({
          ticker: position.ticker,
          value: position.weightPct,
        })),
      );

      if (!cancelled) {
        setProposedTrailing(trailing);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [proposal]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const trailing = await loadPortfolioTrailingReturns(holdings);

      if (!cancelled) {
        setCurrentTrailing(trailing);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [holdings]);

  const proposedAdvisoryFee = proposal
    ? calcAdvisoryFeePct(
        proposal.feeType ?? "none",
        proposal.feeRate ?? 0,
        proposal.targetAmount,
      )
    : 0;

  const proposedMetrics = proposal
    ? calcProposalReturnRiskMetrics(proposal, proposedAdvisoryFee)
    : null;

  const { mean, sigma } = portfolioReturnParams(
    holdings.map((holding) => ({
      cls: holding.cls,
      value: holding.value,
    })),
    {
      mean: 0.07,
      sigma: 0.12,
    },
  );

  const expectedGeometricReturn = geometricMean(mean, sigma) * 100;

  return (
    <ReportPage
      clientName={clientName}
      title="Portfolio Analysis"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <SectionTitle>
        Portfolio Analysis ({holdings.length} holdings)
      </SectionTitle>

      <div className="mt-4">
        <div className="grid grid-cols-[22%_17%_28%_18%_15%] bg-[#0867b9] px-3 py-2 text-[8px] font-bold text-white">
          <span>Position</span>
          <span>Ticker</span>
          <span>Asset class</span>
          <span>Value</span>
          <span>Weight</span>
        </div>

        {holdings.map((holding) => {
          const weight =
            totalPortfolioValue > 0
              ? (holding.value / totalPortfolioValue) * 100
              : 0;

          return (
            <div
              key={holding.id}
              className="grid grid-cols-[22%_17%_28%_18%_15%] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px]"
            >
              <span>{holding.name}</span>

              <span>{holding.ticker || "—"}</span>

              <span>{formatAssetClass(holding.cls)}</span>

              <span>{formatMoney(holding.value, plan.currency)}</span>

              <span>{weight.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        <div className="grid grid-cols-[45%_55%] bg-[#0867b9] px-3 py-2 text-[8px] font-bold text-white">
          <span>Item</span>
          <span>Value</span>
        </div>

        <div className="grid grid-cols-[45%_55%] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px]">
          <span className="font-semibold">Total portfolio value</span>

          <span>{formatMoney(totalPortfolioValue, plan.currency)}</span>
        </div>
      </div>

      <div className="mt-6">
        <SectionTitle>Portfolio Returns — Past vs Expected</SectionTitle>

        <p className="mt-3 text-[9px] leading-[1.5] text-[#6b7280]">
          Trailing annualized returns blended per holding. Historical return
          periods will appear once market-history data is available. Expected
          return is based on the portfolio&apos;s long-run capital-market
          assumptions.
        </p>

        <div className="mt-4">
          <PortfolioReturnsChart
            current={{
              oneYear: currentTrailing?.oneYear,
              threeYear: currentTrailing?.threeYear,
              fiveYear: currentTrailing?.fiveYear,
              tenYear: currentTrailing?.tenYear,
              expected: expectedGeometricReturn,
            }}
            proposed={
              proposal
                ? {
                    oneYear: proposedTrailing?.oneYear,
                    threeYear: proposedTrailing?.threeYear,
                    fiveYear: proposedTrailing?.fiveYear,
                    tenYear: proposedTrailing?.tenYear,
                    expected: proposedMetrics?.netReturn,
                  }
                : undefined
            }
          />
        </div>
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

function formatAssetClass(cls?: string) {
  switch (cls) {
    case "equity":
      return "Equity";

    case "fixed_income":
      return "Fixed income";

    case "real_estate":
      return "Real estate";

    case "alternative":
      return "Alternatives";

    case "cash":
      return "Cash";

    case "commodity":
      return "Commodity";

    case "crypto":
      return "Crypto";

    default:
      return "Other";
  }
}
