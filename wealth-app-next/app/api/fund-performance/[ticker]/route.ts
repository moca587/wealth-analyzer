import { NextResponse } from "next/server";

import { fetchFundPerformance } from "@/lib/portfolio/fund-performance";

type Props = {
  params: Promise<{
    ticker: string;
  }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { ticker } = await params;

  const performance = await fetchFundPerformance(ticker);

  if (!performance) {
    return NextResponse.json(
      {
        error: "Could not load fund performance.",
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json(performance);
}
