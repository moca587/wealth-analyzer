import * as cheerio from "cheerio";

export type IncomingResearchItem = {
  provider: string;
  sourceId: string;
  title: string;
  summary: string;
  sourceUrl: string;
  publishedAt: string;
};

const BLACKROCK_INSIGHTS_URL =
  "https://www.blackrock.com/institutions/en-us/insights";

type BlackRockArticleLink = {
  title: string;
  url: string;
};

function parseDateCandidate(value: string | undefined | null): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const now = new Date();

  // Reject dates that are obviously too old.
  const oldestAllowed = new Date();
  oldestAllowed.setFullYear(now.getFullYear() - 3);

  // Reject dates that are suspiciously far in the future.
  const futureLimit = new Date();
  futureLimit.setDate(now.getDate() + 7);

  if (parsed < oldestAllowed || parsed > futureLimit) {
    return null;
  }

  return parsed.toISOString();
}

export async function fetchBlackRockResearch(): Promise<
  IncomingResearchItem[]
> {
  // Fetch BlackRock's Institutional Insights hub.
  const response = await fetch(BLACKROCK_INSIGHTS_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Could not fetch BlackRock research: ${response.status}`);
  }

  const html = await response.text();

  const $ = cheerio.load(html);

  const links: BlackRockArticleLink[] = [];

  // Look through every link on the BlackRock page.
  $("a").each((_index, element) => {
    const href = $(element).attr("href");

    if (!href) {
      return;
    }

    let url: URL;

    try {
      url = new URL(href, "https://www.blackrock.com");
    } catch {
      return;
    }

    // Only keep BlackRock pages.
    if (url.hostname !== "www.blackrock.com") {
      return;
    }

    const path = url.pathname.toLowerCase();

    // Keep likely research / insight pages.
    const isResearchArticle =
      path.includes("/insights/") ||
      path.includes("/blackrock-investment-institute/");

    if (!isResearchArticle) {
      return;
    }

    // Skip obvious navigation and generic pages.
    const excludedPaths = [
      "/insights/index",
      "/about-us",
      "/contact-us",
      "/careers",
      "/products/",
      "/tools/",
      "/events/",
      "/webcasts/",
    ];

    if (excludedPaths.some((excluded) => path.includes(excluded))) {
      return;
    }

    const title = $(element).text().replace(/\s+/g, " ").trim();

    if (!title) {
      return;
    }

    // Remove tracking parameters and hashes.
    url.search = "";
    url.hash = "";

    links.push({
      title,
      url: url.toString(),
    });
  });

  // Remove duplicate URLs.
  const uniqueLinks = Array.from(
    new Map(links.map((item) => [item.url, item])).values(),
  );

  console.log("Filtered BlackRock research links:", uniqueLinks);

  // Keep the most portfolio-relevant research.
  const selectedArticles = uniqueLinks
    .filter((item) => {
      const title = item.title.toLowerCase();

      return (
        title.includes("market") ||
        title.includes("equity") ||
        title.includes("fixed income") ||
        title.includes("credit") ||
        title.includes("outlook") ||
        title.includes("portfolio") ||
        title.includes("capital market") ||
        title.includes("income") ||
        title.includes("macro") ||
        title.includes("ai")
      );
    })
    .slice(0, 5);

  console.log("Selected BlackRock articles:", selectedArticles);

  // Fetch all selected articles.
  // Promise.allSettled lets one bad page fail
  // without killing the entire BlackRock refresh.
  const results = await Promise.allSettled(
    selectedArticles.map((article) => fetchBlackRockArticle(article)),
  );

  const researchItems = results.flatMap((result) => {
    if (result.status === "fulfilled") {
      return [result.value];
    }

    console.warn("Could not fetch one BlackRock article:", result.reason);

    return [];
  });

  console.log(
    "Fetched BlackRock research items:",
    researchItems.map((item) => ({
      title: item.title,
      publishedAt: item.publishedAt,
    })),
  );

  return researchItems;
}

async function fetchBlackRockArticle(
  article: BlackRockArticleLink,
): Promise<IncomingResearchItem> {
  const response = await fetch(article.url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Could not fetch BlackRock article: ${response.status}`);
  }

  const html = await response.text();

  const $ = cheerio.load(html);

  // BlackRock often stores the publication date as
  // a Unix timestamp in milliseconds:
  //
  // <meta name="publicationDate" content="1782345600000">
  let publishedAt: string | null = null;

  const publicationTimestamp = $('meta[name="publicationDate"]').attr(
    "content",
  );

  if (publicationTimestamp) {
    const timestamp = Number(publicationTimestamp);

    if (Number.isFinite(timestamp)) {
      const date = new Date(timestamp);

      if (!Number.isNaN(date.getTime())) {
        publishedAt = date.toISOString();
      }
    }
  }

  // Fall back to more conventional metadata.
  if (!publishedAt) {
    const metadataDate =
      $('meta[property="article:published_time"]').attr("content") ||
      $('meta[name="date"]').attr("content") ||
      $('meta[name="publish-date"]').attr("content") ||
      $('meta[name="publication_date"]').attr("content") ||
      $("time").first().attr("datetime");

    if (metadataDate) {
      const date = new Date(metadataDate);

      if (!Number.isNaN(date.getTime())) {
        publishedAt = date.toISOString();
      }
    }
  }

  // Final fallback: look for a visible date on the page.
  if (!publishedAt) {
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();

    const dateMatch = bodyText.match(
      /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}\b/,
    );

    if (dateMatch) {
      const date = new Date(dateMatch[0]);

      if (!Number.isNaN(date.getTime())) {
        publishedAt = date.toISOString();
      }
    }
  }

  // Do not save an article with a fake publication date.
  if (!publishedAt) {
    throw new Error(
      `Could not determine BlackRock publication date: ${article.url}`,
    );
  }

  // Remove obvious page junk before extracting content.
  $("script, style, nav, header, footer, noscript, svg").remove();

  const title = $("h1").first().text().replace(/\s+/g, " ").trim();

  const articleText =
    $("article").text().trim() ||
    $("main").text().trim() ||
    $(".article-content").text().trim() ||
    $(".content-body").text().trim() ||
    $("body").text().trim();

  const cleanedText = articleText.replace(/\s+/g, " ").trim();

  if (cleanedText.length < 300) {
    throw new Error(
      `BlackRock page did not contain enough research text: ${article.url}`,
    );
  }

  console.log(
    "BlackRock extracted:",
    article.title,
    "publishedAt:",
    publishedAt,
    "length:",
    cleanedText.length,
  );

  return {
    provider: "blackrock",

    sourceId: new URL(article.url).pathname.replace(/^\/+/, ""),

    title: title || article.title,

    summary: cleanedText.slice(0, 3000),

    sourceUrl: article.url,

    publishedAt,
  };
}
