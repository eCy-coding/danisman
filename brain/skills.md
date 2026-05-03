# EcyPro Premium Consulting — AI Agent Skills Reference

This file defines the technical capabilities, patterns, and conventions
that any AI agent working on this project MUST follow.

## 🏗️ Architecture Patterns

### Frontend (React 19 + Vite)

- **State Management:** Zustand with `persist` middleware (localStorage key: `ecypro-app-storage`).
- **Data Fetching:** React Query (TanStack) via `src/hooks/useApi.ts`.
- **API Client:** Axios with JWT interceptor in `src/lib/api.ts`.
- **Animations:** Framer Motion — use `FadeIn`, `StaggerContainer`, `FloatingElement`, `PulseGlow` from `src/components/common/FadeIn.tsx`.
- **Routing:** React Router v7 with lazy loading.
- **i18n:** `react-i18next` with `en` and `tr` languages.
- **Copy Data:** All translatable text lives in `src/data/copy/pages.ts` with `MultiLang` typed constants.
- **Design Tokens:** CSS custom properties in `index.css` @theme block.
- **SSE Hook:** `src/hooks/useSSE.ts` — Exponential backoff reconnection for real-time data.

### Backend (Express 5 + Prisma v7)

- **Entry:** `server/index.ts` — Express with CORS, JSON parsing, security headers, rate limiting, structured logging, health check, SSE, graceful shutdown, process error handlers.
- **Auth:** PBKDF2 password hashing (Node.js native `crypto`), JWT tokens, Zod input validation.
- **Middleware:**
  - `authenticate` + `requireRole` in `server/middleware/auth.ts`.
  - `securityHeaders` + `structuredLogger` + `corsPreflight` in `server/middleware/security.ts`.
  - `generalLimiter` / `authLimiter` / `contactLimiter` / `sseLimiter` in `server/middleware/rateLimiter.ts`.
- **API Modules:**
  - `/api/auth` — login, register, getMe (auth rate-limited)
  - `/api/bookings` — CRUD with pagination, role-based access
  - `/api/analytics` — pageview, interaction tracking, contact form (contact rate-limited), dashboard summary
  - `/api/health` — service health with memory/uptime metrics
  - `/api/docs` — OpenAPI 3.0 spec (JSON)
  - `/api/sse/dashboard` — Server-Sent Events for real-time data (SSE rate-limited)
- **Database:** PostgreSQL via Prisma. Schema in `prisma/schema.prisma`.
- **Validation Pattern:** All inputs validated with Zod schemas before processing.

### Director Engine (AI Autonomous System)

- **Rule Engine:** `src/lib/director/engine.ts` — Priority-sorted rules with condition evaluation.
- **State Machine:** Content status transitions (DRAFT → PROCESSING → READY → PUBLISHED → ARCHIVED).
- **Personalization:** `src/lib/director/personalization.ts` — Behavior-based rules (integrated in App.tsx).
- **Analytics Consumer:** `src/lib/director/analytics-consumer.ts` — Real-time user context tracking (integrated in App.tsx).
- **Scheduler:** `src/lib/director/scheduler.ts` — Task queue with priority and recurrence.

## 🔧 CLI Commands

```bash
npm run dev            # Start dev server (frontend + backend + terminal)
npm run build          # Production build
npm run typecheck      # TSC strict check (must pass with 0 errors)
npm run lint           # ESLint
npm test               # Vitest unit tests
npm run test:e2e       # Playwright E2E tests
npm run db:push        # Sync Prisma schema to database
npm run db:studio      # Open Prisma Studio
npm run db:seed        # Seed database with initial data
npm run db:generate    # Generate Prisma client
npm run build:server   # Compile server TypeScript
npm run deploy         # Full deploy (frontend + backend)
npm run deploy:docker  # Docker Compose deploy
npm run deploy:frontend # Vercel deploy
```

## 📐 Coding Conventions

1. **Ease types:** Framer Motion v12 requires `ease` as tuple: `[0.25, 0.46, 0.45, 0.94] as [number, number, number, number]`.
2. **Constants:** All section copy uses `Record<string, MultiLang>` pattern with `en`/`tr` keys.
3. **Error handling:** All API endpoints wrapped in try/catch with structured `{ status, message, data }` responses.
4. **Type safety:** `tsconfig.json` strict mode. All `any` eliminated.
5. **Security headers:** Defined in `vercel.json` + `server/middleware/security.ts`.
6. **Reduced motion:** All animations MUST respect `prefers-reduced-motion` via `useReducedMotion()`.
7. **Rate limiting:** All public endpoints rate-limited. Auth: 10/15min. Contact: 5/hour. General: 100/15min.
8. **Request IDs:** Every request gets a UUID via `X-Request-ID` header.

## 📦 Key Dependencies

| Package       | Version | Purpose          |
| ------------- | ------- | ---------------- |
| React         | 19      | UI framework     |
| Framer Motion | 12      | Animations       |
| Zustand       | 5       | State management |
| React Query   | 5       | Server state     |
| Prisma        | 7       | ORM              |
| Express       | 5       | API server       |
| Zod           | 4       | Validation       |
| Playwright    | 1.57    | E2E tests        |
| Vitest        | 4       | Unit tests       |

