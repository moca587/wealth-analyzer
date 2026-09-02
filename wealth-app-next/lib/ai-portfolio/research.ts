import { FUND_UNIVERSE } from "@/lib/data/fund-universe";

// ============================================================
// TYPES
// ============================================================

export type ResearchItem = {
  title?: string;
  summary?: string;

  // Legacy marks duplicated shared baseline research
  // with shared=true.
  shared?: boolean;
};

// represents one institution and all the research items we have from it
export type ResearchProvider = {
  id: string;
  enabled?: boolean;
  items: ResearchItem[];
};

type Bucket = "classes" | "sectors" | "regions" | "themes" | "drivers";

type Stance = "overweight" | "neutral" | "underweight";

type SignalEntry = {
  votes: number;

  providers: string[];
  providersFor: string[];
  providersAgainst: string[];

  providerCount: number;
  forCount: number;
  againstCount: number;
  agreeCount: number;

  items: Array<{
    title: string;
    provider: string;
  }>;
};

export type PointEntry = {
  ow: number;
  neutral: number;
  uw: number;

  providers: string[];
  owProviders: string[];
  uwProviders: string[];

  providerCount: number;

  total: number;
  net: number;

  conviction: number;

  stance: Stance;
};

export type ResearchSignals = {
  classes: Record<string, SignalEntry>;

  sectors: Record<string, SignalEntry>;

  regions: Record<string, SignalEntry>;

  themes: Record<string, SignalEntry>;

  drivers: Record<string, SignalEntry>;

  tickers: Record<
    string,
    {
      count: number;
      providers: string[];
      providerCount: number;
    }
  >;

  points: Record<Bucket, Record<string, PointEntry>>;

  totalItems: number;

  scoredItems: number;

  sharedDuplicatesSkipped: number;

  providerCount: number;

  providers: string[];
};

// ============================================================
// SENTIMENT WORDS
// ============================================================

const POSITIVE_WORDS: Record<string, number> = {
  overweight: 3,
  overweigh: 3,

  "long position": 2,
  "net long": 3,

  bullish: 3,

  favor: 2,
  prefer: 2,

  outperform: 2,
  buy: 2,

  attractive: 2,
  compelling: 2,

  upside: 2,
  tailwind: 2,

  constructive: 2,

  "high conviction": 3,

  "structural growth": 3,

  "tactical overweight": 3,
  "strategic overweight": 3,

  "best ideas": 2,
  "top pick": 3,

  recommend: 2,
  accumulate: 2,
  add: 1,

  supportive: 2,
  accommodative: 2,
  dovish: 2,

  "de-escalation": 2,
  "soft landing": 2,

  resilient: 2,
  recovery: 2,
  disinflation: 2,
};

const NEGATIVE_WORDS: Record<string, number> = {
  underweight: 3,
  underweigh: 3,

  "short position": 2,
  "net short": 3,

  bearish: 3,

  avoid: 2,
  cautious: 2,

  underperform: 2,
  sell: 2,

  expensive: 1,
  stretched: 2,

  headwind: 2,
  downside: 2,
  negative: 1,

  "high conviction underweight": 4,

  "tactical underweight": 3,
  "structural underweight": 3,

  underperforming: 2,

  reduce: 1,
  trim: 1,
  exit: 2,

  restrictive: 2,
  hawkish: 2,

  escalation: 2,

  recession: 3,
  stagflation: 3,
  "hard landing": 3,

  deterioration: 2,
  fragile: 2,

  "elevated risk": 2,

  widening: 1,
};

// ============================================================
// ASSET-CLASS KEYWORDS
// ============================================================

