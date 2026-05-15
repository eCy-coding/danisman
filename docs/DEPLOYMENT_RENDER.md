# Deployment — Render (api.ecypro.com)

**Hedef:** EcyPro API'ı Render üzerinde production'a almak.
**Frontend:** Hostinger (static, www.ecypro.com).
**API:** Render Web Service + Postgres → `api.ecypro.com` (CNAME).

---

## 1. Ön gereksinimler

- Render hesabı (https://dashboard.render.com)
- GitHub repo Render'a bağlı
- Domain Hostinger'da (www.ecypro.com + api.ecypro.com için DNS yetkisi)
- Sentry hesabı (DSN için), opsiyonel: Better Stack, Telegram bot

## 2. Tek seferlik baseline migration (önemli)

`prisma/migrations/` boş. Render'a göndermeden önce **lokalde** baseline üret:

```bash
# Lokal Postgres veya Render'da boş bir staging DB ile:
export DATABASE_URL="postgresql://USER:PASS@HOST:5432/ecypro_baseline"
npx prisma migrate dev --name baseline_p3_2026_05_15
git add prisma/migrations/
git commit -m "chore(db): baseline migration for production cutover"
git push origin main
```

Detay: `outputs/PRISMA_DEPLOY_PLAN.md`.

## 3. Render Blueprint deploy

```bash
# Render CLI yüklü mü?
brew install render

# Repo root'unda render.yaml var (BE-10 commit'i)
render blueprint apply
```

Veya web UI'dan:
1. Dashboard → New → Blueprint
2. Repo seç → `render.yaml` algılanır
3. Apply

## 4. Environment variables (dashboard)

`render.yaml` içinde `sync: false` olan değişkenler manuel set edilmeli:

| Key | Where to get |
|-----|--------------|
| `SENTRY_DSN` | Sentry → Project Settings → Client Keys |
| `LOGTAIL_SOURCE_TOKEN` | (opsiyonel) Better Stack → Source create |
| `REDIS_URL` | Upstash veya Render Redis service |
| `CALCOM_API_KEY` | cal.com → Settings → API Keys |
| `CALCOM_EVENT_TYPE_ID` | cal.com → Event Types → URL slug |
| `RESEND_API_KEY` | resend.com → API Keys |
| `GEMINI_API_KEY` | aistudio.google.com → API key |
| `TELEGRAM_BOT_TOKEN` | @BotFather → /newbot |
| `TELEGRAM_CHAT_ID` | @userinfobot ile chat ID al |
| `HIBP_API_KEY` | (opsiyonel) haveibeenpwned.com/API/Key |

`JWT_SECRET` ve `WEBHOOK_HMAC_SECRET` Render tarafından otomatik üretilir (`generateValue: true`).

## 5. İlk seed

Migrations otomatik (build step). Seed manuel:

```bash
# Render Shell (Service → Shell tab):
NODE_ENV=production npm run db:seed
```

**Not:** seed env'den `ADMIN_EMAIL` + `ADMIN_PASSWORD` okur. Dashboard'da bu env'leri **geçici olarak** set et, seed çalıştır, sonra sil. Parolayı 1Password'a kaydet.

## 6. Custom domain (api.ecypro.com)

1. Render dashboard → Service → Settings → Custom Domains → `api.ecypro.com` ekle
2. Render bir CNAME hedefi verir (örn. `ecypro-api.onrender.com`)
3. Hostinger DNS panel:
   - Type: CNAME
   - Host: `api`
   - Value: `<render-cname-target>`
   - TTL: 14400
4. SSL otomatik (Let's Encrypt, Render yönetir, ~5 dk)

## 7. Smoke tests

```bash
# Liveness
curl https://api.ecypro.com/api/health
# {"status":"ok","service":"ecypro-api","version":"...","uptime":...}

# Readiness
curl https://api.ecypro.com/api/ready
# {"status":"ok","checks":{"db":"ok","redis":"ok",...}}

# OpenAPI spec
curl https://api.ecypro.com/api/docs.json | jq .openapi

# Login (admin)
curl -X POST https://api.ecypro.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@ecypro.com","password":"<seed-password>"}'
```

## 8. CORS doğrulama

Frontend (Hostinger) → Backend (Render) cross-origin. Hatalı CORS = "Network error" konsola.

```bash
# Preflight smoke
curl -i -X OPTIONS https://api.ecypro.com/api/auth/login \
  -H 'Origin: https://www.ecypro.com' \
  -H 'Access-Control-Request-Method: POST'
# Beklenen: 204 + Access-Control-Allow-Origin: https://www.ecypro.com
```

## 9. Auto-deploy davranışı

`render.yaml`: `autoDeploy: true`, `branch: main`. Her `git push origin main` Render'da deploy tetikler.

**İlk hafta:** auto-deploy'ı **kapat** (Settings → Auto-Deploy: No). Manuel deploy ile kontrol altında ilerle. Stabil oldukça aç.

## 10. Rollback

1. Dashboard → Service → Deploys
2. Önceki başarılı deploy'a "Rollback" tıkla
3. Trafik 30sn içinde önceki sürüme döner
4. Veritabanı schema değişikliği varsa: snapshot'tan restore (BE-9 §7)

## 11. İzleme

- **Logs:** Service → Logs tab (canlı stream); Better Stack varsa `LOGTAIL_SOURCE_TOKEN` ile centralize
- **Errors:** Sentry → Issues
- **Uptime:** Render built-in (Settings → Notifications → email/slack)
- **Telegram:** kritik hatalar `lib/telegram.ts` üzerinden anlık bildirim

## 12. Maliyet (Mayıs 2026)

| Bileşen | Plan | $/ay |
|---------|------|------|
| Web Service | Starter | $7 |
| Postgres | Starter | $7 |
| Toplam | | **$14** |

Trafik artışında `scaling: maxInstances: 3` otomatik genişler (her ek instance $7).

---

**Son kontrol listesi (deploy day):**

- [ ] Baseline migration commit edildi + push edildi
- [ ] Blueprint apply yapıldı
- [ ] Tüm env vars dashboard'da set
- [ ] Seed çalıştırıldı (admin user var)
- [ ] DNS CNAME api.ecypro.com → render
- [ ] SSL aktif (browser: padlock var)
- [ ] /api/health 200, /api/ready 200
- [ ] Login + dashboard erişimi smoke test
- [ ] Sentry'de test event göründü
- [ ] Auto-deploy kapalı (ilk hafta)
