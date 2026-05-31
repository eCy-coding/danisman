# EcyPro — Maintenance Guide

**Hedef kitle:** EcyPro operasyon takımı, deploy sorumlusu, on-call engineer.
**Güncelleme:** P10 — 16 Mayıs 2026

---

## 1) Local development kurulum

### Bağımlılıklar

- **Node.js** v20+ (`nvm install 20 && nvm use 20`)
- **npm** v10+ (Node ile gelir; `npm-only` — `pnpm` veya `yarn` kullanma)
- **Docker** (yerel Postgres için, isteğe bağlı — `docker-compose.dev.yml`)
- **PostgreSQL** v15+ (Docker veya native install)

### İlk kurulum

```bash
git clone <repo>
cd ecypro
npm install                                    # bağımlılıklar
cp .env.production.example .env.development    # development env
# .env.development'i düzenle: VITE_API_URL=http://localhost:3001/api vb.

# Postgres'i ayağa kaldır (Docker)
docker compose -f docker-compose.dev.yml up -d
npx prisma db push                              # şemayı DB'ye uygula
npm run db:seed                                 # opsiyonel seed verisi
```

### Çalıştırma

```bash
npm run dev          # vite + server + terminal (concurrently)
npm run dev:server   # sadece backend (tsx server/index.ts)
npm run preview      # vite preview --port 4173 (build sonrası test)
```

### Hızlı sağlık kontrolü

```bash
curl http://localhost:5173/                    # frontend
curl http://localhost:3001/api/health          # backend
curl http://localhost:3001/__health            # LB health (zero-deps)
```

---

## 2) Test koşturma

| Komut                         | Kapsam                        |
| ----------------------------- | ----------------------------- |
| `npm run typecheck`           | Frontend + server TS strict   |
| `npm run lint`                | ESLint --max-warnings 0       |
| `npm run format`              | Prettier --write              |
| `npm test -- --run`           | Vitest unit (web 77 + setup)  |
| `npm run test:server`         | Vitest server (155 test)      |
| `npm run test:e2e`            | Playwright tam suite          |
| `npm run test:e2e:fast`       | Sanity duman (17 check)       |
| `npm run e2e:local`           | mock + preview + e2e zinciri  |
| `/integration-health`         | env validation + format check |
| `/integration-health --probe` | + live endpoint probe         |

### Pre-commit (Lefthook)

Her commit'te otomatik:

- lint-staged (eslint + prettier)
- gitleaks (secret scan)
- commitlint (Conventional Commits)

### Pre-push (Lefthook)

Her push'ta:

- typecheck (web + server)
- build (vite + postbuild)

---

## 3) Build + deploy süreci

### Build

```bash
npm run build                  # gen:blog + vite build + postbuild (sitemap+rss+og)
npm run build:server           # tsc -p tsconfig.server.json → dist-server/
npm run build:all              # ikisi birden
```

`dist/` → frontend artifact (Hostinger public_html için)
`dist-server/` → backend artifact (Render için)

### Deploy

Tek-tık zinciri:

```bash
./DEPLOY_NOW.command
```

Adımlar:

1. Pre-checks (typecheck + lint + test + build + integration-health)
2. Git status temizliği
3. Backend deploy (Render API veya manual)
4. Frontend deploy (Hostinger lftp veya manual)
5. DNS check (`dig`)
6. SSL check (`openssl s_client`)
7. Live smoke (`DEPLOY_LIVE_SMOKE.command`)
8. SEO submit (`npm run seo:push`)

Credentials env vars:

- `RENDER_API_KEY`, `RENDER_SERVICE_ID` (Render API)
- `HOSTINGER_FTP_HOST`, `HOSTINGER_FTP_USER`, `HOSTINGER_FTP_PASS` (Hostinger FTP)
- `INDEXNOW_KEY` (in `.env.production`)

### Rollback

```bash
git revert <commit-hash>             # tek commit geri al
git push origin main                  # yeni commit canlıya gider
```

Veya Render Dashboard'tan **Deploy → Rollback to previous**.

---

## 4) Common troubleshooting

### Frontend 404 (route not found)

**Belirti:** Hostinger'da `/about` direkt erişimde 404.

**Çözüm:** `public/.htaccess` SPA fallback rule'unun deploy edildiğini kontrol et:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### Backend 502 (Render cold start)

**Belirti:** İlk istek 30s gecikiyor, ardından normal.

**Çözüm:** Render Free tier 5 dakika inaktivite sonrası uyuyor. Çözüm:

- Render Starter tier'a geç (~$7/ay)
- Veya `cron-job.org` ile 4 dakikada bir `/__health` ping

### Contact form çalışmıyor

**Belirti:** Form submit 200 ama Telegram'a mesaj gelmiyor.

**Adımlar:**

