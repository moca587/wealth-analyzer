import * as cheerio from "cheerio";

export type IncomingResearchItem = {
  provider: string;
  sourceId: string;
  title: string;
  summary: string;
  sourceUrl: string;
  publishedAt: string;
};

const VANGUARD_INSIGHTS_URL =
  "https://investor.vanguard.com/resources-education/markets-economy";

type VanguardArticleLink = {
  title: string;
  url: string;
};

export async function fetchVanguardResearch(): Promise<IncomingResearchItem[]> {
  // Fetch Vanguard's Markets & Economy research hub.
  const response = await fetch(VANGUARD_INSIGHTS_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Could not fetch Vanguard research: ${response.status}`);
  }

  const html = await response.text();

  const $ = cheerio.load(html);

  console.log("Vanguard HTML length:", html.length);

  console.log("Vanguard page title:", $("title").text().trim());

  console.log(
    "Vanguard links:",
    $("a")
      .map((_index, element) => ({
        text: $(element).text().replace(/\s+/g, " ").trim(),
        href: $(element).attr("href"),
      }))
      .get()
      .filter((item) => item.href)
      .slice(0, 100),
  );

  const links: VanguardArticleLink[] = [];

  // Look through every link on the Vanguard research page.
  $("a").each((_index, element) => {
    const href = $(element).attr("href");

    if (!href) {
      return;
    }

    let url: URL;

    try {
      url = new URL(href, "https://investor.vanguard.com");
    } catch {
      return;
    }

    // Only keep Vanguard pages.
    if (url.hostname !== "investor.vanguard.com") {
      return;
    }

    const path = url.pathname.toLowerCase();

    // Vanguard research articles currently use
    // /investor-resources-education/article/
    // and /investor-resources-education/news/.
    const isResearchArticle =
      path.includes("/investor-resources-education/article/") ||
      path.includes("/investor-resources-education/news/");

    if (!isResearchArticle) {
      return;
    }

    // Skip obvious generic/navigation pages.
    const excludedPaths = [
      "/market-volatility",
      "/news-perspectives",
      "/wealth-management",
      "/personal-finance",
      "/retirement",
      "/taxes",
    ];

    if (excludedPaths.some((excluded) => path.includes(excluded))) {
      return;
    }

    const title = $(element).text().replace(/\s+/g, " ").trim();

    if (!title) {
      return;
    }

    // Remove tracking parameters and fragments.
    url.search = "";
    url.hash = "";

    links.push({
      title,
      url: url.toString(),
    });
  });

  // Deduplicate by URL.
  const uniqueLinks = Array.from(
    new Map(links.map((item) => [item.url, item])).values(),
  );

  console.log("Filtered Vanguard research links:", uniqueLinks);

  // Keep research that is useful for portfolio construction.
  const selectedArticles = uniqueLinks
    .filter((item) => {
      const title = item.title.toLowerCase();

      return (
        title.includes("market") ||
        title.includes("economic") ||
        title.includes("outlook") ||
        title.includes("equity") ||
        title.includes("stock") ||
        title.includes("bond") ||
        title.includes("fixed income") ||
        title.includes("inflation") ||
        title.includes("interest rate") ||
        title.includes("rates") ||
        title.includes("ai") ||
        title.includes("portfolio") ||
        title.includes("investing")
      );
    })
    .slice(0, 5);

  console.log("Selected Vanguard articles:", selectedArticles);

  // Fetch each selected Vanguard article.
  const results = await Promise.allSettled(
    selectedArticles.map((article) => fetchVanguardArticle(article)),
  );

  // Keep successful articles even if one fails.
  const researchItems = results.flatMap((result) => {
    if (result.status === "fulfilled") {
      return [result.value];
    }

    console.warn("Could not fetch one Vanguard article:", result.reason);

    return [];
  });

  console.log(
    "Fetched Vanguard research items:",
    researchItems.map((item) => ({
      title: item.title,
      publishedAt: item.publishedAt,
    })),
  );

  return researchItems;
}

async function fetchVanguardArticle(
  article: VanguardArticleLink,
): Promise<IncomingResearchItem> {
  const response = await fetch(article.url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Could not fetch Vanguard article: ${response.status}`);
  }

  const html = await response.text();

  const $ = cheerio.load(html);

  // Get the page text before removing elements so we can
  // search for Vanguard's visible publication date.
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();

  // Vanguard commonly displays dates like:
  // "Published March 03, 2026"
  // or:
  // "December 01, 2025"
  const dateMatch = bodyText.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/,
  );

  const publishedAt = dateMatch
    ? new Date(dateMatch[0]).toISOString()
    : new Date().toISOString();

  // Remove obvious page junk.
  $("script, style, nav, header, footer, noscript").remove();

  // Get the article title.
  const title = $("h1").first().text().replace(/\s+/g, " ").trim();

  // Prefer the article/main content instead of
  // grabbing the entire webpage.
  const articleText =
    $("article").text().trim() ||
    $("main").text().trim() ||
    $(".article-content").text().trim() ||
    $(".content-body").text().trim();

  const cleanedText = articleText.replace(/\s+/g, " ").trim();

  return {
    provider: "vanguard",

    sourceId: new URL(article.url).pathname.replace(/^\/+/, ""),

    title: title || article.title,

    // Same approach you're currently using for
    // your other providers.
    summary: cleanedText.slice(0, 3000),

    sourceUrl: article.url,

    publishedAt,
  };
}
