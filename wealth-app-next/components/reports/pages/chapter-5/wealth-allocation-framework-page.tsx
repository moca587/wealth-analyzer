"use client";

import type { WealthPlan } from "@/lib/engine/types";

import { ReportPage } from "../../report-page";

import { calculateWealthAllocationFramework } from "@/lib/portfolio/wealth-allocation-framework";

type Props = {
  plan: WealthPlan;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function WealthAllocationFrameworkPage({
  plan,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const wealthAllocation = calculateWealthAllocationFramework(plan);

  const personalValue = wealthAllocation.personal;
  const marketValue = wealthAllocation.market;
  const aspirationalValue = wealthAllocation.aspirational;
  const total = wealthAllocation.total;

  const rows = [
    {
      bucket: "Personal",
      purpose: "Preserve lifestyle · safety",
      value: personalValue,
    },
    {
      bucket: "Market",
      purpose: "Balance risk & return",
      value: marketValue,
    },
    {
      bucket: "Aspirational",
      purpose: "Idiosyncratic upside",
      value: aspirationalValue,
    },
  ];

  return (
    <ReportPage
      clientName={clientName}
      title="Overview: Wealth Allocation Framework"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      {/* Intro */}
      <p className="mt-4 max-w-[96%] text-[9px] leading-[1.55] text-[#4f565e]">
        The Wealth Allocation Framework is a goals-based framework to help
        determine an investor&apos;s financial approach. It compares an
        investor&apos;s risk allocation to their goals and priorities, and
        illuminates how to connect the two. Assets and liabilities are organized
        by risk-return characteristics into the three categories below.
      </p>

      {/* Three framework blocks */}
      <div className="mt-6 grid grid-cols-3 gap-5">
        <FrameworkBlock
          title="Personal Assets"
          riskLabel="Personal Risk"
          subtitle="Preserve lifestyle / principal preservation / aimed at safety"
          description="Assets directly related to protecting your minimum lifestyle: residence, personal property and cash reserves."
          objective="Do not jeopardize the basic standard of living. Reduce downside risk; accept below-market returns for reduced risk."
          benchmark="Inflation."
        />

        <FrameworkBlock
          title="Market Assets"
          riskLabel="Market Risk"
          subtitle="Balance risk and return"
          description="Assets that provide the potential means to maintain or improve your standard of living: diversified equities, bonds and liquid alternatives."
          objective="Maintain or improve lifestyle through market-level performance from a broadly diversified portfolio."
          benchmark="Risk-adjusted market return."
        />

        <FrameworkBlock
          title="Aspirational Assets"
          riskLabel="Idiosyncratic Risk"
          subtitle="Capitalize on unique opportunities"
          description="Calculated, idiosyncratic risks taken to substantially increase your standard of living: concentrated stock, stock options, a private business, investment property, crypto."
          objective="Enhance lifestyle: increase upside by taking measured but significant risk."
          benchmark="Absolute return."
        />
      </div>

      {/* Bucket summary */}
      <div className="mt-7 border-l-[4px] border-[#0867b9] bg-[#dceaf7] px-3 py-2 text-[10px] font-bold text-[#173d60]">
        Your Wealth Allocation
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-[20%_38%_22%_20%] bg-[#0867b9] px-3 py-2 text-[8px] font-bold text-white">
          <span>Bucket</span>
          <span>Purpose</span>
          <span className="text-right">Value</span>
          <span className="text-right">Share</span>
        </div>

        {rows.map((row) => {
          const share = total > 0 ? (row.value / total) * 100 : 0;

          return (
            <div
              key={row.bucket}
              className="grid grid-cols-[20%_38%_22%_20%] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px]"
            >
              <span className="font-semibold text-[#30343b]">{row.bucket}</span>

              <span className="text-[#5f666d]">{row.purpose}</span>

              <span className="text-right text-[#30343b]">
                {formatMoney(row.value, plan.currency)}
              </span>

              <span className="text-right text-[#6b7280]">
                {share.toFixed(1)}%
              </span>
            </div>
          );
        })}

        <div className="grid grid-cols-[20%_38%_22%_20%] border-b border-x border-[#d8dde3] bg-[#f8f9fb] px-3 py-2 text-[8px] font-bold text-[#30343b]">
          <span>Total</span>

          <span />

          <span className="text-right">
            {formatMoney(total, plan.currency)}
          </span>

          <span className="text-right">100%</span>
        </div>
      </div>

      <p className="mt-5 text-[8px] leading-[1.55] text-[#6b7280]">
        Concentrated and idiosyncratic positions carry higher risk. The
        framework recommends limiting Aspirational exposure relative to the
        assets required to fund your essential goals.
      </p>
    </ReportPage>
  );
}

function FrameworkBlock({
  title,
  riskLabel,
  subtitle,
  description,
  objective,
  benchmark,
}: {
  title: string;
  riskLabel: string;
  subtitle: string;
  description: string;
  objective: string;
  benchmark: string;
}) {
  return (
    <div className="border border-[#d8dde3] bg-[#fafbfc]">
      {/* Header */}
      <div className="bg-[#0867b9] px-3 py-3 text-white">
        <div className="text-[10px] font-bold uppercase">{title}</div>

        <div className="mt-0.5 text-[7px] uppercase tracking-[0.08em] opacity-80">
          ({riskLabel})
        </div>
      </div>

      <div className="p-4">
        <div className="text-[8px] font-bold uppercase leading-[1.4] text-[#173d60]">
          {subtitle}
        </div>

        <p className="mt-3 text-[8px] leading-[1.5] text-[#5f666d]">
          {description}
        </p>

        <div className="mt-4 text-[7px] font-bold uppercase tracking-[0.08em] text-[#7c828a]">
          Objective
        </div>

        <p className="mt-1 text-[8px] leading-[1.45] text-[#30343b]">
          {objective}
        </p>

        <div className="mt-4 text-[7px] font-bold uppercase tracking-[0.08em] text-[#7c828a]">
          Benchmark
        </div>

        <p className="mt-1 text-[8px] text-[#30343b]">{benchmark}</p>
      </div>
    </div>
  );
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
