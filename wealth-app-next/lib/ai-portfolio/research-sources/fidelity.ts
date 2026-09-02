import * as cheerio from "cheerio";

export type IncomingResearchItem = {
  provider: string;
  sourceId: string;
  title: string;
  summary: string;
  sourceUrl: string;
  publishedAt: string;
};

const FIDELITY_INSIGHTS_URL =
  "https://www.fidelity.com/viewpoints/market-and-economic-insights";

type FidelityArticleLink = {
  title: string;
  url: string;
};

export async function fetchFidelityResearch(): Promise<IncomingResearchItem[]> {
  // Fetch Fidelity's Market & Economic Insights hub.
  const response = await fetch(FIDELITY_INSIGHTS_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Could not fetch Fidelity research: ${response.status}`);
  }

  // Convert the HTTP response into raw HTML text.
  const html = await response.text();

  // Parse the HTML so we can search through its elements.
  const $ = cheerio.load(html);

  const links: FidelityArticleLink[] = [];

  // Look through every <a> link on the Fidelity page.
  $("a").each((_index, element) => {
    // Get the link destination.
    const href = $(element).attr("href");

    if (!href) {
      return;
    }

    // Keep links that look like Fidelity
    // market / investment research.
    const isResearchArticle =
      href.includes("/learning-center/trading-investing/") ||
      href.includes("/viewpoints/market-and-economic-insights/");

    if (!isResearchArticle) {
      return;
    }

    // Remove obvious educational,
    // navigation, or non-research pages.
    const excludedPaths = [
      "/investing-for-beginners",
      "/trading-for-beginners",
      "/finding-stocks-and-sector-ideas",
      "/technical-analysis/",
      "/fundamental-analysis/",
      "/investment-products/",
      "/events/",
      "/live-pi",
      "/weekly-market-update",
    ];

    // If the URL contains any excluded path,
    // skip this link.
    if (excludedPaths.some((path) => href.includes(path))) {
      return;
    }

    // Get the visible title of the link.
    const title = $(element).text().replace(/\s+/g, " ").trim();

    if (!title) {
      return;
    }

    // Fidelity often gives relative URLs such as:
    // /learning-center/trading-investing/qsiru
    //
    // Convert them into:
    // https://www.fidelity.com/learning-center/trading-investing/qsiru
    const url = new URL(href, "https://www.fidelity.com");

    // Remove query/tracking parameters.
    url.search = "";

    links.push({
      title,
      url: url.toString(),
    });
  });

  // The same article may appear more than once
  // on the Fidelity hub. Use the URL as the
  // unique key and keep only one copy.
  const uniqueLinks = Array.from(
    new Map(links.map((item) => [item.url, item])).values(),
  );

  console.log("Filtered Fidelity research links:", uniqueLinks);

  const selectedArticles = uniqueLinks
    .filter((item) => {
      const title = item.title.toLowerCase();

      return (
        title.includes("market") ||
        title.includes("stock") ||
        title.includes("bond") ||
        title.includes("technology") ||
        title.includes("earnings") ||
        title.includes("portfolio") ||
        title.includes("banks") ||
        title.includes("ai")
      );
    })
    .slice(0, 5);

  const researchItems = await Promise.all(
    selectedArticles.map((article) => fetchFidelityArticle(article)),
  );

  console.log(
    "Fetched Fidelity research items:",
    researchItems.map((item) => ({
      title: item.title,
      publishedAt: item.publishedAt,
    })),
  );

  return researchItems;
}

async function fetchFidelityArticle(
  article: FidelityArticleLink,
): Promise<IncomingResearchItem> {
  const response = await fetch(article.url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Could not fetch Fidelity article: ${response.status}`);
  }

  const html = await response.text();

  const $ = cheerio.load(html);

  // Get page text before removing elements,
  // because the publication date may appear outside
  // the main article container.
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();

  // Look for a visible date such as:
  // July 29, 2026
  const dateMatch = bodyText.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/,
  );

  const publishedAt = dateMatch
    ? new Date(dateMatch[0]).toISOString()
    : new Date().toISOString();

  // Remove obvious non-article content.
  $("script, style, nav, header, footer, noscript").remove();

  const title = $("h1").first().text().replace(/\s+/g, " ").trim();

  // Prefer the actual article/main section.
  const articleText =
    $("article").text().trim() ||
    $("main").text().trim() ||
    $(".article-content").text().trim() ||
    $(".content-body").text().trim();

  const cleanedText = articleText.replace(/\s+/g, " ").trim();

  console.log("Extracted Fidelity date:", publishedAt);

  return {
    provider: "fidelity",

    sourceId: new URL(article.url).pathname.replace(/^\/+/, ""),

    title: title || article.title,

    summary: cleanedText.slice(0, 3000),

    sourceUrl: article.url,

    publishedAt,
  };
}
