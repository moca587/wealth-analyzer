import * as cheerio from "cheerio";

export type IncomingResearchItem = {
  provider: string;
  sourceId: string;
  title: string;
  summary: string;
  sourceUrl: string;
  publishedAt: string;
};

const FRANKLIN_INSIGHTS_URL = "https://www.franklintempleton.com/articles";

type FranklinArticleLink = {
  title: string;
  url: string;
};

export async function fetchFranklinResearch(): Promise<IncomingResearchItem[]> {
  const response = await fetch(FRANKLIN_INSIGHTS_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Could not fetch Franklin Templeton research: ${response.status}`,
    );
  }

  const html = await response.text();

  const $ = cheerio.load(html);

  const links: FranklinArticleLink[] = [];

  $("a").each((_index, element) => {
    const href = $(element).attr("href");

    if (!href) {
      return;
    }

    let url: URL;

    try {
      url = new URL(href, "https://www.franklintempleton.com");
    } catch {
      return;
    }

    if (url.hostname !== "www.franklintempleton.com") {
      return;
    }

    const path = url.pathname.toLowerCase();

    // Franklin individual research articles use
    // /articles/... and /corporate/articles/...
    const isResearchArticle =
      path.includes("/articles/2026/") ||
      path.includes("/corporate/articles/2026/");

    if (!isResearchArticle) {
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

  console.log("Filtered Franklin research links:", uniqueLinks);

  const selectedArticles = uniqueLinks
    .filter((item) => {
      const title = item.title.toLowerCase();

      return (
        title.includes("market") ||
        title.includes("outlook") ||
        title.includes("equity") ||
        title.includes("stock") ||
        title.includes("bond") ||
        title.includes("fixed income") ||
        title.includes("credit") ||
        title.includes("inflation") ||
        title.includes("rate") ||
        title.includes("economic") ||
        title.includes("economy") ||
        title.includes("allocation") ||
        title.includes("portfolio") ||
        title.includes("ai") ||
        title.includes("investment")
      );
    })
    .slice(0, 5);

  console.log("Selected Franklin articles:", selectedArticles);

  const results = await Promise.allSettled(
    selectedArticles.map((article) => fetchFranklinArticle(article)),
  );

  const researchItems = results.flatMap((result) => {
    if (result.status === "fulfilled") {
      return [result.value];
    }

    console.warn("Could not fetch one Franklin article:", result.reason);

    return [];
  });

  console.log(
    "Fetched Franklin research items:",
    researchItems.map((item) => ({
      title: item.title,
      publishedAt: item.publishedAt,
    })),
  );

  return researchItems;
}

async function fetchFranklinArticle(
  article: FranklinArticleLink,
): Promise<IncomingResearchItem> {
  const response = await fetch(article.url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Could not fetch Franklin article: ${response.status}`);
  }

  const html = await response.text();

  const $ = cheerio.load(html);

  // Try structured metadata first.
  const metadataDate =
    $('meta[property="article:published_time"]').attr("content") ||
    $('meta[name="date"]').attr("content") ||
    $("time").first().attr("datetime");

  let publishedAt: string | null = null;

  if (metadataDate) {
    const parsed = new Date(metadataDate);

    if (!Number.isNaN(parsed.getTime())) {
      publishedAt = parsed.toISOString();
    }
  }

  // If metadata didn't work, look for a visible date.
  if (!publishedAt) {
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();

    const dateMatch = bodyText.match(
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/,
    );

    if (dateMatch) {
      const parsed = new Date(dateMatch[0]);

      if (!Number.isNaN(parsed.getTime())) {
        publishedAt = parsed.toISOString();
      }
    }
  }

  // Never manufacture today's date.
  if (!publishedAt) {
    throw new Error(
      `Could not determine Franklin publication date: ${article.url}`,
    );
  }

  $("script, style, nav, header, footer, noscript").remove();

  const title = $("h1").first().text().replace(/\s+/g, " ").trim();

  const articleText =
    $("article").text().trim() ||
    $("main").text().trim() ||
    $(".article-content").text().trim() ||
    $(".content-body").text().trim();

  const cleanedText = articleText.replace(/\s+/g, " ").trim();

  if (!cleanedText) {
    throw new Error(`Could not extract Franklin article text: ${article.url}`);
  }

  console.log(
    "Franklin extracted:",
    title || article.title,
    "publishedAt:",
    publishedAt,
    "length:",
    cleanedText.length,
  );

  return {
    provider: "franklin_templeton",

    sourceId: new URL(article.url).pathname.replace(/^\/+/, ""),

    title: title || article.title,

    summary: cleanedText.slice(0, 3000),

    sourceUrl: article.url,

    publishedAt,
  };
}
