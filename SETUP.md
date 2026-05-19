# Rupiah Tracker — Deployment Info

## URLs
- Production: https://usd-to-idr.hanif.app
- GitHub: https://github.com/hanifwdyt/rupiah

## Coolify
- Project UUID: `gggcc88ogokwowk4ow4gcg0s`
- App UUID: `kk888go4kwsks0sw4ocksow4`
- Server UUID: `qkwscsssg4848owcocg8o48c`
- Domain: `https://usd-to-idr.hanif.app`
- Build pack: Dockerfile
- Port: 3000
- Volume: named volume `rupiah-data` → `/app/data` (via `custom_docker_run_options`)

## Env vars set (in Coolify)
- `TZ=Asia/Jakarta`
- `DATABASE_PATH=/app/data/rupiah.db`
- `PUBLIC_BASE_URL=https://usd-to-idr.hanif.app`
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` (set)
- `EMAIL_FROM=Rupiah Tracker <onboarding@resend.dev>`
- `CRON_TRIGGER_KEY` (random, see Coolify dashboard)
- `RESEND_API_KEY` — **NOT SET** (email subscribe akan return 503 sampai ini diisi)

## Cron schedule (Asia/Jakarta)
- `0 * * * *` — fetch USD/IDR rate (hourly)
- `0 */6 * * *` — crawl RSS news
- `0 9 * * *` — send morning notif
- `0 15 * * *` — send afternoon notif
- `0 21 * * *` — send night notif

## Manual trigger endpoint
```
GET /api/cron/trigger?key=<CRON_TRIGGER_KEY>&job=fetchRate
GET /api/cron/trigger?key=<CRON_TRIGGER_KEY>&job=crawlNews
GET /api/cron/trigger?key=<CRON_TRIGGER_KEY>&job=sendNotifications&slot=morning
```

## To enable email
1. Sign up gratis di https://resend.com
2. Generate API key
3. Tambah ke Coolify env: `RESEND_API_KEY=re_xxxxxx`
4. (Opsional) verify domain `hanif.app` di Resend, lalu ubah `EMAIL_FROM` ke `noreply@hanif.app`. Sementara pakai default `onboarding@resend.dev`.
5. Redeploy

## Data sources
- Rate primary: `open.er-api.com/v6/latest/USD`
- Rate fallback: `frankfurter.dev`
- News RSS: Detik Finance, CNBC Indonesia, Antara Ekonomi, Tempo Bisnis
- News filter: keyword (rupiah, kurs, USD, IDR, BI, dolar, the fed, nilai tukar, valuta, forex)

## Local dev
```bash
npm install
cp .env.example .env  # fill VAPID + RESEND
npm run build && npm start  # dev mode has webpack/serverExternalPackages quirk, use build+start
```

## Manual icon regen (if SVG updated)
```bash
node scripts/generate-icons.mjs
```
