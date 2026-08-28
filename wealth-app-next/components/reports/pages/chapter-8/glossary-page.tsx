import { ReportPage } from "../../report-page";

type Props = {
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

const TERMS = [
  {
    term: "Advisory Fee",
    definition:
      "The annual fee charged on managed assets, expressed as a percentage. Deducted from the gross expected return to give the net return used in projections.",
  },
  {
    term: "Asset Allocation",
    definition:
      "The mix of asset classes (equities, fixed income, cash, real assets, alternatives) in a portfolio. The balance is set from your risk profile, time horizon, and goals.",
  },
  {
    term: "Asset Class",
    definition:
      "A broad grouping of investments that behave similarly — e.g. equities, fixed income, cash, real assets/REITs, commodities, alternatives, private equity, crypto.",
  },
  {
    term: "Benchmark",
    definition:
      "A market index used as a reference point to compare a portfolio's return — chosen automatically here from the portfolio's dominant asset mix.",
  },
  {
    term: "Capital Market Assumptions (CMA)",
    definition:
      "The long-term per-asset-class estimates of expected return, volatility, income, and cross-correlations that drive every projection in this report.",
  },
  {
    term: "Confidence Level",
    definition:
      "The probability that an outcome is achieved at or above the stated value. An amount at 80% confidence is reached in at least 8 of 10 simulated futures.",
  },
  {
    term: "Correlation",
    definition:
      "How closely two asset classes move together (-1 to +1). Combining assets with low correlation lowers total portfolio risk.",
  },
  {
    term: "Diversification",
    definition:
      "Spreading investments across asset classes so portfolio volatility is lower than the weighted average of its parts; computed here via the full correlation matrix.",
  },
  {
    term: "Essential / Important / Aspirational",
    definition:
      "Goal priorities: Essential goals are needs and are tested at 95% confidence; Important goals at 75%; Aspirational goals (wants) at 55%.",
  },
  {
    term: "Expected Return (Arithmetic)",
    definition:
      "The simple average annual return assumed for an asset class or portfolio. Used as the input mean for the simulation.",
  },
  {
    term: "Expense Ratio",
    definition:
      "A fund's internal annual operating cost as a percentage of assets, charged by the fund issuer and already reflected in fund performance.",
  },
  {
    term: "Geometric (Compound) Return",
    definition:
      "The constant annual growth rate that produces the same cumulative result over time; approximately the arithmetic mean minus half the variance.",
  },
  {
    term: "Goal Funding Ratio",
    definition:
      "The present value of the resources allocated to a goal divided by the present value of the goal's cost. 100% or more means the goal is fully funded.",
  },
  {
    term: "Liquid vs Locked Assets",
    definition:
      "Liquid assets (cash, brokerage) can be spent at any time. Locked assets (pension and retirement accounts) are subject to withdrawal-age rules.",
  },
  {
    term: "Median (50th Percentile)",
    definition:
      "The middle simulated outcome — half of all simulated outcomes finish above this value and half below.",
  },
  {
    term: "Market Simulation",
    definition:
      "A technique that projects wealth under hundreds of randomized market-return paths, producing a distribution of outcomes instead of a single forecast.",
  },
  {
    term: "Net Worth",
    definition:
      "Total assets (accounts, portfolio, property, other) minus total liabilities (loans and other debts).",
  },
  {
    term: "Percentile (Pessimistic / Optimistic)",
    definition:
      "A ranking within the simulated outcomes. The 10th percentile (pessimistic) is beaten by 90% of paths; the 90th (optimistic) by only 10%.",
  },
  {
    term: "Potentially Achievable Lifestyle",
    definition:
      "The sustainable, inflation-adjusted annual spending the portfolio could support through retirement at a given confidence level.",
  },
  {
    term: "Present Value (PV)",
    definition:
      "The today's-money equivalent of future cash flows, discounted at a risk- and confidence-adjusted return.",
  },
  {
    term: "Retirement Pool",
    definition:
      "The combined locked retirement accounts. Grown at a fixed conservative 3.5%/yr in this analysis — intentionally insulated from the household's investment risk choices.",
  },
  {
    term: "Risk Profile",
    definition:
      "Your investor categorization, from conservative to aggressive. Sets the expected-return and volatility assumptions when no explicit portfolio drives the simulation.",
  },
  {
    term: "Standard Deviation (Volatility, sigma)",
    definition:
      "The dispersion of returns around the average — the core measure of investment risk. Higher sigma means wider swings in outcomes.",
  },
];

export function GlossaryPage({ clientName, date, page, totalPages }: Props) {
  return (
    <ReportPage
      clientName={clientName}
      title="Glossary of Terms"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <p className="mt-4 text-[8.5px] leading-[1.5] text-[#5f666d]">
        Definitions of the terms used throughout this report, provided for your
        convenience.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
        {" "}
        {TERMS.map((item) => (
          <GlossaryItem
            key={item.term}
            term={item.term}
            definition={item.definition}
          />
        ))}
      </div>
    </ReportPage>
  );
}

function GlossaryItem({
  term,
  definition,
}: {
  term: string;
  definition: string;
}) {
  return (
    <div className="break-inside-avoid">
      <div className="text-[7.5px] font-bold text-[#30343b]">{term}</div>

      <p className="mt-0.5 text-[6.8px] leading-[1.35] text-[#5f666d]">
        {definition}
      </p>
    </div>
  );
}
