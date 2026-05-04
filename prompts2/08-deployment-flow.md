# EcyPro — Deployment Akışı
# Production-ready: Vercel + Render + PostgreSQL + Redis
# ─────────────────────────────────────────────────────────

## Mimari Diyagram

```
                    ┌──────────────────┐
                    │   Cloudflare     │ ← DNS + DDoS + WAF
                    │     (opsiyonel)   │
                    └─────────┬────────┘
                              │
               ┌──────────────┼──────────────┐
               │              │              │
       ┌───────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
       │  Vercel      │ │ Render  │ │  Sentry     │
       │ (Frontend)   │ │(Backend)│ │ (Monitoring)│
       │ Edge Network │ │ Node.js │ │             │
       └───────┬──────┘ └────┬────┘ └─────────────┘
               │             │
               │      ┌──────┴──────┐
               │      │             │
               │ ┌────▼─────┐  ┌───▼────┐
               │ │PostgreSQL│  │ Redis  │
               │ │ (Render) │  │(Render)│
               │ └──────────┘  └────────┘
               │
       ┌───────▼──────┐
       │ GA4 + Plausible│
       │   (Analytics)  │
       └────────────────┘
```

## Deployment Adımları

### 1. Ön Kontrol (Local)
```bash
npm run typecheck       # 0 hata olmalı
npm run lint            # 0 uyarı olmalı
npm test -- --run       # 29/29 geçmeli
npm run build           # sitemap 41 URL
npx playwright test --project=chromium  # E2E yeşil
npx prisma validate     # Schema geçerli
```

### 2. Environment Variables

#### Vercel (Frontend)
```bash
vercel env add VITE_API_URL production       # https://api.ecypro.com
vercel env add VITE_SENTRY_DSN production    # https://xxx@sentry.io/...
vercel env add VITE_GA_TRACKING_ID production # G-XXXXXXXXXX
```

#### Render (Backend)
```bash
# Render dashboard → Environment
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=<openssl rand -base64 32>
CORS_ORIGIN=https://ecypro.com
REDIS_URL=redis://user:pass@host:6379
SENTRY_DSN=https://xxx@sentry.io/...
NODE_ENV=production
```

### 3. Deploy Sırası

```bash
# A) Database migration (backend deploy öncesi)
npx prisma migrate deploy

# B) Backend deploy
git push origin main          # Render auto-deploy trigger
# veya
render deploy                 # Manual trigger

# C) Frontend deploy
vercel --prod
# veya auto-deploy: git push → Vercel webhook

# D) Verifikasyon
curl https://ecypro.com/         # 200
curl https://api.ecypro.com/api/health  # {"status":"ok"}
```

### 4. Post-Deploy Verification

```bash
# 1. Health check
curl -s https://api.ecypro.com/api/health | jq

# 2. Database bağlantısı
curl -s https://api.ecypro.com/api/health | jq .db

# 3. Redis bağlantısı (SSE test)
curl -N https://api.ecypro.com/api/sse/dashboard

# 4. Sitemap erişimi
curl -s https://ecypro.com/sitemap.xml | head -20

# 5. SEO meta
curl -s https://ecypro.com/ | grep -E "og:|twitter:|canonical"

# 6. Lighthouse production
npx lighthouse https://ecypro.com --output=html --output-path=/tmp/lh-prod.html
```

## Rollback Prosedürü

```bash
# Vercel
vercel rollback

# Render (dashboard)
# Deploy History → önceki deploy → "Redeploy"

# Database rollback (dikkat!)
# npx prisma migrate resolve --rolled-back [migration_name]
```

## Monitoring & Alertler

### Sentry
- Error rate > 5/dk → Slack alert
- Performance regression (p95 LCP > 3s) → alert
- Release tracking (source maps upload)

### Health Check (Uptime Robot / Better Uptime)
- https://ecypro.com (5dk interval)
- https://api.ecypro.com/api/health (5dk)
- Custom: WebSocket SSE endpoint

## Disaster Recovery (DR)

### Yedekleme
- **PostgreSQL**: Render otomatik günlük yedek (30 gün retention)
- **Kullanıcı verisi**: `pg_dump` haftalık + S3 yedek
- **Environment**: `.env.production.backup` (GPG şifreli)

### Restore
```bash
# DB restore
psql $DATABASE_URL < backup-2026-05-01.sql

# Redis restore (eğer persistent)
redis-cli --rdb /backup/dump.rdb

# Env restore
gpg -d .env.production.backup.gpg > .env.production
```

## Maliyet Tahmini (Production)

| Servis | Plan | Aylık (USD) |
|--------|------|-------------|
| Vercel Pro | Team | $20 |
| Render Starter | Web Service + PostgreSQL | $15 |
| Redis (Render) | 25MB free → 250MB $10 | $0-10 |
| Sentry Developer | 5K error/ay | $0 |
| Cloudflare (opsiyonel) | Free | $0 |
| Domain (ecypro.com) | .com | ~$12/yıl |
| **Toplam** | | **~$35-45/ay** |

## CI/CD Pipeline Özeti (.github/workflows/ci.yml)

```yaml
name: CI
on: [push, pull_request]
jobs:
  quality:
    - typecheck + lint + test
  build:
    - npm run build
    - sitemap verify (≥ 40 URL)
  e2e:
    - Playwright chromium
  release:  # on tag v*.*.*
    - Sentry source maps upload (if SENTRY_AUTH_TOKEN)
```
