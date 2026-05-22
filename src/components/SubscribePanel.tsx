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
function isStandalone(): boolean {
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
    setIsPWA(isStandalone());
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
          ? "Izin ditolak"
          : push === "unsupported"
            ? "Tak didukung"
            : "Aktifkan di browser ini";

  return (
    <section
      id="langganan"
      className="mx-auto max-w-page px-[var(--page-gutter)] py-[var(--section-gap)]"
    >
      <h2 className="font-display font-light text-display-s text-ink tracking-tight max-w-2xl">
        Berhenti memeriksa kurs setiap saat
      </h2>
      <p className="mt-[var(--space-sm)] max-w-[var(--measure)] text-muted text-md">
        Daftar sekali — kabar terbarunya yang menghampiri kamu, tiga kali sehari, pukul 09.00, 15.00,
        dan 21.00 WIB.
      </p>

      <div className="mt-[var(--space-2xl)] grid md:grid-cols-2 gap-[var(--space-2xl)]">
        {/* Push */}
        <div className="md:pr-[var(--space-2xl)] md:border-r border-rule flex flex-col">
          <div className="label mb-[var(--space-sm)]">Lewat browser</div>
          <p className="text-ink2 text-md leading-relaxed flex-1">
            Notifikasi muncul langsung di perangkat tanpa membuka situs. Jalan di Android, desktop,
            dan iPhone setelah ditambahkan ke layar utama.
          </p>

          {isIOS && !isPWA && (
            <p className="mt-[var(--space-md)] text-sm text-muted leading-relaxed border-l border-rule2 pl-[var(--space-md)]">
              Di iPhone: buka menu Bagikan di Safari, pilih <span className="font-mono">Tambah ke Layar Utama</span>, lalu aktifkan dari sana.
            </p>
          )}

          <button
            onClick={enablePush}
            disabled={push === "loading" || push === "subscribed" || push === "unsupported"}
            className={`mt-[var(--space-lg)] inline-flex items-center justify-between gap-3 rounded-input px-5 py-3.5 font-mono text-xs uppercase tracking-label transition-colors duration-[var(--dur-short)] ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focusring ${
              push === "subscribed"
                ? "bg-paper3 text-ink cursor-default"
                : push === "unsupported" || push === "denied"
                  ? "border border-rule text-muted opacity-60 cursor-not-allowed"
                  : "bg-accent text-accentink hover:bg-ink2 active:translate-y-px"
            }`}
          >
            <span>{pushLabel}</span>
            {push === "idle" && <span aria-hidden>→</span>}
          </button>
        </div>

        {/* Email — C2 inline form */}
        <div className="flex flex-col">
          <div className="label mb-[var(--space-sm)]">Lewat email</div>
          <p className="text-ink2 text-md leading-relaxed flex-1">
            Tiga ringkasan singkat per hari ke inbox. Konfirmasi alamat sekali, setelahnya otomatis.
          </p>
          <form onSubmit={submitEmail} className="mt-[var(--space-lg)] flex flex-col sm:flex-row gap-[var(--space-sm)]">
            <label htmlFor="email" className="sr-only">Alamat email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="flex-1 min-w-0 rounded-input border border-rule bg-paper2 px-4 py-3.5 font-mono text-sm text-ink placeholder:text-muted outline-none transition-colors duration-[var(--dur-short)] hover:border-rule2 focus:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focusring"
            />
            <button
              type="submit"
              disabled={emailState === "loading" || emailState === "sent"}
              className={`whitespace-nowrap rounded-input px-5 py-3.5 font-mono text-xs uppercase tracking-label transition-colors duration-[var(--dur-short)] ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focusring ${
                emailState === "sent"
                  ? "bg-paper3 text-ink cursor-default"
                  : "bg-accent text-accentink hover:bg-ink2 active:translate-y-px"
              }`}
            >
              {emailState === "loading"
                ? "Mengirim…"
                : emailState === "sent"
                  ? "Cek inbox"
                  : emailState === "error"
                    ? "Coba lagi"
                    : "Daftar"}
            </button>
          </form>
          <p className="mt-[var(--space-sm)] text-sm text-muted min-h-[1lh]">
            {emailState === "sent"
              ? "Tautan konfirmasi sudah dikirim ke email kamu."
              : emailState === "error"
                ? "Gagal mengirim. Periksa alamat dan coba lagi."
                : "Bisa berhenti kapan saja."}
          </p>
        </div>
      </div>
    </section>
  );
}
