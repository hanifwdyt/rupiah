import webpush from "web-push";
import { db, schema } from "./db";
import { eq } from "drizzle-orm";

let configured = false;

function configure() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:noreply@usd-to-idr.hanif.app";
  if (!publicKey || !privateKey) {
    console.warn("[webpush] VAPID keys missing — push disabled");
    return;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export function isPushConfigured(): boolean {
  configure();
  return configured;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export async function sendPushToAll(payload: PushPayload): Promise<number> {
  configure();
  if (!configured) return 0;
  const subs = await db.select().from(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.active, 1));
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
        );
        sent += 1;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await db
            .update(schema.pushSubscriptions)
            .set({ active: 0 })
            .where(eq(schema.pushSubscriptions.endpoint, s.endpoint));
        } else {
          console.error("[webpush] send error:", (err as Error).message);
        }
      }
    }),
  );
  return sent;
}
