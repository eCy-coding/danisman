# eCyPro Premium Consulting

> High-performance, premium yönetim panosu + landing site. Production-ready,
> Lighthouse-validated, GDPR-conscious. **Senaryo C** deploy: Hostinger static
> frontend + Render Web Service backend.

<p align="left">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white" />
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss&logoColor=white" />
  <img alt="Express" src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white" />
  <img alt="ESLint clean" src="https://img.shields.io/badge/ESLint-clean-4b32c3?logo=eslint&logoColor=white" />
  <img alt="Lighthouse" src="https://img.shields.io/badge/Lighthouse-Perf%2069%20%C2%B7%20A11y%2098%20%C2%B7%20BP%2096%20%C2%B7%20SEO%2092-ff6b35?logo=lighthouse&logoColor=white" />
  <img alt="Tests" src="https://img.shields.io/badge/tests-passing-2ea44f" />
</p>

**Live:** https://www.ecypro.com (cutover sonrası — bkz. `docs/guides/deployment/DEPLOY_RUNBOOK.md`)
**API:** https://api.ecypro.com (Render)

---

## Tech Stack

| Katman           | Bileşen                                                        |
| ---------------- | -------------------------------------------------------------- |
| **Frontend**     | React 19 · Vite 6 · TypeScript strict · Tailwind v4 (PostCSS)  |
| **State / Data** | Zustand · TanStack Query · React Router DOM v7                 |
| **Forms**        | React Hook Form · Zod                                          |
| **Backend**      | Express 5 · Prisma 7 · Postgres · Redis (ioredis) · BullMQ     |
| **Auth**         | JWT · bcrypt                                                   |
| **Email**        | EmailJS (frontend) · nodemailer (server transactional)         |
| **Charts**       | Recharts                                                       |
| **Realtime**     | Server-Sent Events (`/events`) — auth + topic-based pub/sub    |
| **Testing**      | Vitest (unit) · Playwright (E2E) · axe-core (a11y)             |
| **Tooling**      | ESLint 9 · Prettier · Lefthook · Husky · commitlint · gitleaks |
| **Monitoring**   | Sentry (FE + node) · Web Vitals · synthetic monitor            |
| **CMS**          | Keystatic                                                      |
| **i18n**         | i18next (EN + TR)                                              |

---

## Quick Start

```bash
git clone <repo-url>
cd ecypro
npm install
cp .env.example .env.local        # EmailJS + EmailJS template + Sentry DSN
npm run dev                       # vite + server + terminal (3 paralel)
```

`http://localhost:5173` (FE) · `http://localhost:8787` (BE).

**Tam stack (Docker DB + tmux 15-pane):**

```bash
npm run dev:up      # Postgres + Redis + Mailpit + 15-pane orchestrator
npm run dev:down    # her şeyi kapat
```

Detay: [`docs/guides/ORCHESTRATOR.md`](docs/guides/ORCHESTRATOR.md).

---

## Build & Test

```bash
npm run build               # gen:blog + vite build (postbuild: sitemap + rss + og-image)
npm run preview             # vite preview --port 4173

npm run lint                # ESLint
npm run typecheck           # FE + server strict TS
npm test -- --run           # Vitest tek geçiş
npm run test:server         # server-side vitest
npm run test:e2e            # Playwright tüm suite
npm run test:e2e:fast       # sanity_check smoke
npm run api:contract:strict # STRICT=1 contract test
npm run qa:parity           # EN/TR i18n parity
```

Tek kalite kapısı: [`/publish-check`](.claude/commands/publish-check.md) →
`lint + typecheck + test + build + e2e:fast`.

---

## Deploy Strategy — Senaryo C

| Hedef                       | Sağlayıcı                                    | Tetikleyici                  |
| --------------------------- | -------------------------------------------- | ---------------------------- |
| Frontend (`www.ecypro.com`) | **Hostinger** static hosting                 | `npm run build` + rsync/SFTP |
| Backend (`api.ecypro.com`)  | **Render** Web Service + Postgres            | `render.yaml` (Blueprint)    |
| Background jobs             | Render Worker (BullMQ email/gdpr/cron)       | aynı blueprint               |
| CDN + SSL                   | Cloudflare proxy (opsiyonel) + Let's Encrypt | Hostinger panel              |

