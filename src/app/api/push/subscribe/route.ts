import { NextRequest, NextResponse } from "next/server";
import { db, schema, ensureMigrated } from "@/lib/db";

export const runtime = "nodejs";

type SubscribeBody = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function POST(req: NextRequest) {
  ensureMigrated();
  try {
    const body = (await req.json()) as SubscribeBody;
    if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
      return NextResponse.json({ ok: false, error: "invalid_subscription" }, { status: 400 });
    }
    await db
      .insert(schema.pushSubscriptions)
      .values({
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        createdAt: Date.now(),
        active: 1,
      })
      .onConflictDoUpdate({
        target: schema.pushSubscriptions.endpoint,
        set: { p256dh: body.keys.p256dh, auth: body.keys.auth, active: 1 },
      });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push/subscribe]", (err as Error).message);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
