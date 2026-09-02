import * as cheerio from "cheerio";

export type IncomingResearchItem = {
  provider: string;
  sourceId: string;
  title: string;
  summary: string;
  sourceUrl: string;
  publishedAt: string;
};

const SCHWAB_COMMENTARY_URL = "https://www.schwab.com/learn/market-commentary";

type SchwabArticleLink = {
  title: string;
  url: string;
};

export async function fetchSchwabResearch(): Promise<IncomingResearchItem[]> {
  const response = await fetch(SCHWAB_COMMENTARY_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Could not fetch Schwab research: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const links: SchwabArticleLink[] = [];

  $("a").each((_index, element) => {
    const href = $(element).attr("href");

    if (!href) {
      return;
    }

    let url: URL;

    try {
      url = new URL(href, "https://www.schwab.com");
    } catch {
      return;
    }

    if (url.hostname !== "www.schwab.com") {
      return;
    }

    const path = url.pathname.toLowerCase();

    // Schwab article pages generally live under /learn/story/
    if (!path.includes("/learn/story/")) {
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

  console.log("Filtered Schwab research links:", uniqueLinks);

  const selectedArticles = uniqueLinks
    .filter((item) => {
      const title = item.title.toLowerCase();

      return (
        title.includes("market") ||
        title.includes("stock") ||
        title.includes("equity") ||
        title.includes("bond") ||
        title.includes("fixed income") ||
        title.includes("inflation") ||
        title.includes("fed") ||
        title.includes("portfolio") ||
        title.includes("geopolitical")
      );
    })
    .slice(0, 5);

  console.log("Selected Schwab articles:", selectedArticles);

  const results = await Promise.allSettled(
    selectedArticles.map((article) => fetchSchwabArticle(article)),
  );

  const researchItems = results.flatMap((result) => {
    if (result.status === "fulfilled") {
      return [result.value];
    }

    console.warn("Could not fetch one Schwab article:", result.reason);

    return [];
  });

  console.log(
    "Fetched Schwab research items:",
    researchItems.map((item) => ({
      title: item.title,
      publishedAt: item.publishedAt,
    })),
  );

  return researchItems;
}

async function fetchSchwabArticle(
  article: SchwabArticleLink,
): Promise<IncomingResearchItem> {
  const response = await fetch(article.url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Could not fetch Schwab article: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const bodyText = $("body").text().replace(/\s+/g, " ").trim();

  const dateMatch = bodyText.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/,
  );

  const publishedAt = dateMatch ? new Date(dateMatch[0]).toISOString() : null;

  $("script, style, nav, header, footer, noscript, svg").remove();

  const title = $("h1").first().text().replace(/\s+/g, " ").trim();

  const articleText =
    $("article").text().trim() ||
    $("main").text().trim() ||
    $("body").text().trim();

  const cleanedText = articleText.replace(/\s+/g, " ").trim();

  if (cleanedText.length < 300) {
    throw new Error(
      `Schwab article did not contain enough research text: ${article.url}`,
    );
  }

  if (!publishedAt) {
    throw new Error(
      `Could not determine Schwab publication date: ${article.url}`,
    );
  }

  return {
    provider: "schwab",

    sourceId: new URL(article.url).pathname.replace(/^\/+/, ""),

    title: title || article.title,

    summary: cleanedText.slice(0, 3000),

    sourceUrl: article.url,

    publishedAt,
  };
}
