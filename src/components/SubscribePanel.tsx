"use client";

import { motion } from "framer-motion";
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
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as { standalone?: boolean }).standalone === true;
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

  return (
    <section className="px-6 md:px-12 py-20 md:py-32 border-t border-ink/10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-subtle mb-6">
            Berlangganan
          </div>
          <h2 className="font-serif italic font-normal text-4xl md:text-6xl lg:text-7xl leading-[0.95] mb-12 md:mb-16 max-w-3xl">
            Update kurs langsung ke perangkat kamu
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-px bg-ink/10">
          {/* Push notification card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-bone p-8 md:p-12 flex flex-col"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-subtle mb-4">
              Notifikasi Browser
            </div>
            <h3 className="font-serif italic text-2xl md:text-3xl mb-3">Push Notification</h3>
            <p className="text-sm md:text-base text-ink/70 leading-relaxed mb-8 flex-1">
              Aktifkan sekali, terima notifikasi otomatis setiap pukul 09:00, 15:00, dan 21:00 WIB
              tanpa perlu membuka website.
            </p>

            {isIOS && !isPWA && (
              <div className="mb-6 p-4 border border-ink/20 bg-bone">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle mb-2">Catatan untuk iOS</div>
                <p className="text-sm leading-relaxed">
                  Tap tombol <span className="font-mono">Share</span> di Safari, pilih <span className="font-mono">Add to Home Screen</span>. Buka dari home screen, lalu aktifkan notifikasi.
                </p>
              </div>
            )}

            <button
              onClick={enablePush}
              disabled={push === "loading" || push === "subscribed" || push === "unsupported"}
              className={`group flex items-center justify-between border border-ink px-6 py-4 transition-all ${
                push === "subscribed"
                  ? "bg-ink text-bone cursor-default"
                  : push === "unsupported" || push === "denied"
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-ink hover:text-bone"
              }`}
            >
              <span className="font-mono text-xs uppercase tracking-[0.2em]">
                {push === "subscribed"
                  ? "✓ Aktif"
                  : push === "loading"
                    ? "Memproses…"
                    : push === "denied"
                      ? "Izin ditolak"
                      : push === "unsupported"
                        ? "Browser tidak mendukung"
                        : "Aktifkan"}
              </span>
              {push !== "subscribed" && push !== "denied" && push !== "unsupported" && (
                <span className="font-serif italic text-lg group-hover:translate-x-1 transition-transform">→</span>
              )}
            </button>
          </motion.div>

          {/* Email subscription card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-bone p-8 md:p-12 flex flex-col"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-subtle mb-4">
              Email
            </div>
            <h3 className="font-serif italic text-2xl md:text-3xl mb-3">Update via Email</h3>
            <p className="text-sm md:text-base text-ink/70 leading-relaxed mb-8 flex-1">
              Terima ringkasan kurs ke inbox tiga kali sehari. Konfirmasi alamat email sekali,
              setelah itu otomatis.
            </p>
            <form onSubmit={submitEmail} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full bg-transparent border-b border-ink/30 focus:border-ink py-3 font-mono text-sm placeholder:text-subtle/60 outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={emailState === "loading" || emailState === "sent"}
                className={`group w-full flex items-center justify-between border border-ink px-6 py-4 transition-all ${
                  emailState === "sent" ? "bg-ink text-bone cursor-default" : "hover:bg-ink hover:text-bone"
                }`}
              >
                <span className="font-mono text-xs uppercase tracking-[0.2em]">
                  {emailState === "loading"
                    ? "Mengirim…"
                    : emailState === "sent"
                      ? "✓ Cek inbox kamu"
                      : emailState === "error"
                        ? "Gagal, coba lagi"
                        : "Daftar"}
                </span>
                {emailState === "idle" && (
                  <span className="font-serif italic text-lg group-hover:translate-x-1 transition-transform">→</span>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
