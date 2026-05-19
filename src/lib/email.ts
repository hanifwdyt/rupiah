import { Resend } from "resend";
import { db, schema } from "./db";
import { and, eq } from "drizzle-orm";

let resend: Resend | null = null;
function client(): Resend | null {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY missing — email disabled");
    return null;
  }
  resend = new Resend(key);
  return resend;
}

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

const FROM = process.env.EMAIL_FROM || "Rupiah Tracker <onboarding@resend.dev>";
const BASE_URL = process.env.PUBLIC_BASE_URL || "http://localhost:3000";

function fmtRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Math.round(n));
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const c = client();
  if (!c) throw new Error("email not configured");
  const url = `${BASE_URL}/api/email/verify?token=${encodeURIComponent(token)}`;
  await c.emails.send({
    from: FROM,
    to: email,
    subject: "Konfirmasi langganan kurs USD/IDR",
    html: `
<div style="font-family:Georgia,serif;background:#F2EDE3;color:#0D0C0A;padding:40px;max-width:560px;margin:auto">
  <h1 style="font-size:32px;font-style:italic;font-weight:400;margin:0 0 16px">Konfirmasi alamat email kamu</h1>
  <p style="line-height:1.6;font-size:16px">Klik tombol di bawah untuk mengaktifkan langganan. Setelah dikonfirmasi, kamu akan menerima update kurs USD/IDR setiap pukul 09:00, 15:00, dan 21:00 WIB.</p>
  <p style="margin:32px 0"><a href="${url}" style="background:#0D0C0A;color:#F2EDE3;padding:14px 24px;text-decoration:none;font-family:monospace;font-size:14px;letter-spacing:0.05em">Konfirmasi Email →</a></p>
  <p style="font-size:13px;color:#6B6760;line-height:1.5">Jika kamu tidak pernah mendaftar, abaikan email ini.</p>
</div>`,
  });
}

export async function sendRateEmailToAll(rate: number, changePct: number | null, slot: string): Promise<number> {
  const c = client();
  if (!c) return 0;
  const verified = await db
    .select()
    .from(schema.emailSubscriptions)
    .where(and(eq(schema.emailSubscriptions.verified, 1), eq(schema.emailSubscriptions.active, 1)));
  if (verified.length === 0) return 0;

  const changeLabel = changePct == null
    ? ""
    : `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`;
  const changeColor = changePct == null ? "#6B6760" : changePct >= 0 ? "#8B2A1A" : "#1F4E3D";
  const slotLabel = slot === "morning" ? "Pagi" : slot === "afternoon" ? "Siang" : "Malam";
  const dateStr = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  let sent = 0;
  await Promise.all(
    verified.map(async (sub) => {
      try {
        await c.emails.send({
          from: FROM,
          to: sub.email,
          subject: `Update ${slotLabel}: USD/IDR Rp${fmtRupiah(rate)}`,
          html: `
<div style="font-family:Georgia,serif;background:#F2EDE3;color:#0D0C0A;padding:48px 32px;max-width:560px;margin:auto">
  <div style="font-family:monospace;font-size:11px;letter-spacing:0.2em;color:#6B6760;text-transform:uppercase">${dateStr} · Update ${slotLabel}</div>
  <div style="font-size:96px;font-style:italic;font-weight:400;line-height:1;margin:16px 0 8px">${fmtRupiah(rate)}</div>
  <div style="font-family:monospace;font-size:13px;color:#6B6760">Rupiah per 1 US Dollar${changeLabel ? ` · <span style="color:${changeColor}">${changeLabel}</span> dari update sebelumnya` : ""}</div>
  <hr style="border:none;border-top:1px solid #D9D3C6;margin:32px 0"/>
  <p style="line-height:1.7;font-size:15px;margin:0 0 24px">Lihat grafik historis, berita terkait, dan riwayat update di <a href="${BASE_URL}" style="color:#0D0C0A;text-decoration:underline">usd-to-idr.hanif.app</a>.</p>
  <p style="font-size:12px;color:#6B6760">Update otomatis setiap pukul 09:00, 15:00, dan 21:00 WIB.</p>
</div>`,
        });
        sent += 1;
      } catch (err) {
        console.error("[email] send error:", (err as Error).message);
      }
    }),
  );
  return sent;
}
