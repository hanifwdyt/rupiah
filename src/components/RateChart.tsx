"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { fmtRupiah, fmtDateJakarta } from "@/lib/format";

type Range = "1d" | "1w" | "1m" | "3m" | "6m" | "1y";

const RANGES: { value: Range; label: string }[] = [
  { value: "1d", label: "24J" },
  { value: "1w", label: "7H" },
  { value: "1m", label: "1B" },
  { value: "3m", label: "3B" },
  { value: "6m", label: "6B" },
  { value: "1y", label: "1T" },
];

type Point = { timestamp: number; rate: number };

export function RateChart() {
  const [range, setRange] = useState<Range>("1m");
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/rates/history?range=${range}`)
      .then((r) => r.json())
      .then((data) => setPoints(data.points || []))
      .finally(() => setLoading(false));
  }, [range]);

  const stats = useMemo(() => {
    if (points.length === 0) return null;
    const rates = points.map((p) => p.rate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const first = rates[0];
    const last = rates[rates.length - 1];
    const change = ((last - first) / first) * 100;
    return { min, max, first, last, change };
  }, [points]);

  return (
    <section className="bg-ink text-bone py-20 md:py-32 px-6 md:px-12 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-bone/50 mb-6">
            Grafik Historis
          </div>
          <h2 className="font-serif italic font-normal text-4xl md:text-6xl lg:text-7xl leading-[0.95] mb-12 md:mb-16 max-w-3xl">
            Pergerakan kurs USD/IDR
          </h2>
        </motion.div>

        {/* range selector */}
        <div className="flex flex-wrap gap-2 mb-8 md:mb-12">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`font-mono text-xs px-4 py-2 border transition-all ${
                range === r.value
                  ? "bg-bone text-ink border-bone"
                  : "border-bone/20 text-bone/60 hover:border-bone/60 hover:text-bone"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* stats row */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 mb-8 md:mb-12">
            <Stat label="Tertinggi" value={fmtRupiah(stats.max)} />
            <Stat label="Terendah" value={fmtRupiah(stats.min)} />
            <Stat label="Awal periode" value={fmtRupiah(stats.first)} />
            <Stat
              label="Perubahan"
              value={`${stats.change >= 0 ? "+" : ""}${stats.change.toFixed(2)}%`}
              accent={stats.change >= 0 ? "down" : "up"}
            />
          </div>
        )}

        {/* chart */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="h-[360px] md:h-[480px] -mx-2 md:mx-0"
        >
          {loading || points.length === 0 ? (
            <div className="h-full flex items-center justify-center text-bone/40 font-mono text-xs uppercase tracking-[0.2em]">
              {loading ? "Memuat data…" : "Data belum tersedia"}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(t) => fmtDateJakarta(t, range === "1d" ? { hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short" })}
                  stroke="#6B6760"
                  tick={{ fill: "#9B968A", fontFamily: "var(--font-mono)", fontSize: 10 }}
                  axisLine={{ stroke: "#2A2724" }}
                  tickLine={false}
                  minTickGap={40}
                />
                <YAxis
                  domain={["dataMin - 50", "dataMax + 50"]}
                  tickFormatter={(v) => fmtRupiah(v)}
                  stroke="#6B6760"
                  tick={{ fill: "#9B968A", fontFamily: "var(--font-mono)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                {stats && (
                  <ReferenceLine
                    y={stats.first}
                    stroke="#6B6760"
                    strokeDasharray="2 4"
                    strokeWidth={1}
                  />
                )}
                <Tooltip
                  cursor={{ stroke: "#F2EDE3", strokeWidth: 1, strokeDasharray: "2 4" }}
                  contentStyle={{
                    background: "#0D0C0A",
                    border: "1px solid #2A2724",
                    borderRadius: 0,
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    padding: "10px 14px",
                  }}
                  labelStyle={{ color: "#9B968A", textTransform: "uppercase", letterSpacing: "0.15em", fontSize: 10 }}
                  formatter={(v: number) => [`Rp${fmtRupiah(v)}`, "USD/IDR"]}
                  labelFormatter={(t) => fmtDateJakarta(t as number, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#F2EDE3"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive
                  animationDuration={1400}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <p className="mt-8 md:mt-12 font-mono text-[10px] uppercase tracking-[0.25em] text-bone/40 max-w-2xl">
          Sumber data: Yahoo Finance · Diperbarui setiap 15 menit
        </p>
      </div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "up" | "down" }) {
  const color = accent === "down" ? "text-[#E07B5E]" : accent === "up" ? "text-[#A8C4A0]" : "text-bone";
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-bone/40 mb-2">{label}</div>
      <div className={`font-serif italic text-2xl md:text-3xl ${color}`}>{value}</div>
    </div>
  );
}
