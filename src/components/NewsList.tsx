"use client";

import { motion } from "framer-motion";
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

export function NewsList() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/news?limit=30")
      .then((r) => r.json())
      .then((data) => setItems(data.items || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="px-6 md:px-12 py-20 md:py-32 border-t border-ink/10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-subtle mb-6">
            ─ 04 / Konteks
          </div>
          <h2 className="font-serif italic font-normal text-4xl md:text-6xl lg:text-7xl leading-[0.95] mb-12 md:mb-16 max-w-3xl">
            Berita dan kebijakan<br />di balik angka.
          </h2>
        </motion.div>

        {loading ? (
          <div className="text-center py-16 font-mono text-xs text-subtle uppercase tracking-[0.2em]">
            memuat berita…
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 font-mono text-xs text-subtle uppercase tracking-[0.2em]">
            belum ada berita terkurasi
          </div>
        ) : (
          <div className="grid md:grid-cols-12 gap-8 md:gap-px md:bg-ink/10">
            {items.map((it, idx) => {
              const isFeatured = idx === 0;
              return (
                <motion.a
                  key={it.id}
                  href={it.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: Math.min(idx * 0.04, 0.6) }}
                  className={`group block bg-bone p-6 md:p-8 hover:bg-ink hover:text-bone transition-colors duration-300 ${
                    isFeatured ? "md:col-span-12 md:p-12" : "md:col-span-6 lg:col-span-4"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4 md:mb-6 font-mono text-[10px] uppercase tracking-[0.25em] opacity-60">
                    <span>{it.source}</span>
                    <span>{fmtDateJakarta(it.publishedAt, { day: "numeric", month: "short" })}</span>
                  </div>
                  <h3
                    className={`font-serif italic leading-[1.1] ${
                      isFeatured ? "text-3xl md:text-5xl lg:text-6xl mb-6 md:mb-8" : "text-xl md:text-2xl mb-4"
                    }`}
                  >
                    {it.title}
                  </h3>
                  {it.excerpt && (
                    <p
                      className={`leading-relaxed opacity-80 ${
                        isFeatured ? "text-base md:text-lg max-w-3xl" : "text-sm line-clamp-3"
                      }`}
                    >
                      {it.excerpt}
                    </p>
                  )}
                  <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                    Baca selengkapnya <span className="font-serif italic text-base">→</span>
                  </div>
                </motion.a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
