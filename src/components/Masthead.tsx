"use client";

import { useEffect, useState } from "react";
import { fmtDateJakarta } from "@/lib/format";

function edition(d: Date): string {
  const h = parseInt(
    new Intl.DateTimeFormat("en-US", { hour: "2-digit", hour12: false, timeZone: "Asia/Jakarta" }).format(d),
    10,
  );
  if (h < 12) return "Edisi Pagi";
  if (h < 18) return "Edisi Siang";
  return "Edisi Malam";
}

export function Masthead() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <header className="px-5 md:px-10 pt-5 md:pt-7">
      {/* top meta line */}
      <div className="flex items-center justify-between kicker text-faint pb-3">
        <span className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red animate-pulse" />
          <span className="text-paper">Live</span>
        </span>
        <span className="hidden sm:block">
          {now ? `${fmtDateJakarta(now, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}` : "—"}
        </span>
        <span>{now ? `${fmtDateJakarta(now, { hour: "2-digit", minute: "2-digit" })} WIB` : "—"}</span>
      </div>

      {/* nameplate */}
      <div className="rule-thick border-b border-rule pt-3 pb-4 md:pt-4 md:pb-5 flex items-end justify-between gap-4">
        <h1 className="headline text-paper leading-[0.85] text-[clamp(34px,7vw,72px)]">
          Rupiah&nbsp;Watch
        </h1>
        <div className="text-right shrink-0 pb-1">
          <div className="kicker text-faint">{now ? edition(now) : ""}</div>
          <div className="font-mono text-[11px] md:text-xs text-dim mt-1">USD · IDR</div>
        </div>
      </div>

      {/* sub-rule with descriptor */}
      <div className="flex items-center justify-between py-2 border-b border-rule">
        <span className="kicker text-faint">Pemantau Kurs Dolar — Rupiah</span>
        <span className="kicker text-faint hidden md:block">Sumber · Yahoo Finance</span>
      </div>
    </header>
  );
}
