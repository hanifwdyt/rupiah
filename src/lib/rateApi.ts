type RateResult = { rate: number; source: string; timestamp: number };

const PRIMARY = "https://open.er-api.com/v6/latest/USD";
const FALLBACK = "https://api.frankfurter.dev/v2/latest?base=USD&symbols=IDR";

export async function fetchUsdIdrRate(): Promise<RateResult> {
  try {
    const r = await fetch(PRIMARY, { cache: "no-store" });
    if (!r.ok) throw new Error(`primary status ${r.status}`);
    const json = (await r.json()) as { rates?: Record<string, number>; time_last_update_unix?: number };
    const idr = json.rates?.IDR;
    if (typeof idr !== "number" || idr <= 0) throw new Error("invalid IDR");
    return {
      rate: idr,
      source: "open-er-api",
      timestamp: (json.time_last_update_unix ? json.time_last_update_unix * 1000 : Date.now()),
    };
  } catch (primaryErr) {
    const r = await fetch(FALLBACK, { cache: "no-store" });
    if (!r.ok) throw new Error(`fallback status ${r.status}: ${(primaryErr as Error).message}`);
    const json = (await r.json()) as { rates?: { IDR?: number }; date?: string };
    const idr = json.rates?.IDR;
    if (typeof idr !== "number" || idr <= 0) throw new Error("fallback invalid IDR");
    return { rate: idr, source: "frankfurter", timestamp: Date.now() };
  }
}
