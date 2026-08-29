"use client";

import { useState } from "react";

import type { WealthPlan, RiskProfile } from "@/lib/engine/types";

import { RISK_PROFILES } from "@/lib/engine/constants";

import type { AiPortfolioResult } from "@/lib/ai-portfolio/types";

type Props = {
  plan: WealthPlan;

  amount: number;
  setAmount: (value: number) => void;

  isGenerating: boolean;

  setIsGenerating: (value: boolean) => void;

  setRecommendation: (recommendation: AiPortfolioResult | null) => void;

  setError: (error: string | null) => void;
};

const HORIZON_OPTIONS = [
  {
    value: "1_5",
    label: "⏱ Soon (1-5 years)",
  },
  {
    value: "5_10",
    label: "📅 Medium-term (5-10 years)",
  },
  {
    value: "10_15",
    label: "📆 Long-term (10-15 years)",
  },
  {
    value: "15_plus",
    label: "🗓 Very long-term (15+ years)",
  },
];

const ESG_OPTIONS = [
  {
    value: "none",
    label: "No preference",
  },
  {
    value: "prefer",
    label: "🌱 Prefer sustainable (ESG)",
  },
  {
    value: "strict",
    label: "🌍 Sustainable only",
  },
];

export function AiPortfolioPreferencesSection({
  plan,
  amount,
  setAmount,
  isGenerating,
  setIsGenerating,
  setRecommendation,
  setError,
}: Props) {
  const [risk, setRisk] = useState<RiskProfile>("moderate");

  const [horizon, setHorizon] = useState("15_plus");

  const [esg, setEsg] = useState("none");

  async function buildPortfolio() {
    setError(null);
    setRecommendation(null);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/ai-portfolio", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          amount,
          risk,
          horizon,
          esg,
          plan,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not generate portfolio.");
      }

      const recommendation = (await response.json()) as AiPortfolioResult;

      setRecommendation(recommendation);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not generate portfolio.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Your Preferences</h2>

      <p className="mb-5 text-[11px] text-[#9ca3af]">
        Most clients only need to adjust these four inputs.
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        <label>
          <span className={labelClass}>How much can you invest?</span>

          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[#64748b]">$</span>

            <input
              type="number"
              min="0"
              step="1000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className={inputClass}
            />
          </div>

          <div className={helpClass}>Your starting investment amount</div>
        </label>

        <label>
          <span className={labelClass}>Comfort with risk</span>

          <select
            value={risk}
            onChange={(e) => setRisk(e.target.value as RiskProfile)}
            className={inputClass}
          >
            {Object.entries(RISK_PROFILES).map(([value, profile]) => (
              <option key={value} value={value}>
                {profile.label}
              </option>
            ))}
          </select>

          <div className={helpClass}>How much volatility are you OK with?</div>
        </label>

        <label>
          <span className={labelClass}>When will you need this money?</span>

          <select
            value={horizon}
            onChange={(e) => setHorizon(e.target.value)}
            className={inputClass}
          >
            {HORIZON_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className={helpClass}>Longer horizons can take more risk.</div>
        </label>

        <label>
          <span className={labelClass}>Do you care about sustainability?</span>

          <select
            value={esg}
            onChange={(e) => setEsg(e.target.value)}
            className={inputClass}
          >
            {ESG_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className={helpClass}>
            Environmental, Social & Governance funds
          </div>
        </label>
      </div>

      <div className="mt-7 rounded-xl border-2 border-dashed border-[rgba(124,58,237,.25)] bg-[#faf9ff] p-7 text-center">
        <button
          type="button"
          onClick={buildPortfolio}
          disabled={isGenerating || amount <= 0}
          className={buttonClass}
        >
          {isGenerating
            ? "🤖 Building portfolio..."
            : "🤖 Build my portfolio now"}
        </button>

        <div className="mt-3 text-[11px] text-[#9ca3af]">
          Uses your preferences together with your existing client plan.
        </div>
      </div>
    </section>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "mb-2 text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const labelClass = "mb-1.5 block text-[11px] font-semibold text-[#64748b]";

const inputClass =
  "w-full rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[13px] font-medium text-[#16213e] outline-none focus:border-[#0057b8]";

const helpClass = "mt-1 text-[10px] text-[#9ca3af]";

const buttonClass =
  "rounded-full bg-gradient-to-r from-[#7c3aed] to-[#0057b8] px-7 py-3 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50";
