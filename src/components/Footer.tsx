import { fmtDateJakarta } from "@/lib/format";

export function Footer() {
  return (
    <footer className="px-6 md:px-12 py-12 md:py-16 border-t border-ink/10 bg-ink text-bone">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 md:gap-12">
        <div className="md:col-span-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/40 mb-4">USD to IDR</div>
          <p className="font-serif italic text-2xl md:text-3xl leading-tight max-w-xl">
            Pantau kurs USD/IDR dan berita ekonomi dalam satu halaman.
          </p>
        </div>
        <div className="space-y-3 font-mono text-[11px] uppercase tracking-[0.2em] text-bone/60">
          <div>
            <span className="text-bone/40">Data </span>
            Yahoo Finance
          </div>
          <div>
            <span className="text-bone/40">Berita </span>
            Detik · CNBC · Antara · Tempo
          </div>
          <div>
            <span className="text-bone/40">Update </span>
            Setiap 15 menit
          </div>
        </div>
      </div>
    </footer>
  );
}