const CLASS_KEYWORDS: Record<string, string[]> = {
  equity: [
    "equit",
    "stocks",
    "stock market",

    "S&P",
    "S&P 500",
    "SPY",

    "russell",

    "Magnificent 7",

    "large-cap",
    "small-cap",
    "mid-cap",

    "value stocks",
    "growth stocks",

    "dividend grow",
    "dividend payer",
  ],

  fixed_income: [
    "bond",
    "treasur",

    "credit",

    "yield",
    "duration",

    "IG corporate",

    "HY",
    "high yield",

    "muni",
    "municipal",

    "fixed income",

    "corporate bond",
    "sovereign bond",

    "convertible",

    "preferred",
  ],

  real_estate: [
    "REIT",
    "real estate",
    "property",

    "data center",

    "industrial property",
    "logistics",
  ],

  commodity: [
    "gold",
    "silver",

    "commodit",

    "oil",
    "copper",
    "uranium",
    "platinum",

    "precious metal",

    "CRB",
  ],

  cash: [
    "money market",
    "T-bill",
    "cash",

    "short duration treasury",

    "SGOV",
    "BIL",
  ],

  alternative: [
    "private equity",
    "private credit",

    "alternative",
    "hedge fund",

    "direct lending",

    "CTA",
    "trend follow",

    "BDC",

    "preferred stock",
  ],
};

// ============================================================
// REGION KEYWORDS
// ============================================================

const REGION_KEYWORDS: Record<string, string[]> = {
  us: ["US ", "U.S.", "United States", "America", "S&P", "Russell", "domestic"],

  europe: ["europe", "EU", "euro", "ECB", "EUR", "DAX", "CAC", "FTSE", "Stoxx"],

  japan: ["Japan", "Nikkei", "TOPIX", "JPY", "yen"],

  china: [
    "China",

    "Shanghai",
    "Shenzhen",
    "CSI",

    "CNY",
    "yuan",

    "Hong Kong",
    "HSI",
  ],

  india: ["India", "Sensex", "Nifty", "INR", "rupee"],

  emerging: [
    "emerging market",

    "EM ",
    "EM equit",
    "EM debt",
    "EM credit",

    "ASEAN",

    "LatAm",
    "Latin America",

    "Brazil",
    "Mexico",
  ],
};

// ============================================================
// THEME KEYWORDS
// ============================================================

const THEME_KEYWORDS: Record<string, string[]> = {
  ai: [
    "AI",
    "artificial intelligence",

    "generative AI",

    "ML",
    "machine learning",

    "LLM",

    "NVIDIA",
    "semiconductor",

    "data center",
  ],

  decarbonization: [
    "climate",
    "clean energy",
    "renewable",

    "ESG",
    "sustainab",
    "decarbon",

    "energy transition",
  ],

  healthcare_innovation: [
    "GLP-1",
    "longevity",

    "gene therapy",
    "biotech",

    "medical device",
    "mRNA",

    "obesity",
  ],

  defense: ["defense", "military", "aerospace", "LMT", "RTX", "NOC"],

  cybersecurity: ["cybersecurity", "cyber", "CRWD", "PANW", "ZS"],
};

// ============================================================
// SECTOR KEYWORDS
// ============================================================

const SECTOR_KEYWORDS: Record<string, string[]> = {
  technology: [
    "technology",
    "tech",
    "software",

    "semiconductor",

    "AI",
    "artificial intelligence",

    "NVDA",
    "MSFT",
    "GOOGL",
    "META",

    "TSM",

    "cybersecurity",

    "XLK",
    "QQQ",
  ],

  healthcare: [
    "health",
    "pharma",
    "biotech",

    "medical device",

    "GLP-1",
    "longevity",
    "gene therapy",

    "LLY",
    "NOVO",

    "XLV",
  ],

  financials: [
    "financial",
    "bank",
    "insurance",
    "fintech",

    "JPM",
    "BAC",

    "XLF",
  ],

  energy: ["energy", "oil", "gas", "E&P", "XOM", "CVX", "XLE"],

  industrials: [
    "industrial",

    "aerospace",
    "defense",

    "LMT",
    "RTX",
    "BA",
    "NOC",

    "reshoring",
  ],

  consumer_discretionary: [
    "consumer discretionary",
    "retail",
    "auto",

    "AMZN",
    "TSLA",
  ],

  consumer_staples: ["consumer staples", "staples", "KO", "PG", "XLP"],

  utilities: ["utilities", "power", "grid", "XLU"],

  real_estate_sector: ["REIT", "real estate", "SPG"],

  comm_services: ["communications", "comm services", "telco", "XLC"],

  materials: ["materials", "metals", "mining", "XLB"],
};

// ============================================================
// MACRO DRIVER KEYWORDS
// ============================================================