## 🚀 Deployment

- **Frontend:** Vercel (config: `vercel.json` + `infrastructure/vercel/vercel-frontend.tf`)
- **Backend:** Render (config: `render.yaml` + `infrastructure/render/render-backend.tf`)
- **Docker:** `docker-compose.yml` with postgres + api + frontend + redis profiles
- **CI/CD:** GitHub Actions `.github/workflows/ci.yml` (lint → typecheck → test → build → e2e)
- **API Docs:** Available at `/api/docs` (OpenAPI 3.0 JSON)

## 🤖 Claude Code Integration (Phase 21)

Optional AI coding companion. **Not a hard dependency** — project works without it.

### Files

- `CLAUDE.md` — project manifest auto-loaded by Claude CLI on session start.
- `.claude/settings.json` — shared permission allow/deny lists (committed).
- `.claude/settings.local.json.example` — user override template (gitignored).
- `.claude/commands/*.md` — 7 slash commands: `/lint-fix`, `/typecheck`, `/e2e`, `/e2e-fast`, `/publish-check`, `/phase-status`, `/secret-scan`.
- `scripts/install-claude-code.sh` — idempotent installer (curl native + npm fallback).
- `scripts/claude-doctor.sh` — health check (binary, Node ≥22, auth, config).
- `.windsurf/workflows/claude-{install,doctor,publish-check}.md` — Cascade workflows.
- `.windsurf/rules/claude-code.md` — Cascade always-on rule.
- `.github/workflows/claude-smoke.yml` — light CI: shellcheck + JSON validation.
- `docs/CLAUDE_CODE.md` — Turkish setup guide.

### npm Scripts

```bash
npm run claude:install   # bash scripts/install-claude-code.sh
npm run claude:doctor    # bash scripts/claude-doctor.sh
npm run claude:setup     # install + doctor chain
npm run claude:update    # claude update || npm install -g @anthropic-ai/claude-code
```

### Hard Don'ts (in .claude/settings.json deny list)

- Edit `.env*`, `*.db`, `prisma/migrations/**`, `dist/**`, `node_modules/**`.
- `git push --force`, `git reset --hard`, `git clean -fdx`, `git commit --no-verify`.
- `rm -rf *`, `sudo *`, `chmod 777 *`, `kill -9 *`.
- `pnpm *`, `yarn *` (project is **npm-only**).
- `curl * | bash`, `wget * | sh` (use wrapper scripts).

### Auth

- Primary: OAuth via `claude` interactive login → `~/.claude/credentials.json`.
- Headless: `ANTHROPIC_API_KEY` env (placeholder in `.env.example`).
- gitleaks pre-commit hook catches API key leaks automatically.

## 🎨 UI/UX Pro MAX Patterns (Phase 20.5)

> Premium consulting site standartlarında “zirve” seviyesi UI/UX disiplini. Her madde EcyPro projesinde nerede uygulandığının referansıyla.

### Tipografi & Düzen

- **Golden Ratio (φ ≈ 1.618):** Font basamakları `text-golden-base/lg/xl/2xl` (16 → 26 → 42 → 68 px). Tanım: `index.css` @theme.
- **Fibonacci spacing:** `p-fib-X`, `gap-fib-X`, `mb-fib-X` (2/3/5/8/13/21/34/55/89 px). “Sıfır magic-pixel” kuralı; tüm `[Npx]` literal'ları codemod ile token'a göç ettirildi (Phase 20 E1).
- **Tipografi pairing:** `font-serif` (display) + `font-sans` (body). Hero `text-3xl/4xl/5xl/6xl` cascade.

### Renk & Yüzey

