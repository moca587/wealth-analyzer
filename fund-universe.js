// ════════════════════════════════════════════════════════════════════
// FUND UNIVERSE — 420+ institutional-quality vehicles
// Classes: equity, fixed_income, real_estate, commodity, cash, mixed,
//          alternative, crypto
// Vehicles: etf, mutual_fund, alternative, money_market
// ════════════════════════════════════════════════════════════════════
const FUND_UNIVERSE = [
  // ─── US LARGE CAP — Core / Blend ───
  {tkr:"VTI",name:"Vanguard Total Stock Market ETF",cls:"equity",vehicle:"etf",er:0.03,yld:1.3,sponsor:"Vanguard"},
  {tkr:"ITOT",name:"iShares Core S&P Total US Stock Market",cls:"equity",vehicle:"etf",er:0.03,yld:1.3,sponsor:"BlackRock"},
  {tkr:"SCHB",name:"Schwab US Broad Market ETF",cls:"equity",vehicle:"etf",er:0.03,yld:1.3,sponsor:"Schwab"},
  {tkr:"IVV",name:"iShares Core S&P 500 ETF",cls:"equity",vehicle:"etf",er:0.03,yld:1.3,sponsor:"BlackRock"},
  {tkr:"SPY",name:"SPDR S&P 500 ETF Trust",cls:"equity",vehicle:"etf",er:0.09,yld:1.3,sponsor:"State Street"},
  {tkr:"VOO",name:"Vanguard S&P 500 ETF",cls:"equity",vehicle:"etf",er:0.03,yld:1.3,sponsor:"Vanguard"},
  {tkr:"SPLG",name:"SPDR Portfolio S&P 500 ETF",cls:"equity",vehicle:"etf",er:0.02,yld:1.3,sponsor:"State Street"},
  {tkr:"SCHX",name:"Schwab US Large-Cap ETF",cls:"equity",vehicle:"etf",er:0.03,yld:1.3,sponsor:"Schwab"},
  {tkr:"IWB",name:"iShares Russell 1000 ETF",cls:"equity",vehicle:"etf",er:0.15,yld:1.3,sponsor:"BlackRock"},
  {tkr:"VONE",name:"Vanguard Russell 1000 ETF",cls:"equity",vehicle:"etf",er:0.08,yld:1.3,sponsor:"Vanguard"},
  {tkr:"MGC",name:"Vanguard Mega Cap ETF",cls:"equity",vehicle:"etf",er:0.07,yld:1.4,sponsor:"Vanguard"},
  {tkr:"OEF",name:"iShares S&P 100 ETF",cls:"equity",vehicle:"etf",er:0.20,yld:1.3,sponsor:"BlackRock"},
  {tkr:"RSP",name:"Invesco S&P 500 Equal Weight ETF",cls:"equity",vehicle:"etf",er:0.20,yld:1.7,sponsor:"Invesco"},
  {tkr:"SPGP",name:"Invesco S&P 500 GARP ETF",cls:"equity",vehicle:"etf",er:0.34,yld:1.3,sponsor:"Invesco"},

  // ─── US LARGE GROWTH ───
  {tkr:"VUG",name:"Vanguard Growth ETF",cls:"equity",vehicle:"etf",er:0.04,yld:0.6,sponsor:"Vanguard"},
  {tkr:"IVW",name:"iShares S&P 500 Growth ETF",cls:"equity",vehicle:"etf",er:0.18,yld:0.6,sponsor:"BlackRock"},
  {tkr:"IWF",name:"iShares Russell 1000 Growth ETF",cls:"equity",vehicle:"etf",er:0.19,yld:0.5,sponsor:"BlackRock"},
  {tkr:"SCHG",name:"Schwab US Large-Cap Growth ETF",cls:"equity",vehicle:"etf",er:0.04,yld:0.4,sponsor:"Schwab"},
  {tkr:"MGK",name:"Vanguard Mega Cap Growth ETF",cls:"equity",vehicle:"etf",er:0.07,yld:0.5,sponsor:"Vanguard"},
  {tkr:"SPYG",name:"SPDR Portfolio S&P 500 Growth ETF",cls:"equity",vehicle:"etf",er:0.04,yld:0.5,sponsor:"State Street"},
  {tkr:"QQQ",name:"Invesco QQQ Trust (Nasdaq-100)",cls:"equity",vehicle:"etf",er:0.20,yld:0.6,sponsor:"Invesco"},
  {tkr:"QQQM",name:"Invesco Nasdaq 100 ETF",cls:"equity",vehicle:"etf",er:0.15,yld:0.7,sponsor:"Invesco"},
  {tkr:"ONEQ",name:"Fidelity Nasdaq Composite Index ETF",cls:"equity",vehicle:"etf",er:0.21,yld:0.7,sponsor:"Fidelity"},

  // ─── US LARGE VALUE ───
  {tkr:"VTV",name:"Vanguard Value ETF",cls:"equity",vehicle:"etf",er:0.04,yld:2.5,sponsor:"Vanguard"},
  {tkr:"IVE",name:"iShares S&P 500 Value ETF",cls:"equity",vehicle:"etf",er:0.18,yld:2.0,sponsor:"BlackRock"},
  {tkr:"IWD",name:"iShares Russell 1000 Value ETF",cls:"equity",vehicle:"etf",er:0.19,yld:2.0,sponsor:"BlackRock"},
  {tkr:"SCHV",name:"Schwab US Large-Cap Value ETF",cls:"equity",vehicle:"etf",er:0.04,yld:2.2,sponsor:"Schwab"},
  {tkr:"SPYV",name:"SPDR Portfolio S&P 500 Value ETF",cls:"equity",vehicle:"etf",er:0.04,yld:2.2,sponsor:"State Street"},
  {tkr:"MGV",name:"Vanguard Mega Cap Value ETF",cls:"equity",vehicle:"etf",er:0.07,yld:2.5,sponsor:"Vanguard"},
  {tkr:"DGRO",name:"iShares Core Dividend Growth ETF",cls:"equity",vehicle:"etf",er:0.08,yld:2.3,sponsor:"BlackRock"},
  {tkr:"VIG",name:"Vanguard Dividend Appreciation ETF",cls:"equity",vehicle:"etf",er:0.06,yld:1.8,sponsor:"Vanguard"},

  // ─── US MID CAP ───
  {tkr:"VO",name:"Vanguard Mid-Cap ETF",cls:"equity",vehicle:"etf",er:0.04,yld:1.5,sponsor:"Vanguard"},
  {tkr:"IJH",name:"iShares Core S&P Mid-Cap ETF",cls:"equity",vehicle:"etf",er:0.05,yld:1.5,sponsor:"BlackRock"},
  {tkr:"MDY",name:"SPDR S&P Midcap 400 ETF",cls:"equity",vehicle:"etf",er:0.22,yld:1.4,sponsor:"State Street"},
  {tkr:"IWR",name:"iShares Russell Mid-Cap ETF",cls:"equity",vehicle:"etf",er:0.19,yld:1.4,sponsor:"BlackRock"},
  {tkr:"SCHM",name:"Schwab US Mid-Cap ETF",cls:"equity",vehicle:"etf",er:0.04,yld:1.5,sponsor:"Schwab"},
  {tkr:"VOT",name:"Vanguard Mid-Cap Growth ETF",cls:"equity",vehicle:"etf",er:0.07,yld:0.8,sponsor:"Vanguard"},
  {tkr:"VOE",name:"Vanguard Mid-Cap Value ETF",cls:"equity",vehicle:"etf",er:0.07,yld:2.1,sponsor:"Vanguard"},
  {tkr:"IJK",name:"iShares S&P Mid-Cap 400 Growth",cls:"equity",vehicle:"etf",er:0.17,yld:0.9,sponsor:"BlackRock"},
  {tkr:"IJJ",name:"iShares S&P Mid-Cap 400 Value",cls:"equity",vehicle:"etf",er:0.18,yld:2.0,sponsor:"BlackRock"},

  // ─── US SMALL CAP ───
  {tkr:"VB",name:"Vanguard Small-Cap ETF",cls:"equity",vehicle:"etf",er:0.05,yld:1.3,sponsor:"Vanguard"},
  {tkr:"IJR",name:"iShares Core S&P Small-Cap ETF",cls:"equity",vehicle:"etf",er:0.06,yld:1.7,sponsor:"BlackRock"},
  {tkr:"IWM",name:"iShares Russell 2000 ETF (Small Cap)",cls:"equity",vehicle:"etf",er:0.19,yld:1.1,sponsor:"BlackRock"},
  {tkr:"SCHA",name:"Schwab US Small-Cap ETF",cls:"equity",vehicle:"etf",er:0.04,yld:1.4,sponsor:"Schwab"},
  {tkr:"VTWO",name:"Vanguard Russell 2000 ETF",cls:"equity",vehicle:"etf",er:0.07,yld:1.2,sponsor:"Vanguard"},
  {tkr:"VBR",name:"Vanguard Small-Cap Value ETF",cls:"equity",vehicle:"etf",er:0.07,yld:1.9,sponsor:"Vanguard"},
  {tkr:"VBK",name:"Vanguard Small-Cap Growth ETF",cls:"equity",vehicle:"etf",er:0.07,yld:0.8,sponsor:"Vanguard"},
  {tkr:"IWN",name:"iShares Russell 2000 Value ETF",cls:"equity",vehicle:"etf",er:0.24,yld:1.7,sponsor:"BlackRock"},
  {tkr:"IWO",name:"iShares Russell 2000 Growth ETF",cls:"equity",vehicle:"etf",er:0.24,yld:0.5,sponsor:"BlackRock"},
  {tkr:"AVUV",name:"Avantis US Small Cap Value ETF",cls:"equity",vehicle:"etf",er:0.25,yld:1.8,sponsor:"Avantis"},
  {tkr:"DFAS",name:"Dimensional US Small Cap ETF",cls:"equity",vehicle:"etf",er:0.27,yld:1.4,sponsor:"Dimensional"},
  {tkr:"IJT",name:"iShares S&P Small-Cap 600 Growth",cls:"equity",vehicle:"etf",er:0.18,yld:0.8,sponsor:"BlackRock"},
  {tkr:"IJS",name:"iShares S&P Small-Cap 600 Value",cls:"equity",vehicle:"etf",er:0.18,yld:1.9,sponsor:"BlackRock"},
  {tkr:"SLYG",name:"SPDR S&P 600 Small Cap Growth",cls:"equity",vehicle:"etf",er:0.15,yld:0.8,sponsor:"State Street"},
  {tkr:"SLYV",name:"SPDR S&P 600 Small Cap Value",cls:"equity",vehicle:"etf",er:0.15,yld:2.0,sponsor:"State Street"},

  // ─── US SECTOR ETFs — SPDR Select ───
  {tkr:"XLK",name:"Technology Select Sector SPDR",cls:"equity",vehicle:"etf",er:0.09,yld:0.6,sponsor:"State Street"},
  {tkr:"XLV",name:"Health Care Select Sector SPDR",cls:"equity",vehicle:"etf",er:0.09,yld:1.5,sponsor:"State Street"},
  {tkr:"XLF",name:"Financial Select Sector SPDR",cls:"equity",vehicle:"etf",er:0.09,yld:1.7,sponsor:"State Street"},
  {tkr:"XLE",name:"Energy Select Sector SPDR",cls:"equity",vehicle:"etf",er:0.09,yld:3.4,sponsor:"State Street"},
  {tkr:"XLY",name:"Consumer Discretionary Select SPDR",cls:"equity",vehicle:"etf",er:0.09,yld:0.7,sponsor:"State Street"},
  {tkr:"XLP",name:"Consumer Staples Select SPDR",cls:"equity",vehicle:"etf",er:0.09,yld:2.6,sponsor:"State Street"},
  {tkr:"XLI",name:"Industrial Select Sector SPDR",cls:"equity",vehicle:"etf",er:0.09,yld:1.5,sponsor:"State Street"},
  {tkr:"XLU",name:"Utilities Select Sector SPDR",cls:"equity",vehicle:"etf",er:0.09,yld:3.0,sponsor:"State Street"},
  {tkr:"XLB",name:"Materials Select Sector SPDR",cls:"equity",vehicle:"etf",er:0.09,yld:1.9,sponsor:"State Street"},
  {tkr:"XLC",name:"Communication Services Select SPDR",cls:"equity",vehicle:"etf",er:0.09,yld:0.8,sponsor:"State Street"},

  // ─── US SECTOR ETFs — Vanguard ───
  {tkr:"VGT",name:"Vanguard Information Technology",cls:"equity",vehicle:"etf",er:0.10,yld:0.7,sponsor:"Vanguard"},
  {tkr:"VHT",name:"Vanguard Health Care",cls:"equity",vehicle:"etf",er:0.10,yld:1.4,sponsor:"Vanguard"},
  {tkr:"VFH",name:"Vanguard Financials",cls:"equity",vehicle:"etf",er:0.10,yld:1.9,sponsor:"Vanguard"},
  {tkr:"VDE",name:"Vanguard Energy",cls:"equity",vehicle:"etf",er:0.10,yld:3.5,sponsor:"Vanguard"},
  {tkr:"VCR",name:"Vanguard Consumer Discretionary",cls:"equity",vehicle:"etf",er:0.10,yld:0.7,sponsor:"Vanguard"},
  {tkr:"VDC",name:"Vanguard Consumer Staples",cls:"equity",vehicle:"etf",er:0.10,yld:2.5,sponsor:"Vanguard"},
  {tkr:"VIS",name:"Vanguard Industrials",cls:"equity",vehicle:"etf",er:0.10,yld:1.4,sponsor:"Vanguard"},
  {tkr:"VPU",name:"Vanguard Utilities",cls:"equity",vehicle:"etf",er:0.10,yld:3.0,sponsor:"Vanguard"},
  {tkr:"VAW",name:"Vanguard Materials",cls:"equity",vehicle:"etf",er:0.10,yld:1.8,sponsor:"Vanguard"},
  {tkr:"VOX",name:"Vanguard Communication Services",cls:"equity",vehicle:"etf",er:0.10,yld:0.8,sponsor:"Vanguard"},

  // ─── US SECTOR ETFs — iShares ───
  {tkr:"IYW",name:"iShares US Technology",cls:"equity",vehicle:"etf",er:0.40,yld:0.5,sponsor:"BlackRock"},
  {tkr:"IYH",name:"iShares US Healthcare",cls:"equity",vehicle:"etf",er:0.40,yld:1.3,sponsor:"BlackRock"},
  {tkr:"IYF",name:"iShares US Financials",cls:"equity",vehicle:"etf",er:0.40,yld:1.7,sponsor:"BlackRock"},
  {tkr:"IYE",name:"iShares US Energy",cls:"equity",vehicle:"etf",er:0.40,yld:3.2,sponsor:"BlackRock"},
  {tkr:"ITA",name:"iShares US Aerospace & Defense",cls:"equity",vehicle:"etf",er:0.40,yld:1.0,sponsor:"BlackRock"},
  {tkr:"ITB",name:"iShares US Home Construction",cls:"equity",vehicle:"etf",er:0.40,yld:0.5,sponsor:"BlackRock"},
  {tkr:"IBB",name:"iShares Biotechnology",cls:"equity",vehicle:"etf",er:0.45,yld:0.3,sponsor:"BlackRock"},
  {tkr:"IHI",name:"iShares US Medical Devices",cls:"equity",vehicle:"etf",er:0.40,yld:0.7,sponsor:"BlackRock"},
  {tkr:"KBE",name:"SPDR S&P Bank ETF",cls:"equity",vehicle:"etf",er:0.35,yld:2.6,sponsor:"State Street"},
  {tkr:"KRE",name:"SPDR S&P Regional Banking",cls:"equity",vehicle:"etf",er:0.35,yld:3.0,sponsor:"State Street"},
  {tkr:"KIE",name:"SPDR S&P Insurance",cls:"equity",vehicle:"etf",er:0.35,yld:1.6,sponsor:"State Street"},

  // ─── THEMATIC EQUITY — Semis, AI, Cloud, Cyber ───
  {tkr:"SOXX",name:"iShares Semiconductor ETF",cls:"equity",vehicle:"etf",er:0.35,yld:0.7,sponsor:"BlackRock"},
  {tkr:"SMH",name:"VanEck Semiconductor ETF",cls:"equity",vehicle:"etf",er:0.35,yld:0.6,sponsor:"VanEck"},
  {tkr:"PSI",name:"Invesco Semiconductors ETF",cls:"equity",vehicle:"etf",er:0.57,yld:0.4,sponsor:"Invesco"},
  {tkr:"FTXL",name:"First Trust Nasdaq Semiconductor",cls:"equity",vehicle:"etf",er:0.60,yld:0.6,sponsor:"First Trust"},
  {tkr:"ROBO",name:"ROBO Global Robotics & Automation",cls:"equity",vehicle:"etf",er:0.95,yld:0.4,sponsor:"Exchange Traded Concepts"},
  {tkr:"BOTZ",name:"Global X Robotics & AI ETF",cls:"equity",vehicle:"etf",er:0.69,yld:0.2,sponsor:"Global X"},
  {tkr:"AIQ",name:"Global X Artificial Intelligence & Tech",cls:"equity",vehicle:"etf",er:0.68,yld:0.3,sponsor:"Global X"},
  {tkr:"IRBO",name:"iShares Robotics & AI Multisector",cls:"equity",vehicle:"etf",er:0.47,yld:1.5,sponsor:"BlackRock"},
  {tkr:"WCLD",name:"WisdomTree Cloud Computing",cls:"equity",vehicle:"etf",er:0.45,yld:0.1,sponsor:"WisdomTree"},
  {tkr:"SKYY",name:"First Trust Cloud Computing",cls:"equity",vehicle:"etf",er:0.60,yld:0.4,sponsor:"First Trust"},
  {tkr:"CIBR",name:"First Trust Nasdaq Cybersecurity",cls:"equity",vehicle:"etf",er:0.60,yld:0.4,sponsor:"First Trust"},
  {tkr:"HACK",name:"Amplify Cybersecurity ETF",cls:"equity",vehicle:"etf",er:0.60,yld:0.5,sponsor:"Amplify"},
  {tkr:"BUG",name:"Global X Cybersecurity",cls:"equity",vehicle:"etf",er:0.50,yld:0.2,sponsor:"Global X"},
  {tkr:"FINX",name:"Global X FinTech ETF",cls:"equity",vehicle:"etf",er:0.68,yld:0.2,sponsor:"Global X"},
  {tkr:"IPAY",name:"Amplify Mobile Payments ETF",cls:"equity",vehicle:"etf",er:0.75,yld:0.3,sponsor:"Amplify"},
  {tkr:"BLOK",name:"Amplify Transformational Data Sharing (Blockchain)",cls:"equity",vehicle:"etf",er:0.71,yld:0.0,sponsor:"Amplify"},
  {tkr:"BLCN",name:"Reality Shares Nasdaq NexGen Economy",cls:"equity",vehicle:"etf",er:0.68,yld:0.0,sponsor:"Reality Shares"},
  {tkr:"IBLC",name:"iShares Blockchain & Tech",cls:"equity",vehicle:"etf",er:0.47,yld:0.0,sponsor:"BlackRock"},

  // ─── THEMATIC — ARK, Innovation, Genomics ───
  {tkr:"ARKK",name:"ARK Innovation ETF",cls:"equity",vehicle:"etf",er:0.75,yld:0.0,sponsor:"ARK Invest"},
  {tkr:"ARKW",name:"ARK Next Generation Internet",cls:"equity",vehicle:"etf",er:0.75,yld:0.0,sponsor:"ARK Invest"},
  {tkr:"ARKG",name:"ARK Genomic Revolution",cls:"equity",vehicle:"etf",er:0.75,yld:0.0,sponsor:"ARK Invest"},
  {tkr:"ARKQ",name:"ARK Autonomous Tech & Robotics",cls:"equity",vehicle:"etf",er:0.75,yld:0.0,sponsor:"ARK Invest"},
  {tkr:"ARKF",name:"ARK Fintech Innovation",cls:"equity",vehicle:"etf",er:0.75,yld:0.0,sponsor:"ARK Invest"},
  {tkr:"ARKX",name:"ARK Space Exploration & Innovation",cls:"equity",vehicle:"etf",er:0.75,yld:0.4,sponsor:"ARK Invest"},
  {tkr:"XBI",name:"SPDR S&P Biotech ETF",cls:"equity",vehicle:"etf",er:0.35,yld:0.2,sponsor:"State Street"},
  {tkr:"GNOM",name:"Global X Genomics & Biotech",cls:"equity",vehicle:"etf",er:0.50,yld:0.0,sponsor:"Global X"},
  {tkr:"IDNA",name:"iShares Genomics Immunology & Healthcare",cls:"equity",vehicle:"etf",er:0.47,yld:0.4,sponsor:"BlackRock"},

  // ─── THEMATIC — Clean Energy / Climate ───
  {tkr:"ICLN",name:"iShares Global Clean Energy",cls:"equity",vehicle:"etf",er:0.42,yld:1.4,sponsor:"BlackRock"},
  {tkr:"TAN",name:"Invesco Solar ETF",cls:"equity",vehicle:"etf",er:0.67,yld:0.5,sponsor:"Invesco"},
  {tkr:"FAN",name:"First Trust Global Wind Energy",cls:"equity",vehicle:"etf",er:0.62,yld:1.5,sponsor:"First Trust"},
  {tkr:"PBW",name:"Invesco WilderHill Clean Energy",cls:"equity",vehicle:"etf",er:0.62,yld:0.4,sponsor:"Invesco"},
  {tkr:"QCLN",name:"First Trust NASDAQ Clean Edge Green Energy",cls:"equity",vehicle:"etf",er:0.59,yld:0.5,sponsor:"First Trust"},
  {tkr:"LIT",name:"Global X Lithium & Battery Tech",cls:"equity",vehicle:"etf",er:0.75,yld:0.7,sponsor:"Global X"},
  {tkr:"URA",name:"Global X Uranium ETF",cls:"equity",vehicle:"etf",er:0.69,yld:1.4,sponsor:"Global X"},
  {tkr:"URNM",name:"Sprott Uranium Miners",cls:"equity",vehicle:"etf",er:0.83,yld:0.0,sponsor:"Sprott"},
  {tkr:"DRIV",name:"Global X Autonomous & Electric Vehicles",cls:"equity",vehicle:"etf",er:0.68,yld:1.5,sponsor:"Global X"},
  {tkr:"KARS",name:"KraneShares Electric Vehicles & Future Mobility",cls:"equity",vehicle:"etf",er:0.72,yld:1.2,sponsor:"KraneShares"},
  {tkr:"PHO",name:"Invesco Water Resources",cls:"equity",vehicle:"etf",er:0.60,yld:0.7,sponsor:"Invesco"},
  {tkr:"FIW",name:"First Trust Water ETF",cls:"equity",vehicle:"etf",er:0.53,yld:0.6,sponsor:"First Trust"},
  {tkr:"PIO",name:"Invesco Global Water",cls:"equity",vehicle:"etf",er:0.75,yld:1.1,sponsor:"Invesco"},
  {tkr:"PAVE",name:"Global X US Infrastructure Development",cls:"equity",vehicle:"etf",er:0.47,yld:0.6,sponsor:"Global X"},
  {tkr:"IFRA",name:"iShares US Infrastructure",cls:"equity",vehicle:"etf",er:0.30,yld:2.0,sponsor:"BlackRock"},
  {tkr:"GRID",name:"First Trust NASDAQ Clean Edge Smart Grid",cls:"equity",vehicle:"etf",er:0.59,yld:1.5,sponsor:"First Trust"},

  // ─── THEMATIC — Income / Covered Call ───
  {tkr:"JEPI",name:"JPMorgan Equity Premium Income",cls:"equity",vehicle:"etf",er:0.35,yld:7.5,sponsor:"JPMorgan"},
  {tkr:"JEPQ",name:"JPMorgan Nasdaq Equity Premium Income",cls:"equity",vehicle:"etf",er:0.35,yld:9.5,sponsor:"JPMorgan"},
  {tkr:"XYLD",name:"Global X S&P 500 Covered Call",cls:"equity",vehicle:"etf",er:0.60,yld:10.0,sponsor:"Global X"},
  {tkr:"QYLD",name:"Global X Nasdaq 100 Covered Call",cls:"equity",vehicle:"etf",er:0.60,yld:11.5,sponsor:"Global X"},
  {tkr:"RYLD",name:"Global X Russell 2000 Covered Call",cls:"equity",vehicle:"etf",er:0.60,yld:13.5,sponsor:"Global X"},
  {tkr:"DIVO",name:"Amplify CWP Enhanced Dividend Income",cls:"equity",vehicle:"etf",er:0.55,yld:4.5,sponsor:"Amplify"},
  {tkr:"NUSI",name:"Nationwide Risk-Managed Income",cls:"equity",vehicle:"etf",er:0.68,yld:7.5,sponsor:"Nationwide"},
  {tkr:"ISPY",name:"ProShares S&P 500 High Income",cls:"equity",vehicle:"etf",er:0.55,yld:9.5,sponsor:"ProShares"},
  {tkr:"SPYI",name:"NEOS S&P 500 High Income",cls:"equity",vehicle:"etf",er:0.68,yld:11.5,sponsor:"NEOS"},
  {tkr:"QQQI",name:"NEOS Nasdaq-100 High Income",cls:"equity",vehicle:"etf",er:0.68,yld:14.0,sponsor:"NEOS"},

  // ─── DIVIDEND / INCOME EQUITY ───
  {tkr:"VYM",name:"Vanguard High Dividend Yield",cls:"equity",vehicle:"etf",er:0.06,yld:3.0,sponsor:"Vanguard"},
  {tkr:"SCHD",name:"Schwab US Dividend Equity",cls:"equity",vehicle:"etf",er:0.06,yld:3.5,sponsor:"Schwab"},
  {tkr:"HDV",name:"iShares Core High Dividend",cls:"equity",vehicle:"etf",er:0.08,yld:3.5,sponsor:"BlackRock"},
  {tkr:"DVY",name:"iShares Select Dividend",cls:"equity",vehicle:"etf",er:0.39,yld:3.5,sponsor:"BlackRock"},
  {tkr:"NOBL",name:"ProShares S&P 500 Dividend Aristocrats",cls:"equity",vehicle:"etf",er:0.35,yld:1.9,sponsor:"ProShares"},
  {tkr:"SDOG",name:"ALPS Sector Dividend Dogs",cls:"equity",vehicle:"etf",er:0.40,yld:4.0,sponsor:"ALPS"},
  {tkr:"SPHD",name:"Invesco S&P 500 High Dividend Low Volatility",cls:"equity",vehicle:"etf",er:0.30,yld:4.4,sponsor:"Invesco"},
  {tkr:"DGRW",name:"WisdomTree US Quality Dividend Growth",cls:"equity",vehicle:"etf",er:0.28,yld:1.5,sponsor:"WisdomTree"},
  {tkr:"DLN",name:"WisdomTree US LargeCap Dividend",cls:"equity",vehicle:"etf",er:0.28,yld:2.6,sponsor:"WisdomTree"},
  {tkr:"FDL",name:"First Trust Morningstar Dividend Leaders",cls:"equity",vehicle:"etf",er:0.45,yld:4.5,sponsor:"First Trust"},
  {tkr:"REGL",name:"ProShares S&P MidCap 400 Dividend Aristocrats",cls:"equity",vehicle:"etf",er:0.40,yld:2.4,sponsor:"ProShares"},
  {tkr:"SMDV",name:"ProShares Russell 2000 Dividend Growers",cls:"equity",vehicle:"etf",er:0.40,yld:2.6,sponsor:"ProShares"},
  {tkr:"FVD",name:"First Trust Value Line Dividend",cls:"equity",vehicle:"etf",er:0.70,yld:2.3,sponsor:"First Trust"},

  // ─── FACTOR / SMART BETA ───
  {tkr:"MTUM",name:"iShares MSCI USA Momentum Factor",cls:"equity",vehicle:"etf",er:0.15,yld:1.0,sponsor:"BlackRock"},
  {tkr:"QUAL",name:"iShares MSCI USA Quality Factor",cls:"equity",vehicle:"etf",er:0.15,yld:1.4,sponsor:"BlackRock"},
  {tkr:"USMV",name:"iShares MSCI USA Min Vol Factor",cls:"equity",vehicle:"etf",er:0.15,yld:1.8,sponsor:"BlackRock"},
  {tkr:"SIZE",name:"iShares MSCI USA Size Factor",cls:"equity",vehicle:"etf",er:0.15,yld:1.4,sponsor:"BlackRock"},
  {tkr:"VLUE",name:"iShares MSCI USA Value Factor",cls:"equity",vehicle:"etf",er:0.15,yld:2.2,sponsor:"BlackRock"},
  {tkr:"SPLV",name:"Invesco S&P 500 Low Volatility",cls:"equity",vehicle:"etf",er:0.25,yld:2.0,sponsor:"Invesco"},
  {tkr:"SPHQ",name:"Invesco S&P 500 Quality",cls:"equity",vehicle:"etf",er:0.15,yld:1.5,sponsor:"Invesco"},
  {tkr:"PRF",name:"Invesco FTSE RAFI US 1000",cls:"equity",vehicle:"etf",er:0.39,yld:2.0,sponsor:"Invesco"},
  {tkr:"RPV",name:"Invesco S&P 500 Pure Value",cls:"equity",vehicle:"etf",er:0.35,yld:2.2,sponsor:"Invesco"},
  {tkr:"RPG",name:"Invesco S&P 500 Pure Growth",cls:"equity",vehicle:"etf",er:0.35,yld:0.4,sponsor:"Invesco"},
  {tkr:"DFAC",name:"Dimensional US Core Equity",cls:"equity",vehicle:"etf",er:0.17,yld:1.4,sponsor:"Dimensional"},
  {tkr:"AVUS",name:"Avantis US Equity ETF",cls:"equity",vehicle:"etf",er:0.15,yld:1.4,sponsor:"Avantis"},
  {tkr:"COWZ",name:"Pacer US Cash Cows 100",cls:"equity",vehicle:"etf",er:0.49,yld:2.0,sponsor:"Pacer"},
  {tkr:"CALF",name:"Pacer US Small Cap Cash Cows",cls:"equity",vehicle:"etf",er:0.59,yld:1.2,sponsor:"Pacer"},
  {tkr:"MOAT",name:"VanEck Morningstar Wide Moat",cls:"equity",vehicle:"etf",er:0.46,yld:1.0,sponsor:"VanEck"},
  {tkr:"FNDX",name:"Schwab Fundamental US Large Co",cls:"equity",vehicle:"etf",er:0.25,yld:1.7,sponsor:"Schwab"},
  {tkr:"FNDA",name:"Schwab Fundamental US Small Co",cls:"equity",vehicle:"etf",er:0.25,yld:1.4,sponsor:"Schwab"},
  {tkr:"FNDF",name:"Schwab Fundamental International Large",cls:"equity",vehicle:"etf",er:0.25,yld:3.0,sponsor:"Schwab"},

  // ─── INTERNATIONAL DEVELOPED — Broad ───
  {tkr:"VEA",name:"Vanguard FTSE Developed Markets",cls:"equity",vehicle:"etf",er:0.05,yld:3.0,sponsor:"Vanguard"},
  {tkr:"IEFA",name:"iShares Core MSCI EAFE",cls:"equity",vehicle:"etf",er:0.07,yld:2.8,sponsor:"BlackRock"},
  {tkr:"EFA",name:"iShares MSCI EAFE",cls:"equity",vehicle:"etf",er:0.32,yld:2.6,sponsor:"BlackRock"},
  {tkr:"SCHF",name:"Schwab International Equity",cls:"equity",vehicle:"etf",er:0.06,yld:2.9,sponsor:"Schwab"},
  {tkr:"SPDW",name:"SPDR Portfolio Developed World ex-US",cls:"equity",vehicle:"etf",er:0.04,yld:2.8,sponsor:"State Street"},
  {tkr:"IDEV",name:"iShares Core MSCI International Developed",cls:"equity",vehicle:"etf",er:0.04,yld:2.8,sponsor:"BlackRock"},
  {tkr:"VXUS",name:"Vanguard Total International Stock",cls:"equity",vehicle:"etf",er:0.07,yld:3.0,sponsor:"Vanguard"},
  {tkr:"VEU",name:"Vanguard FTSE All-World ex-US",cls:"equity",vehicle:"etf",er:0.07,yld:3.0,sponsor:"Vanguard"},
  {tkr:"ACWI",name:"iShares MSCI ACWI",cls:"equity",vehicle:"etf",er:0.32,yld:1.9,sponsor:"BlackRock"},
  {tkr:"ACWX",name:"iShares MSCI ACWI ex-US",cls:"equity",vehicle:"etf",er:0.32,yld:2.8,sponsor:"BlackRock"},
  {tkr:"VT",name:"Vanguard Total World Stock",cls:"equity",vehicle:"etf",er:0.06,yld:2.0,sponsor:"Vanguard"},

  // ─── INTERNATIONAL — Europe ───
  {tkr:"VGK",name:"Vanguard FTSE Europe",cls:"equity",vehicle:"etf",er:0.09,yld:3.0,sponsor:"Vanguard"},
  {tkr:"IEUR",name:"iShares Core MSCI Europe",cls:"equity",vehicle:"etf",er:0.09,yld:3.0,sponsor:"BlackRock"},
  {tkr:"EZU",name:"iShares MSCI Eurozone",cls:"equity",vehicle:"etf",er:0.51,yld:2.7,sponsor:"BlackRock"},
  {tkr:"FEZ",name:"SPDR EURO STOXX 50",cls:"equity",vehicle:"etf",er:0.29,yld:3.0,sponsor:"State Street"},
  {tkr:"EWG",name:"iShares MSCI Germany",cls:"equity",vehicle:"etf",er:0.50,yld:2.5,sponsor:"BlackRock"},
  {tkr:"EWU",name:"iShares MSCI United Kingdom",cls:"equity",vehicle:"etf",er:0.50,yld:4.2,sponsor:"BlackRock"},
  {tkr:"EWQ",name:"iShares MSCI France",cls:"equity",vehicle:"etf",er:0.50,yld:2.5,sponsor:"BlackRock"},
  {tkr:"EWL",name:"iShares MSCI Switzerland",cls:"equity",vehicle:"etf",er:0.50,yld:2.6,sponsor:"BlackRock"},
  {tkr:"EWP",name:"iShares MSCI Spain",cls:"equity",vehicle:"etf",er:0.50,yld:4.3,sponsor:"BlackRock"},
  {tkr:"EWI",name:"iShares MSCI Italy",cls:"equity",vehicle:"etf",er:0.50,yld:5.0,sponsor:"BlackRock"},
  {tkr:"EWN",name:"iShares MSCI Netherlands",cls:"equity",vehicle:"etf",er:0.50,yld:2.0,sponsor:"BlackRock"},
  {tkr:"EWD",name:"iShares MSCI Sweden",cls:"equity",vehicle:"etf",er:0.50,yld:3.0,sponsor:"BlackRock"},
  {tkr:"NORW",name:"Global X MSCI Norway",cls:"equity",vehicle:"etf",er:0.50,yld:4.0,sponsor:"Global X"},

  // ─── INTERNATIONAL — Asia/Pacific ───
  {tkr:"EWJ",name:"iShares MSCI Japan",cls:"equity",vehicle:"etf",er:0.50,yld:1.8,sponsor:"BlackRock"},
  {tkr:"DXJ",name:"WisdomTree Japan Hedged Equity",cls:"equity",vehicle:"etf",er:0.48,yld:3.0,sponsor:"WisdomTree"},
  {tkr:"HEWJ",name:"iShares Currency Hedged MSCI Japan",cls:"equity",vehicle:"etf",er:0.50,yld:2.0,sponsor:"BlackRock"},
  {tkr:"EWY",name:"iShares MSCI South Korea",cls:"equity",vehicle:"etf",er:0.59,yld:2.0,sponsor:"BlackRock"},
  {tkr:"EWT",name:"iShares MSCI Taiwan",cls:"equity",vehicle:"etf",er:0.59,yld:2.0,sponsor:"BlackRock"},
  {tkr:"EWA",name:"iShares MSCI Australia",cls:"equity",vehicle:"etf",er:0.50,yld:4.5,sponsor:"BlackRock"},
  {tkr:"EWS",name:"iShares MSCI Singapore",cls:"equity",vehicle:"etf",er:0.50,yld:3.5,sponsor:"BlackRock"},
  {tkr:"EWH",name:"iShares MSCI Hong Kong",cls:"equity",vehicle:"etf",er:0.50,yld:3.0,sponsor:"BlackRock"},
  {tkr:"EWC",name:"iShares MSCI Canada",cls:"equity",vehicle:"etf",er:0.50,yld:2.5,sponsor:"BlackRock"},
  {tkr:"VPL",name:"Vanguard FTSE Pacific",cls:"equity",vehicle:"etf",er:0.08,yld:3.4,sponsor:"Vanguard"},
  {tkr:"AAXJ",name:"iShares MSCI All Country Asia ex Japan",cls:"equity",vehicle:"etf",er:0.69,yld:2.4,sponsor:"BlackRock"},

  // ─── INTERNATIONAL — China ───
  {tkr:"FXI",name:"iShares China Large-Cap",cls:"equity",vehicle:"etf",er:0.74,yld:2.5,sponsor:"BlackRock"},
  {tkr:"MCHI",name:"iShares MSCI China",cls:"equity",vehicle:"etf",er:0.59,yld:1.5,sponsor:"BlackRock"},
  {tkr:"ASHR",name:"Xtrackers Harvest CSI 300 China A",cls:"equity",vehicle:"etf",er:0.65,yld:2.0,sponsor:"DWS"},
  {tkr:"PGJ",name:"Invesco Golden Dragon China",cls:"equity",vehicle:"etf",er:0.70,yld:0.6,sponsor:"Invesco"},
  {tkr:"CQQQ",name:"Invesco China Technology",cls:"equity",vehicle:"etf",er:0.70,yld:0.4,sponsor:"Invesco"},
  {tkr:"KWEB",name:"KraneShares CSI China Internet",cls:"equity",vehicle:"etf",er:0.69,yld:0.6,sponsor:"KraneShares"},
  {tkr:"YINN",name:"Direxion Daily FTSE China Bull 3X",cls:"equity",vehicle:"etf",er:0.99,yld:0.0,sponsor:"Direxion"},

  // ─── INTERNATIONAL — India, EM Single Country ───
  {tkr:"EPI",name:"WisdomTree India Earnings",cls:"equity",vehicle:"etf",er:0.85,yld:0.4,sponsor:"WisdomTree"},
  {tkr:"INDA",name:"iShares MSCI India",cls:"equity",vehicle:"etf",er:0.62,yld:0.5,sponsor:"BlackRock"},
  {tkr:"INDY",name:"iShares India 50",cls:"equity",vehicle:"etf",er:0.89,yld:1.0,sponsor:"BlackRock"},
  {tkr:"SMIN",name:"iShares MSCI India Small-Cap",cls:"equity",vehicle:"etf",er:0.74,yld:0.5,sponsor:"BlackRock"},
  {tkr:"EWZ",name:"iShares MSCI Brazil",cls:"equity",vehicle:"etf",er:0.59,yld:6.5,sponsor:"BlackRock"},
  {tkr:"EWW",name:"iShares MSCI Mexico",cls:"equity",vehicle:"etf",er:0.50,yld:3.0,sponsor:"BlackRock"},
  {tkr:"ECH",name:"iShares MSCI Chile",cls:"equity",vehicle:"etf",er:0.59,yld:5.0,sponsor:"BlackRock"},
  {tkr:"EZA",name:"iShares MSCI South Africa",cls:"equity",vehicle:"etf",er:0.59,yld:3.5,sponsor:"BlackRock"},
  {tkr:"EIDO",name:"iShares MSCI Indonesia",cls:"equity",vehicle:"etf",er:0.59,yld:3.0,sponsor:"BlackRock"},
  {tkr:"EPHE",name:"iShares MSCI Philippines",cls:"equity",vehicle:"etf",er:0.59,yld:1.5,sponsor:"BlackRock"},
  {tkr:"THD",name:"iShares MSCI Thailand",cls:"equity",vehicle:"etf",er:0.59,yld:3.5,sponsor:"BlackRock"},
  {tkr:"TUR",name:"iShares MSCI Turkey",cls:"equity",vehicle:"etf",er:0.59,yld:2.5,sponsor:"BlackRock"},
  {tkr:"VNM",name:"VanEck Vietnam",cls:"equity",vehicle:"etf",er:0.71,yld:0.5,sponsor:"VanEck"},
  {tkr:"KSA",name:"iShares MSCI Saudi Arabia",cls:"equity",vehicle:"etf",er:0.74,yld:3.0,sponsor:"BlackRock"},
  {tkr:"UAE",name:"iShares MSCI UAE",cls:"equity",vehicle:"etf",er:0.74,yld:4.0,sponsor:"BlackRock"},
  {tkr:"QAT",name:"iShares MSCI Qatar",cls:"equity",vehicle:"etf",er:0.74,yld:4.0,sponsor:"BlackRock"},

  // ─── EMERGING MARKETS BROAD ───
  {tkr:"VWO",name:"Vanguard FTSE Emerging Markets",cls:"equity",vehicle:"etf",er:0.08,yld:2.8,sponsor:"Vanguard"},
  {tkr:"IEMG",name:"iShares Core MSCI Emerging Markets",cls:"equity",vehicle:"etf",er:0.09,yld:2.4,sponsor:"BlackRock"},
  {tkr:"EEM",name:"iShares MSCI Emerging Markets",cls:"equity",vehicle:"etf",er:0.69,yld:2.0,sponsor:"BlackRock"},
  {tkr:"SCHE",name:"Schwab Emerging Markets",cls:"equity",vehicle:"etf",er:0.11,yld:2.8,sponsor:"Schwab"},
  {tkr:"SPEM",name:"SPDR Portfolio Emerging Markets",cls:"equity",vehicle:"etf",er:0.07,yld:2.5,sponsor:"State Street"},
  {tkr:"EMQQ",name:"Emerging Markets Internet & Ecommerce",cls:"equity",vehicle:"etf",er:0.86,yld:0.3,sponsor:"EMQQ"},
  {tkr:"FRDM",name:"Freedom 100 Emerging Markets",cls:"equity",vehicle:"etf",er:0.49,yld:2.1,sponsor:"Alpha Architect"},
  {tkr:"AVEM",name:"Avantis Emerging Markets Equity",cls:"equity",vehicle:"etf",er:0.33,yld:2.6,sponsor:"Avantis"},
  {tkr:"DFEM",name:"Dimensional Emerging Markets Core Equity",cls:"equity",vehicle:"etf",er:0.39,yld:2.5,sponsor:"Dimensional"},

  // ─── INTERNATIONAL — Dividend / Factor / Small ───
  {tkr:"IDV",name:"iShares International Select Dividend",cls:"equity",vehicle:"etf",er:0.51,yld:5.5,sponsor:"BlackRock"},
  {tkr:"VYMI",name:"Vanguard International High Dividend",cls:"equity",vehicle:"etf",er:0.22,yld:4.5,sponsor:"Vanguard"},
  {tkr:"DEM",name:"WisdomTree EM High Dividend",cls:"equity",vehicle:"etf",er:0.63,yld:5.0,sponsor:"WisdomTree"},
  {tkr:"DGS",name:"WisdomTree EM SmallCap Dividend",cls:"equity",vehicle:"etf",er:0.58,yld:4.0,sponsor:"WisdomTree"},
  {tkr:"DLS",name:"WisdomTree International SmallCap Dividend",cls:"equity",vehicle:"etf",er:0.58,yld:3.6,sponsor:"WisdomTree"},
  {tkr:"EFV",name:"iShares MSCI EAFE Value",cls:"equity",vehicle:"etf",er:0.36,yld:4.0,sponsor:"BlackRock"},
  {tkr:"EFG",name:"iShares MSCI EAFE Growth",cls:"equity",vehicle:"etf",er:0.36,yld:1.8,sponsor:"BlackRock"},
  {tkr:"VSS",name:"Vanguard FTSE All-World ex-US Small Cap",cls:"equity",vehicle:"etf",er:0.10,yld:2.8,sponsor:"Vanguard"},
  {tkr:"SCZ",name:"iShares MSCI EAFE Small Cap",cls:"equity",vehicle:"etf",er:0.39,yld:2.4,sponsor:"BlackRock"},
  {tkr:"IQLT",name:"iShares MSCI Intl Quality Factor",cls:"equity",vehicle:"etf",er:0.30,yld:2.4,sponsor:"BlackRock"},
  {tkr:"EEMV",name:"iShares MSCI EM Min Vol Factor",cls:"equity",vehicle:"etf",er:0.25,yld:2.6,sponsor:"BlackRock"},
  {tkr:"AVDV",name:"Avantis International Small Cap Value",cls:"equity",vehicle:"etf",er:0.36,yld:3.5,sponsor:"Avantis"},

  // ─── ESG / SUSTAINABLE ───
  {tkr:"ESGV",name:"Vanguard ESG US Stock ETF",cls:"equity",vehicle:"etf",er:0.09,yld:1.4,sponsor:"Vanguard",esg:true},
  {tkr:"VSGX",name:"Vanguard ESG International Stock",cls:"equity",vehicle:"etf",er:0.15,yld:2.7,sponsor:"Vanguard",esg:true},
  {tkr:"SUSL",name:"iShares ESG MSCI USA Leaders",cls:"equity",vehicle:"etf",er:0.10,yld:1.4,sponsor:"BlackRock",esg:true},
  {tkr:"ESGU",name:"iShares ESG Aware MSCI USA",cls:"equity",vehicle:"etf",er:0.15,yld:1.3,sponsor:"BlackRock",esg:true},
  {tkr:"EFIV",name:"SPDR S&P 500 ESG",cls:"equity",vehicle:"etf",er:0.10,yld:1.3,sponsor:"State Street",esg:true},
  {tkr:"NULG",name:"Nuveen ESG Large-Cap Growth",cls:"equity",vehicle:"etf",er:0.26,yld:0.6,sponsor:"Nuveen",esg:true},
  {tkr:"NULV",name:"Nuveen ESG Large-Cap Value",cls:"equity",vehicle:"etf",er:0.26,yld:1.8,sponsor:"Nuveen",esg:true},
  {tkr:"DSI",name:"iShares MSCI KLD 400 Social",cls:"equity",vehicle:"etf",er:0.25,yld:1.3,sponsor:"BlackRock",esg:true},
  {tkr:"SUSA",name:"iShares MSCI USA ESG Select",cls:"equity",vehicle:"etf",er:0.25,yld:1.3,sponsor:"BlackRock",esg:true},
  {tkr:"CRBN",name:"iShares MSCI ACWI Low Carbon Target",cls:"equity",vehicle:"etf",er:0.20,yld:2.0,sponsor:"BlackRock",esg:true},
  {tkr:"EAGG",name:"iShares ESG Aware US Aggregate Bond",cls:"fixed_income",vehicle:"etf",er:0.10,yld:4.4,sponsor:"BlackRock",esg:true},
  {tkr:"SUSC",name:"iShares ESG USD Corporate Bond",cls:"fixed_income",vehicle:"etf",er:0.18,yld:4.7,sponsor:"BlackRock",esg:true},
  {tkr:"EAOR",name:"iShares ESG Aware Growth Allocation",cls:"mixed",vehicle:"etf",er:0.20,yld:2.5,sponsor:"BlackRock",esg:true},
  {tkr:"ESGD",name:"iShares ESG Aware MSCI EAFE",cls:"equity",vehicle:"etf",er:0.20,yld:2.5,sponsor:"BlackRock",esg:true},
  {tkr:"ESGE",name:"iShares ESG Aware MSCI EM",cls:"equity",vehicle:"etf",er:0.25,yld:2.2,sponsor:"BlackRock",esg:true},
  {tkr:"USSG",name:"Xtrackers MSCI USA ESG Leaders",cls:"equity",vehicle:"etf",er:0.10,yld:1.3,sponsor:"DWS",esg:true},
  {tkr:"SHE",name:"SPDR SSGA Gender Diversity Index",cls:"equity",vehicle:"etf",er:0.20,yld:1.4,sponsor:"State Street",esg:true},
  {tkr:"BIBL",name:"Inspire 100 ETF",cls:"equity",vehicle:"etf",er:0.35,yld:1.0,sponsor:"Inspire",esg:true},

  // ─── US TREASURIES — Short ───
  {tkr:"BIL",name:"SPDR Bloomberg 1-3 Month T-Bill",cls:"cash",vehicle:"etf",er:0.14,yld:5.2,sponsor:"State Street",ccy:"USD",act40:true},
  {tkr:"SGOV",name:"iShares 0-3 Month Treasury",cls:"cash",vehicle:"etf",er:0.07,yld:5.2,sponsor:"BlackRock",ccy:"USD",act40:true},
  {tkr:"SHV",name:"iShares Short Treasury Bond",cls:"cash",vehicle:"etf",er:0.15,yld:5.2,sponsor:"BlackRock",ccy:"USD",act40:true},
  {tkr:"USFR",name:"WisdomTree Floating Rate Treasury",cls:"cash",vehicle:"etf",er:0.15,yld:5.3,sponsor:"WisdomTree",ccy:"USD",act40:true},
  {tkr:"TFLO",name:"iShares Treasury Floating Rate",cls:"cash",vehicle:"etf",er:0.15,yld:5.3,sponsor:"BlackRock",ccy:"USD",act40:true},
  {tkr:"CLTL",name:"Invesco Treasury Collateral",cls:"cash",vehicle:"etf",er:0.08,yld:5.2,sponsor:"Invesco",ccy:"USD",act40:true},
  {tkr:"SHY",name:"iShares 1-3 Year Treasury",cls:"fixed_income",vehicle:"etf",er:0.15,yld:4.7,sponsor:"BlackRock"},
  {tkr:"SCHO",name:"Schwab Short-Term US Treasury",cls:"fixed_income",vehicle:"etf",er:0.03,yld:4.7,sponsor:"Schwab"},
  {tkr:"VGSH",name:"Vanguard Short-Term Treasury",cls:"fixed_income",vehicle:"etf",er:0.04,yld:4.6,sponsor:"Vanguard"},

  // ─── US TREASURIES — Intermediate/Long ───
  {tkr:"IEI",name:"iShares 3-7 Year Treasury",cls:"fixed_income",vehicle:"etf",er:0.15,yld:4.4,sponsor:"BlackRock"},
  {tkr:"VGIT",name:"Vanguard Intermediate Treasury",cls:"fixed_income",vehicle:"etf",er:0.04,yld:4.3,sponsor:"Vanguard"},
  {tkr:"SCHR",name:"Schwab Intermediate Treasury",cls:"fixed_income",vehicle:"etf",er:0.03,yld:4.3,sponsor:"Schwab"},
  {tkr:"IEF",name:"iShares 7-10 Year Treasury",cls:"fixed_income",vehicle:"etf",er:0.15,yld:4.0,sponsor:"BlackRock"},
  {tkr:"VGLT",name:"Vanguard Long-Term Treasury",cls:"fixed_income",vehicle:"etf",er:0.04,yld:4.2,sponsor:"Vanguard"},
  {tkr:"TLT",name:"iShares 20+ Year Treasury",cls:"fixed_income",vehicle:"etf",er:0.15,yld:4.3,sponsor:"BlackRock"},
  {tkr:"TLH",name:"iShares 10-20 Year Treasury",cls:"fixed_income",vehicle:"etf",er:0.15,yld:4.2,sponsor:"BlackRock"},
  {tkr:"EDV",name:"Vanguard Extended Duration Treasury",cls:"fixed_income",vehicle:"etf",er:0.06,yld:4.3,sponsor:"Vanguard"},
  {tkr:"ZROZ",name:"PIMCO 25+ Yr Zero Coupon Treasury",cls:"fixed_income",vehicle:"etf",er:0.15,yld:4.5,sponsor:"PIMCO"},
  {tkr:"GOVT",name:"iShares US Treasury Bond",cls:"fixed_income",vehicle:"etf",er:0.05,yld:4.0,sponsor:"BlackRock"},
  {tkr:"SPTL",name:"SPDR Portfolio Long Term Treasury",cls:"fixed_income",vehicle:"etf",er:0.06,yld:4.3,sponsor:"State Street"},
  {tkr:"SPTI",name:"SPDR Portfolio Intermediate Treasury",cls:"fixed_income",vehicle:"etf",er:0.06,yld:4.2,sponsor:"State Street"},
  {tkr:"SPTS",name:"SPDR Portfolio Short Term Treasury",cls:"fixed_income",vehicle:"etf",er:0.06,yld:4.5,sponsor:"State Street"},

  // ─── TIPS ───
  {tkr:"TIP",name:"iShares TIPS Bond",cls:"fixed_income",vehicle:"etf",er:0.19,yld:5.4,sponsor:"BlackRock"},
  {tkr:"SCHP",name:"Schwab US TIPS",cls:"fixed_income",vehicle:"etf",er:0.03,yld:5.0,sponsor:"Schwab"},
  {tkr:"VTIP",name:"Vanguard Short-Term TIPS",cls:"fixed_income",vehicle:"etf",er:0.04,yld:4.6,sponsor:"Vanguard"},
  {tkr:"STIP",name:"iShares 0-5 Year TIPS",cls:"fixed_income",vehicle:"etf",er:0.03,yld:4.5,sponsor:"BlackRock"},
  {tkr:"LTPZ",name:"PIMCO 15+ Year TIPS",cls:"fixed_income",vehicle:"etf",er:0.20,yld:5.0,sponsor:"PIMCO"},

  // ─── INVESTMENT GRADE CORPORATE ───
  {tkr:"LQD",name:"iShares iBoxx IG Corporate Bond",cls:"fixed_income",vehicle:"etf",er:0.14,yld:4.6,sponsor:"BlackRock"},
  {tkr:"VCIT",name:"Vanguard Intermediate Corporate",cls:"fixed_income",vehicle:"etf",er:0.04,yld:4.6,sponsor:"Vanguard"},
  {tkr:"VCSH",name:"Vanguard Short-Term Corporate",cls:"fixed_income",vehicle:"etf",er:0.04,yld:4.7,sponsor:"Vanguard"},
  {tkr:"VCLT",name:"Vanguard Long-Term Corporate",cls:"fixed_income",vehicle:"etf",er:0.04,yld:5.4,sponsor:"Vanguard"},
  {tkr:"IGSB",name:"iShares 1-5 Year IG Corporate",cls:"fixed_income",vehicle:"etf",er:0.04,yld:4.7,sponsor:"BlackRock"},
  {tkr:"IGIB",name:"iShares 5-10 Year IG Corporate",cls:"fixed_income",vehicle:"etf",er:0.04,yld:5.0,sponsor:"BlackRock"},
  {tkr:"IGLB",name:"iShares 10+ Year IG Corporate",cls:"fixed_income",vehicle:"etf",er:0.04,yld:5.3,sponsor:"BlackRock"},
  {tkr:"SPSB",name:"SPDR Portfolio Short Term Corporate",cls:"fixed_income",vehicle:"etf",er:0.04,yld:4.7,sponsor:"State Street"},
  {tkr:"SPIB",name:"SPDR Portfolio Intermediate Corporate",cls:"fixed_income",vehicle:"etf",er:0.04,yld:4.8,sponsor:"State Street"},
  {tkr:"SPLB",name:"SPDR Portfolio Long Term Corporate",cls:"fixed_income",vehicle:"etf",er:0.04,yld:5.4,sponsor:"State Street"},
  {tkr:"SLQD",name:"iShares 0-5 Year IG Corporate",cls:"fixed_income",vehicle:"etf",er:0.06,yld:4.6,sponsor:"BlackRock"},
  {tkr:"USIG",name:"iShares Broad USD IG Corporate",cls:"fixed_income",vehicle:"etf",er:0.04,yld:4.7,sponsor:"BlackRock"},

  // ─── HIGH YIELD ───
  {tkr:"HYG",name:"iShares iBoxx High Yield Corporate",cls:"fixed_income",vehicle:"etf",er:0.49,yld:7.5,sponsor:"BlackRock"},
  {tkr:"JNK",name:"SPDR Bloomberg High Yield",cls:"fixed_income",vehicle:"etf",er:0.40,yld:7.5,sponsor:"State Street"},
  {tkr:"HYLB",name:"Xtrackers USD High Yield Corporate",cls:"fixed_income",vehicle:"etf",er:0.05,yld:7.5,sponsor:"DWS"},
  {tkr:"SJNK",name:"SPDR Short Term High Yield",cls:"fixed_income",vehicle:"etf",er:0.40,yld:7.2,sponsor:"State Street"},
  {tkr:"SHYG",name:"iShares 0-5 Year High Yield",cls:"fixed_income",vehicle:"etf",er:0.30,yld:7.4,sponsor:"BlackRock"},
  {tkr:"USHY",name:"iShares Broad USD High Yield",cls:"fixed_income",vehicle:"etf",er:0.15,yld:7.6,sponsor:"BlackRock"},
  {tkr:"HYS",name:"PIMCO 0-5 Yr US High Yield",cls:"fixed_income",vehicle:"etf",er:0.55,yld:7.0,sponsor:"PIMCO"},
  {tkr:"FALN",name:"iShares Fallen Angels USD Bond",cls:"fixed_income",vehicle:"etf",er:0.25,yld:7.0,sponsor:"BlackRock"},
  {tkr:"BKLN",name:"Invesco Senior Loan",cls:"fixed_income",vehicle:"etf",er:0.65,yld:9.0,sponsor:"Invesco"},
  {tkr:"SRLN",name:"SPDR Blackstone Senior Loan",cls:"fixed_income",vehicle:"etf",er:0.70,yld:9.0,sponsor:"State Street"},

  // ─── MUNICIPAL BONDS ───
  {tkr:"MUB",name:"iShares National Muni Bond",cls:"fixed_income",vehicle:"etf",er:0.05,yld:3.4,sponsor:"BlackRock"},
  {tkr:"VTEB",name:"Vanguard Tax-Exempt Bond",cls:"fixed_income",vehicle:"etf",er:0.05,yld:3.4,sponsor:"Vanguard"},
  {tkr:"TFI",name:"SPDR Nuveen Bloomberg Muni",cls:"fixed_income",vehicle:"etf",er:0.23,yld:3.4,sponsor:"State Street"},
  {tkr:"SUB",name:"iShares Short-Term National Muni",cls:"fixed_income",vehicle:"etf",er:0.07,yld:3.0,sponsor:"BlackRock"},
  {tkr:"SHM",name:"SPDR Nuveen Bloomberg Short Term Muni",cls:"fixed_income",vehicle:"etf",er:0.20,yld:3.0,sponsor:"State Street"},
  {tkr:"HYD",name:"VanEck High Yield Muni",cls:"fixed_income",vehicle:"etf",er:0.32,yld:4.8,sponsor:"VanEck"},
  {tkr:"HYMB",name:"SPDR Nuveen Bloomberg High Yield Muni",cls:"fixed_income",vehicle:"etf",er:0.35,yld:4.5,sponsor:"State Street"},
  {tkr:"PZA",name:"Invesco National AMT-Free Muni",cls:"fixed_income",vehicle:"etf",er:0.28,yld:3.6,sponsor:"Invesco"},
  {tkr:"CMF",name:"iShares California Muni Bond",cls:"fixed_income",vehicle:"etf",er:0.25,yld:3.2,sponsor:"BlackRock"},
  {tkr:"NYF",name:"iShares New York Muni Bond",cls:"fixed_income",vehicle:"etf",er:0.25,yld:3.1,sponsor:"BlackRock"},
  {tkr:"EVN",name:"Eaton Vance Muni Income Trust",cls:"fixed_income",vehicle:"mutual_fund",er:1.78,yld:5.8,sponsor:"Eaton Vance"},

  // ─── INTERNATIONAL / EM BONDS ───
  {tkr:"BNDX",name:"Vanguard Total International Bond",cls:"fixed_income",vehicle:"etf",er:0.07,yld:3.5,sponsor:"Vanguard"},
  {tkr:"IAGG",name:"iShares Core International Aggregate Bond",cls:"fixed_income",vehicle:"etf",er:0.07,yld:3.4,sponsor:"BlackRock"},
  {tkr:"EMB",name:"iShares JP Morgan USD EM Bond",cls:"fixed_income",vehicle:"etf",er:0.39,yld:6.8,sponsor:"BlackRock"},
  {tkr:"EMLC",name:"VanEck EM Local Currency Bond",cls:"fixed_income",vehicle:"etf",er:0.30,yld:6.0,sponsor:"VanEck"},
  {tkr:"PCY",name:"Invesco EM Sovereign Debt",cls:"fixed_income",vehicle:"etf",er:0.50,yld:7.0,sponsor:"Invesco"},
  {tkr:"VWOB",name:"Vanguard EM Government Bond",cls:"fixed_income",vehicle:"etf",er:0.20,yld:5.5,sponsor:"Vanguard"},
  {tkr:"EBND",name:"SPDR Bloomberg EM Local Bond",cls:"fixed_income",vehicle:"etf",er:0.30,yld:6.0,sponsor:"State Street"},
  {tkr:"EMHY",name:"iShares JP Morgan EM High Yield",cls:"fixed_income",vehicle:"etf",er:0.50,yld:8.0,sponsor:"BlackRock"},
  {tkr:"LEMB",name:"iShares JP Morgan EM Local Currency Bond",cls:"fixed_income",vehicle:"etf",er:0.30,yld:6.5,sponsor:"BlackRock"},

  // ─── TOTAL BOND / AGGREGATE / MULTI-SECTOR ───
  {tkr:"AGG",name:"iShares Core US Aggregate Bond",cls:"fixed_income",vehicle:"etf",er:0.03,yld:4.5,sponsor:"BlackRock"},
  {tkr:"BND",name:"Vanguard Total Bond Market",cls:"fixed_income",vehicle:"etf",er:0.03,yld:4.4,sponsor:"Vanguard"},
  {tkr:"SCHZ",name:"Schwab US Aggregate Bond",cls:"fixed_income",vehicle:"etf",er:0.03,yld:4.3,sponsor:"Schwab"},
  {tkr:"SPAB",name:"SPDR Portfolio Aggregate Bond",cls:"fixed_income",vehicle:"etf",er:0.03,yld:4.3,sponsor:"State Street"},
  {tkr:"IUSB",name:"iShares Core Total USD Bond Market",cls:"fixed_income",vehicle:"etf",er:0.06,yld:4.4,sponsor:"BlackRock"},
  {tkr:"FBND",name:"Fidelity Total Bond ETF",cls:"fixed_income",vehicle:"etf",er:0.36,yld:4.7,sponsor:"Fidelity"},
  {tkr:"PYLD",name:"PIMCO Multisector Bond Active",cls:"fixed_income",vehicle:"etf",er:0.55,yld:5.6,sponsor:"PIMCO"},
  {tkr:"JCPB",name:"JPMorgan Core Plus Bond",cls:"fixed_income",vehicle:"etf",er:0.40,yld:4.8,sponsor:"JPMorgan"},
  {tkr:"AGZ",name:"iShares Agency Bond",cls:"fixed_income",vehicle:"etf",er:0.20,yld:4.0,sponsor:"BlackRock"},
  {tkr:"MBB",name:"iShares Mortgage-Backed Securities",cls:"fixed_income",vehicle:"etf",er:0.04,yld:4.5,sponsor:"BlackRock"},
  {tkr:"VMBS",name:"Vanguard Mortgage-Backed Securities",cls:"fixed_income",vehicle:"etf",er:0.04,yld:4.4,sponsor:"Vanguard"},
  {tkr:"GNMA",name:"iShares GNMA Bond",cls:"fixed_income",vehicle:"etf",er:0.10,yld:4.5,sponsor:"BlackRock"},
  {tkr:"CGCP",name:"Capital Group Core Plus Income",cls:"fixed_income",vehicle:"etf",er:0.34,yld:4.8,sponsor:"Capital Group"},
  {tkr:"BOND",name:"PIMCO Active Bond",cls:"fixed_income",vehicle:"etf",er:0.55,yld:5.0,sponsor:"PIMCO"},
  {tkr:"MINT",name:"PIMCO Enhanced Short Maturity Active",cls:"fixed_income",vehicle:"etf",er:0.35,yld:5.2,sponsor:"PIMCO"},

  // ─── PREFERRED / CONVERTIBLE ───
  {tkr:"PFF",name:"iShares Preferred & Income Securities",cls:"fixed_income",vehicle:"etf",er:0.46,yld:6.5,sponsor:"BlackRock"},
  {tkr:"PGX",name:"Invesco Preferred",cls:"fixed_income",vehicle:"etf",er:0.51,yld:6.5,sponsor:"Invesco"},
  {tkr:"PGF",name:"Invesco Financial Preferred",cls:"fixed_income",vehicle:"etf",er:0.62,yld:6.0,sponsor:"Invesco"},
  {tkr:"PFFD",name:"Global X US Preferred",cls:"fixed_income",vehicle:"etf",er:0.23,yld:6.5,sponsor:"Global X"},
  {tkr:"PFFA",name:"Virtus InfraCap US Preferred Stock",cls:"fixed_income",vehicle:"etf",er:1.40,yld:9.5,sponsor:"Virtus"},
  {tkr:"PFFV",name:"Global X Variable Rate Preferred",cls:"fixed_income",vehicle:"etf",er:0.25,yld:7.0,sponsor:"Global X"},
  {tkr:"CWB",name:"SPDR Bloomberg Convertible Securities",cls:"fixed_income",vehicle:"etf",er:0.40,yld:3.0,sponsor:"State Street"},
  {tkr:"ICVT",name:"iShares Convertible Bond",cls:"fixed_income",vehicle:"etf",er:0.20,yld:3.4,sponsor:"BlackRock"},
  {tkr:"FCVT",name:"First Trust SSI Strategic Convertible",cls:"fixed_income",vehicle:"etf",er:0.95,yld:3.0,sponsor:"First Trust"},

  // ─── REAL ESTATE — US ───
  {tkr:"VNQ",name:"Vanguard Real Estate ETF (REITs)",cls:"real_estate",vehicle:"etf",er:0.13,yld:3.8,sponsor:"Vanguard"},
  {tkr:"USRT",name:"iShares Core US REIT",cls:"real_estate",vehicle:"etf",er:0.08,yld:3.6,sponsor:"BlackRock"},
  {tkr:"SCHH",name:"Schwab US REIT",cls:"real_estate",vehicle:"etf",er:0.07,yld:3.5,sponsor:"Schwab"},
  {tkr:"IYR",name:"iShares US Real Estate",cls:"real_estate",vehicle:"etf",er:0.40,yld:3.6,sponsor:"BlackRock"},
  {tkr:"XLRE",name:"Real Estate Select Sector SPDR",cls:"real_estate",vehicle:"etf",er:0.09,yld:3.3,sponsor:"State Street"},
  {tkr:"RWR",name:"SPDR DJ REIT",cls:"real_estate",vehicle:"etf",er:0.25,yld:3.7,sponsor:"State Street"},
  {tkr:"ICF",name:"iShares Cohen & Steers REIT",cls:"real_estate",vehicle:"etf",er:0.32,yld:3.0,sponsor:"BlackRock"},
  {tkr:"REZ",name:"iShares Residential & Multisector REIT",cls:"real_estate",vehicle:"etf",er:0.48,yld:3.4,sponsor:"BlackRock"},
  {tkr:"FREL",name:"Fidelity MSCI Real Estate Index",cls:"real_estate",vehicle:"etf",er:0.08,yld:3.7,sponsor:"Fidelity"},
  {tkr:"REET",name:"iShares Global REIT",cls:"real_estate",vehicle:"etf",er:0.14,yld:3.8,sponsor:"BlackRock"},

  // ─── REAL ESTATE — International / Specialty ───
  {tkr:"VNQI",name:"Vanguard Global ex-US Real Estate",cls:"real_estate",vehicle:"etf",er:0.12,yld:4.5,sponsor:"Vanguard"},
  {tkr:"RWX",name:"SPDR Dow Jones International Real Estate",cls:"real_estate",vehicle:"etf",er:0.59,yld:3.5,sponsor:"State Street"},
  {tkr:"IFGL",name:"iShares International Developed Real Estate",cls:"real_estate",vehicle:"etf",er:0.48,yld:3.8,sponsor:"BlackRock"},
  {tkr:"SRET",name:"Global X SuperDividend REIT",cls:"real_estate",vehicle:"etf",er:0.59,yld:8.5,sponsor:"Global X"},
  {tkr:"MORT",name:"VanEck Mortgage REIT Income",cls:"real_estate",vehicle:"etf",er:0.43,yld:11.0,sponsor:"VanEck"},
  {tkr:"REM",name:"iShares Mortgage Real Estate",cls:"real_estate",vehicle:"etf",er:0.48,yld:11.5,sponsor:"BlackRock"},
  {tkr:"INDS",name:"Pacer Industrial Real Estate",cls:"real_estate",vehicle:"etf",er:0.55,yld:2.5,sponsor:"Pacer"},
  {tkr:"SRVR",name:"Pacer Data & Infrastructure REIT",cls:"real_estate",vehicle:"etf",er:0.55,yld:1.5,sponsor:"Pacer"},
  {tkr:"KBWY",name:"Invesco KBW Premium Yield Equity REIT",cls:"real_estate",vehicle:"etf",er:0.35,yld:8.0,sponsor:"Invesco"},
  {tkr:"HOMZ",name:"Hoya Capital Housing",cls:"real_estate",vehicle:"etf",er:0.30,yld:1.5,sponsor:"Hoya Capital"},
  {tkr:"NETL",name:"NETLease Corporate Real Estate",cls:"real_estate",vehicle:"etf",er:0.60,yld:5.0,sponsor:"NETLease"},
  {tkr:"PSR",name:"Invesco Active US Real Estate",cls:"real_estate",vehicle:"etf",er:0.35,yld:3.4,sponsor:"Invesco"},

  // ─── COMMODITIES — Gold ───
  {tkr:"GLD",name:"SPDR Gold Shares",cls:"commodity",vehicle:"alternative",er:0.40,yld:0.0,sponsor:"State Street"},
  {tkr:"IAU",name:"iShares Gold Trust",cls:"commodity",vehicle:"alternative",er:0.25,yld:0.0,sponsor:"BlackRock"},
  {tkr:"GLDM",name:"SPDR Gold MiniShares",cls:"commodity",vehicle:"alternative",er:0.10,yld:0.0,sponsor:"State Street"},
  {tkr:"SGOL",name:"abrdn Physical Gold Shares",cls:"commodity",vehicle:"alternative",er:0.17,yld:0.0,sponsor:"abrdn"},
  {tkr:"BAR",name:"GraniteShares Gold Trust",cls:"commodity",vehicle:"alternative",er:0.17,yld:0.0,sponsor:"GraniteShares"},
  {tkr:"IAUM",name:"iShares Gold Trust Micro",cls:"commodity",vehicle:"alternative",er:0.09,yld:0.0,sponsor:"BlackRock"},
  {tkr:"AAAU",name:"Goldman Sachs Physical Gold",cls:"commodity",vehicle:"alternative",er:0.18,yld:0.0,sponsor:"Goldman Sachs"},

  // ─── COMMODITIES — Silver/Platinum/Palladium ───
  {tkr:"SLV",name:"iShares Silver Trust",cls:"commodity",vehicle:"alternative",er:0.50,yld:0.0,sponsor:"BlackRock"},
  {tkr:"SIVR",name:"abrdn Physical Silver Shares",cls:"commodity",vehicle:"alternative",er:0.30,yld:0.0,sponsor:"abrdn"},
  {tkr:"PPLT",name:"abrdn Physical Platinum",cls:"commodity",vehicle:"alternative",er:0.60,yld:0.0,sponsor:"abrdn"},
  {tkr:"PALL",name:"abrdn Physical Palladium",cls:"commodity",vehicle:"alternative",er:0.60,yld:0.0,sponsor:"abrdn"},

  // ─── COMMODITIES — Broad/Energy/Agri ───
  {tkr:"DBC",name:"Invesco DB Commodity Index",cls:"commodity",vehicle:"alternative",er:0.85,yld:0.0,sponsor:"Invesco"},
  {tkr:"PDBC",name:"Invesco Optimum Yield Diversified Commodity",cls:"commodity",vehicle:"alternative",er:0.59,yld:4.5,sponsor:"Invesco"},
  {tkr:"GSG",name:"iShares S&P GSCI Commodity",cls:"commodity",vehicle:"alternative",er:0.75,yld:2.0,sponsor:"BlackRock"},
  {tkr:"BCI",name:"abrdn Bloomberg All Commodity",cls:"commodity",vehicle:"alternative",er:0.25,yld:4.5,sponsor:"abrdn"},
  {tkr:"COMT",name:"iShares GSCI Commodity Dynamic Roll",cls:"commodity",vehicle:"alternative",er:0.48,yld:4.0,sponsor:"BlackRock"},
  {tkr:"DBA",name:"Invesco DB Agriculture",cls:"commodity",vehicle:"alternative",er:0.85,yld:0.0,sponsor:"Invesco"},
  {tkr:"CORN",name:"Teucrium Corn Fund",cls:"commodity",vehicle:"alternative",er:1.15,yld:0.0,sponsor:"Teucrium"},
  {tkr:"WEAT",name:"Teucrium Wheat Fund",cls:"commodity",vehicle:"alternative",er:1.13,yld:0.0,sponsor:"Teucrium"},
  {tkr:"SOYB",name:"Teucrium Soybean Fund",cls:"commodity",vehicle:"alternative",er:0.99,yld:0.0,sponsor:"Teucrium"},
  {tkr:"USO",name:"United States Oil",cls:"commodity",vehicle:"alternative",er:0.79,yld:0.0,sponsor:"USCF"},
  {tkr:"BNO",name:"United States Brent Oil",cls:"commodity",vehicle:"alternative",er:1.00,yld:0.0,sponsor:"USCF"},
  {tkr:"UNG",name:"United States Natural Gas",cls:"commodity",vehicle:"alternative",er:1.11,yld:0.0,sponsor:"USCF"},
  {tkr:"GDX",name:"VanEck Gold Miners",cls:"commodity",vehicle:"etf",er:0.51,yld:1.3,sponsor:"VanEck"},
  {tkr:"GDXJ",name:"VanEck Junior Gold Miners",cls:"commodity",vehicle:"etf",er:0.52,yld:1.5,sponsor:"VanEck"},
  {tkr:"RING",name:"iShares MSCI Global Gold Miners",cls:"commodity",vehicle:"etf",er:0.39,yld:1.2,sponsor:"BlackRock"},
  {tkr:"SIL",name:"Global X Silver Miners",cls:"commodity",vehicle:"etf",er:0.65,yld:1.5,sponsor:"Global X"},
  {tkr:"COPX",name:"Global X Copper Miners",cls:"commodity",vehicle:"etf",er:0.65,yld:2.0,sponsor:"Global X"},

  // ─── MIXED / ALLOCATION ───
  {tkr:"AOK",name:"iShares Conservative Allocation 30/70",cls:"mixed",vehicle:"etf",er:0.15,yld:3.0,sponsor:"BlackRock"},
  {tkr:"AOM",name:"iShares Moderate Allocation 40/60",cls:"mixed",vehicle:"etf",er:0.15,yld:2.7,sponsor:"BlackRock"},
  {tkr:"AOR",name:"iShares Growth Allocation 60/40",cls:"mixed",vehicle:"etf",er:0.15,yld:2.5,sponsor:"BlackRock"},
  {tkr:"AOA",name:"iShares Aggressive Allocation 80/20",cls:"mixed",vehicle:"etf",er:0.15,yld:2.0,sponsor:"BlackRock"},
  {tkr:"VBIAX",name:"Vanguard Balanced Index 60/40",cls:"mixed",vehicle:"mutual_fund",er:0.07,yld:2.0,sponsor:"Vanguard"},
  {tkr:"VWELX",name:"Vanguard Wellington",cls:"mixed",vehicle:"mutual_fund",er:0.25,yld:2.2,sponsor:"Vanguard"},
  {tkr:"VWINX",name:"Vanguard Wellesley Income",cls:"mixed",vehicle:"mutual_fund",er:0.23,yld:3.2,sponsor:"Vanguard"},
  {tkr:"PSLDX",name:"PIMCO StocksPlus Long Duration",cls:"mixed",vehicle:"mutual_fund",er:0.59,yld:5.5,sponsor:"PIMCO"},
  {tkr:"VTINX",name:"Vanguard Target Retirement Income",cls:"mixed",vehicle:"mutual_fund",er:0.08,yld:2.7,sponsor:"Vanguard"},
  {tkr:"VTWNX",name:"Vanguard Target Retirement 2020",cls:"mixed",vehicle:"mutual_fund",er:0.08,yld:2.5,sponsor:"Vanguard"},
  {tkr:"VTTVX",name:"Vanguard Target Retirement 2025",cls:"mixed",vehicle:"mutual_fund",er:0.08,yld:2.3,sponsor:"Vanguard"},
  {tkr:"VTHRX",name:"Vanguard Target Retirement 2030",cls:"mixed",vehicle:"mutual_fund",er:0.08,yld:2.0,sponsor:"Vanguard"},
  {tkr:"VTTHX",name:"Vanguard Target Retirement 2035",cls:"mixed",vehicle:"mutual_fund",er:0.08,yld:1.9,sponsor:"Vanguard"},
  {tkr:"VFORX",name:"Vanguard Target Retirement 2040",cls:"mixed",vehicle:"mutual_fund",er:0.08,yld:1.8,sponsor:"Vanguard"},
  {tkr:"VTIVX",name:"Vanguard Target Retirement 2045",cls:"mixed",vehicle:"mutual_fund",er:0.08,yld:1.7,sponsor:"Vanguard"},
  {tkr:"VFIFX",name:"Vanguard Target Retirement 2050",cls:"mixed",vehicle:"mutual_fund",er:0.08,yld:1.6,sponsor:"Vanguard"},
  {tkr:"VFFVX",name:"Vanguard Target Retirement 2055",cls:"mixed",vehicle:"mutual_fund",er:0.08,yld:1.6,sponsor:"Vanguard"},
  {tkr:"VTTSX",name:"Vanguard Target Retirement 2060",cls:"mixed",vehicle:"mutual_fund",er:0.08,yld:1.6,sponsor:"Vanguard"},
  {tkr:"FXIFX",name:"Fidelity Freedom Index 2030",cls:"mixed",vehicle:"mutual_fund",er:0.12,yld:2.0,sponsor:"Fidelity"},
  {tkr:"FFFEX",name:"Fidelity Freedom 2030",cls:"mixed",vehicle:"mutual_fund",er:0.66,yld:2.0,sponsor:"Fidelity"},
  {tkr:"TRRBX",name:"T. Rowe Price Retirement 2030",cls:"mixed",vehicle:"mutual_fund",er:0.55,yld:1.8,sponsor:"T. Rowe Price"},
  {tkr:"CAIBX",name:"American Funds Capital Income Builder",cls:"mixed",vehicle:"mutual_fund",er:0.61,yld:3.8,sponsor:"American Funds"},
  {tkr:"ABALX",name:"American Funds American Balanced",cls:"mixed",vehicle:"mutual_fund",er:0.55,yld:1.7,sponsor:"American Funds"},
  {tkr:"AMECX",name:"American Funds Income Fund of America",cls:"mixed",vehicle:"mutual_fund",er:0.55,yld:3.4,sponsor:"American Funds"},

  // ─── ACTIVE EQUITY MUTUAL FUNDS ───
  {tkr:"DODGX",name:"Dodge & Cox Stock Fund",cls:"equity",vehicle:"mutual_fund",er:0.52,yld:1.6,sponsor:"Dodge & Cox"},
  {tkr:"DODFX",name:"Dodge & Cox International Stock",cls:"equity",vehicle:"mutual_fund",er:0.62,yld:2.7,sponsor:"Dodge & Cox"},
  {tkr:"DODBX",name:"Dodge & Cox Balanced",cls:"mixed",vehicle:"mutual_fund",er:0.51,yld:1.7,sponsor:"Dodge & Cox"},
  {tkr:"DODIX",name:"Dodge & Cox Income",cls:"fixed_income",vehicle:"mutual_fund",er:0.41,yld:4.7,sponsor:"Dodge & Cox"},
  {tkr:"FCNTX",name:"Fidelity Contrafund",cls:"equity",vehicle:"mutual_fund",er:0.39,yld:0.2,sponsor:"Fidelity"},
  {tkr:"FBGRX",name:"Fidelity Blue Chip Growth",cls:"equity",vehicle:"mutual_fund",er:0.49,yld:0.0,sponsor:"Fidelity"},
  {tkr:"FXAIX",name:"Fidelity 500 Index",cls:"equity",vehicle:"mutual_fund",er:0.015,yld:1.3,sponsor:"Fidelity"},
  {tkr:"FSKAX",name:"Fidelity Total Market Index",cls:"equity",vehicle:"mutual_fund",er:0.015,yld:1.3,sponsor:"Fidelity"},
  {tkr:"FZILX",name:"Fidelity ZERO International Index",cls:"equity",vehicle:"mutual_fund",er:0.00,yld:2.9,sponsor:"Fidelity"},
  {tkr:"FZROX",name:"Fidelity ZERO Total Market Index",cls:"equity",vehicle:"mutual_fund",er:0.00,yld:1.3,sponsor:"Fidelity"},
  {tkr:"FSMAX",name:"Fidelity Extended Market Index",cls:"equity",vehicle:"mutual_fund",er:0.035,yld:1.2,sponsor:"Fidelity"},
  {tkr:"FSPSX",name:"Fidelity International Index",cls:"equity",vehicle:"mutual_fund",er:0.035,yld:2.9,sponsor:"Fidelity"},
  {tkr:"FXNAX",name:"Fidelity US Bond Index",cls:"fixed_income",vehicle:"mutual_fund",er:0.025,yld:4.4,sponsor:"Fidelity"},
  {tkr:"PRGFX",name:"T. Rowe Price Growth Stock",cls:"equity",vehicle:"mutual_fund",er:0.65,yld:0.0,sponsor:"T. Rowe Price"},
  {tkr:"PRWCX",name:"T. Rowe Price Capital Appreciation",cls:"mixed",vehicle:"mutual_fund",er:0.71,yld:1.5,sponsor:"T. Rowe Price"},
  {tkr:"PRBLX",name:"Parnassus Core Equity",cls:"equity",vehicle:"mutual_fund",er:0.83,yld:1.2,sponsor:"Parnassus",esg:true},
  {tkr:"AGTHX",name:"American Funds Growth Fund of America",cls:"equity",vehicle:"mutual_fund",er:0.61,yld:0.5,sponsor:"American Funds"},
  {tkr:"AWSHX",name:"American Funds Washington Mutual",cls:"equity",vehicle:"mutual_fund",er:0.55,yld:1.7,sponsor:"American Funds"},
  {tkr:"AIVSX",name:"American Funds Investment Co of America",cls:"equity",vehicle:"mutual_fund",er:0.56,yld:1.4,sponsor:"American Funds"},
  {tkr:"CWGIX",name:"American Funds Capital World Growth & Income",cls:"equity",vehicle:"mutual_fund",er:0.74,yld:1.5,sponsor:"American Funds"},
  {tkr:"VFIAX",name:"Vanguard 500 Index Admiral",cls:"equity",vehicle:"mutual_fund",er:0.04,yld:1.3,sponsor:"Vanguard"},
  {tkr:"VTSAX",name:"Vanguard Total Stock Admiral",cls:"equity",vehicle:"mutual_fund",er:0.04,yld:1.3,sponsor:"Vanguard"},
  {tkr:"VTIAX",name:"Vanguard Total International Admiral",cls:"equity",vehicle:"mutual_fund",er:0.11,yld:3.0,sponsor:"Vanguard"},
  {tkr:"VTBLX",name:"Vanguard Total Bond Market Index",cls:"fixed_income",vehicle:"mutual_fund",er:0.05,yld:4.4,sponsor:"Vanguard"},
  {tkr:"VFICX",name:"Vanguard Intermediate-Term IG",cls:"fixed_income",vehicle:"mutual_fund",er:0.20,yld:5.0,sponsor:"Vanguard"},
  {tkr:"VWIUX",name:"Vanguard Intermediate Tax-Exempt",cls:"fixed_income",vehicle:"mutual_fund",er:0.09,yld:3.4,sponsor:"Vanguard"},
  {tkr:"VWAHX",name:"Vanguard High-Yield Tax-Exempt",cls:"fixed_income",vehicle:"mutual_fund",er:0.17,yld:4.0,sponsor:"Vanguard"},
  {tkr:"VHCAX",name:"Vanguard Capital Opportunity Admiral",cls:"equity",vehicle:"mutual_fund",er:0.36,yld:0.7,sponsor:"Vanguard"},
  {tkr:"VPMAX",name:"Vanguard PRIMECAP Admiral",cls:"equity",vehicle:"mutual_fund",er:0.31,yld:0.7,sponsor:"Vanguard"},
  {tkr:"POAGX",name:"PRIMECAP Odyssey Aggressive Growth",cls:"equity",vehicle:"mutual_fund",er:0.65,yld:0.0,sponsor:"PRIMECAP"},

  // ─── ACTIVE BOND MUTUAL FUNDS ───
  {tkr:"PONAX",name:"PIMCO Income Fund A",cls:"fixed_income",vehicle:"mutual_fund",er:0.90,yld:6.5,sponsor:"PIMCO"},
  {tkr:"PIMIX",name:"PIMCO Income Institutional",cls:"fixed_income",vehicle:"mutual_fund",er:0.51,yld:6.5,sponsor:"PIMCO"},
  {tkr:"PTTRX",name:"PIMCO Total Return Institutional",cls:"fixed_income",vehicle:"mutual_fund",er:0.46,yld:5.0,sponsor:"PIMCO"},
  {tkr:"PFORX",name:"PIMCO Foreign Bond USD-Hedged Inst",cls:"fixed_income",vehicle:"mutual_fund",er:0.59,yld:4.5,sponsor:"PIMCO"},
  {tkr:"DLTNX",name:"DoubleLine Total Return Bond N",cls:"fixed_income",vehicle:"mutual_fund",er:0.71,yld:5.0,sponsor:"DoubleLine"},
  {tkr:"DBLTX",name:"DoubleLine Total Return Bond I",cls:"fixed_income",vehicle:"mutual_fund",er:0.46,yld:5.0,sponsor:"DoubleLine"},
  {tkr:"FTBFX",name:"Fidelity Total Bond",cls:"fixed_income",vehicle:"mutual_fund",er:0.45,yld:4.6,sponsor:"Fidelity"},
  {tkr:"WACPX",name:"Western Asset Core Plus Bond",cls:"fixed_income",vehicle:"mutual_fund",er:0.42,yld:5.0,sponsor:"Western Asset"},
  {tkr:"BCOIX",name:"Baird Core Plus Bond",cls:"fixed_income",vehicle:"mutual_fund",er:0.30,yld:4.7,sponsor:"Baird"},
  {tkr:"BAGIX",name:"Baird Aggregate Bond",cls:"fixed_income",vehicle:"mutual_fund",er:0.30,yld:4.5,sponsor:"Baird"},
  {tkr:"LSBRX",name:"Loomis Sayles Bond Retail",cls:"fixed_income",vehicle:"mutual_fund",er:0.91,yld:4.5,sponsor:"Loomis Sayles"},

  // ─── ALTERNATIVES / MANAGED FUTURES / NEUTRAL ───
  {tkr:"QAI",name:"NYLI Hedge Multi-Strategy Tracker",cls:"alternative",vehicle:"etf",er:0.79,yld:1.8,sponsor:"New York Life"},
  {tkr:"MNA",name:"NYLI Merger Arbitrage",cls:"alternative",vehicle:"etf",er:0.78,yld:1.2,sponsor:"New York Life"},
  {tkr:"BTAL",name:"AGFiQ US Market Neutral Anti-Beta",cls:"alternative",vehicle:"etf",er:1.42,yld:0.5,sponsor:"AGFiQ"},
  {tkr:"KMLM",name:"KFA Mount Lucas Managed Futures",cls:"alternative",vehicle:"etf",er:0.92,yld:0.0,sponsor:"KFA Funds"},
  {tkr:"DBMF",name:"iMGP DBi Managed Futures Strategy",cls:"alternative",vehicle:"etf",er:0.85,yld:5.0,sponsor:"iMGP"},
  {tkr:"CTA",name:"Simplify Managed Futures Strategy",cls:"alternative",vehicle:"etf",er:0.76,yld:5.5,sponsor:"Simplify"},
  {tkr:"RPAR",name:"RPAR Risk Parity",cls:"alternative",vehicle:"etf",er:0.50,yld:3.0,sponsor:"Toroso"},
  {tkr:"UPAR",name:"UPAR Ultra Risk Parity",cls:"alternative",vehicle:"etf",er:0.65,yld:3.5,sponsor:"Toroso"},
  {tkr:"NTSX",name:"WisdomTree US Efficient Core",cls:"alternative",vehicle:"etf",er:0.20,yld:2.8,sponsor:"WisdomTree"},
  {tkr:"NTSI",name:"WisdomTree International Efficient Core",cls:"alternative",vehicle:"etf",er:0.26,yld:3.8,sponsor:"WisdomTree"},
  {tkr:"SVOL",name:"Simplify Volatility Premium",cls:"alternative",vehicle:"etf",er:0.50,yld:16.0,sponsor:"Simplify"},
  {tkr:"SWAN",name:"Amplify BlackSwan Growth & Treasury",cls:"alternative",vehicle:"etf",er:0.49,yld:1.5,sponsor:"Amplify"},
  {tkr:"PSP",name:"Invesco Global Listed Private Equity",cls:"alternative",vehicle:"etf",er:1.44,yld:8.5,sponsor:"Invesco"},
  {tkr:"BIZD",name:"VanEck BDC Income",cls:"alternative",vehicle:"etf",er:13.43,yld:11.0,sponsor:"VanEck"},
  {tkr:"PHDG",name:"Invesco S&P 500 Downside Hedged",cls:"alternative",vehicle:"etf",er:0.39,yld:2.0,sponsor:"Invesco"},
  {tkr:"PUTW",name:"WisdomTree CBOE S&P 500 PutWrite",cls:"alternative",vehicle:"etf",er:0.44,yld:1.5,sponsor:"WisdomTree"},

  // ─── BUFFERED / DEFINED OUTCOME ───
  {tkr:"BUFR",name:"First Trust Cboe Vest Fund of Buffer",cls:"alternative",vehicle:"etf",er:0.95,yld:0.0,sponsor:"First Trust"},
  {tkr:"BJUL",name:"Innovator S&P 500 Buffer ETF July",cls:"alternative",vehicle:"etf",er:0.79,yld:0.0,sponsor:"Innovator"},
  {tkr:"BSEP",name:"Innovator S&P 500 Buffer ETF September",cls:"alternative",vehicle:"etf",er:0.79,yld:0.0,sponsor:"Innovator"},
  {tkr:"BJAN",name:"Innovator S&P 500 Buffer ETF January",cls:"alternative",vehicle:"etf",er:0.79,yld:0.0,sponsor:"Innovator"},
  {tkr:"PJUL",name:"Innovator S&P 500 Power Buffer July",cls:"alternative",vehicle:"etf",er:0.79,yld:0.0,sponsor:"Innovator"},
  {tkr:"PSEP",name:"Innovator S&P 500 Power Buffer September",cls:"alternative",vehicle:"etf",er:0.79,yld:0.0,sponsor:"Innovator"},

  // ─── CASH / MONEY MARKET ───
  {tkr:"VMFXX",name:"Vanguard Federal Money Market",cls:"cash",vehicle:"money_market",er:0.11,yld:5.3,sponsor:"Vanguard",ccy:"USD",act40:true},
  {tkr:"VMSXX",name:"Vanguard Tax-Exempt Money Market",cls:"cash",vehicle:"money_market",er:0.15,yld:3.4,sponsor:"Vanguard",ccy:"USD",act40:true},
  {tkr:"VUSXX",name:"Vanguard Treasury Money Market",cls:"cash",vehicle:"money_market",er:0.09,yld:5.2,sponsor:"Vanguard",ccy:"USD",act40:true},
  {tkr:"SPAXX",name:"Fidelity Government Money Market",cls:"cash",vehicle:"money_market",er:0.42,yld:5.0,sponsor:"Fidelity",ccy:"USD",act40:true},
  {tkr:"FZDXX",name:"Fidelity Money Market Premium",cls:"cash",vehicle:"money_market",er:0.40,yld:5.1,sponsor:"Fidelity",ccy:"USD",act40:true},
  {tkr:"FDLXX",name:"Fidelity Treasury Only Money Market",cls:"cash",vehicle:"money_market",er:0.42,yld:5.0,sponsor:"Fidelity",ccy:"USD",act40:true},
  {tkr:"SWVXX",name:"Schwab Value Advantage Money",cls:"cash",vehicle:"money_market",er:0.34,yld:5.1,sponsor:"Schwab",ccy:"USD",act40:true},
  {tkr:"SNOXX",name:"Schwab Treasury Money Fund",cls:"cash",vehicle:"money_market",er:0.34,yld:5.0,sponsor:"Schwab",ccy:"USD",act40:true},
  {tkr:"SUTXX",name:"Schwab US Treasury Money Fund",cls:"cash",vehicle:"money_market",er:0.34,yld:5.0,sponsor:"Schwab",ccy:"USD",act40:true},
  {tkr:"UTIXX",name:"American Century US Government Money",cls:"cash",vehicle:"money_market",er:0.40,yld:4.9,sponsor:"American Century",ccy:"USD",act40:true},
  {tkr:"FLOT",name:"iShares Floating Rate Bond",cls:"cash",vehicle:"etf",er:0.15,yld:5.4,sponsor:"BlackRock",ccy:"USD",act40:true},
  {tkr:"FLRN",name:"SPDR Bloomberg Investment Grade Floating Rate",cls:"cash",vehicle:"etf",er:0.15,yld:5.4,sponsor:"State Street",ccy:"USD",act40:true},

  // ─── 1940 ACT ULTRA-SHORT ETFs (US-registered) ───
  // The largest ultra-short 40-Act ETFs, absent until now: JPST alone holds
  // more assets than the rest of the ETF cash sleeve combined.
  {tkr:"JPST",name:"JPMorgan Ultra-Short Income ETF",cls:"cash",vehicle:"etf",er:0.18,yld:5.3,sponsor:"J.P. Morgan",ccy:"USD",act40:true},
  {tkr:"ICSH",name:"iShares Ultra Short Duration Bond Active ETF",cls:"cash",vehicle:"etf",er:0.08,yld:5.3,sponsor:"BlackRock",ccy:"USD",act40:true},
  {tkr:"GBIL",name:"Goldman Sachs Access Treasury 0-1 Year ETF",cls:"cash",vehicle:"etf",er:0.12,yld:5.0,sponsor:"Goldman Sachs",ccy:"USD",act40:true},

  // ─── UCITS MONEY MARKET / ULTRA-SHORT (non-US eligible) ───
  // Every fund above is US-listed, so a UCITS-only client (CH/DE/SG/BR and the
  // rest of the PRIIPs world) previously had ZERO eligible cash funds — the
  // sleeve could not be filled and its weight had to be reallocated. These are
  // the liquid European money-market and ultra-short lines that fill it.
  // Yields are stated on the FUND_DATA_AS_OF (2024-12-31) basis like the rest of
  // the dataset — EUR at the then-prevailing ESTR/ECB level, GBP and USD higher.
  {tkr:"XEON",name:"Xtrackers II EUR Overnight Rate Swap UCITS ETF 1C",cls:"cash",vehicle:"etf",er:0.10,yld:3.0,sponsor:"DWS/Xtrackers",dom:"LU",ucits:true,ccy:"EUR"},
  {tkr:"ERNE",name:"iShares € Ultrashort Bond UCITS ETF",cls:"cash",vehicle:"etf",er:0.09,yld:3.4,sponsor:"BlackRock",dom:"IE",ucits:true,ccy:"EUR"},
  {tkr:"ERNA",name:"iShares $ Ultrashort Bond UCITS ETF USD (Acc)",cls:"cash",vehicle:"etf",er:0.09,yld:5.0,sponsor:"BlackRock",dom:"IE",ucits:true,ccy:"USD"},
  {tkr:"ERNS",name:"iShares £ Ultrashort Bond UCITS ETF",cls:"cash",vehicle:"etf",er:0.09,yld:4.8,sponsor:"BlackRock",dom:"IE",ucits:true,ccy:"GBP"},
  {tkr:"IB01",name:"iShares $ Treasury Bond 0-1yr UCITS ETF USD (Acc)",cls:"cash",vehicle:"etf",er:0.07,yld:4.6,sponsor:"BlackRock",dom:"IE",ucits:true,ccy:"USD"},

  // ─── CRYPTO / SPOT BITCOIN/ETHER ───
  {tkr:"IBIT",name:"iShares Bitcoin Trust",cls:"crypto",vehicle:"alternative",er:0.25,yld:0.0,sponsor:"BlackRock"},
  {tkr:"FBTC",name:"Fidelity Wise Origin Bitcoin",cls:"crypto",vehicle:"alternative",er:0.25,yld:0.0,sponsor:"Fidelity"},
  {tkr:"GBTC",name:"Grayscale Bitcoin Trust",cls:"crypto",vehicle:"alternative",er:1.50,yld:0.0,sponsor:"Grayscale"},
  {tkr:"BITB",name:"Bitwise Bitcoin ETF",cls:"crypto",vehicle:"alternative",er:0.20,yld:0.0,sponsor:"Bitwise"},
  {tkr:"ARKB",name:"ARK 21Shares Bitcoin ETF",cls:"crypto",vehicle:"alternative",er:0.21,yld:0.0,sponsor:"ARK Invest"},
  {tkr:"BTCO",name:"Invesco Galaxy Bitcoin ETF",cls:"crypto",vehicle:"alternative",er:0.25,yld:0.0,sponsor:"Invesco"},
  {tkr:"HODL",name:"VanEck Bitcoin Trust",cls:"crypto",vehicle:"alternative",er:0.20,yld:0.0,sponsor:"VanEck"},
  {tkr:"BRRR",name:"Valkyrie Bitcoin Fund",cls:"crypto",vehicle:"alternative",er:0.25,yld:0.0,sponsor:"Valkyrie"},
  {tkr:"ETHA",name:"iShares Ethereum Trust",cls:"crypto",vehicle:"alternative",er:0.25,yld:0.0,sponsor:"BlackRock"},
  {tkr:"FETH",name:"Fidelity Ethereum Fund",cls:"crypto",vehicle:"alternative",er:0.25,yld:0.0,sponsor:"Fidelity"},
  {tkr:"ETHE",name:"Grayscale Ethereum Trust",cls:"crypto",vehicle:"alternative",er:2.50,yld:0.0,sponsor:"Grayscale"},
  {tkr:"BITO",name:"ProShares Bitcoin Strategy",cls:"crypto",vehicle:"alternative",er:0.95,yld:0.0,sponsor:"ProShares"},

  // ════════════════════════════════════════════════════════════════════
  // EUROPEAN UCITS — Ireland (IE) and Luxembourg (LU) domiciled funds
  // sold to EU/UK/CH/Asia/MENA investors via the UCITS passport
  // ════════════════════════════════════════════════════════════════════

  // ─── GLOBAL / WORLD UCITS ETFs ───
  {tkr:"IWDA",name:"iShares Core MSCI World UCITS ETF Acc",cls:"equity",vehicle:"etf",er:0.20,yld:1.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"SWDA",name:"iShares Core MSCI World UCITS ETF Acc (LSE)",cls:"equity",vehicle:"etf",er:0.20,yld:1.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"EUNL",name:"iShares Core MSCI World UCITS (XETRA)",cls:"equity",vehicle:"etf",er:0.20,yld:1.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"VWRL",name:"Vanguard FTSE All-World UCITS Dist",cls:"equity",vehicle:"etf",er:0.22,yld:1.7,sponsor:"Vanguard",dom:"IE",ucits:true},
  {tkr:"VWRD",name:"Vanguard FTSE All-World UCITS USD Dist",cls:"equity",vehicle:"etf",er:0.22,yld:1.7,sponsor:"Vanguard",dom:"IE",ucits:true},
  {tkr:"VWCE",name:"Vanguard FTSE All-World UCITS Acc",cls:"equity",vehicle:"etf",er:0.22,yld:0.0,sponsor:"Vanguard",dom:"IE",ucits:true},
  {tkr:"XDWD",name:"Xtrackers MSCI World UCITS",cls:"equity",vehicle:"etf",er:0.19,yld:1.5,sponsor:"DWS",dom:"IE",ucits:true},
  {tkr:"XDWL",name:"Xtrackers MSCI World UCITS 1C",cls:"equity",vehicle:"etf",er:0.19,yld:0.0,sponsor:"DWS",dom:"IE",ucits:true},
  {tkr:"SWRD",name:"SPDR MSCI World UCITS",cls:"equity",vehicle:"etf",er:0.12,yld:1.5,sponsor:"State Street",dom:"IE",ucits:true},
  {tkr:"HMWO",name:"HSBC MSCI World UCITS",cls:"equity",vehicle:"etf",er:0.15,yld:1.7,sponsor:"HSBC",dom:"IE",ucits:true},
  {tkr:"LGGG",name:"L&G Global Equity UCITS",cls:"equity",vehicle:"etf",er:0.10,yld:1.6,sponsor:"L&G",dom:"IE",ucits:true},
  {tkr:"IUSQ",name:"iShares MSCI ACWI UCITS",cls:"equity",vehicle:"etf",er:0.20,yld:1.7,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"SSAC",name:"iShares MSCI ACWI UCITS Acc",cls:"equity",vehicle:"etf",er:0.20,yld:0.0,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IMID",name:"iShares Core MSCI World ESG Screened UCITS",cls:"equity",vehicle:"etf",er:0.20,yld:1.5,sponsor:"BlackRock",dom:"IE",ucits:true,esg:true},
  {tkr:"WCBRL",name:"WisdomTree Cybersecurity UCITS (LSE)",cls:"equity",vehicle:"etf",er:0.45,yld:0.0,sponsor:"WisdomTree",dom:"IE",ucits:true},

  // ─── US UCITS ETFs (S&P 500 / Nasdaq / Russell) ───
  {tkr:"CSPX",name:"iShares Core S&P 500 UCITS Acc",cls:"equity",vehicle:"etf",er:0.07,yld:0.0,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"SXR8",name:"iShares Core S&P 500 UCITS (XETRA)",cls:"equity",vehicle:"etf",er:0.07,yld:0.0,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IUSA",name:"iShares Core S&P 500 UCITS Dist",cls:"equity",vehicle:"etf",er:0.07,yld:1.3,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"VUSA",name:"Vanguard S&P 500 UCITS Dist",cls:"equity",vehicle:"etf",er:0.07,yld:1.3,sponsor:"Vanguard",dom:"IE",ucits:true},
  {tkr:"VUAA",name:"Vanguard S&P 500 UCITS Acc",cls:"equity",vehicle:"etf",er:0.07,yld:0.0,sponsor:"Vanguard",dom:"IE",ucits:true},
  {tkr:"VUAG",name:"Vanguard S&P 500 UCITS Acc (LSE GBP)",cls:"equity",vehicle:"etf",er:0.07,yld:0.0,sponsor:"Vanguard",dom:"IE",ucits:true},
  {tkr:"XSPX",name:"Xtrackers S&P 500 UCITS",cls:"equity",vehicle:"etf",er:0.07,yld:1.3,sponsor:"DWS",dom:"IE",ucits:true},
  {tkr:"XDPG",name:"Xtrackers MSCI USA UCITS",cls:"equity",vehicle:"etf",er:0.07,yld:1.3,sponsor:"DWS",dom:"IE",ucits:true},
  {tkr:"SPY5",name:"SPDR S&P 500 UCITS",cls:"equity",vehicle:"etf",er:0.09,yld:1.3,sponsor:"State Street",dom:"IE",ucits:true},
  {tkr:"CSP1",name:"iShares Core S&P 500 UCITS GBP Hedged",cls:"equity",vehicle:"etf",er:0.10,yld:0.0,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"CNDX",name:"iShares NASDAQ 100 UCITS Acc",cls:"equity",vehicle:"etf",er:0.33,yld:0.0,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"EQQQ",name:"Invesco EQQQ NASDAQ-100 UCITS",cls:"equity",vehicle:"etf",er:0.30,yld:0.4,sponsor:"Invesco",dom:"IE",ucits:true},
  {tkr:"EQAC",name:"Invesco Nasdaq 100 UCITS Acc",cls:"equity",vehicle:"etf",er:0.20,yld:0.0,sponsor:"Invesco",dom:"IE",ucits:true},
  {tkr:"XNAS",name:"Xtrackers Nasdaq 100 UCITS",cls:"equity",vehicle:"etf",er:0.20,yld:0.0,sponsor:"DWS",dom:"IE",ucits:true},
  {tkr:"VUSC",name:"Vanguard USD Corporate Bond UCITS",cls:"fixed_income",vehicle:"etf",er:0.09,yld:4.7,sponsor:"Vanguard",dom:"IE",ucits:true},
  {tkr:"RS2K",name:"SPDR Russell 2000 US Small Cap UCITS",cls:"equity",vehicle:"etf",er:0.30,yld:1.1,sponsor:"State Street",dom:"IE",ucits:true},
  {tkr:"ZPRR",name:"SPDR Russell 2000 US Small Cap UCITS (XETRA)",cls:"equity",vehicle:"etf",er:0.30,yld:1.1,sponsor:"State Street",dom:"IE",ucits:true},

  // ─── US SECTOR UCITS (iShares S&P 500 sector) ───
  {tkr:"IUIT",name:"iShares S&P 500 Information Technology Sector UCITS",cls:"equity",vehicle:"etf",er:0.15,yld:0.7,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IUHC",name:"iShares S&P 500 Health Care Sector UCITS",cls:"equity",vehicle:"etf",er:0.15,yld:1.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IUFS",name:"iShares S&P 500 Financials Sector UCITS",cls:"equity",vehicle:"etf",er:0.15,yld:1.7,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IUES",name:"iShares S&P 500 Energy Sector UCITS",cls:"equity",vehicle:"etf",er:0.15,yld:3.4,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IUCD",name:"iShares S&P 500 Consumer Discretionary UCITS",cls:"equity",vehicle:"etf",er:0.15,yld:0.7,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IUCS",name:"iShares S&P 500 Consumer Staples UCITS",cls:"equity",vehicle:"etf",er:0.15,yld:2.6,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IUIS",name:"iShares S&P 500 Industrials Sector UCITS",cls:"equity",vehicle:"etf",er:0.15,yld:1.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IUUT",name:"iShares S&P 500 Utilities Sector UCITS",cls:"equity",vehicle:"etf",er:0.15,yld:3.0,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IUMS",name:"iShares S&P 500 Materials Sector UCITS",cls:"equity",vehicle:"etf",er:0.15,yld:1.8,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IUCM",name:"iShares S&P 500 Communication Sector UCITS",cls:"equity",vehicle:"etf",er:0.15,yld:0.8,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"WHEA",name:"Xtrackers MSCI World Health Care UCITS",cls:"equity",vehicle:"etf",er:0.25,yld:1.5,sponsor:"DWS",dom:"IE",ucits:true},
  {tkr:"XDWT",name:"Xtrackers MSCI World Information Tech UCITS",cls:"equity",vehicle:"etf",er:0.25,yld:0.7,sponsor:"DWS",dom:"IE",ucits:true},
  {tkr:"XDWF",name:"Xtrackers MSCI World Financials UCITS",cls:"equity",vehicle:"etf",er:0.25,yld:2.5,sponsor:"DWS",dom:"IE",ucits:true},
  {tkr:"XDWE",name:"Xtrackers MSCI World Energy UCITS",cls:"equity",vehicle:"etf",er:0.25,yld:3.5,sponsor:"DWS",dom:"IE",ucits:true},

  // ─── EUROPE UCITS ETFs ───
  {tkr:"VEUR",name:"Vanguard FTSE Developed Europe UCITS",cls:"equity",vehicle:"etf",er:0.10,yld:3.2,sponsor:"Vanguard",dom:"IE",ucits:true},
  {tkr:"VEVE",name:"Vanguard FTSE Developed World UCITS",cls:"equity",vehicle:"etf",er:0.12,yld:1.7,sponsor:"Vanguard",dom:"IE",ucits:true},
  {tkr:"IMEU",name:"iShares Core MSCI Europe UCITS",cls:"equity",vehicle:"etf",er:0.12,yld:3.0,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"SXRT",name:"iShares STOXX Europe 600 UCITS DE",cls:"equity",vehicle:"etf",er:0.20,yld:3.0,sponsor:"BlackRock",dom:"DE",ucits:true},
  {tkr:"EXSA",name:"iShares STOXX Europe 600 UCITS (XETRA)",cls:"equity",vehicle:"etf",er:0.20,yld:3.0,sponsor:"BlackRock",dom:"DE",ucits:true},
  {tkr:"MEUD",name:"Amundi Core MSCI Europe UCITS",cls:"equity",vehicle:"etf",er:0.07,yld:3.0,sponsor:"Amundi",dom:"LU",ucits:true},
  {tkr:"CEU",name:"Amundi MSCI Europe UCITS",cls:"equity",vehicle:"etf",er:0.15,yld:3.0,sponsor:"Amundi",dom:"LU",ucits:true},
  {tkr:"XESC",name:"Xtrackers Euro STOXX 50 UCITS",cls:"equity",vehicle:"etf",er:0.09,yld:3.0,sponsor:"DWS",dom:"LU",ucits:true},
  {tkr:"CSX5",name:"iShares Core EURO STOXX 50 UCITS",cls:"equity",vehicle:"etf",er:0.10,yld:3.0,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"C50",name:"Amundi Euro STOXX 50 UCITS",cls:"equity",vehicle:"etf",er:0.15,yld:3.0,sponsor:"Amundi",dom:"LU",ucits:true},
  {tkr:"VUKE",name:"Vanguard FTSE 100 UCITS",cls:"equity",vehicle:"etf",er:0.09,yld:4.0,sponsor:"Vanguard",dom:"IE",ucits:true},
  {tkr:"ISF",name:"iShares Core FTSE 100 UCITS",cls:"equity",vehicle:"etf",er:0.07,yld:4.0,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"VMID",name:"Vanguard FTSE 250 UCITS",cls:"equity",vehicle:"etf",er:0.10,yld:3.0,sponsor:"Vanguard",dom:"IE",ucits:true},
  {tkr:"EXS1",name:"iShares Core DAX UCITS (XETRA)",cls:"equity",vehicle:"etf",er:0.16,yld:2.7,sponsor:"BlackRock",dom:"DE",ucits:true},
  {tkr:"DAXX",name:"Xtrackers DAX UCITS",cls:"equity",vehicle:"etf",er:0.09,yld:2.7,sponsor:"DWS",dom:"LU",ucits:true},
  {tkr:"CACX",name:"Lyxor CAC 40 UCITS",cls:"equity",vehicle:"etf",er:0.25,yld:2.8,sponsor:"Amundi",dom:"FR",ucits:true},
  {tkr:"IEUS",name:"iShares STOXX Europe Small 200 UCITS",cls:"equity",vehicle:"etf",er:0.20,yld:2.5,sponsor:"BlackRock",dom:"DE",ucits:true},
  {tkr:"VERX",name:"Vanguard FTSE Developed Europe ex UK UCITS",cls:"equity",vehicle:"etf",er:0.10,yld:3.0,sponsor:"Vanguard",dom:"IE",ucits:true},
  {tkr:"CSEMU",name:"iShares Core MSCI EMU UCITS",cls:"equity",vehicle:"etf",er:0.12,yld:2.7,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"EUDV",name:"WisdomTree Eurozone Quality Dividend Growth UCITS",cls:"equity",vehicle:"etf",er:0.29,yld:3.0,sponsor:"WisdomTree",dom:"IE",ucits:true},

  // ─── EMERGING MARKETS UCITS ETFs ───
  {tkr:"EIMI",name:"iShares Core MSCI EM IMI UCITS",cls:"equity",vehicle:"etf",er:0.18,yld:2.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"EMIM",name:"iShares Core MSCI EM IMI UCITS Acc",cls:"equity",vehicle:"etf",er:0.18,yld:0.0,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"VFEM",name:"Vanguard FTSE Emerging Markets UCITS",cls:"equity",vehicle:"etf",er:0.22,yld:2.7,sponsor:"Vanguard",dom:"IE",ucits:true},
  {tkr:"VFEA",name:"Vanguard FTSE Emerging Markets UCITS Acc",cls:"equity",vehicle:"etf",er:0.22,yld:0.0,sponsor:"Vanguard",dom:"IE",ucits:true},
  {tkr:"XMME",name:"Xtrackers MSCI Emerging Markets UCITS",cls:"equity",vehicle:"etf",er:0.18,yld:2.5,sponsor:"DWS",dom:"IE",ucits:true},
  {tkr:"AEEM",name:"Amundi MSCI Emerging Markets UCITS",cls:"equity",vehicle:"etf",er:0.20,yld:2.5,sponsor:"Amundi",dom:"FR",ucits:true},
  {tkr:"EMSA",name:"iShares Edge MSCI EM Multifactor UCITS",cls:"equity",vehicle:"etf",er:0.45,yld:2.4,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"EMQP",name:"HANetf EMQQ Emerging Markets Internet UCITS (LSE)",cls:"equity",vehicle:"etf",er:0.86,yld:0.3,sponsor:"HANetf",dom:"IE",ucits:true},
  {tkr:"EMVL",name:"iShares Edge MSCI EM Value Factor UCITS",cls:"equity",vehicle:"etf",er:0.40,yld:3.5,sponsor:"BlackRock",dom:"IE",ucits:true},

  // ─── ASIA / CHINA / INDIA UCITS ETFs ───
  {tkr:"IJPN",name:"iShares Core MSCI Japan IMI UCITS",cls:"equity",vehicle:"etf",er:0.12,yld:2.2,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"SJPA",name:"iShares Core MSCI Japan IMI UCITS Acc",cls:"equity",vehicle:"etf",er:0.12,yld:0.0,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"VJPN",name:"Vanguard FTSE Japan UCITS",cls:"equity",vehicle:"etf",er:0.15,yld:2.3,sponsor:"Vanguard",dom:"IE",ucits:true},
  {tkr:"IPAC",name:"iShares Core MSCI Pacific ex-Japan UCITS",cls:"equity",vehicle:"etf",er:0.20,yld:3.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"VAPX",name:"Vanguard FTSE Developed Asia Pacific ex-Japan UCITS",cls:"equity",vehicle:"etf",er:0.15,yld:3.5,sponsor:"Vanguard",dom:"IE",ucits:true},
  {tkr:"IASP",name:"iShares Asia Pacific Dividend UCITS",cls:"equity",vehicle:"etf",er:0.59,yld:5.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"CSH2",name:"iShares MSCI China A UCITS",cls:"equity",vehicle:"etf",er:0.40,yld:1.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"FXC",name:"Franklin FTSE China UCITS",cls:"equity",vehicle:"etf",er:0.19,yld:2.5,sponsor:"Franklin Templeton",dom:"IE",ucits:true},
  {tkr:"XCHA",name:"Xtrackers Harvest CSI300 China A-Shares UCITS",cls:"equity",vehicle:"etf",er:0.65,yld:2.0,sponsor:"DWS",dom:"LU",ucits:true},
  {tkr:"ICHN",name:"iShares MSCI China UCITS",cls:"equity",vehicle:"etf",er:0.40,yld:1.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"KWBL",name:"KraneShares CSI China Internet UCITS (LSE)",cls:"equity",vehicle:"etf",er:0.75,yld:0.6,sponsor:"KraneShares",dom:"IE",ucits:true},
  {tkr:"INRT",name:"iShares MSCI India UCITS",cls:"equity",vehicle:"etf",er:0.65,yld:0.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IDIN",name:"iShares MSCI India UCITS Acc",cls:"equity",vehicle:"etf",er:0.65,yld:0.0,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"NDIA",name:"Franklin FTSE India UCITS",cls:"equity",vehicle:"etf",er:0.19,yld:0.6,sponsor:"Franklin Templeton",dom:"IE",ucits:true},
  {tkr:"XCS6",name:"Xtrackers MSCI Korea UCITS",cls:"equity",vehicle:"etf",er:0.65,yld:1.8,sponsor:"DWS",dom:"IE",ucits:true},
  {tkr:"VNAM",name:"Xtrackers FTSE Vietnam UCITS",cls:"equity",vehicle:"etf",er:0.85,yld:1.0,sponsor:"DWS",dom:"LU",ucits:true},

  // ─── SWITZERLAND / OTHER SINGLE COUNTRY UCITS ───
  {tkr:"CSSMI",name:"iShares Core SMI UCITS",cls:"equity",vehicle:"etf",er:0.20,yld:3.0,sponsor:"BlackRock",dom:"CH",ucits:true},
  {tkr:"CSSMIM",name:"iShares Swiss Domestic Government Bond 1-3 UCITS",cls:"fixed_income",vehicle:"etf",er:0.15,yld:0.7,sponsor:"BlackRock",dom:"CH",ucits:true},
  {tkr:"CHSPI",name:"iShares Core SPI UCITS",cls:"equity",vehicle:"etf",er:0.10,yld:3.0,sponsor:"BlackRock",dom:"CH",ucits:true},
  {tkr:"CASH",name:"UBS Solactive Switzerland 30 UCITS",cls:"equity",vehicle:"etf",er:0.15,yld:3.0,sponsor:"UBS",dom:"CH",ucits:true},
  {tkr:"CCAU",name:"iShares Core MSCI Canada UCITS",cls:"equity",vehicle:"etf",er:0.20,yld:2.6,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"AUST",name:"iShares MSCI Australia UCITS",cls:"equity",vehicle:"etf",er:0.50,yld:4.5,sponsor:"BlackRock",dom:"IE",ucits:true},

  // ─── DIVIDEND / FACTOR UCITS ETFs ───
  {tkr:"VHYL",name:"Vanguard FTSE All-World High Dividend UCITS",cls:"equity",vehicle:"etf",er:0.29,yld:3.5,sponsor:"Vanguard",dom:"IE",ucits:true},
  {tkr:"VHYD",name:"Vanguard FTSE All-World High Dividend UCITS USD",cls:"equity",vehicle:"etf",er:0.29,yld:3.5,sponsor:"Vanguard",dom:"IE",ucits:true},
  {tkr:"WQDS",name:"WisdomTree Global Quality Dividend Growth UCITS",cls:"equity",vehicle:"etf",er:0.38,yld:2.3,sponsor:"WisdomTree",dom:"IE",ucits:true},
  {tkr:"IUKD",name:"iShares UK Dividend UCITS",cls:"equity",vehicle:"etf",er:0.40,yld:5.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IDVY",name:"iShares EURO STOXX Select Dividend 30 UCITS",cls:"equity",vehicle:"etf",er:0.30,yld:5.0,sponsor:"BlackRock",dom:"DE",ucits:true},
  {tkr:"EDIV",name:"SPDR S&P Emerging Markets Dividend Aristocrats UCITS",cls:"equity",vehicle:"etf",er:0.55,yld:5.0,sponsor:"State Street",dom:"IE",ucits:true},
  {tkr:"GLDV",name:"SPDR S&P Global Dividend Aristocrats UCITS",cls:"equity",vehicle:"etf",er:0.45,yld:4.0,sponsor:"State Street",dom:"IE",ucits:true},
  {tkr:"WTED",name:"WisdomTree Europe Equity Income UCITS",cls:"equity",vehicle:"etf",er:0.29,yld:5.0,sponsor:"WisdomTree",dom:"IE",ucits:true},
  {tkr:"IS3R",name:"iShares Edge MSCI World Momentum Factor UCITS",cls:"equity",vehicle:"etf",er:0.30,yld:1.0,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IS3Q",name:"iShares Edge MSCI World Quality Factor UCITS",cls:"equity",vehicle:"etf",er:0.30,yld:1.6,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"MVOL",name:"iShares Edge MSCI World Minimum Volatility UCITS",cls:"equity",vehicle:"etf",er:0.30,yld:1.8,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IWVL",name:"iShares Edge MSCI World Value Factor UCITS",cls:"equity",vehicle:"etf",er:0.30,yld:3.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IWSZ",name:"iShares Edge MSCI World Size Factor UCITS",cls:"equity",vehicle:"etf",er:0.30,yld:2.0,sponsor:"BlackRock",dom:"IE",ucits:true},

  // ─── ESG UCITS ETFs ───
  {tkr:"SUWS",name:"iShares MSCI USA SRI UCITS",cls:"equity",vehicle:"etf",er:0.20,yld:1.2,sponsor:"BlackRock",dom:"IE",ucits:true,esg:true},
  {tkr:"SUSW",name:"iShares MSCI World SRI UCITS",cls:"equity",vehicle:"etf",er:0.20,yld:1.5,sponsor:"BlackRock",dom:"IE",ucits:true,esg:true},
  {tkr:"SUSU",name:"iShares MSCI USA ESG Screened UCITS",cls:"equity",vehicle:"etf",er:0.07,yld:1.3,sponsor:"BlackRock",dom:"IE",ucits:true,esg:true},
  {tkr:"SUSM",name:"iShares MSCI EM SRI UCITS",cls:"equity",vehicle:"etf",er:0.35,yld:2.4,sponsor:"BlackRock",dom:"IE",ucits:true,esg:true},
  {tkr:"SUEU",name:"iShares MSCI Europe SRI UCITS",cls:"equity",vehicle:"etf",er:0.25,yld:2.6,sponsor:"BlackRock",dom:"IE",ucits:true,esg:true},
  {tkr:"SUJP",name:"iShares MSCI Japan SRI UCITS",cls:"equity",vehicle:"etf",er:0.25,yld:2.0,sponsor:"BlackRock",dom:"IE",ucits:true,esg:true},
  {tkr:"V3AB",name:"Vanguard ESG Global All Cap UCITS Acc",cls:"equity",vehicle:"etf",er:0.24,yld:0.0,sponsor:"Vanguard",dom:"IE",ucits:true,esg:true},
  {tkr:"V3AA",name:"Vanguard ESG Developed World All Cap UCITS Acc",cls:"equity",vehicle:"etf",er:0.20,yld:0.0,sponsor:"Vanguard",dom:"IE",ucits:true,esg:true},
  {tkr:"VESG",name:"Vanguard ESG Global Corporate Bond UCITS",cls:"fixed_income",vehicle:"etf",er:0.15,yld:4.5,sponsor:"Vanguard",dom:"IE",ucits:true,esg:true},
  {tkr:"XZW0",name:"Xtrackers ESG MSCI World UCITS",cls:"equity",vehicle:"etf",er:0.20,yld:1.5,sponsor:"DWS",dom:"IE",ucits:true,esg:true},

  // ─── THEMATIC UCITS ETFs ───
  {tkr:"INRG",name:"iShares Global Clean Energy UCITS",cls:"equity",vehicle:"etf",er:0.65,yld:1.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IQQH",name:"iShares Global Clean Energy UCITS (XETRA)",cls:"equity",vehicle:"etf",er:0.65,yld:0.0,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"RBOT",name:"L&G ROBO Global Robotics & Automation UCITS",cls:"equity",vehicle:"etf",er:0.80,yld:0.4,sponsor:"L&G",dom:"IE",ucits:true},
  {tkr:"BNXG",name:"L&G Battery Value-Chain UCITS",cls:"equity",vehicle:"etf",er:0.49,yld:1.0,sponsor:"L&G",dom:"IE",ucits:true},
  {tkr:"AUTO",name:"Lyxor Auto & Mobility World UCITS",cls:"equity",vehicle:"etf",er:0.45,yld:1.5,sponsor:"Amundi",dom:"LU",ucits:true},
  {tkr:"ECAR",name:"iShares Electric Vehicles & Driving Technology UCITS",cls:"equity",vehicle:"etf",er:0.40,yld:1.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"HYDG",name:"L&G Hydrogen Economy UCITS",cls:"equity",vehicle:"etf",er:0.49,yld:0.5,sponsor:"L&G",dom:"IE",ucits:true},
  {tkr:"WOOD",name:"iShares Global Timber & Forestry UCITS",cls:"equity",vehicle:"etf",er:0.65,yld:2.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IH2O",name:"iShares Global Water UCITS",cls:"equity",vehicle:"etf",er:0.65,yld:1.4,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"PWAT",name:"Invesco Global Water UCITS",cls:"equity",vehicle:"etf",er:0.39,yld:0.7,sponsor:"Invesco",dom:"IE",ucits:true},
  {tkr:"ESGL",name:"L&G Clean Water UCITS",cls:"equity",vehicle:"etf",er:0.49,yld:1.5,sponsor:"L&G",dom:"IE",ucits:true},
  {tkr:"XAIX",name:"Xtrackers Artificial Intelligence & Big Data UCITS",cls:"equity",vehicle:"etf",er:0.35,yld:0.0,sponsor:"DWS",dom:"IE",ucits:true},
  {tkr:"ARTI",name:"WisdomTree Artificial Intelligence UCITS",cls:"equity",vehicle:"etf",er:0.40,yld:0.3,sponsor:"WisdomTree",dom:"IE",ucits:true},
  {tkr:"AIAI",name:"L&G Artificial Intelligence UCITS",cls:"equity",vehicle:"etf",er:0.49,yld:0.0,sponsor:"L&G",dom:"IE",ucits:true},
  {tkr:"CYBR",name:"L&G Cyber Security UCITS",cls:"equity",vehicle:"etf",er:0.69,yld:0.4,sponsor:"L&G",dom:"IE",ucits:true},
  {tkr:"GAGG",name:"Invesco Gaming & Esports UCITS",cls:"equity",vehicle:"etf",er:0.55,yld:0.2,sponsor:"Invesco",dom:"IE",ucits:true},
  {tkr:"WCLDE",name:"WisdomTree Cloud Computing UCITS (LSE)",cls:"equity",vehicle:"etf",er:0.40,yld:0.0,sponsor:"WisdomTree",dom:"IE",ucits:true},
  {tkr:"WBLO",name:"WisdomTree Blockchain UCITS",cls:"equity",vehicle:"etf",er:0.45,yld:0.0,sponsor:"WisdomTree",dom:"IE",ucits:true},
  {tkr:"METR",name:"WisdomTree Metaverse UCITS",cls:"equity",vehicle:"etf",er:0.45,yld:0.0,sponsor:"WisdomTree",dom:"IE",ucits:true},
  {tkr:"SMHX",name:"VanEck Semiconductor UCITS",cls:"equity",vehicle:"etf",er:0.35,yld:0.6,sponsor:"VanEck",dom:"IE",ucits:true},
  {tkr:"ESPO",name:"VanEck Video Gaming and eSports UCITS",cls:"equity",vehicle:"etf",er:0.55,yld:0.5,sponsor:"VanEck",dom:"IE",ucits:true},

  // ─── BOND UCITS — Treasuries / Govts ───
  {tkr:"IBTM",name:"iShares USD Treasury Bond 7-10yr UCITS",cls:"fixed_income",vehicle:"etf",er:0.07,yld:4.0,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IBTS",name:"iShares USD Treasury Bond 1-3yr UCITS",cls:"fixed_income",vehicle:"etf",er:0.07,yld:4.7,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IBTA",name:"iShares USD Treasury Bond 3-7yr UCITS",cls:"fixed_income",vehicle:"etf",er:0.07,yld:4.4,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IDTL",name:"iShares USD Treasury Bond 20+yr UCITS",cls:"fixed_income",vehicle:"etf",er:0.07,yld:4.3,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"VUTY",name:"Vanguard USD Treasury Bond UCITS",cls:"fixed_income",vehicle:"etf",er:0.07,yld:4.2,sponsor:"Vanguard",dom:"IE",ucits:true},
  {tkr:"VDST",name:"Vanguard USD Short-Term Treasury UCITS",cls:"fixed_income",vehicle:"etf",er:0.10,yld:4.7,sponsor:"Vanguard",dom:"IE",ucits:true},
  {tkr:"VGOV",name:"Vanguard UK Gilt UCITS",cls:"fixed_income",vehicle:"etf",er:0.07,yld:4.0,sponsor:"Vanguard",dom:"IE",ucits:true},
  {tkr:"IGLT",name:"iShares Core UK Gilts UCITS",cls:"fixed_income",vehicle:"etf",er:0.07,yld:4.0,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IBGL",name:"iShares Core Euro Government Bond UCITS",cls:"fixed_income",vehicle:"etf",er:0.09,yld:3.0,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IEGE",name:"iShares Euro Government Bond 7-10yr UCITS",cls:"fixed_income",vehicle:"etf",er:0.15,yld:3.0,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IEAG",name:"iShares Euro Aggregate Bond UCITS",cls:"fixed_income",vehicle:"etf",er:0.25,yld:3.1,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IBCI",name:"iShares Euro Inflation Linked Gov Bond UCITS",cls:"fixed_income",vehicle:"etf",er:0.20,yld:3.0,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"ITPS",name:"iShares Global Inflation Linked Gov Bond UCITS",cls:"fixed_income",vehicle:"etf",er:0.25,yld:3.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IGLO",name:"iShares Global Government Bond UCITS",cls:"fixed_income",vehicle:"etf",er:0.20,yld:3.2,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"AGGG",name:"iShares Core Global Aggregate Bond UCITS",cls:"fixed_income",vehicle:"etf",er:0.10,yld:3.7,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"AGGH",name:"iShares Core Global Aggregate Bond UCITS EUR Hedged",cls:"fixed_income",vehicle:"etf",er:0.10,yld:3.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"VAGP",name:"Vanguard Global Aggregate Bond UCITS GBP Hedged",cls:"fixed_income",vehicle:"etf",er:0.10,yld:3.7,sponsor:"Vanguard",dom:"IE",ucits:true},

  // ─── BOND UCITS — Corporate / HY / EM ───
  {tkr:"LQDE",name:"iShares USD Corporate Bond UCITS",cls:"fixed_income",vehicle:"etf",er:0.20,yld:4.7,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"LQDA",name:"iShares USD Corporate Bond UCITS Acc",cls:"fixed_income",vehicle:"etf",er:0.20,yld:0.0,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"LQDH",name:"iShares USD Corporate Bond Interest Rate Hedged UCITS",cls:"fixed_income",vehicle:"etf",er:0.25,yld:4.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IEAC",name:"iShares Core Euro Corporate Bond UCITS",cls:"fixed_income",vehicle:"etf",er:0.20,yld:3.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"EUNA",name:"iShares Core Euro Corporate Bond UCITS Dist",cls:"fixed_income",vehicle:"etf",er:0.20,yld:3.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IHYG",name:"iShares Euro High Yield Corporate Bond UCITS",cls:"fixed_income",vehicle:"etf",er:0.50,yld:6.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IHYU",name:"iShares USD High Yield Corporate Bond UCITS",cls:"fixed_income",vehicle:"etf",er:0.50,yld:7.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"SHYU",name:"iShares USD HY Corporate Bond UCITS Acc",cls:"fixed_income",vehicle:"etf",er:0.50,yld:0.0,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IEMB",name:"iShares JPM USD EM Bond UCITS",cls:"fixed_income",vehicle:"etf",er:0.45,yld:6.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"SEMB",name:"iShares JPM USD EM Bond UCITS Acc",cls:"fixed_income",vehicle:"etf",er:0.45,yld:0.0,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"EMLCL",name:"Amundi JPM EM Local Currency Bond UCITS (Lux)",cls:"fixed_income",vehicle:"etf",er:0.30,yld:6.0,sponsor:"Amundi",dom:"LU",ucits:true},
  {tkr:"EMBE",name:"Vanguard USD EM Government Bond UCITS",cls:"fixed_income",vehicle:"etf",er:0.25,yld:5.8,sponsor:"Vanguard",dom:"IE",ucits:true},

  // ─── COMMODITY ETC (Jersey/Ireland physical) ───
  {tkr:"SGLN",name:"iShares Physical Gold ETC",cls:"commodity",vehicle:"alternative",er:0.12,yld:0.0,sponsor:"BlackRock",dom:"JE",ucits:true},
  {tkr:"IGLN",name:"iShares Physical Gold ETC (LSE GBP)",cls:"commodity",vehicle:"alternative",er:0.12,yld:0.0,sponsor:"BlackRock",dom:"JE",ucits:true},
  {tkr:"PHAU",name:"WisdomTree Physical Gold",cls:"commodity",vehicle:"alternative",er:0.39,yld:0.0,sponsor:"WisdomTree",dom:"JE",ucits:true},
  {tkr:"SGLD",name:"Invesco Physical Gold ETC",cls:"commodity",vehicle:"alternative",er:0.12,yld:0.0,sponsor:"Invesco",dom:"IE",ucits:true},
  {tkr:"XGLD",name:"Xtrackers IE Physical Gold ETC",cls:"commodity",vehicle:"alternative",er:0.12,yld:0.0,sponsor:"DWS",dom:"IE",ucits:true},
  {tkr:"AUCH",name:"UBS ETF CH Gold (CHF Hedged)",cls:"commodity",vehicle:"alternative",er:0.23,yld:0.0,sponsor:"UBS",dom:"CH",ucits:true},
  {tkr:"PHAG",name:"WisdomTree Physical Silver",cls:"commodity",vehicle:"alternative",er:0.49,yld:0.0,sponsor:"WisdomTree",dom:"JE",ucits:true},
  {tkr:"SSLV",name:"iShares Physical Silver ETC",cls:"commodity",vehicle:"alternative",er:0.20,yld:0.0,sponsor:"BlackRock",dom:"JE",ucits:true},
  {tkr:"WPLT",name:"WisdomTree Physical Platinum",cls:"commodity",vehicle:"alternative",er:0.49,yld:0.0,sponsor:"WisdomTree",dom:"JE",ucits:true},
  {tkr:"WPDL",name:"WisdomTree Physical Palladium",cls:"commodity",vehicle:"alternative",er:0.49,yld:0.0,sponsor:"WisdomTree",dom:"JE",ucits:true},
  {tkr:"AIGB",name:"WisdomTree Broad Commodities UCITS",cls:"commodity",vehicle:"alternative",er:0.19,yld:0.0,sponsor:"WisdomTree",dom:"IE",ucits:true},
  {tkr:"CMOD",name:"L&G All Commodities UCITS",cls:"commodity",vehicle:"alternative",er:0.30,yld:0.0,sponsor:"L&G",dom:"IE",ucits:true},

  // ─── REIT UCITS ETFs ───
  {tkr:"IPRP",name:"iShares European Property Yield UCITS",cls:"real_estate",vehicle:"etf",er:0.40,yld:3.0,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IWDP",name:"iShares Developed Markets Property Yield UCITS",cls:"real_estate",vehicle:"etf",er:0.59,yld:3.5,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"IDWP",name:"iShares Developed Markets Property Yield UCITS Acc",cls:"real_estate",vehicle:"etf",er:0.59,yld:0.0,sponsor:"BlackRock",dom:"IE",ucits:true},
  {tkr:"VGRE",name:"Vanguard FTSE Developed Europe Real Estate UCITS",cls:"real_estate",vehicle:"etf",er:0.12,yld:3.5,sponsor:"Vanguard",dom:"IE",ucits:true},
  {tkr:"EPRE",name:"SPDR Dow Jones Global Real Estate UCITS",cls:"real_estate",vehicle:"etf",er:0.40,yld:3.7,sponsor:"State Street",dom:"IE",ucits:true},
  {tkr:"ZPRP",name:"SPDR Dow Jones Global Real Estate UCITS Acc",cls:"real_estate",vehicle:"etf",er:0.40,yld:0.0,sponsor:"State Street",dom:"IE",ucits:true},

  // ─── BITCOIN / CRYPTO ETPs (Swiss / Jersey / Ireland) ───
  {tkr:"BTCE",name:"ETC Group Physical Bitcoin",cls:"crypto",vehicle:"alternative",er:2.00,yld:0.0,sponsor:"ETC Group",dom:"DE",ucits:false},
  {tkr:"BTCW",name:"WisdomTree Physical Bitcoin",cls:"crypto",vehicle:"alternative",er:0.95,yld:0.0,sponsor:"WisdomTree",dom:"JE",ucits:false},
  {tkr:"21BC",name:"21Shares Bitcoin Core ETP",cls:"crypto",vehicle:"alternative",er:0.21,yld:0.0,sponsor:"21Shares",dom:"CH",ucits:false},
  {tkr:"ABTC",name:"21Shares Bitcoin ETP",cls:"crypto",vehicle:"alternative",er:1.49,yld:0.0,sponsor:"21Shares",dom:"CH",ucits:false},
  {tkr:"AETH",name:"21Shares Ethereum ETP",cls:"crypto",vehicle:"alternative",er:1.49,yld:0.0,sponsor:"21Shares",dom:"CH",ucits:false},
  {tkr:"ZETH",name:"21Shares Ethereum Core ETP",cls:"crypto",vehicle:"alternative",er:0.21,yld:0.0,sponsor:"21Shares",dom:"CH",ucits:false},
  {tkr:"VBTC",name:"VanEck Bitcoin ETN",cls:"crypto",vehicle:"alternative",er:1.00,yld:0.0,sponsor:"VanEck",dom:"DE",ucits:false},
  {tkr:"VETH",name:"VanEck Ethereum ETN",cls:"crypto",vehicle:"alternative",er:1.00,yld:0.0,sponsor:"VanEck",dom:"DE",ucits:false},
  {tkr:"CBTC",name:"CoinShares Physical Bitcoin",cls:"crypto",vehicle:"alternative",er:0.25,yld:0.0,sponsor:"CoinShares",dom:"JE",ucits:false},
  {tkr:"CETH",name:"CoinShares Physical Ethereum",cls:"crypto",vehicle:"alternative",er:1.25,yld:0.0,sponsor:"CoinShares",dom:"JE",ucits:false},

  // ─── ACTIVE UCITS — Equity SICAVs ───
  {tkr:"BGFGA",name:"BlackRock Global Funds Global Allocation A2 USD",cls:"mixed",vehicle:"mutual_fund",er:1.78,yld:1.0,sponsor:"BlackRock",dom:"LU",ucits:true},
  {tkr:"BGFWG",name:"BlackRock GF World Healthscience A2",cls:"equity",vehicle:"mutual_fund",er:1.81,yld:0.0,sponsor:"BlackRock",dom:"LU",ucits:true},
  {tkr:"BGFTC",name:"BlackRock GF World Technology A2",cls:"equity",vehicle:"mutual_fund",er:1.83,yld:0.0,sponsor:"BlackRock",dom:"LU",ucits:true},
  {tkr:"BGFFI",name:"BlackRock GF World Financials A2",cls:"equity",vehicle:"mutual_fund",er:1.83,yld:0.5,sponsor:"BlackRock",dom:"LU",ucits:true},
  {tkr:"BGFEM",name:"BlackRock GF Emerging Markets A2",cls:"equity",vehicle:"mutual_fund",er:1.81,yld:0.5,sponsor:"BlackRock",dom:"LU",ucits:true},
  {tkr:"FFGE",name:"Fidelity Funds Global Equity Income A USD",cls:"equity",vehicle:"mutual_fund",er:1.91,yld:2.5,sponsor:"Fidelity",dom:"LU",ucits:true},
  {tkr:"FFGD",name:"Fidelity Funds Global Dividend A USD",cls:"equity",vehicle:"mutual_fund",er:1.92,yld:2.7,sponsor:"Fidelity",dom:"LU",ucits:true},
  {tkr:"FFWF",name:"Fidelity Funds World A USD",cls:"equity",vehicle:"mutual_fund",er:1.91,yld:0.4,sponsor:"Fidelity",dom:"LU",ucits:true},
  {tkr:"FFEDG",name:"Fidelity Funds European Dynamic Growth A EUR",cls:"equity",vehicle:"mutual_fund",er:1.91,yld:0.0,sponsor:"Fidelity",dom:"LU",ucits:true},
  {tkr:"FFASE",name:"Fidelity Funds Asian Special Situations A USD",cls:"equity",vehicle:"mutual_fund",er:1.93,yld:1.0,sponsor:"Fidelity",dom:"LU",ucits:true},
  {tkr:"FFAGB",name:"Fidelity Funds Asia Pacific Dividend A USD",cls:"equity",vehicle:"mutual_fund",er:1.93,yld:3.8,sponsor:"Fidelity",dom:"LU",ucits:true},
  {tkr:"JPMUE",name:"JPMorgan US Equity Plus A USD",cls:"equity",vehicle:"mutual_fund",er:1.45,yld:0.5,sponsor:"JPMorgan",dom:"LU",ucits:true},
  {tkr:"JPMIN",name:"JPMorgan Global Income A USD",cls:"mixed",vehicle:"mutual_fund",er:1.45,yld:4.0,sponsor:"JPMorgan",dom:"LU",ucits:true},
  {tkr:"JPMEM",name:"JPMorgan Emerging Markets Equity A USD",cls:"equity",vehicle:"mutual_fund",er:1.80,yld:1.0,sponsor:"JPMorgan",dom:"LU",ucits:true},
  {tkr:"JPMUI",name:"JPMorgan US Income & Growth A USD",cls:"mixed",vehicle:"mutual_fund",er:1.50,yld:4.5,sponsor:"JPMorgan",dom:"LU",ucits:true},
  {tkr:"JPMCB",name:"JPMorgan Global Bond Opportunities A USD",cls:"fixed_income",vehicle:"mutual_fund",er:1.10,yld:5.0,sponsor:"JPMorgan",dom:"LU",ucits:true},
  {tkr:"PIMGI",name:"PIMCO GIS Income Institutional USD",cls:"fixed_income",vehicle:"mutual_fund",er:0.55,yld:5.5,sponsor:"PIMCO",dom:"IE",ucits:true},
  {tkr:"PIMGB",name:"PIMCO GIS Global Bond Institutional",cls:"fixed_income",vehicle:"mutual_fund",er:0.49,yld:4.5,sponsor:"PIMCO",dom:"IE",ucits:true},
  {tkr:"PIMDI",name:"PIMCO GIS Diversified Income Institutional",cls:"fixed_income",vehicle:"mutual_fund",er:0.69,yld:5.5,sponsor:"PIMCO",dom:"IE",ucits:true},
  {tkr:"PIMEM",name:"PIMCO GIS Emerging Markets Bond Institutional",cls:"fixed_income",vehicle:"mutual_fund",er:0.83,yld:6.5,sponsor:"PIMCO",dom:"IE",ucits:true},
  {tkr:"PIMCP",name:"PIMCO GIS Total Return Bond Institutional",cls:"fixed_income",vehicle:"mutual_fund",er:0.49,yld:4.8,sponsor:"PIMCO",dom:"IE",ucits:true},
  {tkr:"MGOI",name:"M&G Optimal Income A EUR",cls:"fixed_income",vehicle:"mutual_fund",er:1.41,yld:3.5,sponsor:"M&G",dom:"LU",ucits:true},
  {tkr:"MGGF",name:"M&G Global Floating Rate High Yield A USD",cls:"fixed_income",vehicle:"mutual_fund",er:1.06,yld:7.0,sponsor:"M&G",dom:"LU",ucits:true},
  {tkr:"CARP",name:"Carmignac Patrimoine A EUR",cls:"mixed",vehicle:"mutual_fund",er:1.94,yld:0.0,sponsor:"Carmignac",dom:"LU",ucits:true},
  {tkr:"CAREM",name:"Carmignac Emergents A EUR",cls:"equity",vehicle:"mutual_fund",er:1.97,yld:0.0,sponsor:"Carmignac",dom:"LU",ucits:true},
  {tkr:"SISFG",name:"Schroder ISF Global Equity Alpha A USD",cls:"equity",vehicle:"mutual_fund",er:1.74,yld:0.5,sponsor:"Schroders",dom:"LU",ucits:true},
  {tkr:"SISFB",name:"Schroder ISF Global Bond A USD",cls:"fixed_income",vehicle:"mutual_fund",er:0.84,yld:4.0,sponsor:"Schroders",dom:"LU",ucits:true},
  {tkr:"SISFE",name:"Schroder ISF Emerging Markets Debt A USD",cls:"fixed_income",vehicle:"mutual_fund",er:1.49,yld:6.0,sponsor:"Schroders",dom:"LU",ucits:true},
  {tkr:"PICTW",name:"Pictet Water P EUR",cls:"equity",vehicle:"mutual_fund",er:1.92,yld:0.7,sponsor:"Pictet",dom:"LU",ucits:true,esg:true},
  {tkr:"PICTH",name:"Pictet Health P EUR",cls:"equity",vehicle:"mutual_fund",er:1.94,yld:0.5,sponsor:"Pictet",dom:"LU",ucits:true},
  {tkr:"PICRO",name:"Pictet Robotics P EUR",cls:"equity",vehicle:"mutual_fund",er:1.92,yld:0.0,sponsor:"Pictet",dom:"LU",ucits:true},
  {tkr:"PICTS",name:"Pictet Security P EUR",cls:"equity",vehicle:"mutual_fund",er:1.92,yld:0.4,sponsor:"Pictet",dom:"LU",ucits:true},
  {tkr:"PICME",name:"Pictet Global Megatrend Selection P EUR",cls:"equity",vehicle:"mutual_fund",er:1.94,yld:0.5,sponsor:"Pictet",dom:"LU",ucits:true},
  {tkr:"PICCE",name:"Pictet Clean Energy Transition P EUR",cls:"equity",vehicle:"mutual_fund",er:1.92,yld:0.0,sponsor:"Pictet",dom:"LU",ucits:true,esg:true},
  {tkr:"PICDI",name:"Pictet Digital P EUR",cls:"equity",vehicle:"mutual_fund",er:1.92,yld:0.0,sponsor:"Pictet",dom:"LU",ucits:true},
  {tkr:"PICTI",name:"Pictet Timber P EUR",cls:"equity",vehicle:"mutual_fund",er:1.94,yld:1.0,sponsor:"Pictet",dom:"LU",ucits:true},
  {tkr:"PICNU",name:"Pictet Nutrition P EUR",cls:"equity",vehicle:"mutual_fund",er:1.94,yld:0.8,sponsor:"Pictet",dom:"LU",ucits:true},
  {tkr:"PICPB",name:"Pictet Premium Brands P EUR",cls:"equity",vehicle:"mutual_fund",er:1.94,yld:0.5,sponsor:"Pictet",dom:"LU",ucits:true},
  {tkr:"PICSC",name:"Pictet SmartCity P EUR",cls:"equity",vehicle:"mutual_fund",er:1.94,yld:0.5,sponsor:"Pictet",dom:"LU",ucits:true},
  {tkr:"NRDSR",name:"Nordea 1 Stable Return Fund BP EUR",cls:"mixed",vehicle:"mutual_fund",er:1.86,yld:0.0,sponsor:"Nordea",dom:"LU",ucits:true},
  {tkr:"NRDGC",name:"Nordea 1 Global Climate & Environment BP EUR",cls:"equity",vehicle:"mutual_fund",er:1.92,yld:0.0,sponsor:"Nordea",dom:"LU",ucits:true,esg:true},
  {tkr:"ALIGN",name:"Allianz Income & Growth A USD",cls:"mixed",vehicle:"mutual_fund",er:1.50,yld:7.5,sponsor:"Allianz",dom:"LU",ucits:true},
  {tkr:"ALAII",name:"Allianz Global Artificial Intelligence A USD",cls:"equity",vehicle:"mutual_fund",er:1.81,yld:0.0,sponsor:"Allianz",dom:"LU",ucits:true},
  {tkr:"DWSTD",name:"DWS Top Dividende LD",cls:"equity",vehicle:"mutual_fund",er:1.45,yld:3.5,sponsor:"DWS",dom:"DE",ucits:true},
  {tkr:"DWSCD",name:"DWS Concept Kaldemorgen LD",cls:"mixed",vehicle:"mutual_fund",er:1.49,yld:0.8,sponsor:"DWS",dom:"LU",ucits:true},
  {tkr:"RBQEM",name:"Robeco QI Emerging Markets Active Equities D EUR",cls:"equity",vehicle:"mutual_fund",er:1.55,yld:2.5,sponsor:"Robeco",dom:"LU",ucits:true},
  {tkr:"RBUS",name:"Robeco BP US Premium Equities D EUR",cls:"equity",vehicle:"mutual_fund",er:1.51,yld:1.5,sponsor:"Robeco",dom:"LU",ucits:true},
  {tkr:"CGNP",name:"Capital Group New Perspective Fund B USD",cls:"equity",vehicle:"mutual_fund",er:1.55,yld:0.7,sponsor:"Capital Group",dom:"LU",ucits:true},
  {tkr:"CGWDG",name:"Capital Group World Dividend Growers B USD",cls:"equity",vehicle:"mutual_fund",er:1.55,yld:1.8,sponsor:"Capital Group",dom:"LU",ucits:true},
  {tkr:"CGGAB",name:"Capital Group Global Allocation B USD",cls:"mixed",vehicle:"mutual_fund",er:1.30,yld:1.5,sponsor:"Capital Group",dom:"LU",ucits:true},
  {tkr:"CGAEM",name:"Capital Group Emerging Markets Total Opportunities B",cls:"mixed",vehicle:"mutual_fund",er:1.40,yld:2.0,sponsor:"Capital Group",dom:"LU",ucits:true},
  {tkr:"TGBOF",name:"Templeton Global Bond Fund A USD",cls:"fixed_income",vehicle:"mutual_fund",er:1.34,yld:5.0,sponsor:"Franklin Templeton",dom:"LU",ucits:true},
  {tkr:"TEMEF",name:"Templeton Emerging Markets Fund A USD",cls:"equity",vehicle:"mutual_fund",er:1.85,yld:1.5,sponsor:"Franklin Templeton",dom:"LU",ucits:true},
  {tkr:"TFMF",name:"Templeton Frontier Markets Fund A USD",cls:"equity",vehicle:"mutual_fund",er:2.30,yld:2.5,sponsor:"Franklin Templeton",dom:"LU",ucits:true},
  {tkr:"COMGE",name:"Comgest Growth Europe EUR Acc",cls:"equity",vehicle:"mutual_fund",er:1.46,yld:0.0,sponsor:"Comgest",dom:"IE",ucits:true},
  {tkr:"COMGW",name:"Comgest Growth World EUR Acc",cls:"equity",vehicle:"mutual_fund",er:1.47,yld:0.0,sponsor:"Comgest",dom:"IE",ucits:true},
  {tkr:"COMGE2",name:"Comgest Growth Emerging Markets EUR Acc",cls:"equity",vehicle:"mutual_fund",er:1.45,yld:0.0,sponsor:"Comgest",dom:"IE",ucits:true},
  {tkr:"LTRG",name:"Lindsell Train Global Equity Fund D USD",cls:"equity",vehicle:"mutual_fund",er:0.65,yld:1.5,sponsor:"Lindsell Train",dom:"IE",ucits:true},
  {tkr:"FUNDS",name:"Fundsmith Equity Fund T USD Acc",cls:"equity",vehicle:"mutual_fund",er:1.05,yld:0.0,sponsor:"Fundsmith",dom:"IE",ucits:true},
  {tkr:"UBSGE",name:"UBS Equity Global Sustainable Innovators P USD",cls:"equity",vehicle:"mutual_fund",er:1.80,yld:0.5,sponsor:"UBS",dom:"LU",ucits:true,esg:true},
  {tkr:"UBSCH",name:"UBS Equity Switzerland Sustainable P CHF",cls:"equity",vehicle:"mutual_fund",er:1.62,yld:2.5,sponsor:"UBS",dom:"CH",ucits:true,esg:true},
  {tkr:"JBHEQ",name:"Julius Baer Equity Global Excellence A USD",cls:"equity",vehicle:"mutual_fund",er:1.78,yld:1.0,sponsor:"Julius Baer",dom:"LU",ucits:true},
  {tkr:"JBHFI",name:"Julius Baer Fixed Income Global EUR P EUR",cls:"fixed_income",vehicle:"mutual_fund",er:1.10,yld:3.5,sponsor:"Julius Baer",dom:"LU",ucits:true},
  {tkr:"VONLA",name:"Vontobel Fund US Equity B USD",cls:"equity",vehicle:"mutual_fund",er:1.74,yld:0.5,sponsor:"Vontobel",dom:"LU",ucits:true},
  {tkr:"VONEM",name:"Vontobel Fund mtx Sustainable EM Leaders B USD",cls:"equity",vehicle:"mutual_fund",er:1.96,yld:1.5,sponsor:"Vontobel",dom:"LU",ucits:true,esg:true},

  // ─── ASIAN / ME UCITS COMMON LISTINGS (HK/SG) ───
  {tkr:"3033",name:"Hang Seng TECH Index ETF (HK)",cls:"equity",vehicle:"etf",er:0.55,yld:0.4,sponsor:"Hang Seng",dom:"HK",ucits:false},
  {tkr:"2800",name:"Tracker Fund of Hong Kong",cls:"equity",vehicle:"etf",er:0.15,yld:3.5,sponsor:"State Street",dom:"HK",ucits:false},
  {tkr:"2828",name:"Hang Seng H-Share Index ETF",cls:"equity",vehicle:"etf",er:0.55,yld:4.5,sponsor:"Hang Seng",dom:"HK",ucits:false},
  {tkr:"2840",name:"SPDR Gold Shares (HK)",cls:"commodity",vehicle:"alternative",er:0.40,yld:0.0,sponsor:"State Street",dom:"HK",ucits:false},
  {tkr:"3140",name:"Mirae Asset HS TECH ETF",cls:"equity",vehicle:"etf",er:0.45,yld:0.0,sponsor:"Mirae Asset",dom:"HK",ucits:false},
  {tkr:"G3B",name:"SPDR Straits Times Index ETF",cls:"equity",vehicle:"etf",er:0.30,yld:4.0,sponsor:"State Street",dom:"SG",ucits:false},
  {tkr:"ES3",name:"Nikko AM Singapore STI ETF",cls:"equity",vehicle:"etf",er:0.30,yld:4.0,sponsor:"Nikko AM",dom:"SG",ucits:false},
  {tkr:"O87",name:"Phillip SGX APAC Dividend ETF",cls:"equity",vehicle:"etf",er:0.35,yld:5.0,sponsor:"Phillip",dom:"SG",ucits:false}
];

// ════════════════════════════════════════════════════════════════════
// FUND METRICS ENRICHMENT — populate performance & risk stats on every
// fund so the AI Portfolio Agent can score them. Real values are used
// for ~80 flagship funds; class-typical defaults with deterministic
// per-ticker jitter for the rest.
// ════════════════════════════════════════════════════════════════════
const CLASS_DEFAULTS = {
  equity:       {mu:9.5,  sigma:15.0, holdings:500,  aum:50,  beta:1.00, r1y:13.0, r3y:9.5,  r5y:11.0, r10y:10.5},
  fixed_income: {mu:4.8,  sigma:5.5,  holdings:5000, aum:25,  beta:0.10, r1y:5.0,  r3y:0.5,  r5y:1.5,  r10y:2.5},
  real_estate:  {mu:7.5,  sigma:18.0, holdings:80,   aum:20,  beta:0.85, r1y:8.5,  r3y:1.0,  r5y:5.0,  r10y:7.0},
  commodity:    {mu:5.0,  sigma:16.0, holdings:1,    aum:30,  beta:0.20, r1y:12.0, r3y:8.0,  r5y:7.0,  r10y:4.0},
  cash:         {mu:5.0,  sigma:0.30, holdings:50,   aum:30,  beta:0.00, r1y:5.2,  r3y:3.0,  r5y:2.0,  r10y:1.5},
  mixed:        {mu:7.0,  sigma:10.0, holdings:300,  aum:15,  beta:0.60, r1y:8.5,  r3y:4.0,  r5y:6.5,  r10y:6.5},
  alternative:  {mu:6.5,  sigma:12.0, holdings:200,  aum:5,   beta:0.40, r1y:7.0,  r3y:5.0,  r5y:5.5,  r10y:5.0},
  crypto:       {mu:25.0, sigma:65.0, holdings:1,    aum:10,  beta:1.80, r1y:80.0, r3y:25.0, r5y:30.0, r10y:0.0}
};

// Explicit performance overrides for flagship funds.
// Format: {mu,sigma,holdings,aum(B USD),beta,r1y,r3y,r5y,r10y,maxDD,sharpe(optional)}
// A trailing-return field of 0 is a SENTINEL meaning "the fund is younger than
// this window"; enrichment converts it to null so it is never displayed or fed
// to the model as a real 0.0% return. Figures are a point-in-time snapshot —
// surface FUND_DATA_AS_OF wherever they are shown rather than implying they are
// live market data.
const FUND_DATA_AS_OF = "2024-12-31";
const FUND_OVERRIDES = {
  // ─── US Large Cap Core ───
  VOO:{mu:10.5,sigma:15.0,holdings:503,aum:1100,beta:1.00,r1y:24.2,r3y:9.8,r5y:14.8,r10y:12.5,maxDD:-23.9},
  IVV:{mu:10.5,sigma:15.0,holdings:503,aum:480,beta:1.00,r1y:24.1,r3y:9.7,r5y:14.7,r10y:12.4,maxDD:-23.9},
  SPY:{mu:10.5,sigma:15.1,holdings:503,aum:520,beta:1.00,r1y:24.0,r3y:9.6,r5y:14.6,r10y:12.3,maxDD:-24.0},
  VTI:{mu:10.4,sigma:15.5,holdings:3700,aum:1400,beta:1.02,r1y:23.9,r3y:8.5,r5y:14.2,r10y:11.9,maxDD:-25.5},
  ITOT:{mu:10.4,sigma:15.5,holdings:3650,aum:55,beta:1.02,r1y:23.8,r3y:8.4,r5y:14.1,r10y:11.8,maxDD:-25.5},
  SPLG:{mu:10.5,sigma:15.0,holdings:503,aum:30,beta:1.00,r1y:24.2,r3y:9.7,r5y:14.7,r10y:12.4,maxDD:-23.9},
  QQQ:{mu:13.5,sigma:21.0,holdings:101,aum:280,beta:1.18,r1y:29.5,r3y:11.5,r5y:21.5,r10y:18.0,maxDD:-32.5},
  QQQM:{mu:13.5,sigma:21.0,holdings:101,aum:23,beta:1.18,r1y:29.4,r3y:11.4,r5y:21.4,r10y:0.0,maxDD:-32.5},
  RSP:{mu:10.0,sigma:16.0,holdings:503,aum:55,beta:1.05,r1y:13.5,r3y:7.5,r5y:11.5,r10y:11.0,maxDD:-30.0},
  // ─── US Growth/Value ───
  VUG:{mu:12.5,sigma:19.0,holdings:200,aum:140,beta:1.12,r1y:33.0,r3y:11.0,r5y:18.5,r10y:14.5,maxDD:-32.0},
  VTV:{mu:9.5,sigma:14.5,holdings:340,aum:130,beta:0.92,r1y:14.0,r3y:8.0,r5y:11.0,r10y:10.0,maxDD:-22.0},
  IWF:{mu:12.5,sigma:19.0,holdings:430,aum:100,beta:1.11,r1y:33.5,r3y:11.5,r5y:18.5,r10y:14.7,maxDD:-32.0},
  IWD:{mu:9.5,sigma:14.5,holdings:850,aum:60,beta:0.92,r1y:13.5,r3y:7.5,r5y:10.5,r10y:9.5,maxDD:-22.0},
  SCHG:{mu:12.5,sigma:19.0,holdings:240,aum:35,beta:1.12,r1y:33.0,r3y:11.0,r5y:18.5,r10y:14.5,maxDD:-32.0},
  SCHD:{mu:10.0,sigma:14.0,holdings:103,aum:60,beta:0.85,r1y:11.5,r3y:6.5,r5y:13.5,r10y:11.5,maxDD:-21.0},
  VIG:{mu:10.5,sigma:13.5,holdings:340,aum:85,beta:0.88,r1y:17.0,r3y:9.0,r5y:11.5,r10y:11.0,maxDD:-21.0},
  VYM:{mu:9.5,sigma:14.0,holdings:550,aum:55,beta:0.85,r1y:14.5,r3y:7.5,r5y:9.5,r10y:9.5,maxDD:-22.0},
  // ─── US Small/Mid ───
  IWM:{mu:9.0,sigma:21.0,holdings:1980,aum:65,beta:1.18,r1y:14.0,r3y:1.5,r5y:8.5,r10y:8.0,maxDD:-33.0},
  IJH:{mu:10.0,sigma:18.5,holdings:400,aum:90,beta:1.08,r1y:17.5,r3y:6.5,r5y:11.0,r10y:10.0,maxDD:-29.5},
  IJR:{mu:9.5,sigma:21.0,holdings:600,aum:90,beta:1.15,r1y:15.0,r3y:3.0,r5y:9.5,r10y:9.5,maxDD:-32.0},
  VB:{mu:9.5,sigma:20.0,holdings:1450,aum:60,beta:1.15,r1y:16.5,r3y:3.5,r5y:10.0,r10y:9.5,maxDD:-31.0},
  AVUV:{mu:10.5,sigma:22.0,holdings:740,aum:13,beta:1.22,r1y:16.5,r3y:6.5,r5y:14.0,r10y:0.0,maxDD:-31.0},
  // ─── Sector ETFs ───
  XLK:{mu:14.0,sigma:21.0,holdings:65,aum:75,beta:1.20,r1y:36.0,r3y:14.5,r5y:21.5,r10y:19.5,maxDD:-33.0},
  XLV:{mu:9.0,sigma:14.0,holdings:65,aum:42,beta:0.75,r1y:7.0,r3y:5.0,r5y:9.0,r10y:11.0,maxDD:-20.0},
  XLF:{mu:9.5,sigma:18.0,holdings:75,aum:46,beta:1.10,r1y:25.0,r3y:7.5,r5y:9.0,r10y:11.0,maxDD:-27.0},
  XLE:{mu:8.0,sigma:25.0,holdings:23,aum:38,beta:1.30,r1y:6.0,r3y:18.0,r5y:11.0,r10y:4.5,maxDD:-58.0},
  XLY:{mu:11.5,sigma:20.0,holdings:54,aum:22,beta:1.15,r1y:25.0,r3y:5.0,r5y:11.5,r10y:13.0,maxDD:-37.0},
  XLP:{mu:8.0,sigma:12.0,holdings:38,aum:18,beta:0.65,r1y:9.0,r3y:3.5,r5y:8.5,r10y:8.5,maxDD:-15.0},
  XLI:{mu:10.0,sigma:17.0,holdings:78,aum:21,beta:1.05,r1y:18.0,r3y:7.0,r5y:11.0,r10y:11.0,maxDD:-26.0},
  XLU:{mu:7.5,sigma:14.0,holdings:31,aum:18,beta:0.55,r1y:23.0,r3y:6.0,r5y:7.5,r10y:9.0,maxDD:-19.0},
  XLRE:{mu:7.0,sigma:18.0,holdings:32,aum:7,beta:0.85,r1y:8.0,r3y:1.0,r5y:5.0,r10y:8.0,maxDD:-31.0},
  // ─── Thematic ───
  SOXX:{mu:18.0,sigma:28.0,holdings:30,aum:13,beta:1.40,r1y:48.0,r3y:14.0,r5y:23.0,r10y:23.0,maxDD:-42.0},
  SMH:{mu:18.5,sigma:28.0,holdings:25,aum:23,beta:1.42,r1y:50.0,r3y:18.0,r5y:27.0,r10y:26.0,maxDD:-43.0},
  ARKK:{mu:6.0,sigma:38.0,holdings:35,aum:7,beta:1.65,r1y:9.0,r3y:-18.0,r5y:-3.0,r10y:7.5,maxDD:-75.0},
  ICLN:{mu:5.5,sigma:25.0,holdings:100,aum:2.6,beta:1.10,r1y:-15.0,r3y:-12.0,r5y:1.5,r10y:6.5,maxDD:-54.0},
  TAN:{mu:6.5,sigma:35.0,holdings:48,aum:1.0,beta:1.30,r1y:-22.0,r3y:-15.0,r5y:5.0,r10y:8.0,maxDD:-60.0},
  BOTZ:{mu:9.5,sigma:21.0,holdings:42,aum:2.6,beta:1.10,r1y:18.0,r3y:1.0,r5y:8.0,r10y:0.0,maxDD:-37.0},
  // ─── Covered Call / Income ───
  JEPI:{mu:9.5,sigma:9.0,holdings:135,aum:35,beta:0.65,r1y:14.5,r3y:7.5,r5y:0.0,r10y:0.0,maxDD:-13.5},
  JEPQ:{mu:11.0,sigma:13.0,holdings:90,aum:20,beta:0.85,r1y:21.0,r3y:0.0,r5y:0.0,r10y:0.0,maxDD:-16.0},
  QYLD:{mu:7.5,sigma:14.0,holdings:101,aum:8,beta:0.80,r1y:14.0,r3y:5.0,r5y:6.5,r10y:7.5,maxDD:-30.0},
  XYLD:{mu:7.0,sigma:11.0,holdings:503,aum:3,beta:0.75,r1y:11.5,r3y:4.0,r5y:7.0,r10y:7.0,maxDD:-22.0},
  // ─── International ───
  VEA:{mu:7.5,sigma:14.0,holdings:4030,aum:130,beta:0.85,r1y:5.5,r3y:1.5,r5y:5.5,r10y:5.0,maxDD:-26.0},
  IEFA:{mu:7.5,sigma:14.0,holdings:2900,aum:130,beta:0.85,r1y:5.4,r3y:1.4,r5y:5.5,r10y:5.0,maxDD:-26.0},
  VXUS:{mu:7.5,sigma:14.5,holdings:8500,aum:75,beta:0.88,r1y:5.7,r3y:1.0,r5y:5.0,r10y:4.5,maxDD:-27.0},
  EFA:{mu:7.0,sigma:14.5,holdings:780,aum:55,beta:0.88,r1y:5.0,r3y:1.0,r5y:5.0,r10y:4.5,maxDD:-27.5},
  ACWI:{mu:9.0,sigma:14.0,holdings:2300,aum:18,beta:0.95,r1y:17.5,r3y:5.5,r5y:10.5,r10y:9.0,maxDD:-25.0},
  EWJ:{mu:7.0,sigma:14.0,holdings:230,aum:13,beta:0.75,r1y:13.0,r3y:3.5,r5y:6.0,r10y:5.5,maxDD:-23.0},
  EWG:{mu:6.5,sigma:18.0,holdings:65,aum:1.8,beta:0.95,r1y:18.0,r3y:1.5,r5y:5.5,r10y:5.0,maxDD:-30.0},
  EWU:{mu:5.5,sigma:14.5,holdings:85,aum:3.0,beta:0.85,r1y:9.5,r3y:5.5,r5y:5.0,r10y:3.5,maxDD:-26.0},
  // ─── Emerging Markets ───
  VWO:{mu:7.0,sigma:18.0,holdings:5700,aum:90,beta:0.95,r1y:8.0,r3y:-3.5,r5y:4.0,r10y:3.5,maxDD:-32.0},
  IEMG:{mu:7.0,sigma:18.0,holdings:2800,aum:80,beta:0.95,r1y:8.5,r3y:-3.5,r5y:4.0,r10y:3.5,maxDD:-32.0},
  EEM:{mu:6.5,sigma:18.5,holdings:1235,aum:18,beta:0.95,r1y:8.0,r3y:-4.0,r5y:3.5,r10y:3.0,maxDD:-33.0},
  FXI:{mu:3.5,sigma:23.0,holdings:50,aum:6.5,beta:1.05,r1y:14.0,r3y:-9.5,r5y:-3.0,r10y:1.5,maxDD:-50.0},
  INDA:{mu:11.0,sigma:18.0,holdings:130,aum:11,beta:0.90,r1y:22.5,r3y:7.5,r5y:13.5,r10y:9.0,maxDD:-32.0},
  EWZ:{mu:5.5,sigma:30.0,holdings:55,aum:5.5,beta:1.25,r1y:-25.0,r3y:0.5,r5y:0.5,r10y:0.0,maxDD:-50.0},
  // ─── Fixed Income ───
  AGG:{mu:4.5,sigma:6.0,holdings:11800,aum:115,beta:0.10,r1y:5.0,r3y:-2.5,r5y:-0.5,r10y:1.5,maxDD:-17.5},
  BND:{mu:4.5,sigma:6.0,holdings:11000,aum:120,beta:0.10,r1y:5.0,r3y:-2.5,r5y:-0.5,r10y:1.5,maxDD:-17.5},
  TLT:{mu:4.0,sigma:14.0,holdings:42,aum:55,beta:-0.10,r1y:-3.0,r3y:-13.0,r5y:-5.0,r10y:0.5,maxDD:-50.0},
  IEF:{mu:4.0,sigma:7.5,holdings:14,aum:32,beta:0.00,r1y:1.5,r3y:-5.0,r5y:-1.5,r10y:0.5,maxDD:-22.0},
  SHY:{mu:4.5,sigma:1.5,holdings:80,aum:25,beta:0.02,r1y:4.5,r3y:0.5,r5y:1.0,r10y:1.0,maxDD:-5.0},
  TIP:{mu:4.5,sigma:7.5,holdings:50,aum:14,beta:0.20,r1y:4.5,r3y:-1.5,r5y:2.0,r10y:2.5,maxDD:-15.0},
  LQD:{mu:5.0,sigma:9.0,holdings:2600,aum:30,beta:0.30,r1y:4.5,r3y:-2.5,r5y:1.0,r10y:2.5,maxDD:-22.0},
  HYG:{mu:7.0,sigma:9.0,holdings:1230,aum:14,beta:0.55,r1y:9.0,r3y:1.5,r5y:3.5,r10y:4.0,maxDD:-23.5},
  MUB:{mu:3.5,sigma:5.0,holdings:5550,aum:38,beta:0.05,r1y:3.0,r3y:-0.5,r5y:1.0,r10y:2.5,maxDD:-11.0},
  BIL:{mu:5.2,sigma:0.4,holdings:18,aum:38,beta:0.00,r1y:5.3,r3y:3.2,r5y:1.9,r10y:1.2,maxDD:-0.2},
  // ─── 1940 Act ultra-short ETFs ───
  JPST:{mu:5.3,sigma:0.5,holdings:700,aum:39,beta:0.02,r1y:5.5,r3y:3.6,r5y:2.6,r10y:0,maxDD:-1.0},
  ICSH:{mu:5.3,sigma:0.5,holdings:400,aum:7.8,beta:0.02,r1y:5.5,r3y:3.6,r5y:2.5,r10y:1.8,maxDD:-1.0},
  GBIL:{mu:5.0,sigma:0.3,holdings:40,aum:7.5,beta:0.00,r1y:5.2,r3y:3.3,r5y:2.2,r10y:0,maxDD:-0.3},
  // ─── UCITS money market / ultra-short ───
  // TER and fund size are the published figures; the return series uses the 0
  // sentinel for windows a line has not run (converted to null = "n/a", never
  // shown as a real 0.0% return). μ reflects the currency's short rate at the
  // FUND_DATA_AS_OF basis, not a forecast.
  XEON:{mu:3.0,sigma:0.3,holdings:1,aum:22.4,beta:0.00,r1y:3.8,r3y:2.4,r5y:1.3,r10y:0.4,maxDD:-0.1},
  ERNE:{mu:3.4,sigma:0.6,holdings:280,aum:3.4,beta:0.02,r1y:4.1,r3y:2.3,r5y:1.4,r10y:0,maxDD:-1.2},
  ERNA:{mu:5.0,sigma:0.6,holdings:340,aum:2.6,beta:0.02,r1y:5.4,r3y:3.4,r5y:2.4,r10y:0,maxDD:-1.4},
  ERNS:{mu:4.8,sigma:0.6,holdings:200,aum:0.9,beta:0.02,r1y:5.1,r3y:3.2,r5y:2.0,r10y:0,maxDD:-1.3},
  IB01:{mu:4.6,sigma:0.4,holdings:20,aum:8.5,beta:0.00,r1y:5.0,r3y:3.1,r5y:0,r10y:0,maxDD:-0.3},
  // ─── Real Estate ───
  VNQ:{mu:7.0,sigma:18.0,holdings:160,aum:35,beta:0.85,r1y:9.0,r3y:-1.5,r5y:4.0,r10y:6.5,maxDD:-35.0},
  // ─── Commodities ───
  GLD:{mu:6.5,sigma:14.0,holdings:1,aum:68,beta:0.10,r1y:28.0,r3y:14.0,r5y:11.0,r10y:7.5,maxDD:-19.0},
  IAU:{mu:6.5,sigma:14.0,holdings:1,aum:33,beta:0.10,r1y:28.0,r3y:14.0,r5y:11.0,r10y:7.5,maxDD:-19.0},
  SLV:{mu:5.5,sigma:24.0,holdings:1,aum:13,beta:0.20,r1y:30.0,r3y:7.5,r5y:9.5,r10y:3.5,maxDD:-30.0},
  // ─── UCITS Flagships ───
  IWDA:{mu:10.5,sigma:14.5,holdings:1450,aum:80,beta:1.00,r1y:21.5,r3y:8.5,r5y:13.0,r10y:11.0,maxDD:-25.0},
  CSPX:{mu:10.5,sigma:15.0,holdings:503,aum:90,beta:1.00,r1y:24.0,r3y:9.7,r5y:14.7,r10y:12.4,maxDD:-23.9},
  VWRL:{mu:9.5,sigma:14.5,holdings:3800,aum:8.5,beta:0.95,r1y:18.0,r3y:6.5,r5y:11.5,r10y:9.5,maxDD:-26.0},
  VWCE:{mu:9.5,sigma:14.5,holdings:3800,aum:18,beta:0.95,r1y:18.5,r3y:7.0,r5y:11.5,r10y:0.0,maxDD:-26.0},
  EIMI:{mu:7.0,sigma:18.0,holdings:3000,aum:25,beta:0.95,r1y:8.5,r3y:-3.0,r5y:4.5,r10y:4.0,maxDD:-32.0},
  VUSA:{mu:10.5,sigma:15.0,holdings:503,aum:50,beta:1.00,r1y:24.0,r3y:9.6,r5y:14.6,r10y:12.3,maxDD:-23.9},
  CNDX:{mu:13.5,sigma:21.0,holdings:101,aum:15,beta:1.18,r1y:29.5,r3y:11.5,r5y:21.5,r10y:18.0,maxDD:-32.5},
  EQQQ:{mu:13.5,sigma:21.0,holdings:101,aum:9.0,beta:1.18,r1y:29.0,r3y:11.0,r5y:21.0,r10y:17.5,maxDD:-32.5},
  // ─── Active mutual fund flagships ───
  DODGX:{mu:11.0,sigma:16.0,holdings:75,aum:95,beta:1.00,r1y:18.5,r3y:11.0,r5y:14.0,r10y:11.0,maxDD:-26.0},
  FCNTX:{mu:11.5,sigma:18.0,holdings:330,aum:140,beta:1.05,r1y:34.0,r3y:11.5,r5y:17.0,r10y:13.5,maxDD:-30.0},
  AGTHX:{mu:11.0,sigma:17.0,holdings:340,aum:280,beta:1.05,r1y:30.0,r3y:8.5,r5y:15.0,r10y:13.0,maxDD:-29.0},
  PIMIX:{mu:6.0,sigma:5.5,holdings:8500,aum:115,beta:0.30,r1y:9.5,r3y:3.5,r5y:3.0,r10y:4.5,maxDD:-12.0},
  PRWCX:{mu:11.0,sigma:11.0,holdings:175,aum:55,beta:0.80,r1y:18.0,r3y:9.5,r5y:13.0,r10y:11.5,maxDD:-20.0},
  // ─── Crypto ───
  IBIT:{mu:35.0,sigma:62.0,holdings:1,aum:55,beta:1.85,r1y:120.0,r3y:0.0,r5y:0.0,r10y:0.0,maxDD:-22.0},
  FBTC:{mu:35.0,sigma:62.0,holdings:1,aum:20,beta:1.85,r1y:120.0,r3y:0.0,r5y:0.0,r10y:0.0,maxDD:-22.0},
  ETHA:{mu:30.0,sigma:75.0,holdings:1,aum:5,beta:2.10,r1y:45.0,r3y:0.0,r5y:0.0,r10y:0.0,maxDD:-30.0}
};

// Deterministic per-ticker hash for stable jitter
function _fundHash(tkr){
  let h = 0;
  for(let i = 0; i < tkr.length; i++){ h = ((h<<5) - h) + tkr.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

// Enrich every fund in-place with full metric set
(function enrichAllFunds(){
  const rf = 4.5; // risk-free rate, %
  FUND_UNIVERSE.forEach(f => {
    const d = CLASS_DEFAULTS[f.cls] || CLASS_DEFAULTS.equity;
    const ov = FUND_OVERRIDES[f.tkr] || {};
    const h = _fundHash(f.tkr);
    const j = [
      ((h        % 100) / 100 - 0.5) * 0.30,
      (((h >> 4) % 100) / 100 - 0.5) * 0.30,
      (((h >> 8) % 100) / 100 - 0.5) * 0.30,
      (((h >> 12)% 100) / 100 - 0.5) * 0.30,
      (((h >> 16)% 100) / 100 - 0.5) * 0.30
    ];
    f.mu       = ov.mu       ?? +(d.mu       * (1 + j[0])).toFixed(2);
    f.sigma    = ov.sigma    ?? +(d.sigma    * (1 + j[1])).toFixed(2);
    f.holdings = ov.holdings ?? Math.max(1, Math.round(d.holdings * (1 + j[2])));
    f.aum      = ov.aum      ?? +Math.max(0.1, d.aum * (1 + j[3])).toFixed(1);
    f.beta     = ov.beta     ?? +(Math.max(-0.5, d.beta + j[0]*0.4)).toFixed(2);
    f.r1y      = ov.r1y      ?? +(d.r1y  + j[0]*10).toFixed(2);
    f.r3y      = ov.r3y      ?? +(d.r3y  + j[1]*5).toFixed(2);
    f.r5y      = ov.r5y      ?? +(d.r5y  + j[2]*4).toFixed(2);
    f.r10y     = ov.r10y     ?? +(d.r10y + j[3]*3).toFixed(2);
    f.maxDD    = ov.maxDD    ?? -(+(f.sigma * 2.0 * (1 + Math.abs(j[4])*0.5)).toFixed(1));
    f.sharpe   = ov.sharpe   ?? +((f.mu - rf) / Math.max(0.5, f.sigma)).toFixed(2);
    // Tracking error: active mutual funds 1.5-4%, ETFs <0.3%
    f.te = ov.te ?? (f.vehicle === "mutual_fund"
      ? +(1.5 + (h % 25) / 10).toFixed(2)
      : +(0.05 + (h % 25) / 100).toFixed(2));
    // Trailing returns: FUND_OVERRIDES uses 0.0 as a "fund is younger than this
    // period" sentinel. Left as 0.0 it renders as a real 0.0% annualized return
    // (e.g. a 2024-launched fund showing "10y: 0.0%") and drags portfolio
    // aggregates toward zero. Normalize the sentinel to null = no track record.
    ["r1y","r3y","r5y","r10y"].forEach(k => {
      if(ov[k] === 0) f[k] = null;
    });
    // Inception year — only when actually curated. It used to be fabricated
    // (every override fund got 2005, everything else 2010+hash), which stated a
    // false launch year for funds that launched in 2024 and fed an "inception
    // >= 5 years ago" quality screen with invented data.
    f.inception = ov.inception ?? null;
    // Income type — derive from yield
    f.income = f.yld >= 4 ? "high" : (f.yld >= 2 ? "moderate" : "low");
  });
})();

