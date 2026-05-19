import { fmtDateJakarta } from "@/lib/format";

export function Footer() {
  return (
    <footer className="px-6 md:px-12 py-12 md:py-16 border-t border-ink/10 bg-ink text-bone">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 md:gap-12">
        <div className="md:col-span-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/40 mb-4">Rupiah Tracker</div>
          <p className="font-serif italic text-2xl md:text-3xl leading-tight max-w-xl">
            Sebuah usaha kecil untuk menjaga kita semua tetap sadar.
          </p>
        </div>
        <div className="space-y-3 font-mono text-[11px] uppercase tracking-[0.2em] text-bone/60">
          <div>
            <span className="text-bone/40">Data </span>
            open.er-api.com · frankfurter.dev
          </div>
          <div>
            <span className="text-bone/40">Berita </span>
            Detik · Kompas · CNBC · Bisnis · Antara
          </div>
          <div>
            <span className="text-bone/40">Build </span>
            {fmtDateJakarta(Date.now(), { year: "numeric", month: "long" })}
          </div>
        </div>
      </div>
    </footer>
  );
}
