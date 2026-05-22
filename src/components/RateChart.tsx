"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { fmtRupiah, fmtDateJakarta } from "@/lib/format";

type Range = "1d" | "1w" | "1m" | "3m" | "6m" | "1y";

const RANGES: { value: Range; label: string }[] = [
  { value: "1d", label: "24 Jam" },
  { value: "1w", label: "Pekan" },
  { value: "1m", label: "Bulan" },
  { value: "3m", label: "3 Bln" },
  { value: "6m", label: "6 Bln" },
  { value: "1y", label: "Tahun" },
];

type Point = { timestamp: number; rate: number };

export function RateChart() {
  const [range, setRange] = useState<Range>("1y");
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
    if (points.length < 2) return null;
    let maxP = points[0];
    let minP = points[0];
    for (const p of points) {
      if (p.rate > maxP.rate) maxP = p;
      if (p.rate < minP.rate) minP = p;
    }
    const first = points[0].rate;
    const last = points[points.length - 1].rate;
    const change = ((last - first) / first) * 100;
    return { maxP, minP, first, last, change };
  }, [points]);

  const rangeNote =
    range === "1y" ? "12 bulan terakhir" : range === "1d" ? "24 jam terakhir" : "periode terpilih";

  return (
    <section className="px-5 md:px-10 py-10 md:py-14 border-t border-rule">
      {/* section header */}
      <div className="rule-thick pt-3 mb-8 md:mb-10 flex items-baseline justify-between">
        <div className="kicker text-red">Grafik · Pergerakan</div>
        <div className="kicker text-faint">{rangeNote}</div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left rail: headline + stats */}
        <div className="lg:col-span-3">
          <h3 className="headline text-paper text-3xl md:text-4xl mb-6 max-w-xs">
            Jejak nilai tukar dari waktu ke waktu
          </h3>
          {stats && (
            <dl className="space-y-4 border-t border-rule pt-5">
              <StatRow label="Tertinggi" value={`Rp${fmtRupiah(stats.maxP.rate)}`} />
              <StatRow label="Terendah" value={`Rp${fmtRupiah(stats.minP.rate)}`} />
              <StatRow label="Awal periode" value={`Rp${fmtRupiah(stats.first)}`} />
              <StatRow
                label="Perubahan"
                value={`${stats.change >= 0 ? "+" : ""}${stats.change.toFixed(2)}%`}
                accent={stats.change >= 0 ? "down" : "up"}
              />
            </dl>
          )}
        </div>

        {/* Chart */}
        <div className="lg:col-span-9">
          {/* range selector */}
          <div className="flex flex-wrap gap-0 mb-6 border border-rule w-fit">
            {RANGES.map((r, i) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`kicker px-3.5 py-2 transition-colors ${i > 0 ? "border-l border-rule" : ""} ${
                  range === r.value ? "bg-paper text-ink" : "text-dim hover:text-paper"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="h-[340px] md:h-[460px] -mx-2 md:mx-0">
            {loading || points.length < 2 ? (
              <div className="h-full flex items-center justify-center kicker text-faint">
                {loading ? "Memuat data" : "Data belum tersedia"}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={points} margin={{ top: 28, right: 16, left: 4, bottom: 8 }}>
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(t) =>
                      fmtDateJakarta(
                        t,
                        range === "1d"
                          ? { hour: "2-digit", minute: "2-digit" }
                          : { day: "numeric", month: "short" },
                      )
                    }
                    stroke="#2C2922"
                    tick={{ fill: "#6E6757", fontFamily: "var(--font-mono)", fontSize: 10 }}
                    axisLine={{ stroke: "#2C2922" }}
                    tickLine={false}
                    minTickGap={48}
                  />
                  <YAxis
                    domain={["dataMin - 40", "dataMax + 40"]}
                    tickFormatter={(v) => fmtRupiah(v)}
                    stroke="#2C2922"
                    tick={{ fill: "#6E6757", fontFamily: "var(--font-mono)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                    orientation="right"
                  />
                  <Tooltip
                    cursor={{ stroke: "#ECE7DB", strokeWidth: 1, strokeDasharray: "2 3" }}
                    contentStyle={{
                      background: "#1A1712",
                      border: "1px solid #2C2922",
                      borderRadius: 0,
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      padding: "8px 12px",
                      color: "#ECE7DB",
                    }}
                    labelStyle={{
                      color: "#6E6757",
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      fontSize: 9,
                      marginBottom: 4,
                    }}
                    formatter={(v: number) => [`Rp${fmtRupiah(v)}`, "USD/IDR"]}
                    labelFormatter={(t) =>
                      fmtDateJakarta(t as number, {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#ECE7DB"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive
                    animationDuration={1100}
                  />
                  {stats && (
                    <ReferenceDot
                      x={stats.maxP.timestamp}
                      y={stats.maxP.rate}
                      r={3}
                      fill="#E2483D"
                      stroke="none"
                      label={{
                        value: `Tertinggi  Rp${fmtRupiah(stats.maxP.rate)}`,
                        position: "top",
                        fill: "#E2483D",
                        fontSize: 10,
                        fontFamily: "var(--font-mono)",
                      }}
                    />
                  )}
                  {stats && (
                    <ReferenceDot
                      x={stats.minP.timestamp}
                      y={stats.minP.rate}
                      r={3}
                      fill="#5FB98A"
                      stroke="none"
                      label={{
                        value: `Terendah  Rp${fmtRupiah(stats.minP.rate)}`,
                        position: "bottom",
                        fill: "#5FB98A",
                        fontSize: 10,
                        fontFamily: "var(--font-mono)",
                      }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <p className="kicker text-faint mt-5 border-t border-rule pt-4">
            Sumber data · Yahoo Finance — diperbarui setiap 5 menit. Titik merah menandai level
            terlemah, hijau level terkuat pada {rangeNote}.
          </p>
        </div>
      </div>
    </section>
  );
}

function StatRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "up" | "down";
}) {
  const color = accent === "down" ? "text-red" : accent === "up" ? "text-green" : "text-paper";
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="kicker text-faint">{label}</dt>
      <dd className={`font-mono text-sm ${color}`}>{value}</dd>
    </div>
  );
}
