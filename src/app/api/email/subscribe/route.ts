import { NextRequest, NextResponse } from "next/server";
import { db, schema, ensureMigrated } from "@/lib/db";
import { sendVerificationEmail, isEmailConfigured } from "@/lib/email";
import crypto from "node:crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  ensureMigrated();
  try {
    const { email } = (await req.json()) as { email?: string };
    const normalized = (email || "").trim().toLowerCase();
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }
    if (!isEmailConfigured()) {
      return NextResponse.json({ ok: false, error: "email_not_configured" }, { status: 503 });
    }
    const token = crypto.randomBytes(24).toString("base64url");
    await db
      .insert(schema.emailSubscriptions)
      .values({
        email: normalized,
        verified: 0,
        verifyToken: token,
        createdAt: Date.now(),
        active: 1,
      })
      .onConflictDoUpdate({
        target: schema.emailSubscriptions.email,
        set: { verifyToken: token, active: 1 },
      });
    await sendVerificationEmail(normalized, token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[email/subscribe]", (err as Error).message);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
