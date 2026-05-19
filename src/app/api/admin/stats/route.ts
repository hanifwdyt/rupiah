import { NextRequest, NextResponse } from "next/server";
import { db, schema, ensureMigrated } from "@/lib/db";
import { count, desc, eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthed(req: NextRequest): boolean {
  const key = process.env.ADMIN_KEY;
  if (!key) return false;
  const provided = req.nextUrl.searchParams.get("key") || req.headers.get("x-admin-key");
  return provided === key;
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  ensureMigrated();

  const [pushTotal] = await db
    .select({ value: count() })
    .from(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.active, 1));
  const [emailVerified] = await db
    .select({ value: count() })
    .from(schema.emailSubscriptions)
    .where(eq(schema.emailSubscriptions.verified, 1));
  const [emailUnverified] = await db
    .select({ value: count() })
    .from(schema.emailSubscriptions)
    .where(eq(schema.emailSubscriptions.verified, 0));
  const [rateRows] = await db.select({ value: count() }).from(schema.rates);
  const [newsRows] = await db.select({ value: count() }).from(schema.newsArticles);

  const emailList = await db
    .select()
    .from(schema.emailSubscriptions)
    .orderBy(desc(schema.emailSubscriptions.createdAt))
    .limit(200);
  const pushList = await db
    .select({
      id: schema.pushSubscriptions.id,
      createdAt: schema.pushSubscriptions.createdAt,
      active: schema.pushSubscriptions.active,
      endpoint: schema.pushSubscriptions.endpoint,
    })
    .from(schema.pushSubscriptions)
    .orderBy(desc(schema.pushSubscriptions.createdAt))
    .limit(200);
  const recentNotifs = await db
    .select()
    .from(schema.notificationsLog)
    .orderBy(desc(schema.notificationsLog.sentAt))
    .limit(20);

  return NextResponse.json({
    stats: {
      pushActive: pushTotal?.value ?? 0,
      emailVerified: emailVerified?.value ?? 0,
      emailUnverified: emailUnverified?.value ?? 0,
      rateRows: rateRows?.value ?? 0,
      newsRows: newsRows?.value ?? 0,
    },
    emailSubscriptions: emailList.map((e) => ({
      id: e.id,
      email: e.email,
      verified: e.verified,
      active: e.active,
      createdAt: e.createdAt,
    })),
    pushSubscriptions: pushList.map((p) => ({
      id: p.id,
      active: p.active,
      createdAt: p.createdAt,
      // Hide raw endpoint, just show domain
      endpointDomain: (() => {
        try {
          return new URL(p.endpoint).hostname;
        } catch {
          return "unknown";
        }
      })(),
    })),
    recentNotifications: recentNotifs,
  });
}
