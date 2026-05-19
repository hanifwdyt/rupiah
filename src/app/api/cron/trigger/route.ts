import { NextRequest, NextResponse } from "next/server";
import { runFetchRate } from "@/jobs/fetchRate";
import { runCrawlNews } from "@/jobs/crawlNews";
import { runSendNotifications, type Slot } from "@/jobs/sendNotifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const key = process.env.CRON_TRIGGER_KEY;
  const provided = req.nextUrl.searchParams.get("key");
  if (key && provided !== key) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const job = req.nextUrl.searchParams.get("job") || "fetchRate";
  try {
    if (job === "fetchRate") {
      const r = await runFetchRate();
      return NextResponse.json({ ok: true, job, result: r });
    }
    if (job === "crawlNews") {
      const n = await runCrawlNews();
      return NextResponse.json({ ok: true, job, inserted: n });
    }
    if (job === "sendNotifications") {
      const slot = (req.nextUrl.searchParams.get("slot") as Slot) || undefined;
      const r = await runSendNotifications(slot ? { slot } : undefined);
      return NextResponse.json({ ok: true, job, result: r });
    }
    return NextResponse.json({ ok: false, error: "unknown_job" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
