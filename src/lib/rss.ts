import Parser from "rss-parser";

const parser = new Parser({
  headers: { "User-Agent": "RupiahTracker/1.0 (+https://usd-to-idr.hanif.app)" },
  timeout: 15000,
});

export const FEEDS: { source: string; url: string }[] = [
  { source: "Detik Finance", url: "https://finance.detik.com/rss" },
  { source: "CNBC Indonesia", url: "https://www.cnbcindonesia.com/market/rss" },
  { source: "Antara Ekonomi", url: "https://www.antaranews.com/rss/ekonomi.xml" },
  { source: "Tempo Bisnis", url: "https://rss.tempo.co/bisnis" },
];

const KEYWORDS = [
  "rupiah",
  "kurs",
  " usd",
  " idr",
  "dollar",
  "dolar",
  "bank indonesia",
  " bi ",
  "the fed",
  "nilai tukar",
  "valuta",
  "forex",
];

export type CrawledArticle = {
  source: string;
  title: string;
  url: string;
  excerpt: string | null;
  publishedAt: number;
};

function matchesKeyword(text: string): boolean {
  const lower = ` ${text.toLowerCase()} `;
  return KEYWORDS.some((k) => lower.includes(k));
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function crawlFeed(feed: { source: string; url: string }): Promise<CrawledArticle[]> {
  try {
    const parsed = await parser.parseURL(feed.url);
    const items = parsed.items || [];
    const filtered: CrawledArticle[] = [];
    for (const item of items) {
      const title = item.title?.trim() || "";
      const url = item.link?.trim() || "";
      if (!title || !url) continue;
      const haystack = `${title} ${item.contentSnippet || item.content || ""}`;
      if (!matchesKeyword(haystack)) continue;
      const rawExcerpt = item.contentSnippet || stripHtml(item.content || "") || null;
      const excerpt = rawExcerpt ? rawExcerpt.slice(0, 280) : null;
      const publishedAt = item.isoDate
        ? new Date(item.isoDate).getTime()
        : item.pubDate
          ? new Date(item.pubDate).getTime()
          : Date.now();
      filtered.push({ source: feed.source, title, url, excerpt, publishedAt });
    }
    return filtered;
  } catch (err) {
    console.error(`[rss] failed ${feed.source} (${feed.url}):`, (err as Error).message);
    return [];
  }
}

export async function crawlAll(): Promise<CrawledArticle[]> {
  const results = await Promise.all(FEEDS.map(crawlFeed));
  return results.flat();
}
