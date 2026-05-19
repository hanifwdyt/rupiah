export function fmtRupiah(n: number, opts?: { decimals?: number }): string {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: opts?.decimals ?? 0,
    minimumFractionDigits: opts?.decimals ?? 0,
  }).format(opts?.decimals != null ? n : Math.round(n));
}

export function fmtPct(n: number, decimals = 2): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(decimals)}%`;
}

export function fmtDateJakarta(d: Date | number, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    ...opts,
  }).format(new Date(d));
}

export function slotLabel(slot: string): string {
  if (slot === "morning") return "Pagi";
  if (slot === "afternoon") return "Siang";
  if (slot === "night") return "Malam";
  return slot;
}
