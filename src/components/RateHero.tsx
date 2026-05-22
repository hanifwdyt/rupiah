"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { fmtRupiah, fmtPct, fmtDateJakarta } from "@/lib/format";

type LatestRate = {
  rate: number | null;
  timestamp: number | null;
  changePct: number | null;
  source?: string;
};

function useAnimatedNumber(target: number) {
  const mv = useMotionValue(0);
  const out = useTransform(mv, (v) => fmtRupiah(v));
  useEffect(() => {
    const controls = animate(mv, target, { duration: 1.1, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [target, mv]);
  return out;
}

export function RateHero() {
  const [data, setData] = useState<LatestRate | null>(null);

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
        if (cancelled || !live?.rate) return;
        setData((prev) => ({
          rate: live.rate,
          timestamp: live.timestamp,
          changePct: prev?.changePct ?? null,
          source: live.source,
        }));
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
  const animated = useAnimatedNumber(rate);
  const change = data?.changePct;
  const dir = change == null ? "flat" : change > 0.02 ? "down" : change < -0.02 ? "up" : "flat";

  const headline =
    change == null
      ? "Memantau pergerakan kurs dolar terhadap rupiah"
      : change > 0.02
        ? `Rupiah melemah ke Rp${fmtRupiah(rate)} per Dolar AS`
        : change < -0.02
          ? `Rupiah menguat ke Rp${fmtRupiah(rate)} per Dolar AS`
          : `Rupiah bertahan di Rp${fmtRupiah(rate)} per Dolar AS`;

  return (
    <section className="px-5 md:px-10 pt-8 md:pt-12 pb-10 md:pb-14">
      <div className="kicker text-red mb-4">Laporan Utama · Kurs Hari Ini</div>

      <div className="grid lg:grid-cols-12 gap-6 lg:gap-10">
        {/* Left: headline + standfirst */}
        <div className="lg:col-span-7">
          <h2 className="headline text-paper text-[clamp(30px,5.2vw,60px)] max-w-3xl">
            {headline}
          </h2>
          <div className="rule-thin mt-6 pt-5 max-w-2xl">
            <p className="standfirst text-dim text-lg md:text-xl">
              Nilai tukar diperbarui setiap lima menit dari pasar global. Notifikasi otomatis dikirim
              tiga kali sehari — pukul 09.00, 15.00, dan 21.00 WIB — lengkap dengan berita ekonomi
              yang menyertainya.
            </p>
          </div>
        </div>

        {/* Right: the number block */}
        <div className="lg:col-span-5 lg:border-l lg:border-rule lg:pl-10">
          <div className="kicker text-faint mb-3">1 Dolar AS</div>
          <div className="flex items-start gap-2">
            <span className="font-serif text-faint text-2xl md:text-3xl mt-3 md:mt-4">Rp</span>
            <motion.div
              className="headline text-paper tabular-nums leading-none text-[clamp(64px,13vw,128px)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.span>{animated}</motion.span>
            </motion.div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
            <span
              className={`font-mono text-sm md:text-base ${
                dir === "down" ? "text-red" : dir === "up" ? "text-green" : "text-dim"
              }`}
            >
              {dir === "down" ? "▲" : dir === "up" ? "▼" : "■"}{" "}
              {change == null ? "—" : `${fmtPct(change)} / 24 jam`}
            </span>
            <span className="font-mono text-xs text-faint">
              {data?.timestamp
                ? `Per ${fmtDateJakarta(data.timestamp, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} WIB`
                : ""}
            </span>
          </div>

          <p className="bodycopy text-dim mt-6 text-[15px] leading-relaxed border-t border-rule pt-5">
            {change == null
              ? "Memuat data terakhir dari pasar."
              : change > 0.02
                ? "Kenaikan angka berarti rupiah melemah — butuh lebih banyak rupiah untuk satu dolar."
                : change < -0.02
                  ? "Penurunan angka berarti rupiah menguat terhadap dolar."
                  : "Pergerakan relatif datar dalam 24 jam terakhir."}
          </p>
        </div>
      </div>
    </section>
  );
}
