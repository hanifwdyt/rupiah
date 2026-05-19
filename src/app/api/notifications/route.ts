import { NextRequest, NextResponse } from "next/server";
import { db, schema, ensureMigrated } from "@/lib/db";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  ensureMigrated();
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "30", 10) || 30, 200);
  const rows = await db
    .select()
    .from(schema.notificationsLog)
    .orderBy(desc(schema.notificationsLog.sentAt))
    .limit(limit);
  return NextResponse.json({ items: rows });
}
