type RateResult = { rate: number; source: string; timestamp: number };

const YAHOO_INTRADAY = "https://query1.finance.yahoo.com/v8/finance/chart/USDIDR=X?interval=1m&range=1d";
const ER_API = "https://open.er-api.com/v6/latest/USD";
const FRANKFURTER = "https://api.frankfurter.dev/v2/latest?base=USD&symbols=IDR";

const UA = "Mozilla/5.0 (compatible; RupiahTracker/1.0; +https://usd-to-idr.hanif.app)";

async function fetchYahoo(): Promise<RateResult> {
  const r = await fetch(YAHOO_INTRADAY, { cache: "no-store", headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`yahoo status ${r.status}`);
  const json = (await r.json()) as {
    chart?: { result?: Array<{ meta?: { regularMarketPrice?: number; regularMarketTime?: number } }>; error?: unknown };
  };
  const meta = json.chart?.result?.[0]?.meta;
  const price = meta?.regularMarketPrice;
  const ts = meta?.regularMarketTime;
  if (typeof price !== "number" || price <= 0) throw new Error("yahoo invalid price");
  return { rate: price, source: "yahoo-finance", timestamp: (ts ?? Math.floor(Date.now() / 1000)) * 1000 };
}

async function fetchErApi(): Promise<RateResult> {
  const r = await fetch(ER_API, { cache: "no-store" });
  if (!r.ok) throw new Error(`er-api status ${r.status}`);
  const json = (await r.json()) as { rates?: Record<string, number>; time_last_update_unix?: number };
  const idr = json.rates?.IDR;
  if (typeof idr !== "number" || idr <= 0) throw new Error("er-api invalid IDR");
  return {
    rate: idr,
    source: "open-er-api",
    timestamp: json.time_last_update_unix ? json.time_last_update_unix * 1000 : Date.now(),
  };
}

async function fetchFrankfurter(): Promise<RateResult> {
  const r = await fetch(FRANKFURTER, { cache: "no-store" });
  if (!r.ok) throw new Error(`frankfurter status ${r.status}`);
  const json = (await r.json()) as { rates?: { IDR?: number } };
  const idr = json.rates?.IDR;
  if (typeof idr !== "number" || idr <= 0) throw new Error("frankfurter invalid IDR");
  return { rate: idr, source: "frankfurter", timestamp: Date.now() };
}

export async function fetchUsdIdrRate(): Promise<RateResult> {
  const sources = [fetchYahoo, fetchErApi, fetchFrankfurter];
  let lastErr: Error | null = null;
  for (const fn of sources) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err as Error;
      console.warn(`[rateApi] source failed: ${(err as Error).message}`);
    }
  }
  throw new Error(`all sources failed: ${lastErr?.message}`);
}

export type HistoryPoint = { timestamp: number; rate: number };

/**
 * Backfill historical USD/IDR data from Yahoo Finance.
 * range: e.g. "1mo", "3mo", "6mo", "1y"
 * interval: "1d" for daily, "60m" for hourly (max 730d for 60m)
 */
export async function fetchYahooHistory(range = "3mo", interval = "1d"): Promise<HistoryPoint[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/USDIDR=X?interval=${interval}&range=${range}`;
  const r = await fetch(url, { cache: "no-store", headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`yahoo history status ${r.status}`);
  const json = (await r.json()) as {
    chart?: {
      result?: Array<{
        timestamp?: number[];
        indicators?: { quote?: Array<{ close?: Array<number | null> }> };
      }>;
    };
  };
  const result = json.chart?.result?.[0];
  const timestamps = result?.timestamp || [];
  const closes = result?.indicators?.quote?.[0]?.close || [];
  const points: HistoryPoint[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i];
    if (typeof close === "number" && close > 0) {
      points.push({ timestamp: timestamps[i] * 1000, rate: close });
    }
  }
  return points;
}
