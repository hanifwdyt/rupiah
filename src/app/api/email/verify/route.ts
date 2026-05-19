import { NextRequest, NextResponse } from "next/server";
import { db, schema, ensureMigrated } from "@/lib/db";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  ensureMigrated();
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/verify-email?status=error", req.url));
  }
  const found = await db
    .select()
    .from(schema.emailSubscriptions)
    .where(eq(schema.emailSubscriptions.verifyToken, token))
    .limit(1);
  if (found.length === 0) {
    return NextResponse.redirect(new URL("/verify-email?status=invalid", req.url));
  }
  await db
    .update(schema.emailSubscriptions)
    .set({ verified: 1, verifyToken: null })
    .where(eq(schema.emailSubscriptions.id, found[0].id));
  return NextResponse.redirect(new URL("/verify-email?status=ok", req.url));
}
