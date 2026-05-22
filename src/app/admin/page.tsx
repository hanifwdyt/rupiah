"use client";

import { useEffect, useState } from "react";
import { fmtDateJakarta, fmtRupiah, fmtPct, slotLabel } from "@/lib/format";

type Stats = {
  pushActive: number;
  emailVerified: number;
  emailUnverified: number;
  rateRows: number;
  newsRows: number;
};

type EmailSub = { id: number; email: string; verified: number; active: number; createdAt: number };
type PushSub = { id: number; active: number; createdAt: number; endpointDomain: string };
type Notif = {
  id: number;
  sentAt: number;
  slot: string;
  rate: number;
  rateChangePct: number | null;
  pushSentCount: number;
  emailSentCount: number;
};

type Data = {
  stats: Stats;
  emailSubscriptions: EmailSub[];
  pushSubscriptions: PushSub[];
  recentNotifications: Notif[];
};

const STORAGE_KEY = "rupiah-admin-key";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom push form
  const [pushTitle, setPushTitle] = useState("Update kurs USD/IDR");
  const [pushBody, setPushBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      setAdminKey(saved);
      load(saved);
    }
  }, []);

  async function load(key: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/stats?key=${encodeURIComponent(key)}`);
      if (res.status === 401) {
        setError("Admin key salah");
        setAuthed(false);
        setData(null);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as Data;
      setData(json);
      setAuthed(true);
      localStorage.setItem(STORAGE_KEY, key);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function runScheduled(slot?: "morning" | "afternoon" | "night") {
    if (!adminKey) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch(`/api/admin/send-push?key=${encodeURIComponent(adminKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "scheduled", slot }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setSendResult(`✓ Push ${json.result?.pushSent ?? 0} · Email ${json.result?.emailSent ?? 0}`);
      await load(adminKey);
    } catch (err) {
      setSendResult(`✗ ${(err as Error).message}`);
    } finally {
      setSending(false);
    }
  }

  async function sendCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!adminKey || !pushBody) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch(`/api/admin/send-push?key=${encodeURIComponent(adminKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "custom", title: pushTitle, message: pushBody }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setSendResult(`✓ Push terkirim ke ${json.pushSent} subscriber`);
      setPushBody("");
    } catch (err) {
      setSendResult(`✗ ${(err as Error).message}`);
    } finally {
      setSending(false);
    }
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(adminKey);
          }}
          className="w-full max-w-sm space-y-4"
        >
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-faint">Admin Access</div>
          <h1 className="headline text-4xl">Masukkan admin key</h1>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="admin key"
            className="w-full bg-transparent border-b border-rule focus:border-paper py-3 font-mono text-sm outline-none"
          />
          {error && <p className="font-mono text-xs text-red">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full border border-paperpy-3 font-mono text-xs uppercase tracking-[0.2em] hover:bg-paper hover:text-ink transition-colors"
          >
            {loading ? "Memuat…" : "Masuk →"}
          </button>
        </form>
      </main>
    );
  }

  if (!data) {
    return <div className="p-12 font-mono text-xs text-faint">Memuat…</div>;
  }

  return (
    <main className="min-h-screen px-6 md:px-12 py-12 md:py-16 max-w-6xl mx-auto">
      <header className="flex items-baseline justify-between mb-12 md:mb-16 border-b border-rule pb-6">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-faint mb-2">Admin</div>
          <h1 className="headline text-4xl md:text-5xl">Dashboard</h1>
        </div>
        <button
          onClick={() => load(adminKey)}
          disabled={loading}
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint hover:text-paper"
        >
          {loading ? "Memuat…" : "↻ Refresh"}
        </button>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-10 mb-16 md:mb-20">
        <Stat label="Push aktif" value={data.stats.pushActive} />
        <Stat label="Email verified" value={data.stats.emailVerified} />
        <Stat label="Email belum verif" value={data.stats.emailUnverified} />
        <Stat label="Data kurs" value={data.stats.rateRows} />
        <Stat label="Berita ter-crawl" value={data.stats.newsRows} />
      </section>

      {/* Manual trigger */}
      <section className="mb-16 md:mb-20">
        <h2 className="headline text-3xl mb-6">Kirim notifikasi sekarang</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-faint">
              Mode otomatis (rate + delta dari log terakhir)
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["morning", "afternoon", "night"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => runScheduled(s)}
                  disabled={sending}
                  className="border border-paperpy-3 font-mono text-xs uppercase tracking-[0.2em] hover:bg-paper hover:text-ink transition-colors disabled:opacity-40"
                >
                  {slotLabel(s)}
                </button>
              ))}
            </div>
            <button
              onClick={() => runScheduled()}
              disabled={sending}
              className="w-full border border-paperpy-3 font-mono text-xs uppercase tracking-[0.2em] bg-paper text-ink hover:opacity-80 disabled:opacity-40"
            >
              Auto slot (ikut jam sekarang)
            </button>
          </div>

          <form onSubmit={sendCustom} className="space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-faint">
              Mode custom (push only, ga simpan log)
            </div>
            <input
              type="text"
              value={pushTitle}
              onChange={(e) => setPushTitle(e.target.value)}
              placeholder="Judul"
              className="w-full bg-transparent border-b border-rule focus:border-paper py-2 font-mono text-sm outline-none"
            />
            <textarea
              value={pushBody}
              onChange={(e) => setPushBody(e.target.value)}
              placeholder="Pesan"
              rows={3}
              required
              className="w-full bg-transparent border border-rule focus:border-paper p-3 font-mono text-sm outline-none resize-none"
            />
            <button
              type="submit"
              disabled={sending || !pushBody}
              className="w-full border border-paper py-3 font-mono text-xs uppercase tracking-[0.2em] hover:bg-paper hover:text-ink transition-colors disabled:opacity-40"
            >
              Kirim push custom
            </button>
          </form>
        </div>
        {sendResult && (
          <div className="mt-4 font-mono text-xs text-faint">
            {sendResult}
          </div>
        )}
      </section>

      {/* Email subscribers */}
      <section className="mb-16 md:mb-20">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="headline text-3xl">Email subscribers</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-faint">
            {data.emailSubscriptions.length} total
          </span>
        </div>
        {data.emailSubscriptions.length === 0 ? (
          <div className="font-mono text-xs text-faint py-8">Belum ada email subscriber.</div>
        ) : (
          <div className="border-t border-b border-rule divide-y divide-rule">
            {data.emailSubscriptions.map((e) => (
              <div key={e.id} className="grid grid-cols-12 gap-4 py-3 items-baseline">
                <span className="col-span-7 md:col-span-7 font-mono text-sm truncate">{e.email}</span>
                <span className="col-span-3 md:col-span-2 font-mono text-[10px] uppercase tracking-[0.2em]">
                  {e.verified ? <span className="text-green">✓ verified</span> : <span className="text-red">unverified</span>}
                </span>
                <span className="col-span-2 md:col-span-3 font-mono text-[10px] text-faint text-right md:text-left">
                  {fmtDateJakarta(e.createdAt, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Push subscribers */}
      <section className="mb-16 md:mb-20">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="headline text-3xl">Push subscribers</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-faint">
            {data.pushSubscriptions.length} total
          </span>
        </div>
        {data.pushSubscriptions.length === 0 ? (
          <div className="font-mono text-xs text-faint py-8">Belum ada push subscriber.</div>
        ) : (
          <div className="border-t border-b border-rule divide-y divide-rule">
            {data.pushSubscriptions.map((p) => (
              <div key={p.id} className="grid grid-cols-12 gap-4 py-3 items-baseline">
                <span className="col-span-1 font-mono text-xs text-faint">#{p.id}</span>
                <span className="col-span-6 font-mono text-sm truncate">{p.endpointDomain}</span>
                <span className="col-span-2 font-mono text-[10px] uppercase tracking-[0.2em]">
                  {p.active ? <span className="text-green">active</span> : <span className="text-faint">inactive</span>}
                </span>
                <span className="col-span-3 font-mono text-[10px] text-faint text-right md:text-left">
                  {fmtDateJakarta(p.createdAt, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent notifications */}
      <section>
        <h2 className="headline text-3xl mb-6">20 notifikasi terakhir</h2>
        {data.recentNotifications.length === 0 ? (
          <div className="font-mono text-xs text-faint py-8">Belum ada notifikasi terkirim.</div>
        ) : (
          <div className="border-t border-b border-rule divide-y divide-rule">
            {data.recentNotifications.map((n) => (
              <div key={n.id} className="grid grid-cols-12 gap-2 py-3 items-baseline font-mono text-sm">
                <span className="col-span-3 text-[11px] text-faint">
                  {fmtDateJakarta(n.sentAt, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="col-span-2 text-[11px] uppercase tracking-[0.15em] text-faint">{slotLabel(n.slot)}</span>
                <span className="col-span-3 headline text-lg">Rp{fmtRupiah(n.rate)}</span>
                <span className={`col-span-1 text-xs ${n.rateChangePct == null ? "text-faint" : n.rateChangePct > 0 ? "text-red" : "text-green"}`}>
                  {n.rateChangePct != null ? fmtPct(n.rateChangePct) : "—"}
                </span>
                <span className="col-span-2 text-[11px] text-faint">push: {n.pushSentCount}</span>
                <span className="col-span-1 text-[11px] text-faint">mail: {n.emailSentCount}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="mt-20 pt-8 border-t border-rule flex justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-faint">
        <span>Rupiah Tracker · Admin</span>
        <button
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY);
            setAuthed(false);
            setAdminKey("");
            setData(null);
          }}
          className="hover:text-ink"
        >
          Logout
        </button>
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-faint mb-2">{label}</div>
      <div className="headline text-4xl md:text-5xl tabular-nums">{value.toLocaleString("id-ID")}</div>
    </div>
  );
}