1. `/integration-health --probe` çalıştır → Telegram getMe PASS mi?
2. Browser DevTools → Console → CSP violation var mı? (`api.telegram.org` connect-src'de olmalı, P10'da eklendi)
3. Network tab → `https://api.telegram.org/...` request status 200 mü?
4. Bot token `123456:ABC-DEF...` formatında mı?
5. Chat ID numeric mi? (`-100123...` veya `123456`)

### Sentry alarmları

**Belirti:** Sentry'de hata patlaması.

**Adımlar:**

1. Sentry Dashboard → Issues → en yeni issue
2. **Event detail** → stack trace, breadcrumbs
3. Release version match mi? (`ecypro@1.0.0`)
4. Source map yüklü mü? (`npm run release:sentry` yapıldı mı?)
5. **PII scrub** çalışıyor mu? Event'te `email: [redacted]` görmeli — görmüyorsan `beforeSend` hook patlamış olabilir
6. Issue alanını `Resolved` veya `Ignored` olarak işaretle

### Performance regression yakalandı

**Belirti:** Lighthouse skoru -5 puan düştü.

**Adımlar:**

1. `git log --oneline` son commit'leri incele
2. `npm run lh:audit` lokal Lighthouse koş, hangi sayfada düştü?
3. Bundle size diff: `npm run build` + `ls -lh dist/assets/*.js`
4. Yeni 3rd-party script var mı? `index.html` CSP `script-src` değişti mi?
5. Lazy-load regression mi? `React.lazy()` chain'i kırıldı mı?
6. Suspect commit'i revert et + tekrar build + lh:audit

### Postgres connection pool tükendi

**Belirti:** Backend "too many connections" hatası.

**Çözüm:** `DATABASE_URL`'e pool config ekle:

```
postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
```

Prisma 7 driver adapter ile pgBouncer entegrasyonu mümkün — bkz. `docs/DEPLOYMENT_RENDER.md`.

---

## 5) Integration env var rehberi

`.env.production` doldurma checklist'i:

| Değişken                       | Format                                              | Kaynak                             | Zorunlu?             |
| ------------------------------ | --------------------------------------------------- | ---------------------------------- | -------------------- |
| `VITE_API_URL`                 | `https://api.ecypro.com/api` veya `""` (simulation) | Plan C/A kararı                    | ✅                   |
| `VITE_PROD_URL`                | `https://www.ecypro.com`                            | sabit                              | ✅                   |
| `VITE_SENTRY_DSN`              | `https://<key>@<org>.ingest.sentry.io/<id>`         | Sentry → Settings → Client Keys    | ✅                   |
| `VITE_GA_TRACKING_ID`          | `G-XXXXXXXXXX`                                      | GA4 → Admin → Data Streams         | ✅                   |
| `VITE_TELEGRAM_BOT_TOKEN`      | `123456:ABC-DEF...`                                 | @BotFather → /newbot               | ✅                   |
| `VITE_TELEGRAM_CHAT_ID`        | `-1001234567890` veya numeric                       | @userinfobot veya getUpdates       | ✅                   |
| `VITE_GROWTHBOOK_CLIENT_KEY`   | `sdk-...`                                           | growthbook.io → SDK Connection     | ⚠ opsiyonel          |
| `VITE_GROWTHBOOK_API_HOST`     | `https://cdn.growthbook.io`                         | default                            | ⚠ opsiyonel          |
| `VITE_CLARITY_PROJECT_ID`      | `<10-char>`                                         | clarity.microsoft.com              | ⚠ opsiyonel          |
| `VITE_LIVECHAT_PROVIDER`       | `crisp` / `tawk` / `intercom` / `""`                | provider seçimi                    | ⚠ opsiyonel          |
| `VITE_LIVECHAT_ID`             | provider account ID                                 | provider dashboard                 | ⚠ opsiyonel          |
| `SENTRY_AUTH_TOKEN`            | `sntrys_...`                                        | Sentry → Settings → Auth Tokens    | ⚠ source-map için    |
| `SENTRY_ORG`                   | `ecypro`                                            | Sentry slug                        | ⚠ source-map için    |
| `SENTRY_PROJECT`               | `ecypro-frontend`                                   | Sentry project slug                | ⚠ source-map için    |
| `INDEXNOW_KEY`                 | UUID benzeri                                        | rastgele üret + `public/<key>.txt` | ⚠ SEO submit için    |
| `DATABASE_URL`                 | `postgresql://...`                                  | Render Postgres / Hostinger MySQL  | ✅ backend           |
| `JWT_SECRET`                   | `openssl rand -hex 32`                              | local üret                         | ✅ backend           |
| `REDIS_URL`                    | `redis://...`                                       | Upstash/Render                     | ⚠ in-memory fallback |
| `RENDER_API_KEY`               | `rnd_...`                                           | Render → Account → API Keys        | ⚠ DEPLOY_NOW için    |
| `RENDER_SERVICE_ID`            | `srv-...`                                           | Render service settings            | ⚠ DEPLOY_NOW için    |
| `HOSTINGER_FTP_HOST/USER/PASS` | —                                                   | Hostinger panel → FTP Accounts     | ⚠ DEPLOY_NOW için    |

