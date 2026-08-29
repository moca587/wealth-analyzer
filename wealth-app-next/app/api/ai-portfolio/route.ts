import { NextResponse } from "next/server";

import { generateAiPortfolio } from "@/lib/ai-portfolio/generate-portfolio";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = generateAiPortfolio({
      amount: Number(body.amount),
      risk: body.risk,
      horizon: body.horizon,
      esg: body.esg,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI portfolio error:", error);

    return NextResponse.json(
      {
        error: "Could not generate portfolio.",
      },
      {
        status: 500,
      },
    );
  }
}