const DRIVER_KEYWORDS: Record<string, string[]> = {
  cycle: [
    "business cycle",

    "late cycle",
    "late-cycle",

    "early cycle",
    "early-cycle",

    "mid-cycle",

    "cycle turn",

    "expansion phase",

    "recovery",
    "slowdown",

    "soft landing",
    "hard landing",

    "recession",
    "downturn",
  ],

  rates: [
    "rates",
    "interest rate",
    "policy rate",
    "fed funds",

    "rate environment",
    "rate path",

    "yield curve",

    "rate cut",
    "rate hike",

    "duration",

    "terminal rate",

    "FOMC",
    "ECB",

    "real yield",

    "tightening",
    "easing",

    "hawkish",
    "dovish",

    "restrictive",
    "accommodative",
  ],

  inflation: [
    "inflation",
    "CPI",
    "PCE",

    "disinflation",
    "deflation",

    "price pressure",
    "wage growth",

    "stagflation",
  ],

  growth: [
    "GDP",

    "economic growth",

    "labor market",
    "payroll",

    "PMI",

    "consumer spending",

    "capex cycle",
  ],

  geopolitics: [
    "geopolit",

    "war",
    "conflict",

    "sanction",

    "tariff",

    "trade tension",
    "trade war",

    "political risk",

    "escalation",
    "de-escalation",

    "supply disruption",
  ],

  fx: [
    "dollar",
    "USD",

    "currency",
    "exchange rate",

    "euro",
    "yen",

    "FX",

    "dedollariz",

    "currency hedg",
  ],

  credit: [
    "credit spread",

    "default rate",

    "credit cycle",

    "leverage",

    "refinanc",

    "credit condition",

    "spreads remain tight",

    "spread widening",
  ],

  valuation: [
    "valuation",

    "multiple",

    "P/E",
    "price-to-earnings",

    "expensive",
    "cheap",

    "rich valuation",

    "discount to NAV",
  ],

  earnings: [
    "earnings",
    "EPS",

    "profit margin",

    "revenue growth",

    "guidance",

    "earnings breadth",

    "margin resilience",
  ],

  liquidity: [
    "liquidity",

    "fund flows",

    "positioning",

    "risk appetite",

    "volatility regime",
  ],

  policy: [
    "fiscal",
    "deficit",

    "government spending",

    "tax policy",

    "stimulus",

    "regulation",

    "monetary policy",

    "central bank",
  ],
};

// ============================================================
// KNOWN TICKERS
// ============================================================

const KNOWN_TICKERS = new Set([
  ...FUND_UNIVERSE.map((fund) => fund.tkr.toUpperCase()),

  "NVDA",
  "MSFT",

  "GOOGL",
  "GOOG",

  "META",
  "AAPL",
  "TSLA",
  "AMZN",

  "JPM",
  "BAC",

  "XOM",
  "CVX",

  "LLY",
  "NOVO",

  "LMT",
  "RTX",

  "CRWD",
  "PANW",
  "ZS",

  "UNH",
  "JNJ",

  "TSM",
  "ASML",
]);

// ============================================================
// REGEX HELPERS
// ============================================================

const regexCache = new Map<string, RegExp>();

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isAcronym(phrase: string) {
  return /^[A-Z][A-Z0-9&.\-]{0,5}$/.test(phrase.trim());
}

function phraseRegex(phrase: string, flags = "", allowTail = false) {
  const p = phrase.trim();

  const cacheKey = `${p}\0${flags}\0${allowTail ? 1 : 0}`;

  let regex = regexCache.get(cacheKey);

  if (!regex) {
    const lead = /^\w/.test(p) ? "\\b" : "";

    const tail = !/\w$/.test(p)
      ? ""
      : isAcronym(p)
        ? "(?:s)?\\b"
        : allowTail
          ? "\\w*"
          : "\\b";

    regex = new RegExp(
      lead + escapeRegex(p) + tail,

      (isAcronym(p) ? "" : "i") + flags,
    );

    regexCache.set(cacheKey, regex);
  }

  regex.lastIndex = 0;

  return regex;
}

// ============================================================
// SENTIMENT
// ============================================================

