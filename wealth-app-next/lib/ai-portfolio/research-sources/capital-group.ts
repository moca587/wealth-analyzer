import * as cheerio from "cheerio";

export type IncomingResearchItem = {
  provider: string;
  sourceId: string;
  title: string;
  summary: string;
  sourceUrl: string;
  publishedAt: string;
};

const CAPITAL_GROUP_INSIGHTS_URL =
  "https://www.capitalgroup.com/advisor/insights.html";

type CapitalGroupArticleLink = {
  title: string;
  url: string;
};

export async function fetchCapitalGroupResearch(): Promise<
  IncomingResearchItem[]
> {
  // Fetch Capital Group's advisor insights hub.
  const response = await fetch(CAPITAL_GROUP_INSIGHTS_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Could not fetch Capital Group research: ${response.status}`,
    );
  }

  const html = await response.text();

  const $ = cheerio.load(html);

  // TEMP DEBUG
  console.log("CAPITAL GROUP DEBUG START");

  console.log("Capital Group HTML length:", html.length);

  console.log("Capital Group page title:", $("title").text().trim());

  console.log(
    "Capital Group raw links:",
    $("a")
      .map((_index, element) => ({
        text: $(element).text().replace(/\s+/g, " ").trim(),
        href: $(element).attr("href"),
      }))
      .get()
      .filter((item) => item.href)
      .slice(0, 150),
  );

  console.log("CAPITAL GROUP DEBUG END");

  const links: CapitalGroupArticleLink[] = [];

  // Look through every link on the insights page.
  $("a").each((_index, element) => {
    const href = $(element).attr("href");

    if (!href) {
      return;
    }

    let url: URL;

    try {
      url = new URL(href, "https://www.capitalgroup.com");
    } catch {
      return;
    }

    // Only keep Capital Group pages.
    if (
      url.hostname !== "www.capitalgroup.com" &&
      url.hostname !== "capitalgroup.com"
    ) {
      return;
    }

    const path = url.pathname.toLowerCase();

    // Individual research articles generally live here.
    const isResearchArticle = path.includes("/advisor/insights/articles/");

    if (!isResearchArticle) {
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

  // Remove duplicate article URLs.
  const uniqueLinks = Array.from(
    new Map(links.map((item) => [item.url, item])).values(),
  );

  console.log("Filtered Capital Group research links:", uniqueLinks);

  // Keep articles useful for portfolio construction.
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
        title.includes("inflation") ||
        title.includes("interest rate") ||
        title.includes("rates") ||
        title.includes("econom") ||
        title.includes("portfolio") ||
        title.includes("capital market") ||
        title.includes("ai") ||
        title.includes("credit")
      );
    })
    .slice(0, 5);

  console.log("Selected Capital Group articles:", selectedArticles);

  // Fetch all selected articles concurrently.
  const results = await Promise.allSettled(
    selectedArticles.map((article) => fetchCapitalGroupArticle(article)),
  );

  // One bad article should not kill the entire provider.
  const researchItems = results.flatMap((result) => {
    if (result.status === "fulfilled") {
      return [result.value];
    }

    console.warn("Could not fetch one Capital Group article:", result.reason);

    return [];
  });

  console.log(
    "Fetched Capital Group research items:",
    researchItems.map((item) => ({
      title: item.title,
      publishedAt: item.publishedAt,
    })),
  );

  return researchItems;
}

async function fetchCapitalGroupArticle(
  article: CapitalGroupArticleLink,
): Promise<IncomingResearchItem> {
  const response = await fetch(article.url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Could not fetch Capital Group article: ${response.status}`,
    );
  }

  const html = await response.text();

  const $ = cheerio.load(html);

  // Read the page text before removing elements so we
  // have the best chance of finding the publication date.
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();

  // Handles dates such as:
  // June 24, 2026
  // February 3, 2026
  const dateMatch = bodyText.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/,
  );

  // Do not pretend today's date is the publication date.
  // If we cannot determine the date, skip the article.
  if (!dateMatch) {
    throw new Error(`Could not determine publication date for ${article.url}`);
  }

  const parsedDate = new Date(dateMatch[0]);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid publication date for ${article.url}`);
  }

  const publishedAt = parsedDate.toISOString();

  // Remove obvious page junk.
  $("script, style, nav, header, footer, noscript").remove();

  // Extract the article's actual title.
  const title = $("h1").first().text().replace(/\s+/g, " ").trim();

  // Prefer focused article content.
  const articleText =
    $("article").text().trim() ||
    $("main").text().trim() ||
    $(".article-content").text().trim() ||
    $(".content-body").text().trim();

  const cleanedText = articleText.replace(/\s+/g, " ").trim();

  if (!cleanedText) {
    throw new Error(`Could not extract article text from ${article.url}`);
  }

  return {
    provider: "capital_group",

    sourceId: new URL(article.url).pathname.replace(/^\/+/, ""),

    title: title || article.title,

    summary: cleanedText.slice(0, 3000),

    sourceUrl: article.url,

    publishedAt,
  };
}
