import { NextResponse } from "next/server";
import { db, schema, ensureMigrated } from "@/lib/db";
import { desc, gte, and } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  ensureMigrated();
  const latest = await db.select().from(schema.rates).orderBy(desc(schema.rates.timestamp)).limit(1);
  if (latest.length === 0) {
    return NextResponse.json({ rate: null, timestamp: null, changePct: null }, { status: 200 });
  }
  const current = latest[0];

  // Find rate from ~24h ago for daily delta
  const cutoff = current.timestamp - 24 * 60 * 60 * 1000;
  const yesterday = await db
    .select()
    .from(schema.rates)
    .where(and(gte(schema.rates.timestamp, cutoff - 6 * 60 * 60 * 1000)))
    .orderBy(schema.rates.timestamp)
    .limit(1);

  const prev = yesterday[0]?.rate;
  const changePct = prev ? ((current.rate - prev) / prev) * 100 : null;

  return NextResponse.json({
    rate: current.rate,
    timestamp: current.timestamp,
    source: current.source,
    changePct,
    previousRate: prev ?? null,
  });
}