function scoreSentiment(text: string) {
  const entries: Array<{
    word: string;
    weight: number;
    sign: 1 | -1;
  }> = [];

  for (const [word, weight] of Object.entries(POSITIVE_WORDS)) {
    entries.push({
      word,
      weight,
      sign: 1,
    });
  }

  for (const [word, weight] of Object.entries(NEGATIVE_WORDS)) {
    entries.push({
      word,
      weight,
      sign: -1,
    });
  }

  // Longest phrase first so
  // "tactical overweight" does not also
  // count "overweight".
  entries.sort((a, b) => b.word.length - a.word.length);

  const taken: Array<[number, number]> = [];

  let score = 0;

  for (const entry of entries) {
    const regex = phraseRegex(entry.word, "g");

    let match: RegExpExecArray | null;

    let hit = false;

    while ((match = regex.exec(text)) !== null) {
      const start = match.index;

      const end = start + match[0].length;

      const overlaps = taken.some(([a, b]) => start < b && end > a);

      if (overlaps) {
        continue;
      }

      taken.push([start, end]);

      hit = true;
    }

    if (hit) {
      score += entry.sign * entry.weight;
    }
  }

  return score;
}

// ============================================================
// CLAUSE SPLITTING
// ============================================================

function splitClauses(text: string) {
  const placeholder = String.fromCharCode(1);

  const guarded = text
    .replace(/(\d)\.(\d)/g, `$1${placeholder}$2`)
    .replace(/\b([A-Za-z])\.(?=[A-Za-z]\.)/g, `$1${placeholder}`)
    .replace(/\b([A-Za-z])\.(?=\s|$)/g, `$1${placeholder}`);

  return guarded
    .split(/[;.]|\s+(?:but|while|whereas|although|though|versus|vs\.?)\s+/i)
    .map((part) => part.split(placeholder).join(".").trim())
    .filter(Boolean);
}

// ============================================================
// FALSE-POSITIVE SCRUBBING
// ============================================================

const TOPIC_EXCLUSIONS: Record<string, RegExp> = {
  cash: /\bcash[-\s]?flows?\b/gi,

  fixed_income:
    /\bdividend[-\s]yields?\b|\bearnings\syield\b|\bfree\scash\sflow\syield\b/gi,
};

function scrubTopic(text: string, key: string) {
  const exclusion = TOPIC_EXCLUSIONS[key];

  return exclusion ? text.replace(exclusion, " ") : text;
}

// ============================================================
// ANALYZE ONE RESEARCH ITEM
// ============================================================

function extractItemSignals(item: ResearchItem, providerName: string) {
  const rawText = `${item.title ?? ""} ${item.summary ?? ""}`;

  const itemSentiment = scoreSentiment(rawText);

  const clauses = splitClauses(rawText).map((text) => ({
    text,

    sentiment: scoreSentiment(text),
  }));

  const signals = {
    classes: {} as Record<string, number>,

    sectors: {} as Record<string, number>,

    regions: {} as Record<string, number>,

    themes: {} as Record<string, number>,

    drivers: {} as Record<string, number>,

    stances: {
      classes: {} as Record<string, number>,

      sectors: {} as Record<string, number>,

      regions: {} as Record<string, number>,

      themes: {} as Record<string, number>,

      drivers: {} as Record<string, number>,
    },

    tickers: [] as string[],

    sentiment: itemSentiment,

    providerName,

    item,
  };

  const toStance = (value: number) => (value > 0 ? 1 : value < 0 ? -1 : 0);

  function voteFor(phrases: string[], key: string) {
    let matched = false;

    let best: number | null = null;

    for (const clause of clauses) {
      const text = scrubTopic(clause.text, key);

      const found = phrases.some((phrase) =>
        phraseRegex(phrase, "", true).test(text),
      );

      if (!found) {
        continue;
      }

      matched = true;

      if (
        clause.sentiment !== 0 &&
        (best === null || Math.abs(clause.sentiment) > Math.abs(best))
      ) {
        best = clause.sentiment;
      }
    }

    if (!matched) {
      const whole = scrubTopic(rawText, key);

      matched = phrases.some((phrase) =>
        phraseRegex(phrase, "", true).test(whole),
      );
    }

    if (!matched) {
      return null;
    }

    return best !== null ? best : itemSentiment;
  }

  function detect(
    map: Record<string, string[]>,

    container: Record<string, number>,

    bucket: Bucket,
  ) {
    for (const [key, phrases] of Object.entries(map)) {
      const vote = voteFor(phrases, key);

      if (vote === null) {
        continue;
      }

      container[key] = (container[key] ?? 0) + vote;

      signals.stances[bucket][key] = toStance(vote);
    }
  }

  detect(CLASS_KEYWORDS, signals.classes, "classes");

  detect(SECTOR_KEYWORDS, signals.sectors, "sectors");

  detect(REGION_KEYWORDS, signals.regions, "regions");

  detect(DRIVER_KEYWORDS, signals.drivers, "drivers");

  detect(THEME_KEYWORDS, signals.themes, "themes");

  // Explicit ticker mentions.
  const matches = rawText.match(/\b[A-Z]{2,5}\b/g) ?? [];

  signals.tickers = matches.filter((ticker) => KNOWN_TICKERS.has(ticker));

  return signals;
}

