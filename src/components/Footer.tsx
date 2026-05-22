import { fmtDateJakarta } from "@/lib/format";

export function Footer() {
  return (
    <footer className="px-5 md:px-10 pt-10 md:pt-14 pb-10 border-t-2 border-paper">
      <div className="grid md:grid-cols-12 gap-8 md:gap-10">
        <div className="md:col-span-6">
          <div className="headline text-paper text-3xl md:text-4xl mb-3">Rupiah Watch</div>
          <p className="bodycopy text-dim max-w-md text-[15px]">
            Pemantau kurs dolar terhadap rupiah, dirangkai seperti halaman koran — angka, grafik,
            dan kabar dalam satu tempat.
          </p>
        </div>
        <div className="md:col-span-3">
          <div className="kicker text-faint mb-3">Sumber</div>
          <ul className="space-y-1.5 font-mono text-[13px] text-dim">
            <li>Kurs · Yahoo Finance</li>
            <li>Berita · Detik, CNBC</li>
            <li>Berita · Antara, Tempo</li>
          </ul>
        </div>
        <div className="md:col-span-3">
          <div className="kicker text-faint mb-3">Jadwal</div>
          <ul className="space-y-1.5 font-mono text-[13px] text-dim">
            <li>Kurs · tiap 5 menit</li>
            <li>Berita · tiap 6 jam</li>
            <li>Notif · 09 · 15 · 21 WIB</li>
          </ul>
        </div>
      </div>
      <div className="mt-10 pt-5 border-t border-rule flex flex-wrap items-center justify-between gap-3 kicker text-faint">
        <span>usd-to-idr.hanif.app</span>
        <span>Edisi {fmtDateJakarta(Date.now(), { day: "numeric", month: "long", year: "numeric" })}</span>
      </div>
    </footer>
  );
}
