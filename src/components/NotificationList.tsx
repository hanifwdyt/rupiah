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
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mx-auto max-w-page px-[var(--page-gutter)] py-[var(--section-gap)]">
      <h2 className="font-display font-light text-display-s text-ink tracking-tight max-w-2xl">
        Setiap update yang sudah dikirim
      </h2>
      <p className="mt-[var(--space-sm)] max-w-[var(--measure)] text-muted text-md">
        Catatan lengkap pengiriman notifikasi — kurs saat itu, perubahannya, dan jumlah penerima.
      </p>

      <div className="mt-[var(--space-xl)]">
        {loading ? (
          <div className="label py-[var(--space-2xl)]">Memuat riwayat</div>
        ) : items.length === 0 ? (
          <div className="label py-[var(--space-2xl)]">Belum ada notifikasi terkirim</div>
        ) : (
          <div role="table" className="border-t border-rule">
            <div role="row" className="hidden md:grid grid-cols-[7rem_5rem_1fr_6rem_2rem] gap-[var(--space-md)] py-[var(--space-sm)] border-b border-rule label">
              <span role="columnheader">Tanggal</span>
              <span role="columnheader">Sesi</span>
              <span role="columnheader">Kurs</span>
              <span role="columnheader" className="text-right">24 jam</span>
              <span role="columnheader" />
            </div>
            <ul>
              {items.map((it) => {
                const open = expanded === it.id;
                const c = it.rateChangePct;
                const dir = c == null ? "flat" : c > 0.02 ? "down" : c < -0.02 ? "up" : "flat";
                return (
                  <li key={it.id} className="border-b border-rule">
                    <button
                      onClick={() => setExpanded(open ? null : it.id)}
                      aria-expanded={open}
                      className="w-full grid grid-cols-[1fr_auto] md:grid-cols-[7rem_5rem_1fr_6rem_2rem] gap-x-[var(--space-md)] gap-y-[var(--space-2xs)] items-baseline py-[var(--space-md)] text-left transition-colors duration-[var(--dur-short)] hover:bg-paper2 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focusring"
                    >
                      <span className="font-mono text-xs text-muted tabular-nums order-1 md:order-none">
                        {fmtDateJakarta(it.sentAt, { day: "2-digit", month: "short" })}
                      </span>
                      <span className="label order-3 md:order-none">{slotLabel(it.slot)}</span>
                      <span className="font-display font-light text-xl text-ink tabular-nums order-2 md:order-none">
                        Rp{fmtRupiah(it.rate)}
                      </span>
                      <span
                        className={`font-mono text-sm tabular-nums text-right order-4 md:order-none ${
                          dir === "down" ? "text-down" : dir === "up" ? "text-up" : "text-muted"
                        }`}
                      >
                        {c != null ? fmtPct(c) : "—"}
                      </span>
                      <span
                        className={`hidden md:block font-mono text-lg text-muted text-right transition-transform duration-[var(--dur-short)] ${open ? "rotate-45" : ""}`}
                        aria-hidden
                      >
                        +
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="pb-[var(--space-md)] grid grid-cols-2 md:grid-cols-4 gap-[var(--space-lg)] md:pl-[calc(7rem+var(--space-md))]">
                            <Field label="Waktu" value={`${fmtDateJakarta(it.sentAt, { hour: "2-digit", minute: "2-digit" })} WIB`} />
                            <Field label="Push terkirim" value={String(it.pushSentCount)} />
                            <Field label="Email terkirim" value={String(it.emailSentCount)} />
                            <Field label="Sesi" value={slotLabel(it.slot)} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label mb-[var(--space-3xs)]">{label}</div>
      <div className="font-mono text-sm text-ink2 tabular-nums">{value}</div>
    </div>
  );
}
