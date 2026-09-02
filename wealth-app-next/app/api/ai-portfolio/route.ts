import { NextResponse } from "next/server";

import { generateAiPortfolio } from "@/lib/ai-portfolio/generate-portfolio";
import { loadResearchProviders } from "@/lib/ai-portfolio/load-research";
import { aggregateResearchSignals } from "@/lib/ai-portfolio/research";
import { LEGACY_CURATED_RESEARCH } from "@/lib/ai-portfolio/legacy-curated-research";

import { loadPageContext } from "@/lib/tenancy/page";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const ctx = await loadPageContext();

    if (ctx.needsChoice) {
      return NextResponse.json(
        {
          error: "No household selected.",
        },
        {
          status: 400,
        },
      );
    }

    // Load the current research from Supabase.
    // Right now this should be your Fidelity research.
    const researchProviders = await loadResearchProviders();

    // Build signals from current Supabase/Fidelity research.
    const liveSignals = aggregateResearchSignals(researchProviders);

    // Build signals from the old hard-coded legacy research.
    const legacySignals = aggregateResearchSignals(LEGACY_CURATED_RESEARCH);

    // Keep the user inputs exactly the same for both runs.
    const baseInput = {
      investmentAmount: Number(body.amount),
      riskProfile: body.risk,
      timeHorizon: body.horizon,
      sustainability: body.esg,
      country: body.country ?? "US",
    };

    // Generate portfolio using current research.
    const liveResult = generateAiPortfolio({
      ...baseInput,
      researchSignals: liveSignals,
    });

    // Generate portfolio using legacy hard-coded research.
    const legacyResult = generateAiPortfolio({
      ...baseInput,
      researchSignals: legacySignals,
    });

    // Temporary A/B test logging.
    console.log(
      "LIVE PROVIDERS:",
      researchProviders.map((provider) => provider.id),
    );

    console.log("LIVE SIGNALS:", liveSignals);

    console.log("LEGACY SIGNALS:", legacySignals);

    console.log("LIVE ASSET MIX:", liveResult.assetMix);

    console.log("LEGACY ASSET MIX:", legacyResult.assetMix);

    console.log(
      "LIVE FUNDS:",
      liveResult.funds.map((fund) => ({
        ticker: fund.ticker,
        weightPct: fund.weightPct,
      })),
    );

    console.log(
      "LEGACY FUNDS:",
      legacyResult.funds.map((fund) => ({
        ticker: fund.ticker,
        weightPct: fund.weightPct,
      })),
    );

    // Continue using the Fidelity/current-research result
    // as the actual result shown to the user.
    const result = liveResult;

    // Save the current-research portfolio result.
    const supabase = await createClient();

    const { error: saveError } = await supabase.from("ai_portfolios").upsert(
      {
        household_id: ctx.household!.id,
        recommendation: result,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "household_id",
      },
    );

    if (saveError) {
      throw new Error(`Could not save AI portfolio: ${saveError.message}`);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI portfolio error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not generate portfolio.",
      },
      {
        status: 500,
      },
    );
  }
}
