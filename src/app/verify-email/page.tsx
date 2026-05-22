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
      title: "Email terkonfirmasi",
      body: "Update kurs USD/IDR akan dikirim ke inbox kamu setiap pukul 09.00, 15.00, dan 21.00 WIB.",
    },
    invalid: {
      title: "Link tidak valid",
      body: "Tautan verifikasi sudah pernah digunakan atau kedaluwarsa. Silakan daftar ulang dari halaman utama.",
    },
    error: {
      title: "Terjadi kesalahan",
      body: "Ada masalah dengan tautan verifikasi. Silakan coba daftar ulang.",
    },
  };

  const content = map[status || ""] ?? map.error;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center mx-auto max-w-[1400px] border-x border-rule">
      <div className="kicker text-red mb-6">Rupiah Watch · Verifikasi</div>
      <h1 className="headline text-paper text-5xl md:text-7xl max-w-2xl mb-6">{content.title}</h1>
      <p className="bodycopy text-dim max-w-md mb-10">{content.body}</p>
      <Link
        href="/"
        className="group inline-flex items-center gap-3 border border-paper text-paper px-7 py-3.5 hover:bg-paper hover:text-ink transition-colors"
      >
        <span className="kicker">Kembali ke beranda</span>
        <span className="font-serif text-lg group-hover:translate-x-1 transition-transform">→</span>
      </Link>
    </main>
  );
}
