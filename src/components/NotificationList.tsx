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
    <section className="px-5 md:px-10 py-10 md:py-14 border-t border-rule">
      <div className="rule-thick pt-3 mb-8 md:mb-10 flex items-baseline justify-between">
        <div className="kicker text-red">Catatan · Riwayat Kirim</div>
        <div className="kicker text-faint">09.00 · 15.00 · 21.00 WIB</div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-3">
          <h3 className="headline text-paper text-3xl md:text-4xl max-w-xs">
            Setiap notifikasi yang pernah dikirim
          </h3>
          <p className="bodycopy text-dim mt-5 text-[15px] max-w-xs">
            Arsip lengkap pengiriman update kurs, beserta jumlah penerima di tiap kanal.
          </p>
        </div>

        <div className="lg:col-span-9">
          {loading ? (
            <div className="kicker text-faint py-12">Memuat riwayat</div>
          ) : items.length === 0 ? (
            <div className="kicker text-faint py-12">Belum ada notifikasi terkirim</div>
          ) : (
            <ul className="border-t border-rule">
              {items.map((it) => {
                const isOpen = expanded === it.id;
                const change = it.rateChangePct;
                const dir =
                  change == null ? "flat" : change > 0.02 ? "down" : change < -0.02 ? "up" : "flat";
                return (
                  <li key={it.id} className="border-b border-rule">
                    <button
                      onClick={() => setExpanded(isOpen ? null : it.id)}
                      className="w-full flex items-center gap-4 md:gap-8 py-4 md:py-5 text-left group"
                    >
                      <span className="font-mono text-[11px] text-faint w-20 md:w-28 shrink-0 tabular-nums">
                        {fmtDateJakarta(it.sentAt, { day: "2-digit", month: "short" })}
                      </span>
                      <span className="kicker text-faint w-14 shrink-0">{slotLabel(it.slot)}</span>
                      <span className="font-serif text-paper text-xl md:text-2xl flex-1 tabular-nums">
                        Rp{fmtRupiah(it.rate)}
                      </span>
                      <span
                        className={`font-mono text-xs md:text-sm shrink-0 ${
                          dir === "down" ? "text-red" : dir === "up" ? "text-green" : "text-faint"
                        }`}
                      >
                        {change != null ? fmtPct(change) : "—"}
                      </span>
                      <span
                        className={`font-serif text-xl text-dim shrink-0 transition-transform ${isOpen ? "rotate-45" : ""}`}
                      >
                        +
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="pb-5 pl-0 md:pl-[8.5rem] grid grid-cols-2 md:grid-cols-4 gap-5">
                            <Field label="Waktu" value={`${fmtDateJakarta(it.sentAt, { hour: "2-digit", minute: "2-digit" })} WIB`} />
                            <Field label="Push" value={String(it.pushSentCount)} />
                            <Field label="Email" value={String(it.emailSentCount)} />
                            <Field label="Slot" value={slotLabel(it.slot)} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="kicker text-faint mb-1">{label}</div>
      <div className="font-mono text-sm text-paper">{value}</div>
    </div>
  );
}