Tek master rehber: **[`docs/guides/deployment/DEPLOY_RUNBOOK.md`](docs/guides/deployment/DEPLOY_RUNBOOK.md)** —
6 phase (pre-flight, BE, FE, DNS/SSL, validation, monitoring).

Alternatifler: [`docs/guides/deployment/DEPLOYMENT_RENDER.md`](docs/guides/deployment/DEPLOYMENT_RENDER.md) ·
[`docs/guides/deployment/DEPLOYMENT_HOSTINGER_VPS.md`](docs/guides/deployment/DEPLOYMENT_HOSTINGER_VPS.md) ·
[`docs/guides/deployment/DEPLOYMENT_RAILWAY.md`](docs/guides/deployment/DEPLOYMENT_RAILWAY.md).

### Vercel ENV Checklist (frontend)

Bu env değişkenleri **deploy öncesi** Vercel → Project Settings → Environment
Variables paneline `Production` scope altında girilmiş olmalıdır. Bir tanesi
bile eksikse ilgili özellik sessizce devre dışı kalır; bunu önlemek için
`AnalyticsProvider` artık eksik anahtarları console.warn ile rapor eder.

| Anahtar                      | Servis             | Default | Kritiklik    | Notlar                                                              |
| ---------------------------- | ------------------ | ------- | ------------ | ------------------------------------------------------------------- |
| `VITE_GA_TRACKING_ID`        | Google Analytics 4 | —       | **P0**       | `G-` ile başlar; eksikse trafik ölçülmez                            |
| `VITE_CLARITY_PROJECT_ID`    | Microsoft Clarity  | —       | **P1**       | 10 karakterli proje kimliği; eksikse heatmap kapalı                 |
| `VITE_GROWTHBOOK_CLIENT_KEY` | GrowthBook         | —       | **P1**       | A/B test özelliği için; eksikse default varyant kullanılır          |
| `VITE_SENTRY_DSN`            | Sentry (frontend)  | —       | **P0**       | DSN URL; eksikse error capture devre dışı                           |
| `VITE_API_URL`               | Backend gateway    | `/api`  | **P0**       | Prod: `https://api.ecypro.com`                                      |
| `VITE_CALENDLY_URL`          | Calendly           | —       | **P1**       | Discovery Call iframe; eksikse fallback CTA gösterilir              |
| `VITE_ENABLE_ADMIN`          | Build-time switch  | `0`     | **HARD-OFF** | `1` yapmadan asla prod build çıkmaz — `/admin/*` brute-force yüzeyi |
| `VITE_DEV_AUDIENCE_TOGGLE`   | Build-time switch  | `0`     | dev-only     | Hero Executive/Developer toggle UX deneyimi                         |

Detaylı liste: [`.env.production.example`](.env.production.example).

### Backend ENV Checklist (Track 1 launch)

Bu değişkenler Render / API host'una **deploy öncesi** girilmelidir. Boş kalan
servisler sessizce no-op'a düşer; KVKK + lead pipeline işlevleri için kritik.

