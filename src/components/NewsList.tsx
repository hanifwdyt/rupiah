"use client";

import { useEffect, useState } from "react";
import { fmtDateJakarta } from "@/lib/format";

type NewsItem = {
  id: number;
  source: string;
  title: string;
  url: string;
  excerpt: string | null;
  publishedAt: number;
};

function rel(ts: number): string {
  const h = Math.floor((Date.now() - ts) / 3_600_000);
  if (h < 1) return "baru saja";
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

export function NewsList() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    fetch("/api/news?limit=40")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }, []);

  const visible = items.slice(0, limit);

  return (
    <section className="mx-auto max-w-page px-[var(--page-gutter)] py-[var(--section-gap)]">
      <h2 className="font-display font-light text-display-s text-ink tracking-tight max-w-2xl">
        Kabar di balik angkanya
      </h2>
      <p className="mt-[var(--space-sm)] max-w-[var(--measure)] text-muted text-md">
        Berita kurs, kebijakan, dan ekonomi yang menggerakkan rupiah — dikurasi tiap enam jam.
      </p>

      <div className="mt-[var(--space-xl)]">
        {loading ? (
          <div className="label py-[var(--space-2xl)]">Memuat berita</div>
        ) : items.length === 0 ? (
          <div className="label py-[var(--space-2xl)]">Belum ada berita terkurasi</div>
        ) : (
          <ol className="border-t border-rule">
            {visible.map((it, i) => (
              <li key={it.id} className="border-b border-rule">
                <a
                  href={it.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group grid grid-cols-[2rem_minmax(0,1fr)] md:grid-cols-[3rem_minmax(0,1fr)_9rem] gap-[var(--space-md)] py-[var(--space-lg)] items-baseline transition-colors duration-[var(--dur-short)] hover:bg-paper2 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focusring"
                >
                  <span className="font-mono text-sm text-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <h3 className="font-display font-normal text-lg md:text-xl text-ink leading-snug transition-colors duration-[var(--dur-short)] group-hover:text-accent">
                      {it.title}
                    </h3>
                    {it.excerpt && (
                      <p className="mt-[var(--space-2xs)] text-sm text-muted leading-relaxed line-clamp-2 max-w-[var(--measure)]">
                        {it.excerpt}
                      </p>
                    )}
                    <div className="mt-[var(--space-xs)] md:hidden label">
                      {it.source} · {rel(it.publishedAt)}
                    </div>
                  </div>
                  <div className="hidden md:block text-right">
                    <div className="label">{it.source}</div>
                    <div className="font-mono text-xs text-muted mt-[var(--space-3xs)]">
                      {rel(it.publishedAt)}
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ol>
        )}

        {!loading && limit < items.length && (
          <button
            onClick={() => setLimit((l) => l + 10)}
            className="mt-[var(--space-lg)] rounded-input border border-rule px-5 py-3 font-mono text-xs uppercase tracking-label text-muted transition-colors duration-[var(--dur-short)] ease-out hover:border-rule2 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focusring"
          >
            Muat {items.length - limit} lagi
          </button>
        )}
      </div>
    </section>
  );
}
