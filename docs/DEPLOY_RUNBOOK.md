# DEPLOY RUNBOOK — eCyPro Premium Consulting

> **Tek master rehber.** P11 + P13 + P19 runbook'larını ve cutover doctrine'ini
> tek dosyada konsolide eder. **Senaryo C** deploy (Hostinger static FE +
> Render BE + Postgres + Redis + Worker).
>
> Hedef domains: `www.ecypro.com` (FE) · `api.ecypro.com` (BE)
> Hedef süre: cutover ~45 dk + 24 saat watch.
> Hedef downtime: **0** (yeşil-mavi cut; eski FE backup + Render rolling).

---

## Skorbord — 6 Phase

| Phase                       | Süre  | Ne yapılır                                       | Rollback                             |
| --------------------------- | ----- | ------------------------------------------------ | ------------------------------------ |
| **1. Pre-flight**           | 5 dk  | Kalite kapıları + commit + env doğrulama         | n/a                                  |
| **2. Backend (Render)**     | 15 dk | Blueprint apply + env + migrate + health         | önceki revision'a `Roll back`        |
| **3. Frontend (Hostinger)** | 10 dk | build + zip + extract + .htaccess                | `public_html-backup-*` rename geri   |
| **4. DNS + SSL**            | 10 dk | A + CNAME + Let's Encrypt + Render custom domain | DNS TTL 300 → 5 dk geri çevir        |
| **5. Live validation**      | 10 dk | smoke + Lighthouse + Sentry test + IndexNow      | Cut-back FE backup + Render previous |
| **6. 24h monitoring**       | 24 sa | Sentry + Render logs + GA4 + perf baseline       | İncident runbook                     |

---

## Phase 1 — Pre-flight checklist (~5 dk)

### 1.1 Kalite kapıları — hepsi yeşil olmalı

```bash
cd ~/Desktop/ecypro
npm run typecheck && \
npm run lint && \
npm run qa:parity && npm run qa:missing && \
npm run api:contract:strict && \
npm test -- --run && npm run test:server
```

Beklenen: hepsi exit 0. Bir kapı kırılırsa **dur**, ilgili phase report
(`outputs/P##_*.md`) oku ve çöz, tekrar dene.

### 1.2 Commit + git durum

```bash
# Lokal commit sayısı (referans: P27 sonrası 201)
git log --oneline | wc -l

# Working tree temiz mi
git status -s

# Remote bağlı mı (Faz 4'te lazım)
git remote -v
```

Remote yoksa: GitHub repo oluştur → `git remote add origin git@github.com:<org>/ecypro.git`.

> ⚠️ Bu runbook **`git push --force` yapmaz**. Eğer remote ile divergence varsa
> önce konuş, atomik commit'lerle reconcile et.

### 1.3 `.env.production` real değerler

`.env.production` **gitignored** olmalı (`git status` listelemez).
İçindeki tüm `__FILL_ME__` placeholder'ları gerçek değerlerle doldurulmalı.

**Kritik (production blocking):**

| Anahtar                                  | Nereden                                                |
| ---------------------------------------- | ------------------------------------------------------ |
| `VITE_GA_TRACKING_ID`                    | GA4 → Admin → Data Streams (`G-XXXXXXXXXX`)            |
| `VITE_SENTRY_DSN`                        | Sentry → Project Settings → Client Keys (DSN)          |
| `SENTRY_DSN`                             | Backend (aynı veya ayrı server-side project)           |
| `SENTRY_AUTH_TOKEN`                      | Sentry → User → Auth Tokens (`project:releases` scope) |
| `SENTRY_ORG`, `SENTRY_PROJECT`           | Sentry org + project slug                              |
| `DATABASE_URL`                           | Render Postgres → Internal/External URL                |
| `REDIS_URL`                              | Render Redis veya Upstash URL                          |
| `RESEND_API_KEY`                         | resend.com → API Keys                                  |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | @BotFather + @userinfobot                              |

