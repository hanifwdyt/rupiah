import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const map: Record<string, { title: string; body: string }> = {
    ok: {
      title: "Email terverifikasi.",
      body: "Mulai sekarang lo bakal terima update kurs USD/IDR di inbox tiga kali sehari — pagi, siang, malam.",
    },
    invalid: {
      title: "Token tidak valid.",
      body: "Link verifikasi sudah pernah dipakai atau kedaluwarsa. Coba subscribe ulang dari halaman utama.",
    },
    error: {
      title: "Terjadi kesalahan.",
      body: "Ada yang salah dengan link verifikasinya. Coba lagi atau subscribe ulang.",
    },
  };

  const content = map[status || ""] ?? map.error;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 md:px-12 text-center">
      <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-subtle mb-6">
        Rupiah Tracker · Verifikasi
      </div>
      <h1 className="font-serif italic text-5xl md:text-7xl leading-[0.95] max-w-2xl mb-8">
        {content.title}
      </h1>
      <p className="max-w-md text-base md:text-lg text-ink/70 leading-relaxed mb-12">
        {content.body}
      </p>
      <Link
        href="/"
        className="group inline-flex items-center gap-3 border border-ink px-8 py-4 hover:bg-ink hover:text-bone transition-all"
      >
        <span className="font-mono text-xs uppercase tracking-[0.2em]">Kembali ke beranda</span>
        <span className="font-serif italic text-lg group-hover:translate-x-1 transition-transform">→</span>
      </Link>
    </main>
  );
}
