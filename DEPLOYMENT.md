# DEPLOYMENT — EcyPro Premium Consulting

> Vercel (frontend) + Render (backend) + Neon (Postgres) + Upstash (Redis) dağıtım rehberi.

## Frontend — Vercel

### İlk kurulum
1. Vercel Dashboard → New Project → GitHub repo bağla.
2. Framework preset: **Vite**.
3. Build command: `npm run build` (postbuild sitemap + rss üretir).
4. Output directory: `dist`.
5. Node version: 20.x.

### ENV variables (Production scope)
```
VITE_API_BASE_URL          = https://api.ecypro.com
VITE_GA4_MEASUREMENT_ID    = G-XXXXXXXXXX
VITE_SENTRY_DSN            = https://xxxx@sentry.io/yyyy
VITE_SENTRY_ENVIRONMENT    = production
VITE_GSC_VERIFICATION      = google-site-verification token
VITE_CONTACT_PHONE         = +905417143000
VITE_WHATSAPP_URL          = https://wa.me/905417143000
VITE_AB_TESTS              = (opsiyonel — test config)
VITE_SOCIAL_PROOF_FEED     = (opsiyonel — live feed endpoint)
VITE_NEWSLETTER_ENDPOINT   = /api/newsletter/subscribe
```

### Custom domain
- `www.ecypro.com` → CNAME → `cname.vercel-dns.com`
- `ecypro.com` (apex) → A record → Vercel anycast IP (76.76.21.21)
- 301 redirect: ecypro.com → www.ecypro.com (Vercel `vercel.json` ile)

### Deploy
- **Otomatik:** `git push origin main` tetikler.
- **Manuel:** Vercel Dashboard → Deployments → "Redeploy".
- **Rollback:** Önceki Production Deployment → "Promote to Production".

## Backend — Render

### İlk kurulum
1. Render Dashboard → New → Web Service → GitHub repo bağla.
2. Root directory: `/` (repo root).
3. Build command: `npm install && npm run build:server && npx prisma generate`.
4. Start command: `node dist/server/index.js`.
5. Region: Frankfurt (eu-central-1) — Türkiye/Avrupa latency için.
6. Plan: Standard (en az 2 GB RAM, BullMQ + Prisma için yeterli).

### Worker servisi (ayrı process)
- Render Dashboard → New → Background Worker.
- Start command: `node dist/server/workers/standalone.js`.
- ENV: aynı pool'u paylaşır (Render'da Environment Group olarak organize et).

### ENV variables
```
NODE_ENV                   = production
DATABASE_URL               = postgresql://user:pass@host/db?sslmode=require
REDIS_URL                  = rediss://default:pass@host:6379
JWT_SECRET                 = 64+ char rastgele string (rotate 90 günde bir)
ALLOWED_ORIGINS            = https://www.ecypro.com,https://ecypro.com

# Email (Resend primary)
RESEND_API_KEY             = re_xxxxxxxxxx
EMAIL_FROM                 = EcyPro <noreply@ecypro.com>

# SMTP (P55 drip campaign)
SMTP_HOST                  = smtp.resend.com
SMTP_PORT                  = 587
SMTP_USER                  = resend
SMTP_PASS                  = re_xxxxxxxxxx
SMTP_FROM                  = EcyPro <info@ecypro.com>

# Newsletter
NEWSLETTER_HMAC_SECRET     = 32+ char rastgele
DRIP_CAMPAIGN_ENABLED      = 1
APP_URL                    = https://www.ecypro.com

# IndexNow
INDEXNOW_KEY               = 32 char hex
INDEXNOW_KEY_LOCATION      = https://www.ecypro.com/<KEY>.txt
INDEXNOW_HOST              = www.ecypro.com
INDEXNOW_ENABLED           = 1

# Sentry / log
SENTRY_DSN                 = https://yyyy@sentry.io/zzzz
LOG_LEVEL                  = info

# Telegram (operator notify)
TELEGRAM_BOT_TOKEN         = bot-token
TELEGRAM_CHAT_ID           = -100xxxxx
```

