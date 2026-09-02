import * as cheerio from "cheerio";

export type IncomingResearchItem = {
  provider: string;
  sourceId: string;
  title: string;
  summary: string;
  sourceUrl: string;
  publishedAt: string;
};

const NUVEEN_INSIGHTS_URL = "https://www.nuveen.com/en-us/insights";

type NuveenArticleLink = {
  title: string;
  url: string;
  publishedAt?: string;
};

export async function fetchNuveenResearch(): Promise<IncomingResearchItem[]> {
  const response = await fetch(NUVEEN_INSIGHTS_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Could not fetch Nuveen research: ${response.status}`);
  }

  const html = await response.text();

  const $ = cheerio.load(html);

  const links: NuveenArticleLink[] = [];

  // Find links to Nuveen insight articles.
  $("a").each((_index, element) => {
    const href = $(element).attr("href");

    if (!href) {
      return;
    }

    let url: URL;

    try {
      url = new URL(href, "https://www.nuveen.com");
    } catch {
      return;
    }

    // Only keep Nuveen links.
    if (url.hostname !== "www.nuveen.com") {
      return;
    }

    const path = url.pathname.toLowerCase();

    // Only keep pages inside the insights area.
    if (!path.includes("/en-us/insights/")) {
      return;
    }

    // Skip generic hub/category pages.
    const excludedPaths = [
      "/en-us/insights/investment-outlook",
      "/en-us/insights/fixed-income",
      "/en-us/insights/equities",
      "/en-us/insights/municipal-bonds",
      "/en-us/insights/alternatives",
      "/en-us/insights/real-estate",
      "/en-us/insights/responsible-investing",
      "/en-us/insights/retirement",
    ];

    if (
      excludedPaths.some(
        (excluded) => path === excluded || path === `${excluded}/`,
      )
    ) {
      return;
    }

    const title = $(element).text().replace(/\s+/g, " ").trim();

    if (!title) {
      return;
    }

    // Remove tracking parameters and fragments.
    url.search = "";
    url.hash = "";

    // Nuveen sometimes exposes the publication date
    // directly in the link text on the insights hub.
    //
    // Example:
    // 31 Aug 2026
    const dateMatch = title.match(
      /\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/i,
    );

    let publishedAt: string | undefined;

    if (dateMatch) {
      const parsedDate = new Date(dateMatch[0]);

      const year = parsedDate.getFullYear();

      if (
        !Number.isNaN(parsedDate.getTime()) &&
        year >= 2000 &&
        year <= new Date().getFullYear() + 1
      ) {
        publishedAt = parsedDate.toISOString();
      }
    }

    links.push({
      title,
      url: url.toString(),
      publishedAt,
    });
  });

  // Remove duplicate URLs.
  const uniqueLinks = Array.from(
    new Map(links.map((item) => [item.url, item])).values(),
  );

  console.log("Filtered Nuveen research links:", uniqueLinks);

  // Select research useful to portfolio construction.
  //
  // Check both the title AND URL because Nuveen sometimes
  // uses a date as the visible link text while the URL
  // contains the actual topic.
  const selectedArticles = uniqueLinks
    .filter((item) => {
      const title = item.title.toLowerCase();
      const url = item.url.toLowerCase();

      const searchable = `${title} ${url}`;

      return (
        searchable.includes("market") ||
        searchable.includes("outlook") ||
        searchable.includes("equity") ||
        searchable.includes("stock") ||
        searchable.includes("bond") ||
        searchable.includes("fixed-income") ||
        searchable.includes("fixed income") ||
        searchable.includes("credit") ||
        searchable.includes("inflation") ||
        searchable.includes("fed") ||
        searchable.includes("rate") ||
        searchable.includes("economic") ||
        searchable.includes("economy") ||
        searchable.includes("portfolio") ||
        searchable.includes("allocation") ||
        searchable.includes("ai") ||
        searchable.includes("investment")
      );
    })
    .slice(0, 5);

  console.log("Selected Nuveen articles:", selectedArticles);

  // Fetch all selected articles.
  const results = await Promise.allSettled(
    selectedArticles.map((article) => fetchNuveenArticle(article)),
  );

  // Keep successful articles even if another one fails.
  const researchItems = results.flatMap((result) => {
    if (result.status === "fulfilled") {
      return [result.value];
    }

    console.warn("Could not fetch one Nuveen article:", result.reason);

    return [];
  });

  console.log(
    "Fetched Nuveen research items:",
    researchItems.map((item) => ({
      title: item.title,
      publishedAt: item.publishedAt,
    })),
  );

  return researchItems;
}

async function fetchNuveenArticle(
  article: NuveenArticleLink,
): Promise<IncomingResearchItem> {
  const response = await fetch(article.url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Could not fetch Nuveen article: ${response.status}`);
  }

  const html = await response.text();

  const $ = cheerio.load(html);

  // --------------------------------
  // 1. Try structured date metadata
  // --------------------------------

  let publishedAt: string | null = null;

  const metadataDate =
    $('meta[property="article:published_time"]').attr("content") ||
    $('meta[name="date"]').attr("content") ||
    $("time").first().attr("datetime");

  if (metadataDate) {
    const parsedDate = new Date(metadataDate);

    const year = parsedDate.getFullYear();

    // Reject bogus values such as 1970.
    if (
      !Number.isNaN(parsedDate.getTime()) &&
      year >= 2000 &&
      year <= new Date().getFullYear() + 1
    ) {
      publishedAt = parsedDate.toISOString();
    }
  }

  // --------------------------------
  // 2. Try visible article-page text
  // --------------------------------

  if (!publishedAt) {
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();

    // Handles:
    // 31 Aug 2026
    // 7 Jul 2026
    const dayFirstMatch = bodyText.match(
      /\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/i,
    );

    // Handles:
    // August 31, 2026
    // July 7, 2026
    const monthFirstMatch = bodyText.match(
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/i,
    );

    const dateText = dayFirstMatch?.[0] ?? monthFirstMatch?.[0];

    if (dateText) {
      const parsedDate = new Date(dateText);

      const year = parsedDate.getFullYear();

      if (
        !Number.isNaN(parsedDate.getTime()) &&
        year >= 2000 &&
        year <= new Date().getFullYear() + 1
      ) {
        publishedAt = parsedDate.toISOString();
      }
    }
  }

  // --------------------------------
  // 3. Fall back to hub-page date
  // --------------------------------

  // If the individual article page did not expose a
  // trustworthy date, use the date we discovered while
  // scraping Nuveen's main insights page.
  if (!publishedAt && article.publishedAt) {
    publishedAt = article.publishedAt;
  }

  // --------------------------------
  // 4. Final sanity check
  // --------------------------------

  if (publishedAt) {
    const parsedDate = new Date(publishedAt);

    const year = parsedDate.getFullYear();

    if (
      Number.isNaN(parsedDate.getTime()) ||
      year < 2000 ||
      year > new Date().getFullYear() + 1
    ) {
      publishedAt = null;
    }
  }

  // Do NOT manufacture today's date.
  // If we still cannot determine the publication date,
  // skip this article.
  if (!publishedAt) {
    throw new Error(
      `Could not determine Nuveen publication date: ${article.url}`,
    );
  }

  // --------------------------------
  // Article content
  // --------------------------------

  $("script, style, nav, header, footer, noscript").remove();

  const title = $("h1").first().text().replace(/\s+/g, " ").trim();

  const articleText =
    $("article").text().trim() ||
    $("main").text().trim() ||
    $(".article-content").text().trim() ||
    $(".content-body").text().trim();

  const cleanedText = articleText.replace(/\s+/g, " ").trim();

  if (!cleanedText) {
    throw new Error(`Could not extract Nuveen article text: ${article.url}`);
  }

  console.log(
    "Nuveen extracted:",
    title || article.title,
    "publishedAt:",
    publishedAt,
    "length:",
    cleanedText.length,
  );

  return {
    provider: "nuveen",

    sourceId: new URL(article.url).pathname.replace(/^\/+/, ""),

    title: title || article.title,

    summary: cleanedText.slice(0, 3000),

    sourceUrl: article.url,

    publishedAt,
  };
}
