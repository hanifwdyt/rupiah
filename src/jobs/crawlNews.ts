import { db, schema, ensureMigrated } from "@/lib/db";
import { crawlAll } from "@/lib/rss";
import { sql } from "drizzle-orm";

export async function runCrawlNews(): Promise<number> {
  ensureMigrated();
  const articles = await crawlAll();
  if (articles.length === 0) {
    console.log("[crawlNews] no articles");
    return 0;
  }
  const now = Date.now();
  let inserted = 0;
  for (const a of articles) {
    try {
      const res = await db
        .insert(schema.newsArticles)
        .values({
          source: a.source,
          title: a.title,
          url: a.url,
          excerpt: a.excerpt,
          publishedAt: a.publishedAt,
          fetchedAt: now,
        })
        .onConflictDoNothing({ target: schema.newsArticles.url });
      if (res.changes > 0) inserted += 1;
    } catch (err) {
      console.error("[crawlNews] insert error:", (err as Error).message);
    }
  }
  // Prune older than 30 days to keep DB lean
  const cutoff = now - 30 * 24 * 60 * 60 * 1000;
  await db.run(sql`DELETE FROM news_articles WHERE published_at < ${cutoff}`);
  console.log(`[crawlNews] ${inserted} new / ${articles.length} matched`);
  return inserted;
}
