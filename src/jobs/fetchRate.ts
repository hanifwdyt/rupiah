import { db, schema, ensureMigrated } from "@/lib/db";
import { fetchUsdIdrRate } from "@/lib/rateApi";

export async function runFetchRate(): Promise<{ rate: number; source: string } | null> {
  ensureMigrated();
  try {
    const result = await fetchUsdIdrRate();
    await db.insert(schema.rates).values({
      timestamp: result.timestamp,
      rate: result.rate,
      source: result.source,
    });
    console.log(`[fetchRate] ${new Date().toISOString()} ${result.source} rate=${result.rate}`);
    return { rate: result.rate, source: result.source };
  } catch (err) {
    console.error("[fetchRate] failed:", (err as Error).message);
    return null;
  }
}