| Anahtar                        | Servis           | Kritiklik | Notlar                                                                                 |
| ------------------------------ | ---------------- | --------- | -------------------------------------------------------------------------------------- |
| `SENTRY_DSN`                   | Sentry (Node)    | **P0**    | Boşsa server-side error capture devre dışı                                             |
| `RESEND_API_KEY`               | Resend           | **P0**    | Eksikse contact/quick-check/pricing-calc ack maili gönderilmez                         |
| `FOUNDER_EMAIL`                | Reply-to         | **P0**    | Tüm transactional Resend gönderilerinde `replyTo` olarak kullanılır                    |
| `NOTION_API_KEY`               | Notion CRM       | **P0**    | Boşsa Prospect/Interaction yazımları no-op                                             |
| `NOTION_PROSPECTS_DB_ID`       | Notion           | **P0**    | Prospects veritabanı ID'si (URL slug'ı)                                                |
| `NOTION_INTERACTIONS_DB_ID`    | Notion           | **P1**    | Interactions DB; boşsa sadece Prospect yazılır                                         |
| `NOTION_ENGAGEMENTS_DB_ID`     | Notion           | **P2**    | Gelecek rollup'lar için rezerve                                                        |
| `NOTION_DELIVERABLES_DB_ID`    | Notion           | **P2**    | Gelecek rollup'lar için rezerve                                                        |
| `CALENDLY_WEBHOOK_SIGNING_KEY` | Calendly         | **P0**    | Boşsa prod'da `/api/v1/calendly` 503 döner (HMAC zorunlu)                              |
| `POSTHOG_API_KEY`              | PostHog (server) | **P1**    | Server-side event ingestion; boşsa client-side `VITE_POSTHOG_KEY` üzerinden devam eder |
| `POSTHOG_HOST`                 | PostHog          | **P1**    | Default `https://eu.i.posthog.com`                                                     |
| `TELEGRAM_BOT_TOKEN`           | Telegram         | **P1**    | Booking + lead notifier; eksikse `/api/v1/contact` prod'da 503                         |
| `TELEGRAM_CHAT_ID`             | Telegram         | **P1**    | Default ops channel                                                                    |
| `TELEGRAM_FOUNDER_CHAT_ID`     | Telegram         | **P2**    | Opsiyonel founder-only kanal                                                           |

---

## Database (Prisma)

```bash
npm run db:push              # dev-only: şemayı DB'ye uygula
npm run db:generate          # Prisma client
npm run db:studio            # Prisma Studio
npm run db:migrate:deploy    # production migrate (Render pre-deploy command)
npm run db:seed              # seed verisi
```

Baseline migration uyarısı: `prisma/migrations/` boş → ilk cutover öncesi
`prisma migrate dev --name baseline_p3_2026_05_15` çalıştırıp commit
edilmesi gerekir. Detay: `outputs/PRISMA_DEPLOY_PLAN.md`.

### Admin Bootstrap

İlk deploy sonrası admin kullanıcı oluşturmak için:

```bash
ADMIN_EMAIL=founder@ecypro.com \
ADMIN_PASSWORD=your-secure-password-here \
DATABASE_URL="postgres://..." \
npx tsx server/scripts/seed-admin.ts
```

Script idempotent — aynı email ile tekrar çalıştırılırsa mevcut kullanıcıyı
ADMIN rolüne yükseltir ve şifreyi günceller.

Detaylı operasyon rehberi: [`docs/guides/operations/RUNBOOK.md`](docs/guides/operations/RUNBOOK.md).

---

## Quality Gates (canlı durum — P27)

| Gate                             | Durum                                                 |
| -------------------------------- | ----------------------------------------------------- |
| TypeScript strict (web + server) | ✅ clean                                              |
| ESLint                           | ✅ clean                                              |
| Vitest unit                      | ✅ passing                                            |
| Vitest server                    | ✅ passing                                            |
| Playwright sanity_check          | ✅ green                                              |
| API contract strict              | ✅ green                                              |
| i18n parity (EN/TR)              | ✅ aligned                                            |
| Lighthouse `/services`           | ✅ Perf **69** · A11y **98** · BP **96** · SEO **92** |
| Bundle size-limit                | ✅ within budget                                      |
| gitleaks (working tree)          | ✅ 0 leak                                             |
| Total commits (local)            | **201**                                               |

`/services` `PAGE_HUNG` regression P27'de **çözüldü** — synthetic-UA gating

- Scheduler park-when-idle (`outputs/P27_EXEC_FINAL.md`).

---

## Project Structure