### Database — Neon Postgres
1. Neon Dashboard → New Project → Region Frankfurt.
2. Branch: `main` (production), `dev` (staging).
3. Connection string'i `DATABASE_URL`'a koy.
4. Migration:
   ```bash
   npx prisma migrate deploy   # production
   npx prisma generate
   ```

### Cache — Upstash Redis
1. Upstash Dashboard → Create Database → Region Frankfurt → Region Replica eu-west-1.
2. TLS connection string'i `REDIS_URL`'a koy.
3. BullMQ + drip queue + rate limit + idempotency aynı pool'u kullanır.

## Post-deploy verify checklist

### Vercel
- [ ] Build success, deployment "Production" badge yeşil.
- [ ] `https://www.ecypro.com` 200 + hero görünür.
- [ ] Sitemap `https://www.ecypro.com/sitemap.xml` accessible.
- [ ] Lighthouse mobile/desktop Perf ≥85, A11y ≥95, BP ≥90, SEO ≥95 (`npm run lh:audit`).
- [ ] Network tab: 0 mixed content warning.
- [ ] CSP / X-Frame-Options / HSTS headers var.

### Render
- [ ] `https://api.ecypro.com/api/health` 200 + `{status:ok,db:ok,redis:ok}`.
- [ ] `https://api.ecypro.com/api/newsletter/subscribe` POST + valid payload → 201.
- [ ] Logs (Render Dashboard → Logs) — drip worker + indexnow cron başlangıç logları görünüyor.

### Email
- [ ] SMTP smoke: `curl -X POST .../api/contact` ile contact form submit → ack mail T+10s içinde inbox'a düşüyor.

### SEO
- [ ] Search Console → sitemap submitted, no crawl errors.
- [ ] Bing IndexNow cron başarılı (`[indexnow] submitted X URLs`).

## Rollback prosedürü

### Frontend rollback
1. Vercel Dashboard → Deployments → önceki yeşil deployment → "Promote to Production".
2. Anında etki (CDN cache invalidation otomatik).

### Backend rollback
1. Render Dashboard → Manual Deploy → önceki commit hash → "Deploy".
2. Eğer DB migration kırıldıysa:
   ```bash
   npx prisma migrate resolve --rolled-back <migration_name>
   ```
3. Veya Neon Branch Restore (point-in-time recovery, son 7 gün).

### Worker rollback
1. Render Worker Service → "Suspend" → loglar incele.
2. Fix push → "Resume".

## Maintenance window

- **Önerilen:** Salı sabah 04:00-06:00 UTC (TR 07:00-09:00) — düşük trafik.
- **DB migration:** Önce staging'de test (`prisma migrate dev`), sonra production'da `prisma migrate deploy`.
- **Rotate JWT_SECRET:** 90 günde bir; rotate öncesi tüm session'lar geçersiz olur → user yeniden login eder. Önceden duyuru maili at.

## Cost estimate (aylık)

| Servis | Tier | Aylık |
|---|---|---|
| Vercel | Pro | $20 (Hobby tier $0 ama analytics + edge config kısıtlı) |
| Render Web | Standard | $25 |
| Render Worker | Starter | $7 |
| Neon Postgres | Scale | $19 |
| Upstash Redis | Pro Free 256MB | $0 (10K request/day free) |
| Resend | Hobby 3K mail/day | $0 |
| Sentry | Developer 5K events/mo | $0 |
| **TOPLAM** |  | **~$71/ay** |

## Disaster recovery

- DB: Neon point-in-time recovery (7 gün). Her gece 03:00 UTC otomatik snapshot.
- Code: GitHub branch protection (main); force push yasak (Lefthook).
- Vercel: önceki 30 deployment tutulur, anlık rollback mümkün.
- Render: image registry'de son 5 build artefaktı.
- Secrets: 1Password vault (paylaşımlı), Render Environment Group'ta sealed.
