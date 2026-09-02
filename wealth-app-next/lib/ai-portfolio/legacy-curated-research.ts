import type { ResearchProvider } from "@/lib/ai-portfolio/research";

// Legacy fallback research copied from the legacy Wealth Analyzer.
// IMPORTANT: the legacy catalogue reflects 2024-2025 public house views.
// Use this for migration/parity testing, not as a permanent live-research source.

export const LEGACY_CURATED_RESEARCH: ResearchProvider[] = [
  {
    id: "bofa_ml",
    enabled: true,
    items: [
      {
        title:
          "Equities: Overweight quality large caps; mid-single-digit S&P returns through 2025",
        summary:
          "BofA Global Research multi-asset team maintains overweight equity stance with bias toward quality factor (high ROE, low leverage, stable margins).",
        shared: false,
      },
      {
        title:
          "Bonds: Add duration in IG credit as Fed cuts begin; favor 5-7yr Treasuries",
        summary:
          "Lock in real yields above historical averages before terminal rate compression.",
        shared: false,
      },
      {
        title:
          "Themes: AI infrastructure, US re-industrialization, defense spending",
        summary:
          "Three secular themes BofA highlights as multi-year capex tailwinds.",
        shared: false,
      },
      {
        title:
          "Sector calls: Overweight Technology, Financials, Industrials; Underweight Real Estate, Utilities",
        summary: "",
        shared: false,
      },
      {
        title:
          "Magnificent 7 concentration risk — diversify into equal-weight indices",
        summary:
          "S&P 500 top 10 stocks now >35% of index; equal-weight (RSP) offers cheaper valuations.",
        shared: false,
      },
      {
        title:
          "Asia ex-Japan: Tactical underweight, structural overweight India",
        summary:
          "BofA EM strategist sees Indian structural growth thesis intact through 2030.",
        shared: false,
      },
      {
        title: "Private markets: 15-25% allocation for $5M+ portfolios",
        summary:
          "Private credit yielding 10%+ with seniority and shorter duration than HY.",
        shared: false,
      },
      {
        title:
          "Munis: AAA 10yr offers 6.2% tax-equivalent for top federal bracket",
        summary: "",
        shared: false,
      },
      {
        title: "Gold: Constructive — $2,700 12mo target",
        summary:
          "Central bank buying + de-dollarization + real rate normalization.",
        shared: false,
      },
      {
        title:
          "Oil: Range-bound $70-90 — overweight integrated majors over E&Ps",
        summary:
          "BofA energy team prefers cash-generative supermajors (XOM, CVX, SHEL) over capex-heavy producers.",
        shared: false,
      },
      {
        title:
          "Risks: Election volatility, sticky services inflation, geopolitical premium",
        summary: "",
        shared: false,
      },
      {
        title:
          "Crypto: 1-3% bitcoin allocation appropriate for diversification",
        summary:
          "BofA Digital Assets group views BTC as portfolio diversifier with low correlation to equities.",
        shared: false,
      },
      {
        title:
          "Currency: USD overvalued long-term — diversify with EUR/JPY exposure",
        summary: "",
        shared: false,
      },
    ],
  },
  {
    id: "jpm",
    enabled: true,
    items: [
      {
        title:
          "Guide to the Markets: 60/40 portfolio 6-8% expected return next decade",
        summary:
          "JPM AM long-term capital market assumptions show normalized returns after 2022 bond reset.",
        shared: false,
      },
      {
        title: "EM equities: Tactical underweight, structural overweight India",
        summary:
          "Indian equities 4Y CAGR projected 11-13% USD-terms, highest among major EMs.",
        shared: false,
      },
      {
        title: "Alternatives: 20% target for $5M+ portfolios",
        summary:
          "Mix of private equity (8%), private credit (6%), real estate (4%), infrastructure (2%).",
        shared: false,
      },
      {
        title:
          "Munis: AA-rated 10yr offer 6% taxable-equivalent for top brackets",
        summary: "",
        shared: false,
      },
      {
        title:
          "Real Estate: Public REITs trading at meaningful discount to NAV",
        summary:
          "~25% NAV discount in industrials, data centers — selective opportunities.",
        shared: false,
      },
      {
        title:
          "Long Term Capital Market Assumptions 2025: US equity 7.0% / Intl 7.8% / Bonds 4.6%",
        summary: "",
        shared: false,
      },
      {
        title:
          "Direct Indexing: tax-alpha 0.5-1.0% annually for taxable accounts >$250k",
        summary: "JPM 55ip and ETF-of-ETFs direct indexing platform.",
        shared: false,
      },
      {
        title:
          "Healthcare: Overweight on GLP-1 secular tailwind + ageing demographics",
        summary: "",
        shared: false,
      },
      {
        title:
          "Japan: Overweight — TOPIX corporate governance reforms unlocking value",
        summary:
          "Tokyo Stock Exchange's PBR-below-1 initiative driving share buybacks + dividend hikes.",
        shared: false,
      },
      {
        title:
          "Fixed income: Barbell long Treasuries + IG corporate; underweight HY",
        summary: "HY spreads tight; risk/reward favors quality.",
        shared: false,
      },
      {
        title: "Commodities: 5% strategic allocation as inflation hedge",
        summary: "Mix of broad commodity (DBC) and gold (GLD).",
        shared: false,
      },
      {
        title: "China: Underweight — structural deflation + policy uncertainty",
        summary: "",
        shared: false,
      },
      {
        title:
          "Currency hedging: 50% hedge ratio for international bond allocations",
        summary: "",
        shared: false,
      },
    ],
  },
  {
    id: "ms",
    enabled: true,
    items: [
      {
        title:
          "GIC: Overweight US large-cap quality, underweight small-cap until earnings inflect",
        summary: "Morgan Stanley Global Investment Committee weekly update.",
        shared: false,
      },
      {
        title:
          "Cross-asset: Add convertible bonds for asymmetric equity exposure",
        summary:
          "5-7% allocation in convertibles captures upside with bond floor.",
        shared: false,
      },
      {
        title:
          "Currencies: USD overvalued vs JPY medium-term, but yield differential keeps it bid",
        summary: "",
        shared: false,
      },
      {
        title:
          "Themes: Generative AI productivity, GLP-1 medical revolution, Western capex cycle",
        summary: "",
        shared: false,
      },
      {
        title: "Mike Wilson: S&P 500 6,500 by mid-2025 — bullish revision",
        summary: "Chief US Equity Strategist.",
        shared: false,
      },
      {
        title:
          "Thoughts on the Market podcast: Recent topics — AI capex, election risk, China stimulus",
        summary: "Daily 5-minute audio from senior MS strategists.",
        shared: false,
      },
      {
        title: "Energy transition: Long copper, uranium; short coal",
        summary: "Copper deficit structural through 2030.",
        shared: false,
      },
      {
        title: "Munis: Best risk-adjusted income in 5+ years",
        summary: "",
        shared: false,
      },
      {
        title: "India: Overweight — 7% real GDP growth, Modi continuity",
        summary: "",
        shared: false,
      },
      {
        title:
          "Earnings: 12% YoY growth expected 2025 — peaks in tech, broadens to healthcare and financials",
        summary: "",
        shared: false,
      },
      {
        title:
          "Sector tilt: Overweight Tech, Financials, Comm Services; underweight Cons Discretionary, Utilities",
        summary: "",
        shared: false,
      },
      {
        title:
          "Wealth Management Note: Tax-loss harvest more aggressively before YE",
        summary: "",
        shared: false,
      },
      {
        title:
          "Risk Indicators: MS Risk-Reward Indicator near +1σ — tactically cautious",
        summary: "",
        shared: false,
      },
    ],
  },
  {
    id: "citi",
    enabled: true,
    items: [
      {
        title:
          "Wealth Outlook: Add private equity secondaries at 15-20% discount to NAV",
        summary:
          "Citi PE secondaries strategy capitalizing on LP-led liquidity needs.",
        shared: false,
      },
      {
        title:
          "Income: Investment-grade preferreds offer 7%+ yields with limited duration",
        summary:
          "PFF and equivalents — fixed-rate IG preferreds trading at meaningful discount.",
        shared: false,
      },
      {
        title:
          "Themes: G2 polarisation, climate adaptation infrastructure, cybersecurity",
        summary: "",
        shared: false,
      },
      {
        title: "FX: Long EM carry baskets vs short G10 funders",
        summary: "Brazil/Mexico carry trades funded by JPY/CHF.",
        shared: false,
      },
      {
        title:
          "Citi Wealth Outlook 2025: 5% USD equity return, 4% global bonds, 6% blended 60/40",
        summary: "",
        shared: false,
      },
      {
        title:
          "Single-stock concentration risk: rebalance positions >10% of NW",
        summary:
          "Tax-efficient exchange funds for low-cost-basis concentrated stock.",
        shared: false,
      },
      {
        title:
          "Alternative income: Direct lending 9-11% net yield with senior secured loans",
        summary: "",
        shared: false,
      },
      {
        title:
          "Citi Global Wealth Investments: 10-year capital market assumption equity 7.3%",
        summary: "",
        shared: false,
      },
      {
        title: "China: Underweight equities, neutral RMB sovereign bonds",
        summary: "",
        shared: false,
      },
      {
        title: "India: Overweight large-cap equities; structural growth thesis",
        summary: "",
        shared: false,
      },
      {
        title: "Infrastructure: 5-7% allocation as inflation-linked income",
        summary:
          "Listed infrastructure (IGF) yielding 4%+ with utility-like cash flows.",
        shared: false,
      },
      {
        title:
          "Gold + Silver: 5% allocation each as crisis hedge + monetary debasement protection",
        summary: "",
        shared: false,
      },
      {
        title:
          "Risk: Markets pricing in soft landing — barbell with cash and quality equities",
        summary: "",
        shared: false,
      },
    ],
  },
  {
    id: "gs",
    enabled: true,
    items: [
      {
        title: "GSAM SAA: Lift bonds to 35% from 25% as real yields normalize",
        summary: "Strategic Asset Allocation update.",
        shared: false,
      },
      {
        title:
          "Equities: Magnificent 7 valuations stretched but earnings still compounding",
        summary:
          "GS top stock picks within Mag 7 — keep MSFT, AMZN, NVDA; trim AAPL, TSLA.",
        shared: false,
      },
      {
        title:
          "Commodities: Structural copper deficit; gold $2,700 12-month target",
        summary: "",
        shared: false,
      },
      {
        title:
          "Themes: Energy transition capex, AI silicon supply chain, defense",
        summary: "",
        shared: false,
      },
      {
        title:
          "David Kostin: S&P 500 6,300 by YE 2025 — top-down strategist call",
        summary: "",
        shared: false,
      },
      {
        title: "GS Briefings podcast: Recent — Fed pivot, EM debt, AI margins",
        summary: "",
        shared: false,
      },
      {
        title:
          "Sector calls: Overweight Tech (AI infra), Industrials (re-shoring), Healthcare; UW Energy, Utilities",
        summary: "",
        shared: false,
      },
      {
        title:
          "Real Estate: Public REITs trading 15-25% below replacement cost",
        summary: "",
        shared: false,
      },
      {
        title:
          "Munis: 5-year AAA TEY 6.2% — strong demand from $50k+ income demographic",
        summary: "",
        shared: false,
      },
      {
        title:
          "Japan: Overweight — corporate governance reforms unlocking $400bn in cash returns",
        summary: "",
        shared: false,
      },
      {
        title: "India: Overweight — multi-decade structural growth story",
        summary: "",
        shared: false,
      },
      {
        title: "Crypto: Bitcoin as digital gold — 1-3% strategic allocation",
        summary: "",
        shared: false,
      },
      {
        title:
          "Risk: Election year volatility — hedge with VIX calls or low-vol equity tilt",
        summary: "",
        shared: false,
      },
      {
        title:
          "Stop-loss discipline: trim equity beta if S&P 500 breaks 200-day moving average",
        summary: "",
        shared: false,
      },
    ],
  },
  {
    id: "julius",
    enabled: true,
    items: [
      {
        title:
          "Next Generation: AI-driven biotech discovery, longevity therapeutics, climate tech",
        summary:
          "Julius Baer Next Generation theme — investing in transformative trends.",
        shared: false,
      },
      {
        title:
          "Geographic: Switzerland + Singapore favored for wealth preservation",
        summary: "",
        shared: false,
      },
      {
        title: "Alternatives: Trend-following CTAs for tail-risk hedging",
        summary:
          "15-20% CTA allocation for clients seeking uncorrelated returns.",
        shared: false,
      },
      {
        title: "Cash: Hold 5-10% in CHF money market as portfolio ballast",
        summary: "",
        shared: false,
      },
      {
        title:
          "Strategic allocation 2025: Equities 50% / Bonds 30% / Alts 15% / Cash 5% for balanced mandate",
        summary: "",
        shared: false,
      },
      {
        title:
          "European equities: Selective opportunities in Swiss multinationals (NESN, ROG, NOVN)",
        summary: "",
        shared: false,
      },
      {
        title: "Private debt: 8-10% allocation with floating-rate exposure",
        summary: "",
        shared: false,
      },
      {
        title:
          "Wealth structuring: Multi-jurisdictional family office setups for $50M+ families",
        summary: "",
        shared: false,
      },
      {
        title:
          "Sustainability: ESG integration without giving up returns — best-in-class screening",
        summary: "",
        shared: false,
      },
      {
        title:
          "Premiumization in luxury (LVMH, Hermes) — long-term consumer thesis",
        summary: "",
        shared: false,
      },
      {
        title:
          "Healthcare: GLP-1 winners (NOVO-B, LLY) + medical devices (ROG, ZMH)",
        summary: "",
        shared: false,
      },
      {
        title: "Gold: 5-7% allocation as central bank reserve diversifier",
        summary: "",
        shared: false,
      },
      {
        title: "Currency: Diversify away from USD into CHF and gold",
        summary: "",
        shared: false,
      },
    ],
  },
  {
    id: "ubs",
    enabled: true,
    items: [
      {
        title:
          "House View: Moderate equity overweight, prefer quality + dividend growers",
        summary:
          "UBS CIO Wealth Management Global Investment Office monthly publication.",
        shared: false,
      },
      {
        title: "Bonds: Lock in 5%+ yields in 5-10yr IG credit before Fed cuts",
        summary: "",
        shared: false,
      },
      {
        title: "Themes: Decarbonization, generative AI, healthcare innovation",
        summary: "",
        shared: false,
      },
      {
        title:
          "Risks: US election outcomes, China property contagion, oil price spikes",
        summary: "",
        shared: false,
      },
      {
        title:
          "UBS CIO Year Ahead 2025: 'A new world' — themes and tactical positioning",
        summary: "",
        shared: false,
      },
      {
        title:
          "Asia ex-Japan: Tactical preference for India + ASEAN over China",
        summary: "",
        shared: false,
      },
      {
        title:
          "Listed alternatives: Hedge fund replicators + liquid alts gaining ground",
        summary: "",
        shared: false,
      },
      {
        title: "Sustainable investing: 100% integrated for new client mandates",
        summary: "",
        shared: false,
      },
      {
        title: "Multi-asset 2025 outlook: 6-7% balanced portfolio total return",
        summary: "",
        shared: false,
      },
      {
        title: "Gold: Strategic 5% allocation; tactical bias to overweight",
        summary: "",
        shared: false,
      },
      {
        title:
          "Switzerland: SMI defensive composition (NESN, ROG, NOVN) attractive in volatile periods",
        summary: "",
        shared: false,
      },
      {
        title:
          "Real estate: European listed REITs offer best risk-reward post-2022 reset",
        summary: "",
        shared: false,
      },
      {
        title:
          "Private wealth solutions: Lombard lending against portfolio for liquidity",
        summary: "",
        shared: false,
      },
      {
        title: "Family office: 25-35% alts allocation typical for UHNW",
        summary: "",
        shared: false,
      },
    ],
  },
  {
    id: "vontobel",
    enabled: true,
    items: [
      {
        title:
          "Thematic equity: Clean Energy, Digital Transformation, Healthy Living",
        summary: "Vontobel mtx Active Quality flagship strategies.",
        shared: false,
      },
      {
        title:
          "EM: Overweight quality EM consumer franchises, underweight cyclicals",
        summary: "",
        shared: false,
      },
      {
        title: "Fixed income: EUR IG corporate spreads offer attractive carry",
        summary: "",
        shared: false,
      },
      {
        title: "Currency hedging: Tactical hedge USD-funded EM positions",
        summary: "",
        shared: false,
      },
      {
        title:
          "Quality Growth investing: 15+ year track record of beating MSCI World by 200bp",
        summary: "",
        shared: false,
      },
      {
        title: "ESG-integrated mtx Sustainable Emerging Markets Leaders fund",
        summary: "",
        shared: false,
      },
      {
        title:
          "Conviction stocks: Tencent, Tata Consultancy, AIA Group, NESN, ASML",
        summary: "",
        shared: false,
      },
      {
        title: "Active share >85% across flagship equity strategies",
        summary: "",
        shared: false,
      },
      {
        title:
          "Income solutions: Vontobel Fund-Smart Dividend (high-conviction dividend payers)",
        summary: "",
        shared: false,
      },
      {
        title: "Alpha is alive in EM small-cap — Vontobel mtx EM Small Cap",
        summary: "",
        shared: false,
      },
      {
        title:
          "AI Revolution: 5 secular winners — NVDA, MSFT, GOOGL, TSM, ASML",
        summary: "",
        shared: false,
      },
      {
        title:
          "Multi-asset: Conservative 4-6% / Balanced 5-7% / Growth 6-8% expected returns",
        summary: "",
        shared: false,
      },
    ],
  },
  {
    id: "pictet",
    enabled: true,
    items: [
      {
        title:
          "Pictet Barometer: Neutral equities, overweight bonds, underweight cash",
        summary: "Monthly cross-asset positioning publication.",
        shared: false,
      },
      {
        title:
          "Secular Outlook: Premiumization in EM consumer, water scarcity, robotics",
        summary: "Pictet AM secular themes franchise.",
        shared: false,
      },
      {
        title:
          "Style: Quality + low-volatility factor tilt for current cycle phase",
        summary: "",
        shared: false,
      },
      {
        title:
          "Alternatives: Global infrastructure 8-10% real returns expected",
        summary: "",
        shared: false,
      },
      {
        title:
          "Pictet Mega — long-only equity fund picking secular megatrend winners",
        summary: "",
        shared: false,
      },
      {
        title:
          "Water fund: 30-yr track record, top quartile vs global thematic peers",
        summary: "",
        shared: false,
      },
      {
        title:
          "Robotics: AI-adjacent industrial automation theme, double-digit revenue growth in winners",
        summary: "",
        shared: false,
      },
      {
        title:
          "Health: GLP-1, longevity, gene therapy — Pictet Health fund flagship",
        summary: "",
        shared: false,
      },
      {
        title:
          "Strategic AA Conservative: 35% equity / 50% bond / 10% alt / 5% cash",
        summary: "",
        shared: false,
      },
      {
        title:
          "Strategic AA Balanced: 55% equity / 30% bond / 12% alt / 3% cash",
        summary: "",
        shared: false,
      },
      {
        title: "Strategic AA Growth: 75% equity / 12% bond / 12% alt / 1% cash",
        summary: "",
        shared: false,
      },
      {
        title:
          "EM Debt local currency — selective, prefer high-yield single-name corporates",
        summary: "",
        shared: false,
      },
      {
        title:
          "Wealth platform: Direct indexing + tax-loss harvesting for taxable mandates",
        summary: "",
        shared: false,
      },
    ],
  },
  {
    id: "factset",
    enabled: true,
    items: [
      {
        title:
          "Earnings Insight: S&P 500 Q3 EPS growth 4.6% YoY, beat rate 75%",
        summary:
          "FactSet Senior Earnings Analyst John Butters weekly publication.",
        shared: false,
      },
      {
        title: "Sector: Tech earnings revisions strongest, energy weakest",
        summary: "",
        shared: false,
      },
      {
        title: "Valuation: S&P 500 fwd P/E 21x vs 10-yr avg 17.9x",
        summary: "",
        shared: false,
      },
      {
        title: "Guidance: 65% of companies issuing positive guidance for Q4",
        summary: "",
        shared: false,
      },
      {
        title: "Buyback Quarterly: $230B in Q3 buybacks — second highest ever",
        summary: "",
        shared: false,
      },
      {
        title:
          "Dividend Quarterly: 8% YoY dividend growth — broad-based across sectors",
        summary: "",
        shared: false,
      },
      {
        title:
          "Analyst sentiment: Sell-side maintains overweight on Tech, Comm Services, Industrials",
        summary: "",
        shared: false,
      },
      {
        title:
          "Sector revenue growth 2025 estimate: Tech +11%, Healthcare +8%, Financials +6%",
        summary: "",
        shared: false,
      },
      {
        title: "Margins: S&P 500 net margin 12.0% vs 10.7% 10-yr average",
        summary: "",
        shared: false,
      },
      {
        title:
          "International earnings: Japan TOPIX EPS growth strongest among DM regions",
        summary: "",
        shared: false,
      },
      {
        title:
          "FactSet Concept Search: AI-mention transcripts up 350% YoY in S&P 500 calls",
        summary: "",
        shared: false,
      },
      {
        title: "Earnings Insight Pro: customer-specific earnings dashboards",
        summary: "",
        shared: false,
      },
    ],
  },
  {
    id: "bloomberg",
    enabled: true,
    items: [
      {
        title:
          "BI: ETF flows pivoting from large-cap blend to international value YTD",
        summary: "Bloomberg Intelligence ETF research.",
        shared: false,
      },
      {
        title:
          "BI Credit: HY spreads at 320bp — tight vs history but supported by fundamentals",
        summary: "",
        shared: false,
      },
      {
        title: "BI Sector: Tech free-cash-flow margins to reach 30%+ by 2026",
        summary: "",
        shared: false,
      },
      {
        title:
          "BI: Active manager equal-weight strategies outperform cap-weight YTD by 4%",
        summary: "",
        shared: false,
      },
      {
        title:
          "BI Energy: Oil demand peaks 2030; majors pivoting to renewables",
        summary: "",
        shared: false,
      },
      {
        title:
          "BI Healthcare: GLP-1 market $130B+ by 2030; LLY, NOVO dominance",
        summary: "",
        shared: false,
      },
      {
        title:
          "BI Tech: AI hyperscaler capex $300B+ in 2025 — NVDA primary beneficiary",
        summary: "",
        shared: false,
      },
      {
        title:
          "BI Financials: Regional banks under-owned; selective opportunity in well-capitalized names",
        summary: "",
        shared: false,
      },
      {
        title: "BI ESG: Sustainable bond issuance to exceed $1T in 2025",
        summary: "",
        shared: false,
      },
      {
        title:
          "BI Real Estate: Cap rates have peaked; core to value-add opportunities",
        summary: "",
        shared: false,
      },
      {
        title:
          "Bloomberg Opinion: Multiple columns daily on macro, markets, policy",
        summary: "",
        shared: false,
      },
      {
        title:
          "BI Crypto: BTC ETF flows topping $50B since January 2024 launch",
        summary: "",
        shared: false,
      },
      {
        title:
          "BI Macro: Global liquidity cycle inflecting positive — risk-on bias",
        summary: "",
        shared: false,
      },
    ],
  },
  {
    id: "oppen",
    enabled: true,
    items: [
      {
        title:
          "OAM Weekly: Risk-on tactical bias, prefer cyclical sectors + small caps",
        summary: "",
        shared: false,
      },
      {
        title:
          "Equities: Mid-caps trading at meaningful discount to large caps",
        summary: "",
        shared: false,
      },
      {
        title:
          "Bonds: 7-10yr TIPS attractive for inflation breakeven near 2.3%",
        summary: "",
        shared: false,
      },
      {
        title: "Themes: Reshoring beneficiaries, copper supply tightening",
        summary: "",
        shared: false,
      },
      {
        title:
          "Sector calls: OW Industrials (reshoring), Energy (capital discipline), Financials (steepening curve)",
        summary: "",
        shared: false,
      },
      {
        title:
          "Small-cap value: Russell 2000 Value at multi-year low P/E vs growth",
        summary: "",
        shared: false,
      },
      {
        title:
          "International developed: Tactical overweight Japan, neutral Europe",
        summary: "",
        shared: false,
      },
      {
        title: "EM: Overweight India, neutral LatAm, underweight China",
        summary: "",
        shared: false,
      },
      {
        title:
          "Credit: Investment grade preferred; HY spreads tight historically",
        summary: "",
        shared: false,
      },
      {
        title:
          "Alternatives: 10-15% allocation for accredited investors — focus on lower-corr strategies",
        summary: "",
        shared: false,
      },
      {
        title:
          "Energy: OXY, FANG, PXD — capital-disciplined E&Ps with shareholder returns",
        summary: "",
        shared: false,
      },
      {
        title: "Defense: LMT, RTX, NOC — multi-year capex cycle",
        summary: "",
        shared: false,
      },
    ],
  },
  {
    id: "sa",
    enabled: true,
    items: [
      {
        title: "Wall Street Breakfast: Earnings season focus on margin trends",
        summary: "Daily premarket Seeking Alpha newsletter.",
        shared: false,
      },
      {
        title:
          "Top SA contributors: Bullish on quality dividend growers (VIG-style screens)",
        summary: "",
        shared: false,
      },
      {
        title:
          "Sector views: Healthcare underweight overdone — overweight medtech",
        summary: "",
        shared: false,
      },
      {
        title:
          "Income: BDCs at 11%+ yields screening attractive on coverage ratios",
        summary: "",
        shared: false,
      },
      {
        title:
          "SA Quant ratings: 25 'Strong Buy' picks include NVDA, GOOG, META",
        summary: "",
        shared: false,
      },
      {
        title:
          "SA Market Currents: Real-time analyst note feed across all coverage",
        summary: "",
        shared: false,
      },
      {
        title:
          "Dividend Aristocrats: Best long-term performance in 25+ yr dividend growers",
        summary: "",
        shared: false,
      },
      {
        title: "REITs: O, AMT, EQIX trading attractively post-rate-rise reset",
        summary: "",
        shared: false,
      },
      {
        title: "Energy: OXY, EOG, DVN — quality E&Ps with capital discipline",
        summary: "",
        shared: false,
      },
      {
        title:
          "Technology: MSFT, GOOGL, META — AI beneficiaries with reasonable valuations",
        summary: "",
        shared: false,
      },
      {
        title:
          "Closed-end funds: Trading at 8-15% discounts to NAV — selective opportunities",
        summary: "",
        shared: false,
      },
      {
        title:
          "Preferred stocks: PFF, PGX yielding 6.5%+ with limited duration",
        summary: "",
        shared: false,
      },
      {
        title: "International: VEA, VWO best low-cost international exposure",
        summary: "",
        shared: false,
      },
    ],
  },
  {
    id: "blackrock",
    enabled: true,
    items: [
      {
        title:
          "BII Weekly: Tilt to fixed income; underweight US equities tactical",
        summary: "BlackRock Investment Institute weekly commentary.",
        shared: false,
      },
      {
        title:
          "Global Outlook: Structural shifts (aging, geopolitics, AI) → higher inflation regime",
        summary: "",
        shared: false,
      },
      {
        title: "EM: Overweight India + Mexico nearshoring beneficiaries",
        summary: "",
        shared: false,
      },
      {
        title:
          "Private markets: 20% target allocation for institutional portfolios",
        summary: "",
        shared: false,
      },
      {
        title:
          "BlackRock Year-Ahead Outlook 2025: 'Rebooting investing in a transformed world'",
        summary: "",
        shared: false,
      },
      {
        title:
          "Geopolitical fragmentation = AI capex + defense spending tailwind",
        summary: "",
        shared: false,
      },
      {
        title:
          "Energy transition: Renewables + grid build-out — long-duration capex theme",
        summary: "",
        shared: false,
      },
      {
        title:
          "Demographics: Aging populations = higher healthcare allocation + GLP-1",
        summary: "",
        shared: false,
      },
      {
        title: "Active fixed income: Find alpha in IG short-duration, EM debt",
        summary: "",
        shared: false,
      },
      {
        title: "iShares Top Picks: IVV (S&P 500), AGG (US Agg Bond), IEMG (EM)",
        summary: "",
        shared: false,
      },
      {
        title: "ESG: ESGV, SUSL maintain tracking error <50bp vs parent index",
        summary: "",
        shared: false,
      },
      {
        title:
          "Direct indexing: SMA platforms enable tax-loss harvesting at $250k+",
        summary: "",
        shared: false,
      },
      {
        title:
          "Crypto: IBIT (spot bitcoin ETF) — 1-2% strategic allocation for diversification",
        summary: "",
        shared: false,
      },
    ],
  },
  {
    id: "eaton",
    enabled: true,
    items: [
      {
        title:
          "Capital Markets: Floating-rate loans 9%+ yields with low duration",
        summary: "",
        shared: false,
      },
      {
        title:
          "Parametric: Direct indexing for tax-loss harvesting at $250k+ portfolios",
        summary: "",
        shared: false,
      },
      {
        title: "Munis: Tax-equivalent yields 6.5%+ for top brackets",
        summary: "",
        shared: false,
      },
      {
        title:
          "Active equity: Quality value screens outperforming since rates inflected",
        summary: "",
        shared: false,
      },
      {
        title:
          "Eaton Vance Income Fund (EOI) — covered call S&P 500 yielding 8%+",
        summary: "",
        shared: false,
      },
      {
        title: "Floating rate income: EFR, BSI — senior loans yielding 9-11%",
        summary: "",
        shared: false,
      },
      {
        title: "Calvert ESG: Equity + fixed income ESG-integrated strategies",
        summary: "",
        shared: false,
      },
      {
        title:
          "High-yield muni: ETJ, EVN — 5-6% tax-free for high-income clients",
        summary: "",
        shared: false,
      },
      {
        title:
          "Parametric Custom Beta: Direct indexing with after-tax alpha 50-100bp",
        summary: "",
        shared: false,
      },
      {
        title:
          "Atlanta Capital: Small-cap quality value with 25-yr track record",
        summary: "",
        shared: false,
      },
      {
        title: "Eaton Vance Bond Mosaic — multi-sector fixed income flagship",
        summary: "",
        shared: false,
      },
      {
        title:
          "Closed-end fund opportunities: 8-12% discounts to NAV at quarter-end",
        summary: "",
        shared: false,
      },
    ],
  },
  {
    id: "mstar",
    enabled: true,
    items: [
      {
        title:
          "Analyst ratings: Most undervalued sectors are healthcare and communications",
        summary: "",
        shared: false,
      },
      {
        title:
          "Fund picks: Active managers beating index in small-cap value YTD",
        summary: "",
        shared: false,
      },
      {
        title:
          "Sustainability: ESG-rated funds tracking parent universe within 50bp",
        summary: "",
        shared: false,
      },
      {
        title:
          "Star ratings: 4-5 star funds outperforming 1-2 star peers by 220bp over 10yr",
        summary: "",
        shared: false,
      },
      {
        title:
          "Morningstar Gold-rated funds: Vanguard Wellington, Dodge & Cox Stock, T. Rowe Price Blue Chip",
        summary: "",
        shared: false,
      },
      {
        title:
          "Bond fund top picks (Gold): Dodge & Cox Income, PIMCO Total Return, Vanguard Total Bond",
        summary: "",
        shared: false,
      },
      {
        title:
          "International fund top picks: Vanguard Total International, Dodge & Cox International",
        summary: "",
        shared: false,
      },
      {
        title:
          "Best ETFs 2025: IVV, AGG, VXUS, VWO, MUB — low cost broad exposure",
        summary: "",
        shared: false,
      },
      {
        title:
          "Top mutual funds: Vanguard Wellington (Gold), Fidelity Contrafund (Bronze)",
        summary: "",
        shared: false,
      },
      {
        title:
          "Style box analysis: Large-cap blend outperforming small-cap blend YTD",
        summary: "",
        shared: false,
      },
      {
        title:
          "Behavior gap research: Investors underperform their funds by ~1.5% annually",
        summary: "",
        shared: false,
      },
      {
        title:
          "Morningstar Sustainability: Avoid funds with 1-2 globes (lowest ESG ranking)",
        summary: "",
        shared: false,
      },
      {
        title:
          "Multi-Asset Income: VBIAX (Vanguard Balanced) cheaper alternative to 60/40 strategists",
        summary: "",
        shared: false,
      },
    ],
  },
];
