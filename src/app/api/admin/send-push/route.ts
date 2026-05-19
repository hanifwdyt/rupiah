import { NextRequest, NextResponse } from "next/server";
import { sendPushToAll } from "@/lib/webPush";
import { runSendNotifications, type Slot } from "@/jobs/sendNotifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthed(req: NextRequest): boolean {
  const key = process.env.ADMIN_KEY;
  if (!key) return false;
  const provided = req.nextUrl.searchParams.get("key") || req.headers.get("x-admin-key");
  return provided === key;
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const body = (await req.json().catch(() => ({}))) as {
      mode?: "scheduled" | "custom";
      slot?: Slot;
      title?: string;
      message?: string;
    };

    if (body.mode === "custom") {
      if (!body.title || !body.message) {
        return NextResponse.json({ error: "title_and_message_required" }, { status: 400 });
      }
      const sent = await sendPushToAll({
        title: body.title,
        body: body.message,
        url: process.env.PUBLIC_BASE_URL || "/",
        tag: `admin-${Date.now()}`,
      });
      return NextResponse.json({ ok: true, mode: "custom", pushSent: sent });
    }

    // Default: run the full scheduled-style notification (rate + push + email + log)
    const result = await runSendNotifications(body.slot ? { slot: body.slot } : undefined);
    return NextResponse.json({ ok: true, mode: "scheduled", result });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
