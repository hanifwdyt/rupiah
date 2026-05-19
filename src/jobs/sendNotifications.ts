import { db, schema, ensureMigrated } from "@/lib/db";
import { desc } from "drizzle-orm";
import { sendPushToAll } from "@/lib/webPush";
import { sendRateEmailToAll } from "@/lib/email";
import { runFetchRate } from "./fetchRate";
import { fmtRupiah, fmtPct } from "@/lib/format";

export type Slot = "morning" | "afternoon" | "night";

function currentSlot(now = new Date()): Slot {
  const fmt = new Intl.DateTimeFormat("en-US", { hour: "2-digit", hour12: false, timeZone: "Asia/Jakarta" });
  const hour = parseInt(fmt.format(now), 10);
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "night";
}

export async function runSendNotifications(opts?: { slot?: Slot }): Promise<{
  rate: number;
  changePct: number | null;
  pushSent: number;
  emailSent: number;
} | null> {
  ensureMigrated();
  // Refresh rate right before sending
  await runFetchRate();

  const latest = await db.select().from(schema.rates).orderBy(desc(schema.rates.timestamp)).limit(1);
  if (latest.length === 0) {
    console.error("[sendNotifications] no rate available");
    return null;
  }
  const current = latest[0];

  // Previous notification log for delta calculation
  const lastNotif = await db
    .select()
    .from(schema.notificationsLog)
    .orderBy(desc(schema.notificationsLog.sentAt))
    .limit(1);
  const prevRate = lastNotif[0]?.rate;
  const changePct = prevRate ? ((current.rate - prevRate) / prevRate) * 100 : null;
  const slot: Slot = opts?.slot ?? currentSlot();

  const directionLabel =
    changePct == null
      ? "update terbaru"
      : changePct > 0.05
        ? `rupiah melemah ${fmtPct(changePct)}`
        : changePct < -0.05
          ? `rupiah menguat ${fmtPct(Math.abs(changePct))}`
          : "stabil";

  const slotGreeting = slot === "morning" ? "Pagi" : slot === "afternoon" ? "Siang" : "Malam";

  const payload = {
    title: `${slotGreeting} · USD/IDR Rp${fmtRupiah(current.rate)}`,
    body: `${directionLabel} sejak update lalu`,
    url: process.env.PUBLIC_BASE_URL || "/",
    tag: `rate-${slot}-${new Date().toDateString()}`,
  };

  const [pushSent, emailSent] = await Promise.all([
    sendPushToAll(payload),
    sendRateEmailToAll(current.rate, changePct, slot),
  ]);

  await db.insert(schema.notificationsLog).values({
    sentAt: Date.now(),
    slot,
    rate: current.rate,
    rateChangePct: changePct,
    pushSentCount: pushSent,
    emailSentCount: emailSent,
  });

  console.log(`[sendNotifications] ${slot} rate=${current.rate} push=${pushSent} email=${emailSent}`);
  return { rate: current.rate, changePct, pushSent, emailSent };
}
