"use client";

import { useEffect, useState } from "react";
import { fmtRupiah } from "@/lib/format";

export function Nav() {
  const [rate, setRate] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const live = await fetch("/api/rates/live").then((r) => r.json());
        if (!cancelled && live?.rate) setRate(live.rate);
      } catch {}
    }
    load();
    const id = setInterval(load, 60_000);
    const onScroll = () => setScrolled(window.scrollY > 320);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      className="fixed inset-x-0 top-[var(--space-md)] z-[var(--z-nav)] flex justify-center px-[var(--page-gutter)] pointer-events-none"
    >
      <nav
        className="pointer-events-auto flex items-center gap-4 md:gap-6 rounded-pill border border-rule pl-5 pr-2 py-2 backdrop-blur-md"
        style={{
          background: "color-mix(in oklch, var(--color-paper-2) 82%, transparent)",
          boxShadow: "0 8px 30px color-mix(in oklch, var(--color-paper) 60%, transparent)",
        }}
      >
        <a href="#top" className="font-mono text-sm font-medium tracking-tight text-ink whitespace-nowrap">
          USD<span className="text-muted">/</span>IDR
        </a>

        <span
          className={`hidden sm:flex items-center gap-2 font-mono text-sm tabular-nums transition-opacity duration-[var(--dur-mid)] ${
            scrolled && rate ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={!(scrolled && rate)}
        >
          <span className="live-dot" />
          <span className="text-ink2">{rate ? `Rp${fmtRupiah(rate)}` : ""}</span>
        </span>

        <a
          href="#langganan"
          className="ml-auto whitespace-nowrap rounded-pill bg-accent px-4 py-2 font-mono text-xs font-medium uppercase tracking-label text-accentink transition-colors duration-[var(--dur-short)] ease-out hover:bg-ink2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focusring active:translate-y-px"
        >
          Notifikasi
        </a>
      </nav>
    </div>
  );
}
