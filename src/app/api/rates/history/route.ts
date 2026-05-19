import { NextRequest, NextResponse } from "next/server";
import { db, schema, ensureMigrated } from "@/lib/db";
import { gte, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Range = "1d" | "1w" | "1m" | "3m" | "6m" | "1y";

const RANGE_MS: Record<Range, number> = {
  "1d": 24 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
  "1m": 30 * 24 * 60 * 60 * 1000,
  "3m": 90 * 24 * 60 * 60 * 1000,
  "6m": 180 * 24 * 60 * 60 * 1000,
  "1y": 365 * 24 * 60 * 60 * 1000,
};

// Target number of points per range for clean chart rendering
const TARGET_POINTS: Record<Range, number> = {
  "1d": 24,
  "1w": 56,
  "1m": 60,
  "3m": 90,
  "6m": 90,
  "1y": 120,
};

function downsample<T extends { timestamp: number; rate: number }>(rows: T[], targetCount: number): T[] {
  if (rows.length <= targetCount) return rows;
  const bucketSize = Math.ceil(rows.length / targetCount);
  const out: T[] = [];
  for (let i = 0; i < rows.length; i += bucketSize) {
    const slice = rows.slice(i, i + bucketSize);
    const avg = slice.reduce((s, r) => s + r.rate, 0) / slice.length;
    out.push({ ...slice[Math.floor(slice.length / 2)], rate: avg });
  }
  return out;
}

export async function GET(req: NextRequest) {
  ensureMigrated();
  const range = (req.nextUrl.searchParams.get("range") as Range) || "1m";
  const span = RANGE_MS[range] ?? RANGE_MS["1m"];
  const cutoff = Date.now() - span;

  const rows = await db
    .select({ timestamp: schema.rates.timestamp, rate: schema.rates.rate })
    .from(schema.rates)
    .where(gte(schema.rates.timestamp, cutoff))
    .orderBy(asc(schema.rates.timestamp));

  const sampled = downsample(rows, TARGET_POINTS[range] ?? 60);

  return NextResponse.json({ range, points: sampled });
}