```
src/                    # FE (React 19 + Vite + Tailwind v4)
  components/           # features/ · layout/ · ui/ · sections/
  pages/                # route components
  lib/                  # director, monitor, sentry, queries
  hooks/                # useInterestTracker, useAuth, ...
  store/                # Zustand slices
  i18n/                 # EN + TR resource bundles
server/                 # BE (Express 5 + Prisma + BullMQ)
  routes/               # REST + SSE endpoints
  middleware/           # auth, rate limit, sentry, logger
  jobs/                 # email / gdpr-export / cron worker
  lib/                  # prisma, redis, sentry, queues
prisma/                 # schema + (post-baseline) migrations
public/                 # static + .htaccess + robots + sitemap
scripts/                # smoke, sourcemaps, og-image, lighthouse
docs/                   # runbook, incident, observability, ...
outputs/                # phase reports (P10–P28) + recipes
.claude/                # Claude Code commands (lint-fix, e2e, publish-check)
```

---

## Documentation

- **Deploy:** [`docs/guides/deployment/DEPLOY_RUNBOOK.md`](docs/guides/deployment/DEPLOY_RUNBOOK.md) (master)
- **Contributing:** [`CONTRIBUTING.md`](CONTRIBUTING.md)
- **Incident response:** [`docs/guides/operations/INCIDENT_RUNBOOK.md`](docs/guides/operations/INCIDENT_RUNBOOK.md)
- **Observability:** [`docs/reference/OBSERVABILITY_SETUP.md`](docs/reference/OBSERVABILITY_SETUP.md)
- **Disaster recovery:** [`docs/guides/operations/DISASTER_RECOVERY.md`](docs/guides/operations/DISASTER_RECOVERY.md)
- **CMS manual:** [`docs/guides/CMS_MANUAL.md`](docs/guides/CMS_MANUAL.md)
- **CRO playbook:** [`docs/guides/CRO_PLAYBOOK.md`](docs/guides/CRO_PLAYBOOK.md)
- **AB testing:** [`docs/reference/AB_TESTING.md`](docs/reference/AB_TESTING.md)
- **API versioning:** [`docs/reference/API_VERSIONING.md`](docs/reference/API_VERSIONING.md)
- **Phase log:** [`outputs/`](outputs/) (P10–P28, BE + FE recipes)

---

## Analytics — GTM + GA4 + PostHog (P97)

Three-layer chain with KVKK strict opt-in:

| Layer       | Role                        | Container / Key                                                                                               |
| ----------- | --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **GTM**     | Tag orchestration           | Container `GTM-NH7RJ9FB` (Account `ecypro` · Container `ecypro-web`) — hard-wired in `index.html` head + body |
| **GA4**     | Page + event metrics        | Measurement ID `G-3Q4T3KL83V` — configured as a GA4 Configuration tag inside the GTM workspace                |
| **PostHog** | Product analytics (EU host) | `VITE_POSTHOG_KEY` in Vercel ENV (do not commit), init runs with `opt_out_capturing_by_default: true`         |

`ConsentBanner` (`src/components/ConsentBanner.tsx`) keeps PostHog capturing
disabled until the user explicitly accepts; the decision is persisted in
`localStorage['posthog_consent']`. GTM still loads, but GA4 + marketing tags
are gated inside GTM via Consent Mode v2.

Launch checklist:

1. ~~Create GTM container~~ — done; container ID `GTM-NH7RJ9FB` already wired.
2. In GTM workspace, ensure a GA4 Configuration tag exists with Measurement ID `G-3Q4T3KL83V`.
3. Set `VITE_POSTHOG_KEY` in Vercel (Production + Preview) — PostHog EU project key.
4. Smoke-test `/` after deploy: ConsentBanner renders, `dataLayer` is populated, `posthog._opting_in === false` until user accepts.

---

## Claude Code (opsiyonel)

```bash
npm run claude:setup        # idempotent install + sağlık kontrolü
```

Slash komutları: `/lint-fix` · `/typecheck` · `/e2e` · `/e2e-fast` ·
`/publish-check` · `/phase-status` · `/secret-scan`.

Detay: [`docs/reference/CLAUDE_CODE.md`](docs/reference/CLAUDE_CODE.md).

---

## License & Contact

Proprietary — © 2026 EcyPro Consulting. All rights reserved.

- **Email:** info@ecypro.com
- **Website:** https://www.ecypro.com
- **Issues / contributions:** [`CONTRIBUTING.md`](CONTRIBUTING.md)
