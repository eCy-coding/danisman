# 🚀 EcyPro 15-Pane Dev Orchestrator

İstek5 disiplininde inşa edilen 15-pane tmux geliştirme stack'i. Tek komutla
tüm yerel ortamı (DB + Redis + Mailpit + 13 paralel dev servis) ayağa kaldırır.

---

## Hızlı Başlangıç

```bash
# Tek komutla her şey
npm run dev:up

# Sadece Docker servisleri (DB + Redis + Mailpit)
npm run dev:db

# Tmux yoksa concurrently fallback (CI uyumlu)
npm run dev:full

# Hepsini kapat
npm run dev:down

# Volumes dahil tam reset
npm run dev:reset
```

İlk açılışta:

1. `docker-compose.dev.yml` → 3 container: `ecypro-postgres-dev`, `ecypro-redis-dev`, `ecypro-mailpit-dev`
2. `scripts/orchestrator.sh` → `tmux new-session ecypro-dev` + 15 pane
3. Her pane başlığı 3-5 sn içinde renkli prompt'a düşer

---

## 15 Pane Görevi

| #   | Pane              | Komut                          | Görev                                                                |
| --- | ----------------- | ------------------------------ | -------------------------------------------------------------------- |
| 0   | 🖥 Frontend-Dev   | `npm run vite`                 | Vite dev server (port 3000), HMR, proxy → API:3001                   |
| 1   | 🛠 Backend-API    | `npm run server`               | Express + tsx (port 3001), 100+ route, SSE, Prisma                   |
| 2   | 💾 DB-Postgres    | `docker logs -f`               | Postgres + Redis + Mailpit container log akışı                       |
| 3   | 🧪 E2E-Playwright | `playwright test --ui`         | Playwright UI mode — testleri canlı izle/yeniden çalıştır            |
| 4   | 🔎 SEO-Watch      | `tsx scripts/seo-watch.ts`     | `src/content/blog/**` değişince sitemap+RSS otomatik regenerate      |
| 5   | 🎨 UI-Storybook   | `tail -f /dev/null`            | (Soft) Storybook config eklenince aktif olur                         |
| 6   | 📦 Media-Watcher  | `tsx scripts/watch-media.ts`   | Yeni image kaydedince otomatik WebP+AVIF + manifest                  |
| 7   | ⚙ CI-Lighthouse   | `tsx scripts/lhci-watch.ts`    | 30 dk'da bir LHCI autorun, regression → Telegram alert               |
| 8   | 🗒 Log-Tail       | `bash scripts/logs-tail.sh`    | `logs/ecypro-*.log` + `docker logs -f` paralel renkli akış           |
| 9   | 📈 Analytics-Dev  | `tsx scripts/analytics-dev.ts` | Mock GA4 server (port 4001) — frontend dataLayer push'larını yakalar |
| 10  | 🔐 Sec-Watch      | `tsx scripts/sec-watch.ts`     | Saatlik npm audit + gitleaks + env scan, regression → Telegram       |
| 11  | 🚀 Deploy-Watch   | `tsx scripts/deploy-watch.ts`  | Vercel + Render API poll, deploy state değişimleri                   |
| 12  | 🧭 Geo-Watch      | `tsx scripts/geo-watch.ts`     | Haftalık MaxMind MMDB refresh + `public/geo-data.json`               |
| 13  | 🧑‍💼 CRM-Watch      | `tsx scripts/crm-watch.ts`     | Yeni ContactSubmission → Telegram alert + lead scoring               |
| 14  | 📋 Status         | `watch curl /api/status`       | API status + DB/Redis component durumu (5 sn refresh)                |

---

## Tmux Klavye Kısayolları

```
Ctrl-b + ←/→/↑/↓     pane'ler arası gezin
Ctrl-b + q            pane numaralarını göster (0-14)
Ctrl-b + z            mevcut pane'i tam ekran yap/küçült
Ctrl-b + d            session'dan çık (tmux kapanmaz)
Ctrl-b + [            scroll mode (q ile çık)
Ctrl-b + ,            pane başlığını yeniden adlandır
Ctrl-b + x            pane'i kapat
```

Yeniden bağlan: `tmux attach -t ecypro-dev`
Tüm session'ları gör: `tmux ls`
Session'ı tamamen kapat: `tmux kill-session -t ecypro-dev` (veya `npm run dev:down`)

---

## Watch Script'lerin Davranışı

Her watch script'i ortak doktrini takip eder:

- **Türkçe log** — `[HH:MM:SS] ▶ <name>: <msg>` formatı
- **SIGTERM/SIGINT graceful** — açık dosyaları kapatır, manifest flush eder
- **Token/secret redact** — Telegram token, API key gibi alanlar log'a sızmaz
- **Timeout** — her HTTP çağrısında AbortController, 5-10s timeout
- **Idempotent** — yeniden başlatınca aynı işi 2x yapmaz (lastSeen tracking)
- **Fail-open** — bağımlılık yoksa graceful skip + uyarı (örn. Sharp, Maxmind)

---

## Backend Yeni Route'lar (Faz 3)

İstek5 disiplininde inşa edilen yeni servisler:

### `GET /api/geo/lookup`

Request IP'sinden ülke kodu döndürür. Sıra: Cloudflare header → MaxMind MMDB → fallback `TR`.

```bash
curl http://localhost:3001/api/geo/lookup -H "CF-IPCountry: US"
# {"status":"success","data":{"country":"US","source":"header"}}
```

### `GET /api/geo/banner`

UI banner için lokal ülke + currency + dil önerisi.

```json
{
  "data": {
    "country": "TR",
    "currency": "TRY",
    "flag": "🇹🇷",
    "suggestedLang": "tr",
    "message": "🇹🇷 Türkiye'den…"
  }
}
```

