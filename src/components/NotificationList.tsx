"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fmtRupiah, fmtPct, fmtDateJakarta, slotLabel } from "@/lib/format";

type NotifItem = {
  id: number;
  sentAt: number;
  slot: string;
  rate: number;
  rateChangePct: number | null;
  pushSentCount: number;
  emailSentCount: number;
};

export function NotificationList() {
  const [items, setItems] = useState<NotifItem[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications?limit=40")
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
            ─ 03 / Riwayat
          </div>
          <h2 className="font-serif italic font-normal text-4xl md:text-6xl lg:text-7xl leading-[0.95] mb-12 md:mb-16 max-w-3xl">
            Setiap update,<br />tercatat.
          </h2>
        </motion.div>

        {loading ? (
          <div className="text-center py-16 font-mono text-xs text-subtle uppercase tracking-[0.2em]">
            memuat riwayat…
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 font-mono text-xs text-subtle uppercase tracking-[0.2em]">
            belum ada notifikasi terkirim
          </div>
        ) : (
          <ul className="divide-y divide-ink/15 border-t border-b border-ink/15">
            {items.map((it, idx) => {
              const isOpen = expanded === it.id;
              const change = it.rateChangePct;
              const dir = change == null ? "neutral" : change > 0.05 ? "down" : change < -0.05 ? "up" : "neutral";
              return (
                <motion.li
                  key={it.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: Math.min(idx * 0.03, 0.4) }}
                >
                  <button
                    onClick={() => setExpanded(isOpen ? null : it.id)}
                    className="w-full flex items-center justify-between gap-4 py-5 md:py-6 text-left group"
                  >
                    <div className="flex items-baseline gap-4 md:gap-8 min-w-0 flex-1">
                      <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-subtle w-20 md:w-32 shrink-0">
                        {fmtDateJakarta(it.sentAt, { day: "2-digit", month: "short" })}
                      </span>
                      <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-subtle w-16 shrink-0">
                        {slotLabel(it.slot)}
                      </span>
                      <span className="font-serif italic text-xl md:text-3xl truncate">
                        Rp{fmtRupiah(it.rate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 md:gap-6 shrink-0">
                      {change != null && (
                        <span
                          className={`font-mono text-xs md:text-sm ${
                            dir === "down" ? "text-crimson" : dir === "up" ? "text-[#2F5D40]" : "text-subtle"
                          }`}
                        >
                          {fmtPct(change)}
                        </span>
                      )}
                      <span className={`font-serif text-2xl transition-transform ${isOpen ? "rotate-45" : ""}`}>+</span>
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="pb-6 md:pb-8 pl-0 md:pl-44 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                          <div>
                            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle mb-1">Waktu</div>
                            <div className="font-mono">
                              {fmtDateJakarta(it.sentAt, { hour: "2-digit", minute: "2-digit" })} WIB
                            </div>
                          </div>
                          <div>
                            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle mb-1">Push terkirim</div>
                            <div className="font-mono">{it.pushSentCount}</div>
                          </div>
                          <div>
                            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle mb-1">Email terkirim</div>
                            <div className="font-mono">{it.emailSentCount}</div>
                          </div>
                          <div>
                            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle mb-1">Slot</div>
                            <div className="font-mono">{slotLabel(it.slot)}</div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