**Auto-generated (P19'da üretildi):** `JWT_SECRET`, `SESSION_SECRET`,
`API_KEY_SALT`, `CORS_ORIGIN`, `NODE_ENV`, `PORT`, `RATE_LIMIT_*`.

### 1.4 DNS + SSL ön kontrol

- Domain Hostinger'da kayıtlı mı? (`whois ecypro.com`)
- Hostinger panel'e giriş + Render hesabına giriş test edildi mi?
- Önceki SSL bitiş tarihi (varsa rollback'ta lazım)

**GO/NO-GO kararı:** 4 kapı yeşilse Phase 2'ye geç. Bir tanesi kırmızıysa
sprint planına geri dön.

---

## Phase 2 — Backend deploy (Render) (~15 dk)

### 2.1 Önce: baseline Prisma migration

`prisma/migrations/` boş → cutover öncesi lokalde baseline üret:

```bash
# Lokal Postgres veya Render'da boş staging DB ile
export DATABASE_URL="postgresql://USER:PASS@HOST:5432/ecypro_baseline"
npx prisma migrate dev --name baseline_p3_2026_05_15
git add prisma/migrations/
git commit -m "chore(db): baseline migration for production cutover"
```

(`outputs/PRISMA_DEPLOY_PLAN.md` detay.)

### 2.2 Git push (henüz değilse)

```bash
git push origin main
```

`PUSH_TO_REMOTE.command` recipe'i mevcut (host'ta çift-tıkla; sandbox push yapmaz).

### 2.3 Render Blueprint apply — Yol A (Dashboard, 5 dk)

1. https://dashboard.render.com/blueprints → **New Blueprint Instance**
2. GitHub repo'yu bağla → `ecypro` seç → Render `render.yaml` otomatik detect eder
3. **Apply** → şunlar provision edilir:
   - `ecypro-api` (Web Service, Frankfurt region, starter plan)
   - `ecypro-db` (Postgres)
   - `ecypro-redis` (Redis, opsiyonel `render.yaml`'da yoksa Upstash)
   - `ecypro-worker` (Worker — BullMQ email/gdpr/cron, opsiyonel)
4. **Env vars** sayfasında 24 değişkeni doldur (`.env.production`'dan kopyala):

```
NODE_ENV=production           (autofill)
PORT=3001                     (autofill)
DATABASE_URL                  (autofill: fromDatabase ecypro-db)
JWT_SECRET                    ← .env.production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://www.ecypro.com,https://ecypro.com
TRUST_PROXY=1
SENTRY_DSN                    ← Sentry
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
LOG_LEVEL=info
LOGTAIL_SOURCE_TOKEN          (opsiyonel)
REDIS_URL                     ← Render Redis/Upstash
CALCOM_API_KEY                ← Cal.com (opsiyonel)
CALCOM_EVENT_TYPE_ID          ← Cal.com
RESEND_API_KEY                ← resend.com
EMAIL_FROM=noreply@ecypro.com
GEMINI_API_KEY                ← Google AI Studio (opsiyonel)
WEBHOOK_HMAC_SECRET           ← openssl rand -hex 32
TELEGRAM_BOT_TOKEN            ← @BotFather
TELEGRAM_CHAT_ID              ← @userinfobot
HIBP_API_KEY                  ← haveibeenpwned (opsiyonel)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
```

5. **Create Resources** → build başlar (~5 dk). Build step otomatik koşar:
   ```
   npm ci && npx prisma generate && npx prisma migrate deploy && \
   npx tsc -p tsconfig.server.json
   ```

### 2.4 Alternatif yollar

- **Yol B — Render CLI:** `brew install render-cli && render login && render blueprint launch`
- **Yol C — REST API:** `RENDER_API_KEY` set + curl (örnek: `outputs/P19_RENDER_DEPLOY_GUIDE.md`)

### 2.5 Healthcheck

```bash
# Render service URL'i dashboard'dan al (örn. ecypro-api-xxxx.onrender.com)
SERVICE=https://ecypro-api-xxxx.onrender.com

curl -s "$SERVICE/api/health" | jq .       # → { ok: true, ... }
curl -s "$SERVICE/api/ready"  | jq .       # → { db: true, redis: true, ... }
```

Service URL'i not al — Phase 4'te `api.ecypro.com` CNAME hedefi.

> **Drain-aware health:** P13'te shutdown sırasında `/health` 503 +
> `Retry-After` döner. Render rolling deploy bu sayede zero-downtime.

---

## Phase 3 — Frontend deploy (Hostinger) (~10 dk)

### 3.1 Fresh build

```bash
cd ~/Desktop/ecypro
rm -rf dist/
npm run build                  # gen:blog + vite build + postbuild
```

Build çıktısı:

- `dist/` ~36MB, ~628 dosya
- `dist/index.html` + `dist/.htaccess` (SPA rewrite, CSP, HSTS, brotli/gzip)
- `dist/robots.txt`, `dist/sitemap*.xml`, `dist/manifest.webmanifest`
- Sourcemap (`.map`) Sentry release upload için (Phase 5'te)

Zip paketi:

```bash
ZIP="outputs/ecypro-frontend-$(date +%Y%m%d-%H%M).zip"
cd dist && zip -rq "../$ZIP" . && cd ..
ls -lh "$ZIP"
```

### 3.2 Upload — Yol A: Hostinger File Manager (5–10 dk)

1. https://hpanel.hostinger.com → Files → **File Manager**
2. `public_html/` → **mevcut içeriği yedekle:** sağ-tık → Rename →
   `public_html-backup-$(date +%Y%m%d-%H%M)`
3. Sağ üst **Upload** → `outputs/ecypro-frontend-*.zip` seç
4. Upload sonrası sağ-tık → **Extract** → `public_html/` içine
5. Hidden files'ı aç (Settings → Show hidden) → `.htaccess` var olduğunu doğrula

### 3.3 Upload — Yol B: SSH + rsync (Business/Premium)

```bash
rsync -avz --delete dist/ user@host.hostinger.com:~/public_html/
```

### 3.4 Upload — Yol C: FTP

```bash
lftp -e "mirror -R --delete --parallel=4 dist/ /public_html/; bye" \
     -u "$FTP_USER","$FTP_PASS" "$FTP_HOST"
```

### 3.5 `.htaccess` doğrula

`dist/.htaccess` zaten şunları içerir:

- SPA fallback: `RewriteRule ^ index.html [L]`
- Cache headers: 1 yıl statics, no-cache HTML
- Brotli + gzip negotiation
- Security: CSP, X-Frame-Options DENY, HSTS, Referrer-Policy

### 3.6 Smoke (DNS henüz aktif değilse temp URL ile)

```bash
curl -sI https://<temp-hostinger-url>/ | head -5
```

---

## Phase 4 — DNS + SSL (~10 dk)

### 4.1 DNS records — Hostinger DNS Zone Editor

**Frontend (apex + www → Hostinger IP):**

| Type  | Name  | Value                                                 | TTL |
| ----- | ----- | ----------------------------------------------------- | --- |
| A     | `@`   | `<Hostinger IP>` (hpanel → Server Information → IPv4) | 300 |
| CNAME | `www` | `ecypro.com.`                                         | 300 |

**Backend (api → Render):**

| Type  | Name  | Value                     | TTL |
| ----- | ----- | ------------------------- | --- |
| CNAME | `api` | `<service>.onrender.com.` | 300 |

### 4.2 DNS propagation doğrula

```bash
dig +short www.ecypro.com    # → Hostinger IP
dig +short ecypro.com        # → Hostinger IP
dig +short api.ecypro.com    # → onrender.com hostname

# Multi-resolver kontrolü (cache miss garantisi)
dig +short @1.1.1.1 www.ecypro.com
dig +short @8.8.8.8 api.ecypro.com
```

TTL 300 → propagation ~5 dk.

### 4.3 SSL — Let's Encrypt

**Frontend (Hostinger):**

1. hpanel → **Security → SSL**
2. `www.ecypro.com` ve `ecypro.com` için **Install Free SSL**
3. ~2 dk içinde "Active"
4. Doğrula:
   ```bash
   curl -sI https://www.ecypro.com | head -5
   openssl s_client -connect www.ecypro.com:443 -servername www.ecypro.com \
     </dev/null 2>/dev/null | openssl x509 -noout -subject -dates
   ```

**Backend (Render):**

1. Render dashboard → Service → **Settings → Custom Domains**
2. `api.ecypro.com` ekle
3. Render Let's Encrypt sertifikası otomatik kesilir (~5 dk)

---

## Phase 5 — Live validation (~10 dk)

### 5.1 Smoke test

```bash
cd ~/Desktop/ecypro

# Frontend (17 check matrix)
node scripts/smoke-test.mjs --url https://www.ecypro.com

# Backend
node scripts/smoke-test.mjs --url https://api.ecypro.com

# Quick health
curl -s https://api.ecypro.com/api/health | jq .
curl -s https://api.ecypro.com/api/ready  | jq .
```

**Beklenen 17 check kategorisi:**

| Kategori | Check                                         |
| -------- | --------------------------------------------- |
| HTTP     | status 200, response <3 s, SPA fallback       |
| HTML     | `<title>`, `og:image`, canonical, `html lang` |
| Sitemap  | valid XML root, urlset count >0               |
| Security | HSTS, X-Content-Type-Options, CSP active      |
| API      | `/api/health` 200 JSON, CORS allow-origin     |

### 5.2 Production Lighthouse

```bash
npx lighthouse https://www.ecypro.com/ \
  --quiet --chrome-flags="--headless=new" \
  --preset=desktop --output=json \
  --output-path=outputs/p28-lh-prod-home.json
```

P27 baseline (`/services`): Perf **69** · A11y **98** · BP **96** · SEO **92**.
Production'da home page benzer veya daha iyi olmalı.

### 5.3 Sentry release + test event

```bash
# Sourcemap upload (release:sentry npm script)
export SENTRY_AUTH_TOKEN=...
export SENTRY_ORG=...
export SENTRY_PROJECT=...
npm run release:sentry

# Test event
node scripts/probe-sentry-event.mjs
```

Sentry → Releases sekmesinde `<commit-sha>` görünür ve test event 200 OK
ile event_id döner.

### 5.4 SEO submit

```bash
npm run seo:push     # IndexNow + Google/Bing Indexing API
```

Search Console (`https://search.google.com/search-console`) ve
Bing Webmaster Tools → Property add → sitemap submit:
`https://www.ecypro.com/sitemap-index.xml`.

### 5.5 GA4 doğrulama

GA4 Realtime → ilk pageview 30 sn içinde görünmeli.

### 5.6 Manuel cutover smoke (kullanıcı bakışıyla)

| Akış                   | Beklenen                                                |
| ---------------------- | ------------------------------------------------------- |
| `/` home               | Hero + CTA + lazy-load 3 sn altında                     |
| `/services`            | Lighthouse fix sonrası hung yok, ROI kalkülatör çalışır |
| `/insights`            | Blog listing + ilk yazı 200                             |
| `/contact` POST        | rate limit + Idempotency-Key respect + Telegram notify  |
| `/privacy/data-rights` | GDPR form submit → 1/24h/email rate limit               |
| `/admin` (login)       | JWT + bcrypt auth flow                                  |

---

## Phase 6 — 24h post-deploy monitoring

### 6.1 Watch dashboards

| Dashboard             | Eşik                  | Aksiyon                       |
| --------------------- | --------------------- | ----------------------------- |
| Sentry — error rate   | <0.5% per session     | >1% → triage + revert düşün   |
| Render — service logs | 0 unhandled rejection | tail -f, alarm Telegram       |
| Render — DB CPU       | <60% sustained        | >80% → pool tune (P18)        |
| Render — Redis ops    | normal aralık         | spike → rate limit kontrol    |
| GA4 — bounce rate     | <70% home             | >85% → smoke regression       |
| Hostinger — bandwidth | aylık quota           | aşım → CDN proxy (Cloudflare) |

### 6.2 Performance baseline document

İlk 24 saatte:

- Web Vitals p75 (Sentry RUM): LCP <2.5s, FID <100ms, CLS <0.1
- Bundle size: `npm run size` (size-limit budget altı)
- 5 saatlik trend snapshot → `outputs/P29_PERF_BASELINE.md`

### 6.3 İncident runbook referansı

İncident sınıflandırması ve ilk 5 dk response:

- **P0 (down):** `docs/INCIDENT_RUNBOOK.md` § P0 sequence
- **P1 (degraded):** `docs/INCIDENT_RUNBOOK.md` § P1 sequence
- **P2 (perf regression):** `docs/PERFORMANCE_REPORT.md` triage
- **Disaster (data loss):** `docs/DISASTER_RECOVERY.md` RTO/RPO + restore drill

Sentry alert → Telegram bot → on-call rotation (`docs/INCIDENT_RESPONSE.md`).

---

## Sıkça Görülen Fail + Triaj

| Hata                             | Çözüm                                                                            |
| -------------------------------- | -------------------------------------------------------------------------------- |
| `api.ecypro.com` CORS reject     | Render env `CORS_ORIGIN` doğru mu? (`https://www.ecypro.com,https://ecypro.com`) |
| `Strict-Transport-Security` yok  | Hostinger `.htaccess` aktif mi? (`mod_headers` enabled)                          |
| Sentry capture fail              | `VITE_SENTRY_DSN` build env'de var mı? (build-time inline)                       |
| Mixed content warning            | `VITE_API_URL` `https://` mi?                                                    |
| Prisma migrate deploy fail       | `DATABASE_URL` Render Internal mı? Baseline migration commit edildi mi?          |
| 502 Bad Gateway (Render)         | Build started ama crash → Render logs → genelde env var eksik                    |
| `/services` PAGE_HUNG geri döndü | P27 Scheduler park regresyonu → `src/lib/director/scheduler.ts` rollback test    |
| GA4 realtime'da pageview yok     | `VITE_GA_TRACKING_ID` build env'de mi? consent banner accept edildi mi?          |

Fail varsa atomik fix commit → push → Hostinger re-upload (sadece değişen
`dist/` dosyaları) veya Render auto-redeploy.

---

## Rollback Stratejisi

| Phase                     | Rollback                                                               |
| ------------------------- | ---------------------------------------------------------------------- |
| Pre-flight kapısı kırıldı | Sprint planına dön, fix commit, baştan                                 |
| Backend (Render)          | Dashboard → Service → Events → **Roll back to previous**               |
| Frontend (Hostinger)      | File Manager → `public_html/` sil → `public_html-backup-*` rename geri |
| DNS yanlış                | TTL 300 → 5 dk içinde geri çevir                                       |
| SSL provisioning fail     | DNS doğru mu? CAA record blokluyor mu? `dig CAA ecypro.com`            |
| Live validation fail (P0) | Cut-back FE backup + Render previous → 24h freeze + post-mortem        |

Acil rollback recipe: `bash scripts/emergency-rollback.sh` (sadece P0).

---

## Sınırlar / Hard Don'ts

- ❌ Şifre / SSH passphrase yazılmaz (sandbox keylog koruması)
- ❌ Hesap oluşturulmaz (kullanıcı doğrulayacak)
- ❌ Kredi kartı bilgisi girilmez (Hostinger/Render kullanıcı tarafı)
- ❌ `git push --force` yok
- ❌ `prisma migrate reset` production'da yok (`db:migrate:reset` lokal-only)
- ❌ `rm -rf public_html/` yedek olmadan yok
- ✅ Atomik commit + yeşil kalite kapısı + rollback hazır

---

## Recipe Dosyaları (host'ta çift-tıkla)

| Recipe                          | Amaç                         |
| ------------------------------- | ---------------------------- |
| `PUSH_TO_REMOTE.command`        | GitHub remote ekle + push    |
| `APPLY_P##_COMMITS.command`     | Phase commit recipe (atomik) |
| `RUN_SMOKE.command`             | Production smoke test        |
| `scripts/emergency-rollback.sh` | P0 acil cut-back             |

---

## Geçmiş Referansları

Bu runbook konsolide eder:

- `outputs/P11_FINAL.md` — visual baseline + integration probe + production runbook
- `outputs/P13_FINAL.md` — backend hardness + RUM + GDPR + asset pipeline
- `outputs/P19_PREFLIGHT.md` + `P19_RENDER_DEPLOY_GUIDE.md` + `P19_HOSTINGER_DEPLOY_GUIDE.md` + `P19_DNS_SSL_SMOKE_GUIDE.md` + `P19_SEO_SENTRY_GUIDE.md` + `P19_LAUNCH.md`
- `outputs/P27_EXEC_FINAL.md` — `/services` PAGE_HUNG fix doğrulama
- `outputs/P28_SECURITY_AUDIT.md` — final pre-deploy security
- `outputs/P28_FINAL_PRE_DEPLOY.md` — bu sprint özet

---

_Master rehber — son güncelleme: P28 Track 2 (2026-05-16)._
