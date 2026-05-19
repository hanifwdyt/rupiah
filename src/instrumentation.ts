export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Only bootstrap cron in server (not edge/build)
  const { ensureMigrated } = await import("@/lib/db");
  ensureMigrated();

  // Avoid double-registration in dev hot reload
  const g = globalThis as unknown as { __rupiahCronStarted?: boolean };
  if (g.__rupiahCronStarted) return;
  g.__rupiahCronStarted = true;

  const cron = (await import("node-cron")).default;
  const { runFetchRate } = await import("@/jobs/fetchRate");
  const { runCrawlNews } = await import("@/jobs/crawlNews");
  const { runSendNotifications } = await import("@/jobs/sendNotifications");

  const tz = "Asia/Jakarta";

  // Fetch rate every 15 minutes (Yahoo Finance is real-time so this gives a richer chart)
  cron.schedule("*/15 * * * *", () => { void runFetchRate(); }, { timezone: tz });

  // Crawl news every 6 hours
  cron.schedule("0 */6 * * *", () => { void runCrawlNews(); }, { timezone: tz });

  // Send notifications at 09:00, 15:00, 21:00 WIB
  cron.schedule("0 9 * * *", () => { void runSendNotifications({ slot: "morning" }); }, { timezone: tz });
  cron.schedule("0 15 * * *", () => { void runSendNotifications({ slot: "afternoon" }); }, { timezone: tz });
  cron.schedule("0 21 * * *", () => { void runSendNotifications({ slot: "night" }); }, { timezone: tz });

  // Kick off an initial fetch + backfill on boot if rates table is sparse
  setTimeout(async () => {
    try {
      const { db, schema } = await import("@/lib/db");
      const { runBackfillHistory } = await import("@/jobs/backfillHistory");
      const rows = await db.select().from(schema.rates).limit(1);
      if (rows.length === 0) {
        await runFetchRate();
        await runCrawlNews();
        // Backfill 1 year of daily history for chart
        await runBackfillHistory("1y", "1d");
      }
    } catch (err) {
      console.error("[instrumentation] initial bootstrap error:", (err as Error).message);
    }
  }, 2000);

  console.log("[instrumentation] cron jobs registered (TZ=Asia/Jakarta)");
}
