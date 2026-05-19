import { NextRequest, NextResponse } from "next/server";
import { db, schema, ensureMigrated } from "@/lib/db";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  ensureMigrated();
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "20", 10) || 20, 100);
  const offset = Math.max(parseInt(req.nextUrl.searchParams.get("offset") || "0", 10) || 0, 0);

  const rows = await db
    .select()
    .from(schema.newsArticles)
    .orderBy(desc(schema.newsArticles.publishedAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ items: rows });
}