- **Theme tokens:** `--color-primary`, `--color-secondary`, `--color-neutral`, `--color-surface`, `--color-surface-high` (`index.css`).
- **Surface ladder:** `bg-neutral` (#000) → `bg-surface` (#0a0a0a) → `bg-surface-high` (#111). Kart yüzeyleri `bg-white/3` veya `bg-white/5`, hover `bg-white/10`.
- **Glassmorphism:** `bg-white/5 backdrop-blur-md border border-white/10`. Yoğun kullanım: `Pricing`, `Certifications`, `Contact` kartları.
- **Gradient overlay:** `bg-[radial-gradient(circle_at_X,rgba(...),transparent_60%)]` pointer-events-none arka plan glow.

### Motion Discipline (framer-motion v12)

- **Reduce-motion respect:** `useReducedMotion()` dönen değer; `initial={reducedMotion ? false : {...}}`. Örn: `Certifications.tsx`, `BusinessHealthQuiz.tsx`.
- **Stagger:** `viewport={{ once: true, margin: '-50px' }}` + `delay: idx * 0.08`. Her grid'de bu pattern.
- **Parallax:** `useScroll` + `useTransform` (`SuccessStories` horizontal scroll, `Hero` glow drift).
- **Mouse-reactive:** `MouseGlow` bileşeni (cursor-follower radial light). Tüm büyük kartlarda mount edili.
- **Magnetic CTA:** `MagneticButton` (Contact submit, Hero primary). Cursor proximity → translate.

### Etkileşim

- **Focus rings:** `focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none`. Tüm buton + input.
- **Skip-link:** `MainLayout` üstünde sr-only → focus visible.
- **Disclosure:** `aria-expanded`, `aria-controls`, `aria-labelledby`, `hidden` (PricingPage FAQ, Phase 17.5 R7).
- **Live regions:** `aria-live="polite"` newsletter status, contact banner, case-study filter grid.

### SEO & Yapısal

- **JSON-LD builder pattern:** `src/lib/structured-data.ts` factory'leri (`buildArticleSchema`, `buildBreadcrumbSchema`, `buildFaqSchema`, `buildServiceSchema`, `buildCaseStudySchema`). `JsonLd` Helmet wrapper ile inject.
- **Global schema:** `SchemaOrg.tsx` ProfessionalService + Service + FAQPage; her sayfada otomatik (App.tsx).
- **Per-page:** Article (BlogPostPage, CaseStudyDetailPage), FAQPage (PricingPage), Breadcrumb (her detail page + listeler).

## 🔍 Competitive Patterns (Phase 20.5)

> 10 rakip siteden (McKinsey, BCG, Bain, Accenture Song, Deloitte Digital, Thoughtworks, IDEO, EY-Parthenon, Kearney, Productive.io) extract edilen ve EcyPro'da uygulanan / değerlendirilen pattern'ler. Detay: `brain/COMPETITIVE_AUDIT.md`.

### EcyPro'da Aktif Olanlar

1. **Pricing açık** — Productive.io modeli; 3-tier + monthly/annual toggle (PricingPage).
2. **JSON-LD ProfessionalService + Service + FAQPage + Article + Breadcrumb** — McKinsey/BCG/Bain standardı.
3. **Industry chip filter** (case studies) — Bain/Thoughtworks pattern (CaseStudiesPage).
4. **Certifications row** (ISO27001/SOC2/GDPR/KVKK) — Deloitte Digital pattern (Certifications section).
5. **TrustMarquee** — McKinsey/Bain tarzı sürekli logo carousel.
6. **i18n TR/EN** — react-i18next + 8 namespace HTTP backend.
7. **Consent-gated GA4** — KVKK/GDPR-uyumlu (AnalyticsProvider + ga4-loader).

### Phase 21+'a Ertelenenler

- **Mega-menu derinliği** (McKinsey 6×20+ sub navigation).
- **Calendly / SavvyCal embed** (Deloitte; book-a-meeting).
- **Video hero / case-study video** (IDEO; tam-sayfa video embed).
- **Industry / Capability cross-taxonomy** (BCG; multi-dim filter).
- **Insights dijital format çeşitliliği** (Thoughtworks Tech Radar tarzı, podcast, webinar).

## ⚡ Deep-Search Protocol (Phase 20.5)

> Cascade'in ultra-deep araştırma yaparken izlediği 5-adım protokol. Yeni bir araştırma görevi geldiğinde uygulanır.

```
1. INTENT — Kullanıcının publish.txt / istek.txt / mevcut konuşma satırını parse et;
   "ne", "neden", "ne kadar derin" sorularını yanıtla.
2. SEARCH — search_web ile en az 2 paralel sorgu (sektör + spesifik terim).
   read_url_content ile en zengin 2-3 doc'u fetch et.
3. SYNTHESIZE — view_content_chunk ile detaylı pasajları al; pattern'leri bizim
   projeyle karşılaştır.
4. AUDIT — `brain/COMPETITIVE_AUDIT.md` veya `brain/PHASE_X_AUDIT.md` üret.
   Matrix + gap list + öncelik sırası.
5. ACTION — Otonom implementation; her gap için cerrahi fix; FV matriksi yeşil.
```

### Kullanılan Araçlar

- `search_web` (paralel sorgular) → `read_url_content` (en iyi 2-3 doc) → `view_content_chunk` (zengin pasajlar).
- `grep_search` (kod tabanı): pattern'in projede olup olmadığını saniyeler içinde tespit.
- `find_by_name` (dosya): yeni component / page önce var mı kontrol.
- `create_memory` (Cascade global): büyük closure sonrası kalıcı bilgi.
- `todo_list`: çok adımlı görevde ilerleme takibi.

## 🛡️ Phase 20.5 Closure Beyanı

Phase 1 → Phase 17 (+17.5) için **sıfır açık uç**. publish.txt'in 10 kriteri tam karşılandı:

- K1-K9 (Zero Errors, Makro/Mikro, Animation, UI/UX, A11y, i18n, Security) ✅
- K6 (SEO) ✅ Phase 20.5 H1 ile JSON-LD tam set
- K10 (Entegrasyon) ✅ GA4 gerçek init + LiveChat + EmailJS + Sentry + Redis

`brain/COMPETITIVE_AUDIT.md` + `brain/PHASE_1_17_AUDIT.md` referans dokümanlar.

**End of File.**