// ============================================================
// AGGREGATE ALL PROVIDERS
// ============================================================

export function aggregateResearchSignals(
  providers: ResearchProvider[],
): ResearchSignals {
  const agg = {
    classes: {},
    sectors: {},
    regions: {},
    themes: {},
    drivers: {},

    tickers: {},

    points: {
      classes: {},
      sectors: {},
      regions: {},
      themes: {},
      drivers: {},
    },

    totalItems: 0,

    scoredItems: 0,

    sharedDuplicatesSkipped: 0,

    providerCount: 0,

    providers: [],
  } as ResearchSignals;

  function bump(
    container: Record<string, any>,

    key: string,

    vote: number,

    providerName: string,

    item: ResearchItem,
  ) {
    if (!container[key]) {
      container[key] = {
        votes: 0,

        providers: new Set<string>(),

        providersFor: new Set<string>(),

        providersAgainst: new Set<string>(),

        items: [],
      };
    }

    const entry = container[key];

    entry.votes += vote;

    entry.providers.add(providerName);

    if (vote > 0) {
      entry.providersFor.add(providerName);
    } else if (vote < 0) {
      entry.providersAgainst.add(providerName);
    }

    if (entry.items.length < 5) {
      entry.items.push({
        title: (item.title ?? "").slice(0, 120),

        provider: providerName,
      });
    }
  }

  function tally(
    bucket: Bucket,

    key: string,

    stance: number,

    providerName: string,
  ) {
    const bucketMap = agg.points[bucket] as Record<string, any>;

    if (!bucketMap[key]) {
      bucketMap[key] = {
        ow: 0,
        neutral: 0,
        uw: 0,

        providers: new Set<string>(),

        owProviders: new Set<string>(),

        uwProviders: new Set<string>(),
      };
    }

    const entry = bucketMap[key];

    if (stance > 0) {
      entry.ow++;

      entry.owProviders.add(providerName);
    } else if (stance < 0) {
      entry.uw++;

      entry.uwProviders.add(providerName);
    } else {
      entry.neutral++;
    }

    entry.providers.add(providerName);
  }

  // Legacy prevents the same shared research item
  // from manufacturing consensus across providers.
  const sharedSeen = new Set<string>();

  for (const provider of providers) {
    if (provider.enabled === false) {
      continue;
    }

    const items = provider.items ?? [];

    if (items.length === 0) {
      continue;
    }

    agg.providerCount++;

    agg.providers.push(provider.id);

    agg.totalItems += items.length;

    for (const item of items) {
      if (item.shared) {
        const key = (item.title ?? "").trim().toLowerCase();

        if (sharedSeen.has(key)) {
          agg.sharedDuplicatesSkipped++;

          continue;
        }

        sharedSeen.add(key);
      }

      agg.scoredItems++;

      const signals = extractItemSignals(item, provider.id);

      for (const [key, vote] of Object.entries(signals.classes)) {
        bump(agg.classes, key, vote, provider.id, item);
      }

      for (const [key, vote] of Object.entries(signals.sectors)) {
        bump(agg.sectors, key, vote, provider.id, item);
      }

      for (const [key, vote] of Object.entries(signals.regions)) {
        bump(agg.regions, key, vote, provider.id, item);
      }

      for (const [key, vote] of Object.entries(signals.themes)) {
        bump(agg.themes, key, vote, provider.id, item);
      }

      for (const [key, vote] of Object.entries(signals.drivers)) {
        bump(agg.drivers, key, vote, provider.id, item);
      }

      for (const [bucket, values] of Object.entries(signals.stances)) {
        for (const [key, stance] of Object.entries(values)) {
          tally(bucket as Bucket, key, stance, provider.id);
        }
      }

      for (const ticker of signals.tickers) {
        const existing = (agg.tickers as Record<string, any>)[ticker];

        if (!existing) {
          (agg.tickers as Record<string, any>)[ticker] = {
            count: 0,

            providers: new Set<string>(),
          };
        }

        const tickerEntry = (agg.tickers as Record<string, any>)[ticker];

        tickerEntry.count++;

        tickerEntry.providers.add(provider.id);
      }
    }
  }

  // ==========================================================
  // RESOLVE POINT SYSTEM INTO OW / NEUTRAL / UW
  // ==========================================================

  for (const bucket of Object.keys(agg.points) as Bucket[]) {
    const entries = agg.points[bucket] as Record<string, any>;

    for (const entry of Object.values(entries)) {
      entry.providers = Array.from(entry.providers);

      entry.owProviders = Array.from(entry.owProviders);

      entry.uwProviders = Array.from(entry.uwProviders);

      entry.providerCount = entry.providers.length;

      entry.total = entry.ow + entry.neutral + entry.uw;

      entry.net = entry.ow - entry.uw;

      const directional = entry.ow + entry.uw;

      entry.conviction = directional
        ? +(entry.net / directional).toFixed(2)
        : 0;

      if (entry.ow >= 3 && entry.net >= 3 && entry.conviction >= 0.5) {
        entry.stance = "overweight";
      } else if (entry.uw >= 3 && entry.net <= -3 && entry.conviction <= -0.5) {
        entry.stance = "underweight";
      } else {
        entry.stance = "neutral";
      }
    }
  }

  // ==========================================================
  // CONVERT SETS TO ARRAYS
  // ==========================================================

  function normalizeSignalBucket(bucket: Record<string, any>) {
    for (const entry of Object.values(bucket)) {
      entry.providers = Array.from(entry.providers);

      entry.providerCount = entry.providers.length;

      entry.providersFor = Array.from(entry.providersFor ?? []);

      entry.providersAgainst = Array.from(entry.providersAgainst ?? []);

      entry.forCount = entry.providersFor.length;

      entry.againstCount = entry.providersAgainst.length;

      entry.agreeCount =
        entry.votes > 0
          ? entry.forCount
          : entry.votes < 0
            ? entry.againstCount
            : 0;
    }
  }

  normalizeSignalBucket(agg.classes);

  normalizeSignalBucket(agg.sectors);

  normalizeSignalBucket(agg.regions);

  normalizeSignalBucket(agg.themes);

  normalizeSignalBucket(agg.drivers);

  for (const entry of Object.values(agg.tickers) as any[]) {
    entry.providers = Array.from(entry.providers);

    entry.providerCount = entry.providers.length;
  }

  return agg;
}

