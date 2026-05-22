"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { fmtRupiah, fmtPct, fmtDateJakarta } from "@/lib/format";

type Latest = { rate: number | null; timestamp: number | null; changePct: number | null };
type Point = { timestamp: number; rate: number };

function useCounter(target: number) {
  const mv = useMotionValue(0);
  const out = useTransform(mv, (v) => fmtRupiah(v));
  useEffect(() => {
    const c = animate(mv, target, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
    return () => c.stop();
  }, [target, mv]);
  return out;
}

export function RateHero() {
  const [data, setData] = useState<Latest | null>(null);
  const [yearStats, setYearStats] = useState<{ high: number; low: number; yoy: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const stored = await fetch("/api/rates/latest").then((r) => r.json());
        if (!cancelled) setData(stored);
      } catch {
        if (!cancelled) setData({ rate: null, timestamp: null, changePct: null });
      }
      try {
        const live = await fetch("/api/rates/live").then((r) => r.json());
        if (!cancelled && live?.rate)
          setData((p) => ({ rate: live.rate, timestamp: live.timestamp, changePct: p?.changePct ?? null }));
      } catch {}
      try {
        const hist = await fetch("/api/rates/history?range=1y").then((r) => r.json());
        const points: Point[] = hist.points || [];
        if (!cancelled && points.length > 1) {
          const rates = points.map((p) => p.rate);
          const high = Math.max(...rates);
          const low = Math.min(...rates);
          const yoy = ((rates[rates.length - 1] - rates[0]) / rates[0]) * 100;
          setYearStats({ high, low, yoy });
        }
      } catch {}
    }
    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const rate = data?.rate ?? 0;
  const counter = useCounter(rate);
  const change = data?.changePct;
  const dir = change == null ? "flat" : change > 0.02 ? "down" : change < -0.02 ? "up" : "flat";

  return (
    <header
      id="top"
      className="mx-auto max-w-page px-[var(--page-gutter)] pt-[var(--space-3xl)] pb-[var(--space-4xl)]"
    >
      {/* eyebrow-free: a single label line + the figure stacked vertically */}
      <div className="flex items-center gap-2 label mb-[var(--space-lg)]">
        <span className="live-dot" />
        <span>Kurs USD ke IDR · {data?.timestamp ? `${fmtDateJakarta(data.timestamp, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} WIB` : "live"}</span>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_auto] gap-x-[var(--space-2xl)] gap-y-[var(--space-lg)] items-end">
        <div className="flex items-start gap-3">
          <span className="font-display font-light text-2xl md:text-3xl text-muted mt-[0.6em]">Rp</span>
          <motion.div
            className="stat-figure text-stat text-ink"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.span>{counter}</motion.span>
          </motion.div>
        </div>

        <div
          className={`font-mono text-lg md:text-xl tabular-nums pb-2 ${
            dir === "down" ? "text-down" : dir === "up" ? "text-up" : "text-muted"
          }`}
        >
          {dir === "down" ? "▲" : dir === "up" ? "▼" : "■"}{" "}
          {change == null ? "—" : `${fmtPct(change)} / 24 jam`}
        </div>
      </div>

      <p className="mt-[var(--space-lg)] max-w-[var(--measure)] text-ink2 text-md md:text-lg leading-relaxed">
        Harga satu dolar Amerika dalam rupiah, diperbarui setiap lima menit dari pasar global.
        {yearStats
          ? ` Dalam setahun terakhir rupiah ${yearStats.yoy >= 0 ? "melemah" : "menguat"} ${Math.abs(yearStats.yoy).toFixed(1)}% terhadap dolar.`
          : ""}
      </p>

      {/* secondary stat strip — T4, real numbers only */}
      <dl className="mt-[var(--space-2xl)] grid grid-cols-2 md:grid-cols-4 border-t border-rule">
        <Stat label="Perubahan 24 jam" value={change == null ? "—" : fmtPct(change)} tone={dir} />
        <Stat label="Tertinggi 52 pekan" value={yearStats ? `Rp${fmtRupiah(yearStats.high)}` : "—"} />
        <Stat label="Terendah 52 pekan" value={yearStats ? `Rp${fmtRupiah(yearStats.low)}` : "—"} />
        <Stat
          label="Setahun"
          value={yearStats ? fmtPct(yearStats.yoy) : "—"}
          tone={yearStats ? (yearStats.yoy > 0 ? "down" : "up") : "flat"}
        />
      </dl>

      <div className="mt-[var(--space-xl)]">
        <a
          href="#grafik"
          className="inline-flex items-center gap-2 rounded-input border border-rule2 px-5 py-3 font-mono text-xs uppercase tracking-label text-ink2 transition-colors duration-[var(--dur-short)] ease-out hover:border-ink2 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focusring active:translate-y-px"
        >
          Lihat grafik <span aria-hidden>↓</span>
        </a>
      </div>
    </header>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" | "flat" }) {
  const color = tone === "down" ? "text-down" : tone === "up" ? "text-up" : "text-ink";
  return (
    <div className="border-b border-rule py-[var(--space-md)] pr-[var(--space-md)] md:border-b-0 md:border-r last:border-r-0 md:pl-[var(--space-md)] md:first:pl-0">
      <dt className="label mb-[var(--space-2xs)]">{label}</dt>
      <dd className={`font-display font-light text-xl md:text-2xl tabular-nums ${color}`}>{value}</dd>
    </div>
  );
}
