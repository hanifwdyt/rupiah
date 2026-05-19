"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { fmtRupiah, fmtPct, fmtDateJakarta } from "@/lib/format";

type LatestRate = {
  rate: number | null;
  timestamp: number | null;
  changePct: number | null;
};

function useAnimatedNumber(target: number) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => fmtRupiah(v));
  useEffect(() => {
    const controls = animate(mv, target, { duration: 1.6, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [target, mv]);
  return rounded;
}

export function RateHero() {
  const [data, setData] = useState<LatestRate | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetch("/api/rates/latest")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ rate: null, timestamp: null, changePct: null }));
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const rate = data?.rate ?? 0;
  const animated = useAnimatedNumber(rate);

  const change = data?.changePct;
  const direction = change == null ? "neutral" : change > 0 ? "down" : "up";
  const directionText =
    change == null
      ? "memuat data terakhir…"
      : change > 0.05
        ? `rupiah melemah ${fmtPct(change)} dalam 24 jam`
        : change < -0.05
          ? `rupiah menguat ${fmtPct(Math.abs(change))} dalam 24 jam`
          : "stabil dalam 24 jam";

  return (
    <section className="relative min-h-screen flex flex-col justify-between px-6 md:px-12 py-8 md:py-12 overflow-hidden">
      {/* top bar */}
      <header className="flex items-center justify-between text-[11px] md:text-xs font-mono uppercase tracking-[0.2em] text-subtle">
        <div className="flex items-center gap-3">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-crimson animate-pulse" />
          <span>Live · USD/IDR</span>
        </div>
        <div className="hidden md:block">
          {fmtDateJakarta(now, { hour: "2-digit", minute: "2-digit", second: "2-digit" })} WIB
        </div>
      </header>

      {/* hero number */}
      <div className="flex-1 flex flex-col justify-center -mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-mono text-[11px] md:text-xs uppercase tracking-[0.3em] text-subtle mb-4 md:mb-6"
        >
          1 Dolar Amerika setara
        </motion.div>

        <div className="relative">
          <motion.h1
            className="font-serif italic font-normal leading-[0.85] tracking-tight text-ink"
            style={{ fontSize: "clamp(80px, 16vw, 260px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <motion.span>{animated}</motion.span>
          </motion.h1>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="absolute -right-1 md:right-0 top-2 md:top-4 font-mono text-xs md:text-sm uppercase tracking-[0.3em] text-subtle"
          >
            IDR
          </motion.span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-6 md:mt-10 flex items-baseline gap-4 flex-wrap"
        >
          <span
            className={`font-mono text-sm md:text-base ${
              direction === "down" ? "text-crimson" : direction === "up" ? "text-[#2F5D40]" : "text-subtle"
            }`}
          >
            {direction === "down" ? "↓" : direction === "up" ? "↑" : "→"} {directionText}
          </span>
          <span className="font-mono text-[11px] text-subtle">
            {data?.timestamp ? `· ${fmtDateJakarta(data.timestamp, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} WIB` : ""}
          </span>
        </motion.div>
      </div>

      {/* footer manifesto */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        className="grid md:grid-cols-3 gap-6 md:gap-12 pt-12 md:pt-0 max-w-5xl"
      >
        <p className="text-sm md:text-base leading-relaxed text-ink/80 md:col-span-2 font-serif">
          Sebuah catatan terbuka soal pelemahan rupiah — diperbarui otomatis, dikirim ke lo
          tiga kali sehari, dibaca dari sumber resmi global.
        </p>
        <div className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.25em] text-subtle md:text-right md:self-end">
          ↓ Scroll buat lihat chart, riwayat, dan berita
        </div>
      </motion.div>
    </section>
  );
}
