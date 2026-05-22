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

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "baru saja";
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return `${d} hari lalu`;
}

export function NewsList() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(12);

  useEffect(() => {
    fetch("/api/news?limit=40")
      .then((r) => r.json())
      .then((data) => setItems(data.items || []))
      .finally(() => setLoading(false));
  }, []);

  const visible = items.slice(0, limit);
  const lead = visible[0];
  const rest = visible.slice(1);

  return (
    <section className="px-5 md:px-10 py-10 md:py-14 border-t border-rule">
      <div className="rule-thick pt-3 mb-8 md:mb-10 flex items-baseline justify-between">
        <div className="kicker text-red">Berita Terkait</div>
        <div className="kicker text-faint">Diperbarui tiap 6 jam</div>
      </div>

      {loading ? (
        <div className="kicker text-faint py-12">Memuat berita</div>
      ) : items.length === 0 ? (
        <div className="kicker text-faint py-12">Belum ada berita terkurasi</div>
      ) : (
        <>
          {/* Lead story */}
          {lead && (
            <a
              href={lead.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block border-b border-rule pb-8 mb-8"
            >
              <div className="grid lg:grid-cols-12 gap-4 lg:gap-10 items-baseline">
                <div className="lg:col-span-2">
                  <div className="kicker text-faint">{lead.source}</div>
                  <div className="kicker text-faint mt-1">{relativeTime(lead.publishedAt)}</div>
                </div>
                <div className="lg:col-span-10">
                  <h3 className="headline text-paper text-3xl md:text-5xl leading-[1.02] group-hover:text-red transition-colors max-w-4xl">
                    {lead.title}
                  </h3>
                  {lead.excerpt && (
                    <p className="bodycopy text-dim mt-4 max-w-2xl">{lead.excerpt}</p>
                  )}
                </div>
              </div>
            </a>
          )}

          {/* Index list */}
          <ol className="border-t border-rule">
            {rest.map((it, i) => (
              <li key={it.id} className="border-b border-rule">
                <a
                  href={it.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group grid grid-cols-12 gap-3 md:gap-6 py-5 items-baseline"
                >
                  <span className="col-span-2 md:col-span-1 font-mono text-sm text-faint tabular-nums">
                    {String(i + 2).padStart(2, "0")}
                  </span>
                  <div className="col-span-10 md:col-span-8">
                    <h4 className="font-serif text-paper text-lg md:text-2xl leading-snug group-hover:text-red transition-colors">
                      {it.title}
                    </h4>
                    {it.excerpt && (
                      <p className="bodycopy text-faint text-[14px] mt-1.5 line-clamp-2 md:hidden lg:block max-w-2xl">
                        {it.excerpt}
                      </p>
                    )}
                  </div>
                  <div className="hidden md:block md:col-span-3 text-right">
                    <div className="kicker text-faint">{it.source}</div>
                    <div className="kicker text-faint mt-1">{relativeTime(it.publishedAt)}</div>
                  </div>
                </a>
              </li>
            ))}
          </ol>

          {limit < items.length && (
            <button
              onClick={() => setLimit((l) => l + 12)}
              className="mt-8 kicker text-dim hover:text-paper border border-rule hover:border-paper px-5 py-3 transition-colors"
            >
              Muat lebih banyak ({items.length - limit})
            </button>
          )}
        </>
      )}
    </section>
  );
}
