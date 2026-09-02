import * as cheerio from "cheerio";

export type IncomingResearchItem = {
  provider: string;
  sourceId: string;
  title: string;
  summary: string;
  sourceUrl: string;
  publishedAt: string;
};

const JPMORGAN_INSIGHTS_URL =
  "https://am.jpmorgan.com/us/en/asset-management/adv/insights/";

type JpmorganArticleLink = {
  title: string;
  url: string;
};

export async function fetchJpmorganResearch(): Promise<IncomingResearchItem[]> {
  const response = await fetch(JPMORGAN_INSIGHTS_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Could not fetch J.P. Morgan research: ${response.status}`);
  }

  const html = await response.text();

  const $ = cheerio.load(html);

  const links: JpmorganArticleLink[] = [];

  $("a").each((_index, element) => {
    const href = $(element).attr("href");

    if (!href) {
      return;
    }

    let url: URL;

    try {
      url = new URL(href, "https://am.jpmorgan.com");
    } catch {
      return;
    }

    if (url.hostname !== "am.jpmorgan.com") {
      return;
    }

    const path = url.pathname.toLowerCase();

    const isInsightsPage =
      path.includes("/insights/market-insights/") ||
      path.includes("/insights/portfolio-insights/");

    if (!isInsightsPage) {
      return;
    }

    const title = $(element).text().replace(/\s+/g, " ").trim();

    if (!title) {
      return;
    }

    url.search = "";
    url.hash = "";

    links.push({
      title,
      url: url.toString(),
    });
  });

  const uniqueLinks = Array.from(
    new Map(links.map((item) => [item.url, item])).values(),
  );

  console.log("Filtered J.P. Morgan research links:", uniqueLinks);

  const excludedTitles = [
    "market insights overview",
    "market updates",
    "portfolio insights overview",
    "equity",
    "fixed income",
    "alternatives",
    "taxes",
  ];

  const excludedPaths = [
    "/us/en/asset-management/adv/insights/market-insights/",
    "/us/en/asset-management/adv/insights/market-insights/market-updates/",
    "/us/en/asset-management/adv/insights/portfolio-insights/",
    "/us/en/asset-management/adv/insights/portfolio-insights/equity/",
    "/us/en/asset-management/adv/insights/portfolio-insights/fixed-income/",
    "/us/en/asset-management/adv/insights/portfolio-insights/alternatives/",
    "/us/en/asset-management/adv/insights/portfolio-insights/taxes/",
  ];

  const selectedArticles = uniqueLinks
    .filter((item) => {
      const title = item.title.toLowerCase();

      const path = new URL(item.url).pathname.toLowerCase();

      if (excludedTitles.includes(title)) {
        return false;
      }

      if (excludedPaths.includes(path)) {
        return false;
      }

      return (
        title.includes("weekly market recap") ||
        title.includes("on the minds of investors") ||
        title.includes("asset class views") ||
        title.includes("long-term capital market assumptions") ||
        title.includes("quarterly economic") ||
        title.includes("outlook") ||
        title.includes("asset allocation") ||
        title.includes("investment views") ||
        title.includes("market views") ||
        title.includes("research report")
      );
    })
    .slice(0, 5);

  console.log("Selected J.P. Morgan articles:", selectedArticles);

  const results = await Promise.allSettled(
    selectedArticles.map((article) => fetchJpmorganArticle(article)),
  );

  const researchItems = results.flatMap((result) => {
    if (result.status === "fulfilled") {
      return [result.value];
    }

    console.warn("Could not fetch one J.P. Morgan article:", result.reason);

    return [];
  });

  console.log(
    "Fetched J.P. Morgan research items:",
    researchItems.map((item) => ({
      title: item.title,
      publishedAt: item.publishedAt,
    })),
  );

  return researchItems;
}

async function fetchJpmorganArticle(
  article: JpmorganArticleLink,
): Promise<IncomingResearchItem> {
  const response = await fetch(article.url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Could not fetch J.P. Morgan article: ${response.status}`);
  }

  const html = await response.text();

  // DEBUG JPM ARTICLE HTML
  console.log("\nJPM DEBUG URL:", article.url);

  console.log("HTML length:", html.length);

  console.log(
    "Contains Weekly Market Recap:",
    html.includes("Weekly Market Recap"),
  );

  console.log("Contains __NEXT_DATA__:", html.includes("__NEXT_DATA__"));

  console.log(
    "Contains application/ld+json:",
    html.includes("application/ld+json"),
  );

  const $ = cheerio.load(html);

  console.log(
    "JSON-LD blocks:",
    $('script[type="application/ld+json"]').length,
  );

  $('script[type="application/ld+json"]').each((index, element) => {
    console.log(`JSON-LD ${index}:`, $(element).html()?.slice(0, 1000));
  });

  // Get visible page text before removing elements.
  const bodyTextBeforeCleaning = $("body").text().replace(/\s+/g, " ").trim();

  // Look for a publication date.
  const longDateMatch = bodyTextBeforeCleaning.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}\b/,
  );

  const slashDateMatch = bodyTextBeforeCleaning.match(
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/,
  );

  let publishedAt: string | null = null;

  if (longDateMatch) {
    const parsedDate = new Date(longDateMatch[0]);

    if (!Number.isNaN(parsedDate.getTime())) {
      publishedAt = parsedDate.toISOString();
    }
  }

  if (!publishedAt && slashDateMatch) {
    const [month, day, year] = slashDateMatch[0].split("/");

    const parsedDate = new Date(
      `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00Z`,
    );

    if (!Number.isNaN(parsedDate.getTime())) {
      publishedAt = parsedDate.toISOString();
    }
  }

  // Remove obvious junk before extracting content.
  $("script, style, nav, header, footer, noscript, svg").remove();

  const title = $("h1").first().text().replace(/\s+/g, " ").trim();

  // Try specific article containers first,
  // then fall back to the cleaned body.
  const articleText =
    $("article").text().trim() ||
    $("main").text().trim() ||
    $(".article-content").text().trim() ||
    $(".content-body").text().trim() ||
    $("body").text().trim();

  const cleanedText = articleText.replace(/\s+/g, " ").trim();

  console.log(
    "JPM extracted:",
    article.title,
    "length:",
    cleanedText.length,
    "preview:",
    cleanedText.slice(0, 300),
  );

  if (cleanedText.length < 200) {
    throw new Error(
      `J.P. Morgan page did not contain enough research text: ${article.url}`,
    );
  }

  const finalPublishedAt = publishedAt ?? new Date().toISOString();

  return {
    provider: "jpmorgan",

    sourceId: new URL(article.url).pathname.replace(/^\/+/, ""),

    title: title || article.title,

    summary: cleanedText.slice(0, 3000),

    sourceUrl: article.url,

    publishedAt: finalPublishedAt,
  };
}
