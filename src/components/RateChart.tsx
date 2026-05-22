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
  { value: "1d", label: "24J" },
  { value: "1w", label: "1P" },
  { value: "1m", label: "1B" },
  { value: "3m", label: "3B" },
  { value: "6m", label: "6B" },
  { value: "1y", label: "1T" },
];
type Point = { timestamp: number; rate: number };

function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function RateChart() {
  const [range, setRange] = useState<Range>("1y");
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [palette, setPalette] = useState({
    ink: "#eef2f6",
    accent: "#74c7e6",
    rule: "#3a3f4a",
    muted: "#9aa3b2",
    down: "#e0584a",
    up: "#5fb98a",
    paper2: "#1c2330",
  });

  useEffect(() => {
    setPalette({
      ink: cssVar("--color-ink", "#eef2f6"),
      accent: cssVar("--color-accent", "#74c7e6"),
      rule: cssVar("--color-rule", "#3a3f4a"),
      muted: cssVar("--color-muted", "#9aa3b2"),
      down: cssVar("--color-down", "#e0584a"),
      up: cssVar("--color-up", "#5fb98a"),
      paper2: cssVar("--color-paper-2", "#1c2330"),
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/rates/history?range=${range}`)
      .then((r) => r.json())
      .then((d) => setPoints(d.points || []))
      .finally(() => setLoading(false));
  }, [range]);

  const stats = useMemo(() => {
    if (points.length < 2) return null;
    let hi = points[0];
    let lo = points[0];
    for (const p of points) {
      if (p.rate > hi.rate) hi = p;
      if (p.rate < lo.rate) lo = p;
    }
    const change = ((points[points.length - 1].rate - points[0].rate) / points[0].rate) * 100;
    return { hi, lo, change };
  }, [points]);

  return (
    <section id="grafik" className="mx-auto max-w-page px-[var(--page-gutter)] pt-[var(--space-xl)] pb-[var(--section-gap)]">
      {/* hanging heading — heading then dek, vertical stack, no eyebrow */}
      <h2 className="font-display font-light text-display-s text-ink tracking-tight max-w-2xl">
        Pergerakan kurs dari waktu ke waktu
      </h2>
      <p className="mt-[var(--space-sm)] max-w-[var(--measure)] text-muted text-md">
        Garis penuh menandai harga penutupan. Titik menandai level terlemah dan terkuat pada rentang
        yang dipilih.
      </p>

      <div className="mt-[var(--space-xl)] flex flex-wrap items-center gap-[var(--space-lg)] justify-between">
        {stats && (
          <div className="flex flex-wrap gap-x-[var(--space-xl)] gap-y-[var(--space-sm)]">
            <Mini label="Tertinggi" value={`Rp${fmtRupiah(stats.hi.rate)}`} color="text-down" />
            <Mini label="Terendah" value={`Rp${fmtRupiah(stats.lo.rate)}`} color="text-up" />
            <Mini
              label="Perubahan"
              value={`${stats.change >= 0 ? "+" : ""}${stats.change.toFixed(2)}%`}
              color={stats.change >= 0 ? "text-down" : "text-up"}
            />
          </div>
        )}
        <div className="flex items-center border border-rule rounded-input overflow-hidden">
          {RANGES.map((r, i) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`font-mono text-xs px-3.5 py-2 transition-colors duration-[var(--dur-short)] ease-out ${i > 0 ? "border-l border-rule" : ""} ${
                range === r.value
                  ? "bg-accent text-accentink"
                  : "text-muted hover:text-ink"
              } focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focusring`}
              aria-pressed={range === r.value}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-[var(--space-lg)] h-[clamp(280px,46vh,520px)] -mx-2 md:mx-0">
        {loading || points.length < 2 ? (
          <div className="h-full flex items-center justify-center label">
            {loading ? "Memuat data" : "Data belum tersedia"}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 28, right: 12, left: 4, bottom: 8 }}>
              <XAxis
                dataKey="timestamp"
                tickFormatter={(t) =>
                  fmtDateJakarta(
                    t,
                    range === "1d" ? { hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short" },
                  )
                }
                stroke={palette.rule}
                tick={{ fill: palette.muted, fontFamily: "var(--font-mono)", fontSize: 10 }}
                axisLine={{ stroke: palette.rule }}
                tickLine={false}
                minTickGap={48}
              />
              <YAxis
                domain={["dataMin - 40", "dataMax + 40"]}
                tickFormatter={(v) => fmtRupiah(v)}
                stroke={palette.rule}
                tick={{ fill: palette.muted, fontFamily: "var(--font-mono)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={54}
                orientation="right"
              />
              <Tooltip
                cursor={{ stroke: palette.ink, strokeWidth: 1, strokeDasharray: "2 3" }}
                contentStyle={{
                  background: palette.paper2,
                  border: `1px solid ${palette.rule}`,
                  borderRadius: 8,
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  padding: "8px 12px",
                  color: palette.ink,
                }}
                labelStyle={{
                  color: palette.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
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
                stroke={palette.accent}
                strokeWidth={1.75}
                dot={false}
                isAnimationActive
                animationDuration={900}
                animationEasing="ease-out"
              />
              {stats && (
                <ReferenceDot
                  x={stats.hi.timestamp}
                  y={stats.hi.rate}
                  r={3.5}
                  fill={palette.down}
                  stroke={palette.paper2}
                  strokeWidth={1.5}
                />
              )}
              {stats && (
                <ReferenceDot
                  x={stats.lo.timestamp}
                  y={stats.lo.rate}
                  r={3.5}
                  fill={palette.up}
                  stroke={palette.paper2}
                  strokeWidth={1.5}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="mt-[var(--space-md)] label">Sumber · Yahoo Finance — diperbarui tiap 5 menit</p>
    </section>
  );
}

function Mini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="label mb-[var(--space-3xs)]">{label}</div>
      <div className={`font-mono text-md tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
