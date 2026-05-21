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

**Live:** https://www.ecypro.com (cutover sonrası — bkz. `docs/DEPLOY_RUNBOOK.md`)
**API:** https://api.ecypro.com (Render)

---

## Tech Stack

| Katman | Bileşen |
| --- | --- |
| **Frontend** | React 19 · Vite 6 · TypeScript strict · Tailwind v4 (PostCSS) |
| **State / Data** | Zustand · TanStack Query · React Router DOM v7 |
| **Forms** | React Hook Form · Zod |
| **Backend** | Express 5 · Prisma 7 · Postgres · Redis (ioredis) · BullMQ |
| **Auth** | JWT · bcrypt |
| **Email** | EmailJS (frontend) · nodemailer (server transactional) |
| **Charts** | Recharts |
| **Realtime** | Server-Sent Events (`/events`) — auth + topic-based pub/sub |
| **Testing** | Vitest (unit) · Playwright (E2E) · axe-core (a11y) |
| **Tooling** | ESLint 9 · Prettier · Lefthook · Husky · commitlint · gitleaks |
| **Monitoring** | Sentry (FE + node) · Web Vitals · synthetic monitor |
| **CMS** | Keystatic |
| **i18n** | i18next (EN + TR) |

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

Detay: [`docs/ORCHESTRATOR.md`](docs/ORCHESTRATOR.md).

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

| Hedef | Sağlayıcı | Tetikleyici |
| --- | --- | --- |
| Frontend (`www.ecypro.com`) | **Hostinger** static hosting | `npm run build` + rsync/SFTP |
| Backend (`api.ecypro.com`) | **Render** Web Service + Postgres | `render.yaml` (Blueprint) |
| Background jobs | Render Worker (BullMQ email/gdpr/cron) | aynı blueprint |
| CDN + SSL | Cloudflare proxy (opsiyonel) + Let's Encrypt | Hostinger panel |

Tek master rehber: **[`docs/DEPLOY_RUNBOOK.md`](docs/DEPLOY_RUNBOOK.md)** —
6 phase (pre-flight, BE, FE, DNS/SSL, validation, monitoring).

Alternatifler: [`docs/DEPLOYMENT_RENDER.md`](docs/DEPLOYMENT_RENDER.md) ·
[`docs/DEPLOYMENT_HOSTINGER_VPS.md`](docs/DEPLOYMENT_HOSTINGER_VPS.md) ·
[`docs/DEPLOYMENT_RAILWAY.md`](docs/DEPLOYMENT_RAILWAY.md).

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

Detaylı operasyon rehberi: [`RUNBOOK.md`](RUNBOOK.md).

---

## Quality Gates (canlı durum — P27)

| Gate | Durum |
| --- | --- |
| TypeScript strict (web + server) | ✅ clean |
| ESLint | ✅ clean |
| Vitest unit | ✅ passing |
| Vitest server | ✅ passing |
| Playwright sanity_check | ✅ green |
| API contract strict | ✅ green |
| i18n parity (EN/TR) | ✅ aligned |
| Lighthouse `/services` | ✅ Perf **69** · A11y **98** · BP **96** · SEO **92** |
| Bundle size-limit | ✅ within budget |
| gitleaks (working tree) | ✅ 0 leak |
| Total commits (local) | **201** |

`/services` `PAGE_HUNG` regression P27'de **çözüldü** — synthetic-UA gating
+ Scheduler park-when-idle (`outputs/P27_EXEC_FINAL.md`).

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

- **Deploy:** [`docs/DEPLOY_RUNBOOK.md`](docs/DEPLOY_RUNBOOK.md) (master)
- **Contributing:** [`CONTRIBUTING.md`](CONTRIBUTING.md)
- **Incident response:** [`docs/INCIDENT_RUNBOOK.md`](docs/INCIDENT_RUNBOOK.md)
- **Observability:** [`docs/OBSERVABILITY_SETUP.md`](docs/OBSERVABILITY_SETUP.md)
- **Disaster recovery:** [`docs/DISASTER_RECOVERY.md`](docs/DISASTER_RECOVERY.md)
- **CMS manual:** [`docs/CMS_MANUAL.md`](docs/CMS_MANUAL.md)
- **CRO playbook:** [`docs/CRO_PLAYBOOK.md`](docs/CRO_PLAYBOOK.md)
- **AB testing:** [`docs/AB_TESTING.md`](docs/AB_TESTING.md)
- **API versioning:** [`docs/API_VERSIONING.md`](docs/API_VERSIONING.md)
- **Phase log:** [`outputs/`](outputs/) (P10–P28, BE + FE recipes)

---

## Claude Code (opsiyonel)

```bash
npm run claude:setup        # idempotent install + sağlık kontrolü
```

Slash komutları: `/lint-fix` · `/typecheck` · `/e2e` · `/e2e-fast` ·
`/publish-check` · `/phase-status` · `/secret-scan`.

Detay: [`docs/CLAUDE_CODE.md`](docs/CLAUDE_CODE.md).

---

## License & Contact

Proprietary — © 2026 EcyPro Consulting. All rights reserved.

- **Email:** info@ecypro.com
- **Website:** https://www.ecypro.com
- **Issues / contributions:** [`CONTRIBUTING.md`](CONTRIBUTING.md)