### `GET /api/geo/countries`

`public/geo-data.json` → desteklenen 50 ülke listesi.

### `GET /api/crm/leads/hot` (admin)

Tier A (≥100 puan) sıcak lead listesi, son 90 gün.

### `GET /api/crm/pipeline-stats` (admin)

Funnel metrikleri: contacts → newsletter → bookings.

### `POST /api/crm/sync-contact` (admin)

Manuel lead skor yeniden hesaplama.

### `POST /api/crm/notify` (admin)

Telegram test bildirimi.

### `POST /api/dev/analytics/collect` (sadece dev)

Frontend mock GA4 relay — production'da 404.

### `GET /api/sse/analytics`

Real-time KPI stream (admin dashboard için).

### `GET /api/status`

Status page API: API + DB + Redis component durumu.

---

## Lead Pipeline Service

`server/services/lead-pipeline.ts` arka planda çalışır:

- 30 sn'de bir `ContactSubmission` tablosunu poll'lar
- Yeni satır → `lead-scoring.ts` ile tier hesaplar (A/B/C)
- **Tier A** → Telegram'a 🔥 _HOT LEAD_ bildirimi
- Idempotent: `lastSeenAt` tracking, aynı satır 2x işlenmez

Server başlarken otomatik aktive olur (`startLeadPipeline()` in `server/index.ts`).
Test ortamında devre dışı (`NODE_ENV === 'test'`).

---

## docker-compose.dev.yml

| Servis              | Port | URL                                                             |
| ------------------- | ---- | --------------------------------------------------------------- |
| Postgres 17         | 5432 | `postgresql://ecypro:ecypro_dev_2026@localhost:5432/ecypro_dev` |
| Redis 7             | 6379 | `redis://localhost:6379`                                        |
| Mailpit SMTP        | 1025 | `localhost:1025` (no auth, dev)                                 |
| Mailpit UI          | 8025 | http://localhost:8025                                           |
| Adminer (opsiyonel) | 8080 | http://localhost:8080 — `npm run dev:db:tools`                  |

`.env.local` dev override'ı için:

```bash
DATABASE_URL="postgresql://ecypro:ecypro_dev_2026@localhost:5432/ecypro_dev?schema=public"
REDIS_URL="redis://localhost:6379"
EMAIL_FROM="dev@ecypro.local"
SMTP_HOST="localhost"
SMTP_PORT="1025"
```

---

## Fallback: Tmux Yoksa

Sistem otomatik tespit eder:

1. `command -v tmux` başarısız → `npm run dev:full` (concurrently)
2. `$CI` veya `$GITHUB_ACTIONS` set → `npm run dev:full`
3. Ana session zaten açık → `tmux attach -t ecypro-dev`

`dev:full` 9 servisi paralel çalıştırır (FE/BE/SEO/MEDIA/GEO/CRM/SEC/LHCI/ANALYTICS),
renkli prefix ile aynı stdout'a basar. CI'da bu mod kullanılır.

---

## Sorun Giderme

| Belirti                              | Çözüm                                                              |
| ------------------------------------ | ------------------------------------------------------------------ |
| `dev:up` → "tmux: command not found" | Otomatik `dev:full`'a düşer (uyarı görürsün)                       |
| Pane hemen kapanıyor                 | İlgili pane'in komutunu manuel çalıştır → hata göreceksin          |
| Postgres "connection refused"        | `docker ps` → container yok mu? `npm run dev:db`                   |
| Redis bağlanmıyor                    | `docker compose -f docker-compose.dev.yml logs redis-dev`          |
| Mailpit UI açılmıyor                 | `curl http://localhost:8025/api/v1/info` — container sağ mı?       |
| Geo lookup hep "TR" döndürüyor       | MaxMind MMDB yok → `MAXMIND_LICENSE_KEY` ekle, `npm run geo:watch` |
| LHCI hata                            | `.lighthouserc.js` ekle veya pane'i kapatabilirsin (soft)          |

---

## Pane Görsel Layout

Tmux 15 pane'i `tiled` layout ile otomatik düzenler. Tipik 16:9 ekranda:

```
┌──────────┬──────────┬──────────┬──────────┐
│ 0 FE     │ 1 BE     │ 2 DB     │ 3 E2E    │
├──────────┼──────────┼──────────┼──────────┤
│ 4 SEO    │ 5 Story  │ 6 Media  │ 7 LHCI   │
├──────────┼──────────┼──────────┼──────────┤
│ 8 Logs   │ 9 Analy  │ 10 Sec   │ 11 Deploy│
├──────────┼──────────┼──────────┴──────────┤
│ 12 Geo   │ 13 CRM   │ 14 Status           │
└──────────┴──────────┴─────────────────────┘
```

`Ctrl-b + z` ile herhangi bir pane'i tam ekran yap. `Ctrl-b + [` ile scroll.

---

## İlgili Dosyalar

- `scripts/orchestrator.sh` — tmux session creator
- `docker-compose.dev.yml` — dev container'ları
- `scripts/watch-*.ts` — 9 watch service
- `server/routes/geo.ts`, `crm.ts`, `dev-analytics.ts` — backend route'lar
- `server/services/lead-pipeline.ts` — arka plan lead processor
- `server/lib/geoip.ts` — IP → ülke lookup helper

---

İlk çalıştırmadan önce `cp .env.example .env` ve key'leri doldur.
Telegram bildirimi için: `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`.
Deploy watcher için: `VERCEL_TOKEN` + `RENDER_API_KEY`.
GeoIP için: `MAXMIND_LICENSE_KEY` (opsiyonel, fallback Cloudflare header).