// ============================================================
// HELPERS USED BY generate-portfolio.ts
// ============================================================

export function stanceScore(
  signals: ResearchSignals,
  bucket: Bucket,
  key: string,
) {
  const entry = signals.points[bucket]?.[key];

  if (!entry) {
    return 0;
  }

  if (entry.stance === "overweight") {
    return entry.conviction;
  }

  if (entry.stance === "underweight") {
    return entry.conviction;
  }

  return 0;
}

export function getTopThemes(signals: ResearchSignals, limit = 3) {
  return Object.entries(signals.themes)
    .sort((a, b) => b[1].votes - a[1].votes)
    .filter(([, entry]) => entry.votes > 0)
    .slice(0, limit)
    .map(([theme]) => prettyTheme(theme));
}

export function prettyTheme(theme: string) {
  const labels: Record<string, string> = {
    ai: "Artificial Intelligence",

    decarbonization: "Decarbonization",

    healthcare_innovation: "Healthcare Innovation",

    defense: "Defense",

    cybersecurity: "Cybersecurity",
  };

  return labels[theme] ?? theme.replace(/_/g, " ");
}

// ============================================================
// FIGURE OUT WHICH RESEARCH BUCKETS A FUND BELONGS TO
// ============================================================

export function fundBucketKeys(fund: {
  tkr?: string;
  name?: string;

  region?: string;
}) {
  const hay = `${fund.name ?? ""} ${fund.tkr ?? ""}`.toLowerCase();

  const regionText = (fund.region ?? "").toLowerCase();

  const regions: string[] = [];

  const exUs =
    /\bex[\s-]?u\.?s\.?a?\b|\bex[\s-]?united\s+states\b|\bexcluding\s+the\s+u\.?s\.?a?\b/.test(
      hay,
    );

  const broaderScope =
    /\bglobal\b|\bworld\b|\bemerging\b|\binternational\b|\bacwi\b|\beafe\b|\basia\b|\beurope\b|\bjapan\b|\bchina\b|\bswiss\b|\bex[\s-]/.test(
      hay,
    );

  const usToken =
    /\bus\b|\bu\.s\.?|\busa\b|\bunited\s+states\b|total market|total stock|total bond|\b500\b|\brussell\b|\bnasdaq\b|\bwilshire\b|\bus domestic\b/.test(
      `${regionText} ${hay}`,
    );

  const usIndexFamily = /s&p|dow jones/.test(hay) && !broaderScope;

  if (!exUs && (usToken || usIndexFamily)) {
    regions.push("us");
  }

  if (
    /europe|eafe|developed international|ex-us/.test(`${regionText} ${hay}`)
  ) {
    regions.push("europe", "developed_intl");
  }

  if (/emerging|\bem\b/.test(`${regionText} ${hay}`)) {
    regions.push("emerging");
  }

  if (/japan/.test(hay)) {
    regions.push("japan");
  }

  if (/china/.test(hay)) {
    regions.push("china");
  }

  if (/india/.test(hay)) {
    regions.push("india");
  }

  const sectors: string[] = [];

  if (
    /\btech\b|\btechnology\b|semiconductor|software|\bxlk\b|qqq|nasdaq.?100|\bsoxx\b|\bsmh\b/.test(
      hay,
    )
  ) {
    sectors.push("technology");
  }

  if (/health|biotech|pharma|\bxlv\b/.test(hay)) {
    sectors.push("healthcare");
  }

  if (/financ|bank|\bxlf\b/.test(hay)) {
    sectors.push("financials");
  }

  if (/energy|\boil\b|\bxle\b/.test(hay)) {
    sectors.push("energy");
  }

  if (/industrial|aerospace|defen|\bxli\b/.test(hay)) {
    sectors.push("industrials");
  }

  if (/utilit|\bxlu\b/.test(hay)) {
    sectors.push("utilities");
  }

  if (/real estate|reit|\bxlre\b|\bschh\b/.test(hay)) {
    sectors.push("real_estate_sector");
  }

  if (/material|mining|\bxlb\b/.test(hay)) {
    sectors.push("materials");
  }

  if (/staple|\bxlp\b/.test(hay)) {
    sectors.push("consumer_staples");
  }

  if (/discretionary|\bxly\b/.test(hay)) {
    sectors.push("consumer_discretionary");
  }

  const themes: string[] = [];

  if (
    /\bai\b|artificial intelligence|semiconductor|robot|data cent|\bsoxx\b|\bsmh\b|\bbotz\b|\baiq\b/.test(
      hay,
    )
  ) {
    themes.push("ai");
  }

  if (/clean|solar|renewab|\besg\b|sustainab|\bicln\b|\btan\b/.test(hay)) {
    themes.push("decarbonization");
  }

  if (/cyber|\bcrwd\b|\bpanw\b|hack|\bbug\b/.test(hay)) {
    themes.push("cybersecurity");
  }

  if (/defen|aerospace|\bita\b|\bppa\b/.test(hay)) {
    themes.push("defense");
  }

  if (/dividend|\bvig\b|\bschd\b|\bvym\b/.test(hay)) {
    themes.push("dividend_growth");
  }

  if (/quality|\bqual\b/.test(hay)) {
    themes.push("quality_factor");
  }

  if (/bitcoin|crypto|\bibit\b|\bfbtc\b|\beth\b|ethereum/.test(hay)) {
    themes.push("cryptocurrency");
  }

  if (/water|infrastructure|\bpho\b|\bigf\b/.test(hay)) {
    themes.push("water_infrastructure");
  }

  return {
    regions,
    sectors,
    themes,
  };
}
