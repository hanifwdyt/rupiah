import { db, schema, ensureMigrated } from "@/lib/db";
import { fetchYahooHistory } from "@/lib/rateApi";
import { sql } from "drizzle-orm";

/**
 * Backfill historical USD/IDR data from Yahoo Finance.
 * Idempotent: only inserts timestamps that don't already exist.
 */
export async function runBackfillHistory(range = "1y", interval = "1d"): Promise<number> {
  ensureMigrated();
  const points = await fetchYahooHistory(range, interval);
  if (points.length === 0) return 0;

  // Build set of existing timestamps to avoid dupes
  const existing = await db
    .select({ timestamp: schema.rates.timestamp })
    .from(schema.rates)
    .where(sql`source = ${"yahoo-history"}`);
  const existingSet = new Set(existing.map((r) => r.timestamp));

  let inserted = 0;
  for (const p of points) {
    if (existingSet.has(p.timestamp)) continue;
    try {
      await db.insert(schema.rates).values({
        timestamp: p.timestamp,
        rate: p.rate,
        source: "yahoo-history",
      });
      inserted += 1;
    } catch {
      // ignore conflicts
    }
  }
  console.log(`[backfillHistory] ${inserted} inserted / ${points.length} fetched`);
  return inserted;
}
