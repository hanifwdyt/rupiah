import { NextRequest, NextResponse } from "next/server";
import { db, schema, ensureMigrated } from "@/lib/db";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  ensureMigrated();
  try {
    const { endpoint } = (await req.json()) as { endpoint?: string };
    if (!endpoint) return NextResponse.json({ ok: false }, { status: 400 });
    await db
      .update(schema.pushSubscriptions)
      .set({ active: 0 })
      .where(eq(schema.pushSubscriptions.endpoint, endpoint));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
