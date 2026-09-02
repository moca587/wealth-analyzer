import { NextResponse } from "next/server";

import { refreshResearch } from "@/lib/ai-portfolio/refresh-research";

export async function POST() {
  try {
    const result = await refreshResearch();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Research refresh error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not refresh research.",
      },
      {
        status: 500,
      },
    );
  }
}
