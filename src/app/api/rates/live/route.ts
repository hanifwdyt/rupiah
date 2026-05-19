import { NextResponse } from "next/server";
import { fetchUsdIdrRate } from "@/lib/rateApi";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const r = await fetchUsdIdrRate();
    return NextResponse.json(
      { rate: r.rate, timestamp: r.timestamp, source: r.source },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