---

## 6) Sentry alarmlarına bakma

### Dashboard erişim

1. https://sentry.io/organizations/<ORG>/issues/
2. Filter: `environment:production` + `release:ecypro@1.0.0`
3. Sort: `Last Seen` → en yeni

### Issue triage

| Severity                                       | Aksiyon                                   |
| ---------------------------------------------- | ----------------------------------------- |
| **Crash** (component error, unhandled promise) | Acil — replay incele, root cause + hotfix |
| **Error** (logger.error, captureException)     | 24 saat içinde fix planla                 |
| **Warning** (logger.warn)                      | Sprint kuyruğuna                          |
| **Info** (breadcrumb)                          | İzlem — aksiyon yok                       |

### Alert kuralları (önerilen)

- `production` environment'ta yeni `error` level event → email + Slack
- Aynı issue 100+ user'da → urgent Slack
- Performance: P75 LCP > 4s → email weekly digest

---

## 7) Performance regression playbook

Lighthouse skoru düştüğünde:

1. `git bisect start && git bisect bad HEAD && git bisect good <last-good-commit>`
2. Her bisect step'inde `npm run lh:audit` veya `/lighthouse-check`
3. Suspect commit'i revert: `git revert <hash>`
4. Yeniden ölç → skor geri geldi mi?
5. Geldiyse: commit'i farklı şekilde reimplementliyon
6. Gelmediyse: bisect'i derinleştir

**Yaygın suspectler:**

- Yeni `npm install` paketi (bundle bloat)
- `useEffect` dependency değişimi (infinite render — P10 ServicesPage bulgusu!)
- `motion/react` layout animation
- `backdrop-blur-*` GPU compositor
- 3rd-party script injection (CSP geçerse de FCP'yi şişirir)

---

## 8) Sık komutlar (cheat sheet)

```bash
# Geliştirme
npm run dev
npm run dev:server
npm run preview

# Build
npm run build
npm run build:server
npm run build:all

# Kalite
npm run typecheck
npm run lint
npm run format
npm test -- --run
npm run test:server
npm run test:e2e
npm run test:e2e:fast

# DB
npm run db:push
npm run db:migrate:dev
npm run db:migrate:deploy
npm run db:studio
npm run db:seed
npm run db:backup

# Deploy
./DEPLOY_NOW.command
./DEPLOY_BACKEND_RENDER.command
./DEPLOY_FRONTEND_HOSTINGER.command
./DEPLOY_LIVE_SMOKE.command
./DEPLOY_PRECHECK.command

# Integration health
node scripts/integration-health.mjs
node scripts/integration-health.mjs --probe

# SEO
npm run gen:sitemap
npm run gen:rss
npm run seo:push
npm run seo:indexnow
npm run seo:weekly-diff

# Sentry release
npm run release:sentry

# Lighthouse
npm run lh:audit

# Performance
npm run perf:budget          # lighthouse-budget check
```

---

## 9) On-call escalation

| Durum                    | Aksiyon                                                | İletişim           |
| ------------------------ | ------------------------------------------------------ | ------------------ |
| Site down (frontend 5xx) | Hostinger panel + DNS check                            | Hostinger support  |
| API down (Render 5xx)    | Render Dashboard + logs                                | Render status page |
| Contact form çalışmıyor  | `/integration-health --probe` Telegram                 | Bot owner          |
| DB down                  | `DATABASE_URL` validate + Render Postgres logs         | Render Postgres    |
| Sentry overflow          | Sample rate düşür `.env.production` `tracesSampleRate` | Sentry dashboard   |

---

## 10) Faz sistemi

Proje P0 → P10 fazlardan geçti. P11+ için `outputs/PROJECT_COMPLETE.md` Section 8 önerilerine bak.

Yeni faz başlatırken:

1. `outputs/P11_PROMPT.md` yaz (P10 prompt pattern'ini izle)
2. Atomik commit disiplin korunsun
3. Test silmek yasak (kullanıcı açık talep etmediği sürece)
4. CLAUDE.md doktrini (Solid surface, Fibonacci, npm-only) sıkı uygulanır

---

Bu rehber yaşayan bir doküman — yeni keşifler, yeni troubleshooting case'leri buraya eklenir. Pre-commit hook'u olmamasından dolayı manuel güncelleme: `git commit -m "docs(maintenance): <başlık>"`.
