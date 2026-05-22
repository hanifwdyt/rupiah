import { fmtDateJakarta } from "@/lib/format";

export function Footer() {
  return (
    <footer className="mx-auto max-w-page px-[var(--page-gutter)] pb-[var(--space-2xl)] pt-[var(--space-xl)]">
      <div className="border-t border-rule pt-[var(--space-lg)] flex flex-col gap-[var(--space-sm)] md:flex-row md:items-center md:justify-between label">
        <span className="text-ink2">
          USD<span className="text-muted">/</span>IDR — pemantau kurs rupiah
        </span>
        <span className="text-muted normal-case tracking-normal font-mono text-xs">
          Kurs · Yahoo Finance · tiap 5 menit &nbsp;·&nbsp; Berita · Detik, CNBC, Antara, Tempo · tiap 6 jam
        </span>
        <span className="text-muted">
          Edisi {fmtDateJakarta(Date.now(), { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>
    </footer>
  );
}
