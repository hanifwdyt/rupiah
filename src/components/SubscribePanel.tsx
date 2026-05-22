"use client";

import { useEffect, useState } from "react";

type PushState = "unsupported" | "denied" | "subscribed" | "idle" | "loading";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}
function isInStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

export function SubscribePanel() {
  const [push, setPush] = useState<PushState>("idle");
  const [email, setEmail] = useState("");
  const [emailState, setEmailState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [isIOS, setIsIOS] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    setIsIOS(detectIOS());
    setIsPWA(isInStandaloneMode());
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPush("unsupported");
      return;
    }
    if (Notification.permission === "denied") setPush("denied");
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      if (sub) setPush("subscribed");
    });
  }, []);

  async function enablePush() {
    if (push === "unsupported" || push === "loading") return;
    setPush("loading");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setPush(perm === "denied" ? "denied" : "idle");
        return;
      }
      const { key } = await fetch("/api/vapid-public-key").then((r) => r.json());
      if (!key) throw new Error("vapid_key_missing");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("subscribe_failed");
      setPush("subscribed");
    } catch (err) {
      console.error(err);
      setPush("idle");
    }
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email || emailState === "loading") return;
    setEmailState("loading");
    try {
      const res = await fetch("/api/email/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setEmailState("sent");
      setEmail("");
    } catch {
      setEmailState("error");
    }
  }

  const pushLabel =
    push === "subscribed"
      ? "Notifikasi aktif"
      : push === "loading"
        ? "Memproses…"
        : push === "denied"
          ? "Izin ditolak browser"
          : push === "unsupported"
            ? "Tidak didukung browser"
            : "Aktifkan notifikasi";

  return (
    <section className="px-5 md:px-10 py-10 md:py-14 border-t border-rule">
      <div className="rule-thick pt-3 mb-8 md:mb-10 flex items-baseline justify-between">
        <div className="kicker text-red">Langganan</div>
        <div className="kicker text-faint">Gratis · 3× sehari</div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-4">
          <h3 className="headline text-paper text-3xl md:text-4xl max-w-sm">
            Berhenti memeriksa kurs setiap saat
          </h3>
          <p className="bodycopy text-dim mt-5 max-w-sm">
            Daftar sekali, dan biarkan kabar terbaru yang menghampiri. Update dikirim setiap pukul
            09.00, 15.00, dan 21.00 WIB.
          </p>
        </div>

        {/* Two subscription "boxes" like a newspaper classified */}
        <div className="lg:col-span-8 grid md:grid-cols-2 border border-rule">
          {/* Push */}
          <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-rule flex flex-col">
            <div className="flex items-baseline justify-between mb-4">
              <span className="kicker text-faint">Cara 01</span>
              <span className="kicker text-faint">Browser</span>
            </div>
            <h4 className="headline text-paper text-2xl mb-3">Notifikasi langsung</h4>
            <p className="bodycopy text-dim text-[15px] flex-1 mb-6">
              Muncul di perangkat tanpa perlu membuka situs. Berfungsi di Android, desktop, dan
              iPhone (lewat Add to Home Screen).
            </p>

            {isIOS && !isPWA && (
              <p className="kicker text-faint leading-relaxed normal-case tracking-normal text-[12px] mb-5 border-l-2 border-red pl-3">
                <span className="kicker text-red">Untuk iOS — </span>
                buka menu Share di Safari, pilih <em>Add to Home Screen</em>, lalu aktifkan dari sana.
              </p>
            )}

            <button
              onClick={enablePush}
              disabled={push === "loading" || push === "subscribed" || push === "unsupported"}
              className={`group flex items-center justify-between border px-5 py-3.5 transition-colors ${
                push === "subscribed"
                  ? "bg-paper text-ink border-paper cursor-default"
                  : push === "unsupported" || push === "denied"
                    ? "border-rule text-faint opacity-60 cursor-not-allowed"
                    : "border-paper text-paper hover:bg-paper hover:text-ink"
              }`}
            >
              <span className="kicker">{pushLabel}</span>
              {push !== "subscribed" && push !== "denied" && push !== "unsupported" && (
                <span className="font-serif text-lg group-hover:translate-x-1 transition-transform">→</span>
              )}
            </button>
          </div>

          {/* Email */}
          <div className="p-6 md:p-8 flex flex-col">
            <div className="flex items-baseline justify-between mb-4">
              <span className="kicker text-faint">Cara 02</span>
              <span className="kicker text-faint">Email</span>
            </div>
            <h4 className="headline text-paper text-2xl mb-3">Ringkasan ke inbox</h4>
            <p className="bodycopy text-dim text-[15px] flex-1 mb-6">
              Tiga email singkat per hari berisi kurs terbaru. Konfirmasi alamat sekali di awal.
            </p>
            <form onSubmit={submitEmail} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full bg-transparent border-b border-rule focus:border-paper py-3 font-mono text-sm text-paper placeholder:text-faint outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={emailState === "loading" || emailState === "sent"}
                className={`group w-full flex items-center justify-between border px-5 py-3.5 transition-colors ${
                  emailState === "sent"
                    ? "bg-paper text-ink border-paper cursor-default"
                    : "border-paper text-paper hover:bg-paper hover:text-ink"
                }`}
              >
                <span className="kicker">
                  {emailState === "loading"
                    ? "Mengirim…"
                    : emailState === "sent"
                      ? "Cek inbox kamu"
                      : emailState === "error"
                        ? "Gagal — coba lagi"
                        : "Daftar"}
                </span>
                {emailState === "idle" && (
                  <span className="font-serif text-lg group-hover:translate-x-1 transition-transform">→</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
