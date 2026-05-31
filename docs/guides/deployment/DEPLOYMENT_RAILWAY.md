# Deployment — Railway (api.ecypro.com)

**Hedef:** EcyPro API'ı Railway üzerinde production'a almak.
**Frontend:** Hostinger (static, www.ecypro.com).
**API:** Railway service + Postgres plugin → `api.ecypro.com` (CNAME).

Render alternatifi. Avantajlar: dakikalık fiyatlandırma, daha esnek build (nixpacks). Dezavantaj: ücretsiz tier yok ($5 trial credit).

---

## 1. Ön gereksinimler

- Railway hesabı (https://railway.app)
- GitHub repo Railway'e bağlı (App-level GitHub auth)
- Domain Hostinger'da (api.ecypro.com için DNS yetkisi)
- Sentry hesabı

## 2. Tek seferlik baseline migration

`outputs/PRISMA_DEPLOY_PLAN.md` aynı şekilde uygulanır:

```bash
npx prisma migrate dev --name baseline_p3_2026_05_15
git add prisma/migrations/
git commit -m "chore(db): baseline migration"
git push origin main
```

## 3. Project create

```bash
# Railway CLI
brew install railway

# Login
railway login

# Repo root'unda
railway init        # yeni project oluştur
railway link        # mevcut project'e bağla
```

Veya web UI'dan: New Project → Deploy from GitHub repo → ecypro.

## 4. Postgres plugin ekle

Dashboard → Project → New → Database → PostgreSQL.
`DATABASE_URL` otomatik service'e enjekte edilir.

## 5. Environment variables

Railway dashboard → Service → Variables. `railway.toml` içinde liste var:

```bash
NODE_ENV=production
PORT=3001
JWT_SECRET=<openssl rand -hex 64>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://www.ecypro.com,https://ecypro.com
TRUST_PROXY=1

SENTRY_DSN=<from sentry>
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
LOG_LEVEL=info

REDIS_URL=<redis plugin or upstash>
CALCOM_API_KEY=...
CALCOM_EVENT_TYPE_ID=...
RESEND_API_KEY=...
EMAIL_FROM=noreply@ecypro.com
GEMINI_API_KEY=...
WEBHOOK_HMAC_SECRET=<openssl rand -hex 32>
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

CLI alternatif:

```bash
railway variables set JWT_SECRET=$(openssl rand -hex 64)
railway variables set CORS_ORIGIN=https://www.ecypro.com,https://ecypro.com
# ...
```

## 6. Build & start

`railway.toml` (commit edildi BE-10) build/start command'ları tanımlar. `nixpacks.toml` Node 22 + openssl pin.

İlk deploy:

```bash
railway up
```

## 7. İlk seed

```bash
railway run npm run db:seed
```

Aynı uyarı: `ADMIN_EMAIL` + `ADMIN_PASSWORD` geçici olarak set, seed sonrası sil.

## 8. Custom domain

Railway dashboard → Service → Settings → Domains → Custom Domain → `api.ecypro.com`.
Railway bir CNAME hedefi verir. Hostinger DNS:

- Type: CNAME
- Host: `api`
- Value: `<railway-cname-target>`
- TTL: 14400

SSL otomatik (Let's Encrypt).

## 9. Smoke tests

```bash
curl https://api.ecypro.com/api/health
curl https://api.ecypro.com/api/ready
curl https://api.ecypro.com/api/docs.json | jq .info
```

## 10. CORS preflight

```bash
curl -i -X OPTIONS https://api.ecypro.com/api/auth/login \
  -H 'Origin: https://www.ecypro.com' \
  -H 'Access-Control-Request-Method: POST'
```

## 11. Logs

Dashboard → Service → Deployments → Logs. Better Stack için `LOGTAIL_SOURCE_TOKEN` opsiyonel.

## 12. Rollback

Dashboard → Service → Deployments → previous deployment → "Rollback".
DB schema rollback için Railway DB → "Backup" → restore.

## 13. Maliyet (Mayıs 2026)

Railway "metered usage" — RAM × CPU × saat:

- Web service ~$5-10/ay (1 vCPU, 512MB, 24/7)
- Postgres ~$5-7/ay (1GB depolama)
- **Toplam:** $10-17/ay (Render'a benzer)

İlk $5 trial credit deploy'ı test etmek için yeterli.

---

**Son kontrol listesi:**

- [ ] Baseline migration commit
- [ ] Postgres plugin attached
- [ ] Tüm env vars set
- [ ] `railway up` başarılı
- [ ] Seed çalıştırıldı
- [ ] DNS CNAME api.ecypro.com → railway
- [ ] SSL aktif
- [ ] /api/health, /api/ready 200
- [ ] Sentry test event
