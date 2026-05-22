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
      title: "Tautan tidak valid",
      body: "Tautan verifikasi sudah pernah digunakan atau kedaluwarsa. Silakan daftar ulang dari halaman utama.",
    },
    error: {
      title: "Terjadi kesalahan",
      body: "Ada masalah dengan tautan verifikasi. Silakan coba daftar ulang.",
    },
  };

  const content = map[status || ""] ?? map.error;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-[var(--page-gutter)] text-center">
      <div className="label mb-[var(--space-lg)]">USD/IDR · Verifikasi</div>
      <h1 className="font-display font-light text-display-s text-ink tracking-tight max-w-2xl mb-[var(--space-md)]">
        {content.title}
      </h1>
      <p className="text-muted text-md max-w-md mb-[var(--space-xl)]">{content.body}</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-input border border-rule2 px-6 py-3 font-mono text-xs uppercase tracking-label text-ink2 transition-colors duration-[var(--dur-short)] ease-out hover:border-ink2 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focusring"
      >
        Kembali ke beranda <span aria-hidden>→</span>
      </Link>
    </main>
  );
}
