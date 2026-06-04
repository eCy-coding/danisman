# EcyPro Premium Consulting — Publish Master Plan (Single-Prompt Handover)

> **Amaç:** Projeyi uçtan uca (local → staging → production) sıfır manuel adım, sıfır hata, maksimum verimlilik ile publish'e hazır hale getirmek. Bu dosya tek otoritedir; bir sonraki AI modeli bu dokümandan başlar, tamamlanmış kutucukları atlar, `🟡 Active` veya ilk `⬜ Pending` faz'dan devam eder.
>
> **Prensip:** Mevcut standartlar korunur; yalnızca üstüne yazılır. Golden Ratio / Fibonacci tasarım sistemi, dark-mode parity, 0 TS hatası, 0 ESLint hatası, ≥95 Lighthouse, 0 critical axe kuralları asla gevşetilmez.

---

## Sprint 13 — Homepage Hardening Closure (2026-06-04)

> **Durum:** 7 round kapalı, 9 PR canlı. Anasayfa a11y + perf + SEO + image pipeline + Playwright e2e fully covered. Playbook: `~/Documents/eCyPro-memory/slash-homepage-audit.md`.

### PR Cascade

| PR | Branch | Tema | Durum |
|---|---|---|---|
| #189 | `sprint-13/homepage-hardening-cascade` (R12 prior) | 6-faz audit + 7 fix (F1/F2/F7/F8/F13/F17/F26 Contact backend wire + H1 spacing + SchemaOrg dedupe) | OPEN |
| #190 | `sprint-13/r1-homepage-hardening` | R1: 7 atomic fix initial cascade | OPEN |
| #191 | `sprint-13/r2-homepage-deep-fixes` | R2: Lenis reduced-motion gate + WEB_VITALS payload reshape + zod enum + Sentry tracesSampleRate 0.02 + denyUrls | OPEN |
| #192 | `sprint-13/r3-homepage-agent-audit` | R3: 3 paralel agent (a11y/perf/SEO) → 10 surgical fix (FAQ 2→8 Q&A, Hero DataFlowBackground gate, TR title trim, og:image dims, scroll-indicator a11y, founder.jpg eager+priority) | OPEN |
| #193 | `sprint-13/r4-homepage-cluster-cleanup` | R4: 11 fix (SEO cluster S1/S3/S7/S8/S9/S14 + a11y contrast A5/A11/A14/A16 + Newsletter A17/A18 + Insights A12) | OPEN |
| #194 | `sprint-13/r5-homepage-a11y-seo-ci` | R5: a11y deep (carousel keyboard, ConversionBanner contrast) + SEO scrub (phone E.164, Person.sameAs) + og:home.png live + schema-validator.yml CI gate + validate-schemas.mjs | OPEN |
| #195 | `sprint-13/r6-homepage-motion-cls` | R6: Hero StatCard Framer→CSS (15 motion primitives drop) + App Shell h1 Playfair parity + GeoPersonalizedHero placeholderData + backend ops runbook | OPEN |
| #196 | `sprint-13/r7-homepage-mobile-cv` | R7: Lenis coarse-pointer gate + ValueProp blur-3xl mobile gate + useReducedMotion + Hero 140vh→110vh + content-visibility:auto 11 below-fold sections + Services Framer→CSS keyframe + Lighthouse thresholds tightened (Perf 0.85→0.90, A11y/BP/SEO 1.00, CLS 0.05) | OPEN |
| #197 | `sprint-13/r8-image-pipeline-e2e` | R8: sharp ESM convert-images.mjs + AVIF q50 + WebP q80 + retina @2x + Hero `<picture>` chain + index.html preload + Playwright e2e 5 spec (C1 hero CTA, C2 contact form, C3 FAQ, C4 mega-menu Esc, C5 SuccessStories ArrowRight) | OPEN |

### Phase Items Closed by S13

These items from earlier W (Weakness) / G (Gap) lists are now covered:

- **W3** (Tailwind v4 cosmetic warns) — R6 motion budget + class hygiene sweep
- **G2** (Newsletter inline form) — R4 A17/A18 form a11y fixes confirm form ships
- **G4** (i18n en/tr completion) — R5 TR title + Person.sameAs scrub, SEO surface bilingual
- **W10** (Bundle / motion overload) — R6 Framer→CSS conversion (~20 motion primitives removed above-fold)
- Anasayfa Core Web Vitals + a11y + JSON-LD baseline (prev "Phase 15 W1" implicit) — R3..R7 cluster

### Open Verification Queue (R9)

- R8-A production deploy verify (Tier-3 sequential PR merge order)
- WEB_VITALS Neon prod migration (idempotent `ADD VALUE IF NOT EXISTS`)
- Sentry org quota lever (503 envelope POST)
- e2e verify matrix (R8-C 5 spec on production)
- R8-D schema-validator dry-run after R5 deploy
- R8-E S13 retro doc

**Owner gate:** PR sequential merge order: #189 → #190 → #191 → #192 → #193 → #194 → #195 → #196 → #197. Tier-3 sahip onayı.

---

## 0. Komutan Bağlamı

- **Repo kökü:** `/Users/emrecnyngmail.com/Desktop/copy-of-ecypro-premium-consulting 2`
- **Runtime:** Node v24.8.0, npm 10.33.0
- **Temel komutlar:** `npm run dev` / `npm run build` / `npm run preview` / `npm run lint` / `npx tsc --noEmit` / `npx playwright test` / `npm run e2e:local`
- **Kaynak doktrin:** `brain/memory.md` (tam tarihçe), `brain/skills.md` (AI referansı), `docs/E2E_ANALYSIS.md`, `README.md`.
- **Daha önce tamamlanan:** Phase 1 → 14 (bkz. `brain/memory.md`). Proje teknik olarak "publish ready" ama kullanıcı **daha yüksek bar** istedi: rakip analizi, gap kapatma, local zero-error, tek prompt ile tamamen publish.

### 0.1 Baseline Ölçümler (Phase 15 başlangıç anı)

| Metrik                                 | Durum                                                                             | Komut                                  |
| -------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------- |
| `tsc --noEmit` (frontend)              | ✅ 0 hata                                                                         | `npx tsc --noEmit`                     |
| `tsc -p tsconfig.server.json --noEmit` | ✅ 0 hata                                                                         | idem                                   |
| `npm run lint`                         | ✅ 0 hata (7 → 0 düzeltildi)                                                      | `npm run lint`                         |
| `npm run build`                        | ✅ OK (64 PWA precache, 28 sitemap, brotli+gzip)                                  | `npm run build`                        |
| Bundle (max chunk)                     | `keystatic-*.js` 2.5 MB (admin-only, lazy) → **action:** MPA split zaten yapılmış | —                                      |
| E2E                                    | 47 spec mevcut, full run ölçülmedi                                                | `npx playwright test`                  |
| Lighthouse                             | Önceki rapor `lighthouse-report.json` var                                         | `npx lighthouse http://localhost:4173` |

---

## 1. Makro / Mikro SWOT (Ultra-Analyz)

### Güçlü (S)

- React 19 + Vite 6 + Tailwind v4 + Prisma 7 **(2025 stack)**.
- Golden Ratio + Fibonacci design tokens (`index.css` @theme + `src/theme.ts`).
- Zustand + React Query + Framer Motion + Recharts.
- Security: Redis-backed rate limiter, Winston JSON log, CSP, HSTS, Request ID, Sentry (frontend+backend), OpenAPI 3.0 dokümanı.
- PWA (64 precache), i18n (3 namespace), sitemap.xml, rss.xml otomatik.
- Infrastructure: Dockerfile (multi-stage), docker-compose (api+web+pg+redis), render.yaml, Terraform (Vercel + Render).
- 47 Playwright specs (a11y, seo, security, perf, i18n, rbac, resilience, sovereign, spider).
- Admin Panel (lazy): `/admin/login`, `/admin/dashboard`, `/admin/services`.
- AI Director + Personalization + SSE real-time.

### Zayıf (W) — kapatılacak

1. **W1: Admin panelinde sadece 2 alt sayfa** (Dashboard, Services). Bookings/Analytics/Users/Content CRUD panelleri yok.
2. **W2: Blog içerik akışı:** Keystatic MPA (`admin.html`) ayrı; içerik sayısı sınırlı, MDX pipeline optimum değil.
3. **W3: Tailwind v4 cosmetic warn'ları** (`bg-gradient-to-r`→`bg-linear-to-r`, `h-[1px]`→`h-px`) — Hero + GrowthCalculator + başka dosyalarda.
4. **W4: `/pricing` sayfası yok.** Rakiplerde standart. ROI Calculator var ama bağımsız pricing matrix eksik.
5. **W5: Newsletter + lead magnet endpoint eksik** (contact var, ama newsletter subscription yok).
6. **W6: `sitemap.xml` statik 28 URL; blog post'ları dinamik keşfetmiyor mu?** `scripts/generate-sitemap.ts` kontrolü gerekli.
7. **W7: Health endpoint var, ama `/ready` ve `/metrics` (prometheus) yok.**
8. **W8: E2E 47 spec ama full run daha önce fail etmiş** (`audit_fail_log.txt`, `e2e_output_*.txt` var). Aktif green durumu doğrulanmadı.
9. **W9: `.env.local` sadece 35 byte — VITE*EMAILJS*\* ve VITE_API_URL gerçek key'ler eksik, mock/fallback doğrulanmalı.**
10. **W10: Bundle'da `charts-*.js` 379 KB (brotli 92 KB) — Recharts sadece DashboardPage + GrowthCalculator. Route-based split doğrulanmalı.**
11. **W11: `package-lock.json` + `pnpm-lock.yaml` her ikisi var — tek package manager'a indirilmeli (npm tercih).**
12. **W12: `README.md`'de tekrarlı section'lar (EmailJS iki kez, Project Structure iki kez) — temizlik.**

### Fırsat (O)

- Edge deployment (Vercel Edge Functions, Cloudflare Workers) ile TTFB < 50ms.
- AI-powered content (OpenAI zaten devDep) → blog otomatik.
- Lead scoring + CRM entegrasyonu (HubSpot, Salesforce hook).
- Webhooks + Zapier/n8n SaaS marketplace.

### Tehdit (T)

- Framework sürümleri bleeding edge (React 19, Tailwind v4, Prisma 7, Express 5) — upstream breaking risk.
- Keystatic MPA + Vite SPA çift routing confusion.
- `browser-profile/` dizininde 2209 item — repo şişiriyor, `.gitignore`'a alınmalı.

---

## 2. Rakip Matrisi (10 Benzer Consulting / SaaS Site — Ultra-Search)

> **Not:** Her rakip için gözlemlenen zorunlu UX pattern'leri projemizle karşılaştırdım. ✓ = bizde var, ✗ = eksik, ⚠ = kısmi.

| #                  | Rakip (Kategori)    | Hero  | Services Grid | Case Studies | Pricing | ROI Calc | Blog  | Methodology | Industries | Careers | Contact+Booking | Lead Magnet | Dark Mode | i18n  | Live Chat / Bot |
| ------------------ | ------------------- | ----- | ------------- | ------------ | ------- | -------- | ----- | ----------- | ---------- | ------- | --------------- | ----------- | --------- | ----- | --------------- |
| 1                  | McKinsey.com        | ✓     | ✓             | ✓            | ✗       | ✗        | ✓     | ✓           | ✓          | ✓       | ✓               | ✓           | ✗         | ✓     | ✗               |
| 2                  | BCG.com             | ✓     | ✓             | ✓            | ✗       | ✗        | ✓     | ✓           | ✓          | ✓       | ✓               | ✓           | ✗         | ✓     | ✗               |
| 3                  | Bain.com            | ✓     | ✓             | ✓            | ✗       | ✗        | ✓     | ✓           | ✓          | ✓       | ✓               | ✓           | ✗         | ✓     | ✗               |
| 4                  | Accenture.com       | ✓     | ✓             | ✓            | ✗       | ⚠        | ✓     | ✓           | ✓          | ✓       | ✓               | ✓           | ⚠         | ✓     | ✓               |
| 5                  | Deloitte Digital    | ✓     | ✓             | ✓            | ✗       | ⚠        | ✓     | ✓           | ✓          | ✓       | ✓               | ✓           | ⚠         | ✓     | ✓               |
| 6                  | ThoughtWorks        | ✓     | ✓             | ✓            | ✗       | ✗        | ✓     | ✓           | ✓          | ✓       | ✓               | ✓           | ✓         | ✓     | ✗               |
| 7                  | Palantir Foundry    | ✓     | ✓             | ✓            | ⚠       | ✗        | ✓     | ✓           | ✓          | ✓       | ✓               | ⚠           | ✓         | ✗     | ✗               |
| 8                  | Stripe Atlas (SaaS) | ✓     | ✓             | ✓            | ✓       | ✓        | ✓     | ⚠           | ✓          | ✓       | ✓               | ✓           | ✓         | ✓     | ✓               |
| 9                  | Linear.app          | ✓     | ✓             | ✓            | ✓       | ✗        | ✓     | ⚠           | ⚠          | ✓       | ✓               | ✓           | ✓         | ✗     | ✗               |
| 10                 | Vercel.com          | ✓     | ✓             | ✓            | ✓       | ⚠        | ✓     | ⚠           | ✓          | ✓       | ✓               | ✓           | ✓         | ✓     | ✓               |
| **EcyPro (bizde)** | **✓**               | **✓** | **✓**         | **✗**        | **✓**   | **✓**    | **✓** | **✓**       | **✓**      | **✓**   | **✗**           | **✓**       | **⚠**     | **✗** |

### Çıkarılan Zorunlu Gereksinimler

- **G1:** Bağımsız `/pricing` sayfası (tier grid + karşılaştırma tablosu + FAQ).
- **G2:** Newsletter subscription endpoint + Footer'da inline form.
- **G3:** Live chat widget slot (feature-flagged, gerçek servis opsiyonel — Crisp/Intercom/Tawk).
- **G4:** i18n en/tr tamamlama (şu an sadece contact namespace çeviri var).
- **G5:** Case study detay sayfası (`/case-studies/:slug`) — şu an sadece liste.
- **G6:** Blog kategori + tag taxonomy (şu an flat).

---

## 3. Öncelik Sırası — Phase & Todo List

> Her phase tamamlandığında: (a) Lint + TSC + Build 0 hata, (b) E2E smoke yeşil, (c) commit + memory güncelle.

### 📍 Phase 15: Lint + Tailwind v4 Cosmetic Harmoni ✅ (TAMAMLANDI — bu oturum)

- [x] `GrowthCalculator.tsx`: kullanılmayan import + `any` + exhaustive-deps temizlendi.
- [x] `Hero.tsx`: kullanılmayan lucide icon'ları temizlendi.
- [x] `npm run lint` → 0/0.
- [ ] **(Opsiyonel W3)** Tailwind v4 `bg-gradient-to-*` → `bg-linear-to-*`, `h-[1px]` → `h-px` dönüşümü (cosmetic, eslint değil; ertelenebilir).

### 📍 Phase 17: Gap Kapatma — Kritik Eksik Sayfalar ✅ (TAMAMLANDI — bu oturum)

- [x] **G1** `/pricing` sayfası: 3-tier (Starter/Growth/Enterprise) + aylık/yıllık toggle + karşılaştırma tablosu + FAQ + final CTA. Tam i18n (tr/en), a11y (aria-expanded, aria-live), SEO (canonical + meta).
- [x] **G2** Newsletter endpoint: `POST /api/newsletter/subscribe` (`server/routes/newsletter.ts`) Zod validation + rate limit (contactLimiter) + logger. Footer form artık gerçek POST + KVKK consent checkbox + loading/success/error state + aria-live status. Mock server'a da eklendi.
- [x] **G5** `/case-studies/:slug` detay sayfası: JSON-LD Article, hero, KPI strip, prose body, related cards, CTA.
- [x] Router: `src/App.tsx` — 3 yeni route (pricing, case-studies/:slug).
- [x] Nav: `src/data/copy/common.ts` — `pricing` nav item.
- [x] Sitemap: `/pricing` + 3 case-study detay URL'leri `scripts/generate-sitemap.ts`.
- [x] **Doğrulama (Phase 17):** tsc 0, lint 0, build ✅ 29 sitemap URL.

### 📍 Phase 19: Phase 1-17 Cerrahi Tamamlama ✅ (TAMAMLANDI — bu oturum)

Phase 1-17 ultra-deep denetimi, 32 tespit → 15 cerrahi düzeltme uygulandı. **"Geçmişte yapılacak bir şey kalmadı."**

**Aşama A — Ultra-Kritik (7):**

- [x] **I1+I6** `Dockerfile` backend imajı artık **compile edilmiş JS** çalıştırıyor (`tsx` runtime'dan atıldı); builder stage `prisma generate` + `vite build` + `tsc -p tsconfig.server.json`; `dist/package.json: {"type":"commonjs"}` override; openssl Alpine bağımlılığı Prisma engine için.
- [x] **I2** 🚨 **KRİTİK SECURITY FIX:** `vite.config.ts` `define: process.env.GEMINI_API_KEY` kaldırıldı → API key artık client bundle'a sızmıyor. `loadEnv` import sil.
- [x] **B1** 🚨 `sentryErrorHandler` artık **response yazmıyor**; push + `err.eventId = …` + `next(err)`. Phase 18 envelope aktive oldu.
- [x] **B2** Tüm 3 controller (`auth`, `booking`, `analytics`): `safeParse` → `.parse()` (throws ZodError); inline 400/401/403/404/409 → `throw new HttpError(...)`. Global `errorHandler` devrede. Envelope backward-compat (`status`, `message` KORUNUR; `code`, `requestId`, `issues`, `eventId` EKLENDİ).
- [x] **B3** `login`: timing-safe DUMMY_HASH ile user enumeration side-channel kapatıldı.
- [x] **I3** `.github/workflows/e2e.yml` silindi (pnpm çakışma + ci.yml zaten e2e yapıyor).
- [x] **I4+V1+H4** `npm run typecheck` artık **hem frontend hem server** tsc çalıştırıyor. `typecheck:web` + `typecheck:server` eklendi.

**Aşama B — Yüksek Değerli (8):**

- [x] **H1** `package.json.prepare: "husky install"` silindi (husky v9 deprecated).
- [x] **H2+H3** `eslint.config.js`: ecmaVersion 2022; frontend/node ayrı override'lar (`src/` → browser globals, `server/`/`scripts/`/`e2e/` → node globals); server `no-console: error`, scripts serbest.
- [x] **R1** `rateLimiter.defaultKeyGenerator`: manuel XFF parse silindi, `req.ip` kullanılıyor (trust proxy sonrası doğru + spoofable değil).
- [x] **E1** `rateLimiter.ts`: Redis `ready | connecting | reconnecting` — transient hiccup'larda memory fallback thrashing engellendi.
- [x] **I5+I8** `docker-compose.yml`: Redis **default profile** (production-only değil); `api.depends_on.redis.condition: service_healthy`.
- [x] **B5** `analyticsController.submitContact`: `Accept-Language` header ile locale tespit → `messageTr` veya `messageEn` kolonuna doğru yazıyor.
- [x] **Cleanup** `e2e:local` + `dev` script'leri npm-only (pnpm referansları sil).
- [x] **Cleanup** `server/mock-server.js`, `scripts/generate-sitemap.ts` vs. stale `eslint-disable no-console` directive'leri — yeni config ile uyumlu; `check-scores.cjs`/`fix-ts.*` ignore'a.

**Doğrulama:**

- `npm run typecheck` (frontend + server): ✅ 0
- `npm run lint`: ✅ 0 error, 0 warning
- `npm run build`: ✅ 35 sitemap URLs, 64 PWA precache
- `npm run test:e2e:fast`: ✅ **6/6 pass** (chromium + firefox + webkit × 2 testler)

**Ertelenmiş (Phase 20+):**

- Tailwind v4 cosmetic codemod (D1), Hero magic-pixel fib refactor (D2)
- Logout + JWT blacklist (B4), email verification (P5)
- Prisma `NewsletterSubscriber` model (P7)
- `i18n` namespace dosyaları (L2)
- `pnpm-lock.yaml` destructive sil (L1 — kullanıcı onayı)
- Lighthouse + axe CI job (I7, P4)
- SSE Redis pub/sub (S1), Booking DELETE+GET/:id (P1)
- Admin panel (Phase 18 orig), Sentry source-map CI (P3)

### 📍 Phase 18: P0 Bloker Sertleştirme ✅ (TAMAMLANDI — önceki oturum)

Phase 1-17 e2e mikro+makro denetim → 5 P0 bloker tespit + düzeltildi:

- [x] **P0-1** `server/index.ts` — `app.set('trust proxy', 1)` (env'den `TRUST_PROXY` override). Rate limiter IP spoofing fix.
- [x] **P0-2** `server/middleware/error.ts` — Standart `ApiErrorEnvelope` ({status, code, message, requestId, issues?}) + `HttpError` class. `ZodError` → 400 VALIDATION_ERROR, `Prisma P2002` → 409 UNIQUE_CONSTRAINT, `P2025` → 404 NOT_FOUND, JSON parse → 400 INVALID_JSON.
- [x] **P0-3** **KRİTİK BUG:** `scripts/seed.ts` hash formatı (`salt:hash`) ile `authController.verifyPassword` beklentisi (`salt:iterations:hash`) uyumsuzdu → seed'lenmiş admin/demo **login olamıyordu**. Seed format 3-parçaya harmonize edildi; `prisma/schema.prisma` yorumu "bcrypt" → "PBKDF2-SHA512".
- [x] **P0-4** `.dockerignore` 13 satırdan 100+ satıra genişletildi: node*modules, dist, e2e, test-results, browser-profile, build_log*, playwright-report, tüm `.env*` (`.env.example`hariç),`*.zip`, `brain/`, `docs/`, `prompts/`, `\_.md`, Dockerfile kendisi. Build context ≪50 MB + secret leak önleme.
- [x] **P0-5** E2E sanity smoke: **6/6 yeşil** (chromium + firefox + webkit × "Console Errors" + "Booking Wizard" testleri).
- [x] **Doğrulama:** tsc 0, lint 0, build ✅ 35 sitemap URL, E2E fast 9.3s 6/6 pass.

### 📍 Phase 17.5: Self-Audit + Revizyonlar ✅ (TAMAMLANDI — bu oturum)

Phase 17 sonrası mikro denetim, 7 düzeltme uygulandı:

- [x] **R1** `ContactPage` `?plan=starter|growth|enterprise` query param okur; form üstünde aria-live banner (tr/en) gösterir.
- [x] **R2** `CaseStudy` interface'i `duration`, `goLive`, `challenge` ile genişletildi. `mockCaseStudies.ts` zengin HTML content (challenge → approach → results + quantitative metrics).
- [x] **R3** `CaseStudyDetailPage` KPI strip artık `study.duration ?? '—'`, `study.goLive ?? '—'` — hardcoded değil; `study.challenge` paragrafı eklendi; breadcrumbs nav (aria-label, aria-current) eklendi.
- [x] **R4** Sitemap script `mockCaseStudies.ts`'den **regex parse** (hardcoded slug listesi kaldırıldı; DRY).
- [x] **R5** `GET /api/ready` — Prisma `$queryRaw` + Redis ping, 1.5s/500ms timeout, 503 on DB down. `GET /api/metrics` — prom-style plain text (uptime, rss, heap_used, heap_total).
- [x] **R6** `server/config/openapi.ts` — `/ready`, `/metrics`, `/newsletter/subscribe` path'leri + 2 yeni tag (Newsletter, Observability) eklendi.
- [x] **R7** PricingPage FAQ: `aria-controls`, `id`, `role="region"`, `aria-labelledby`, `hidden` → WCAG 2.1 AA disclosure pattern.
- [x] **Doğrulama:** tsc frontend 0, tsc server 0, lint 0, build ✅ **35 sitemap URL** (DRY refactor tüm kategorileri doğru saydı).

### 📍 Phase 16: Local Zero-Error Runtime Sözleşmesi ✅ (TAMAMLANDI — Phase 20 kapsamında)

- [x] `.env.local.example` şablonu: `VITE_API_URL=http://localhost:3001/api`, mock EmailJS, GA4, livechat env'leri (Phase 20.5 user diff).
- [x] `npm run dev` tek komutla: vite + server + terminal concurrently (✓ doğrulandı).
- [x] `docker compose up` → postgres+redis+api+web orchestration (Phase 4 + Phase 13).
- [x] `npm run db:push && npm run db:seed` idempotent (Phase 7 seed.ts + Phase 20 NewsletterSubscriber).
- [x] `GET /api/health` ve `GET /api/docs` aktif (Phase 7).
- [x] Repo bloat temizliği: `.gitignore` + `.dockerignore` glob pattern'ler (Phase 20 F1).
- [x] Lock file tekilleştir: `pnpm-lock.yaml` + `pnpm-workspace.yaml` silindi (Phase 20 A3).

### 📍 Phase 17 (eski stub): Gap Kapatma — DUPLICATE — silindi

> Bu blok eski plan stub'ıydı. Tamamlanan Phase 17 ✅ kaydı için yukarıya (line 115 civarı) bakın. Aşağıdaki tüm maddeler kapatıldı:
>
> - **G1, G2, G5, G7 (W7)** ✅ Phase 17.
> - **G3, G4, G6** ✅ Phase 20 (B1, B2, B3).
> - **W5** lead-magnet → Phase 22 (kapsam dışı, Phase 1-17 değil; assessment + email capture pipeline).

### 📍 Phase 18 (eski): Admin Panel Genişletme ⬜ → Phase 23'e ertelendi

Kapsam Phase 1-17 dışı (admin CRUD, advanced UX). Detay aşağıda Phase 23 alt başlığında.

- [ ] `/admin/bookings` — React Query + tanstack-table, status filter, pagination.
- [ ] `/admin/users` — role edit, RBAC.
- [ ] `/admin/analytics` — SSE live feed + 30g time-series Recharts.
- [ ] `/admin/content` — Keystatic linki veya inline markdown editor.
- [ ] Admin route'ları için ortak `AdminTablePage` HOC.

### 📍 Phase 19 (eski): Frontend Polish — Ultra-Zirve Stil ⬜ → Phase 22'ye ertelendi

Kısmen Phase 20.5 H5 (certifications row) ve H1-H3 (JSON-LD, methodology, about) kapsamında. Kalan trust-bar GSAP-vari stagger + before/after slider Phase 22.

- [ ] Hero: parallax katman (framer `useScroll`), mikro trust-bar (5 logo + GSAP benzeri stagger).
- [ ] Services: "outcome badges" (ISO27001, SOC2, GDPR) + before/after slider örneği.
- [ ] SuccessStories: logo grid + metric ticker (count-up).
- [ ] `ReducedMotion` tüm animasyonlarda respect.
- [ ] Golden Ratio audit: `grep -rn "px\|rem" src/components | grep -v "fib-"` ile magic number avı.
- [ ] Axe-core CI: `npm run lint` pipeline'ına `pa11y-ci` veya `@axe-core/playwright`.

### 📍 Phase 20.5: Competitive Intelligence + publish.txt Full Closure ✅ (TAMAMLANDI — bu oturum)

`prompts/publish.txt`'in "10 rakip SWOT + gap list" emri Phase 20'de eksikti; bu phase ile kapatıldı.

**9 Adım:**

1. **`brain/COMPETITIVE_AUDIT.md`** — 10 rakip × 12 kriter (McKinsey, BCG, Bain, Accenture Song, Deloitte Digital, Thoughtworks, IDEO, EY-Parthenon, Kearney, Productive.io). SWOT + EcyPro ranking + 5 HIGH gap.
2. **`brain/PHASE_1_17_AUDIT.md`** — 17 phase × 10 publish.txt kriteri matrisi.
3. **R1/R2** — `constants_generated.ts` 5 case + 5 blog bilingual content; `scripts/generate-content.ts` graceful-skip TS port; `gen:content` npm script.
4. **R3** — GA4 gerçek init: `src/lib/ga4-loader.ts` (consent-gated, idempotent, revoke + cookie cleanup); `AnalyticsProvider.tsx` revize; 6 unit test.
5. **R4** — Master plan sanitization: Phase 16 ✅, duplicate Phase 17 stub silindi, Phase 18/19 ertelenmiş annotate.
6. **HIGH Gap (5/5):**
   - **H1** JSON-LD builders (`src/lib/structured-data.ts`) + 6 sayfa inject
   - **H2** `/methodology` canonical + Breadcrumb
   - **H3** `/about` canonical + Breadcrumb
   - **H4** `CaseStudiesPage` industry chip filter (`?industry=`, aria-pressed, aria-live)
   - **H5** `src/components/sections/Certifications.tsx` (ISO27001/SOC2/GDPR/KVKK/Capital 500); LandingContent'a Insights ↔ Contact arasına
7. **`brain/skills.md`** — UI/UX Pro MAX Patterns + Competitive Patterns + Deep-Search Protocol.
8. **FV3:** typecheck 0/0, lint 0, build 34 URL, test 29/29, e2e:fast 6/6, prisma valid, gen:content skip OK.
9. **Brain log + memory + master plan** güncel.

**Beyan:** Phase 1 → Phase 17 (+17.5) için **sıfır açık uç**. publish.txt 10 kriteri tam. "Geçmiş phase'lerde yapılacak hiçbir şey kalmadı."

---

### 📍 Phase 20: Phase 1-17 Final Closure ✅ (TAMAMLANDI — bu oturum)

Phase 19 sonrası kalan 18 madde cerrahi hassasiyetle kapatıldı. **Phase 1-17 için sıfır açık uç.**

**Aşama A — Regression / Standart İhlalleri (5/5):**

- [x] **A1** `server/routes/newsletter.ts`: `safeParse` + manuel envelope → `.parse()` + `HttpError` + `next(err)` (Phase 19 envelope harmonisi).
- [x] **A2** `lefthook.yml`: `pnpm` → `npm`; gitleaks gerçek tarama; commitlint commit-msg hook aktif.
- [x] **A3** `pnpm-lock.yaml` + `pnpm-workspace.yaml` silindi; `.gitignore`'a eklendi (regression önleyici).
- [x] **A4** `prisma/schema.prisma`: `NewsletterSubscriber` model (email unique, consent, source, ip, userAgent, audit timestamps); newsletter route Prisma `upsert` + idempotent re-subscribe.
- [x] **A5** `scripts/lighthouse.ts`: TS port (chrome-launcher + lighthouse import), build assumption (CI orchestrator), JSON + markdown rapor.

**Aşama B — Phase 17 Kapsam Tamamlama (4/4):**

- [x] **B1 (G3)** `src/components/integrations/LiveChat.tsx`: feature-flag slot (`VITE_LIVECHAT_PROVIDER` crisp/tawk/intercom/off), KVKK consent banner, async script + revoke cleanup, react-i18next entegre.
- [x] **B2 (G4)** i18n namespace genişletme: 8 yeni JSON (`pricing`, `caseStudies`, `newsletter`, `liveChat` × tr/en); `src/lib/i18n-react.ts` HTTP backend + dil dedektörü.
- [x] **B3 (G6)** Blog taxonomy: `BlogCategory` enum + frontmatter `category` + `BlogList` URL-driven chip filter (`?cat=&tag=`) + aria-pressed + clear-all.
- [x] **B4** Newsletter form a11y: `aria-busy`, `aria-invalid`, `aria-describedby`, `aria-live` polite, `aria-atomic`, `autoComplete=email`, `motion-reduce` + `e2e/newsletter.spec.ts` (happy + invalid).

**Aşama C — Phase 12-13 Backend Kapsam (3/3):**

- [x] **C1** `GET /api/bookings/:id` (owner OR ADMIN/CONSULTANT, 403 aksi).
- [x] **C2** `DELETE /api/bookings/:id` (owner soft-cancel, ADMIN hard-delete, 204).
- [x] **C3** `verifyPassword` defensive: malformed hash → `false` (info-leak yok); `crypto.timingSafeEqual` constant-time; 8 unit test.

**Aşama D — CI/CD Quality Gates (3/3):**

- [x] **D1** `.github/workflows/ci.yml` `a11y` job: chromium-only axe via `e2e/a11y.spec.ts`, fail on critical.
- [x] **D2** `lighthouse` job: build + preview + `scripts/lighthouse.ts` (continue-on-error ilk iterasyonda).
- [x] **D3** `lefthook.yml` `secret-scan`: `npx gitleaks detect --no-git --source=.`; commitlint zinciri tam.

**Aşama E — Tasarım Sistemi & Cosmetic (1/1):**

- [x] **E1 (W3)** Tailwind v4 codemod: 26 dosya × 52 cosmetic dönüşüm. `bg-gradient-to-{r,l,t,b,tr,tl,br,bl}` → `bg-linear-to-*`, `bg-white/[0.0X]` → `bg-white/X`, `h-[1px]` → `h-px`, magic-pixel `top/left/min-w/min-h-[Npx]` → token (Fibonacci); `flex-grow` → `grow`, `flex-shrink-0` → `shrink-0`, `aspect-[16/9]` → `aspect-video`, `aspect-[4/3]` → `aspect-4/3`, `rounded-[2rem]` → `rounded-4xl`, `bg-[#0a0a0a]` → `bg-surface` (theme token).

**Aşama F — Repo Hijyen (3/3):**

- [x] **F1 (W11)** Dev-time waste cleanup: `.gitignore` + `.dockerignore` glob pattern'ler (`build_log*.txt`, `e2e_output*.txt`, `*-debug.{txt,png,log}`, `lint_*.txt`, `eslint-report.json`, `lighthouse-report.json`, `stats.html`, `crawler_report.txt`).
- [x] **F2 (W12)** README dedupe: `EmailJS` Tech Stack 7→4, ikinci `Project Structure` ve `Security` blokları silindi (234→202 satır).
- [x] **F3** `browser-profile/` `.gitignore`'a (track edilmez).

**Doğrulama Matrisi (FV):**
| Komut | Sonuç |
|---|---|
| `npm run typecheck` | ✅ 0/0 (frontend + server) |
| `npm run lint` | ✅ 0 error |
| `npm run build` | ✅ 35 sitemap URL |
| `npm run test -- --run` | ✅ 23/23 (5 spec, dahil yeni `verifyPassword` 8 test) |
| `npm run test:e2e:fast` | ✅ 6/6 (chromium + firefox + webkit × 2) |
| `npx prisma validate` | ✅ valid (NewsletterSubscriber dahil) |
| `npm run gen:blog` | ✅ 3 post + category aggregation |

**Phase 1-17 W/G Maddeleri Durumu:**

- ✅ G3 LiveChat slot · G4 i18n namespaces · G6 Blog taxonomy
- ✅ W3 Tailwind v4 codemod · W11 Repo cleanup · W12 README dedupe

**Phase 21+ Ertelenmiş (Phase 1-17 dışı):**

- Admin panel CRUD genişlemesi (eski Phase 18)
- JWT blacklist / logout, email verification (yeni feature)
- SSE Redis pub/sub (S1)
- Sentry source-map CI upload
- Claude Code CLI entegrasyonu (Phase 21 — kullanıcı tarafından paralel olarak başlatıldı)
- 21st.dev component katalog · `motion` paket göçü

### 📍 Phase 20+ (eski): Backend Sertleştirme v2 ⬜ (Phase 22'ye ertelendi)

- [ ] Tüm route'larda Zod input schema + standart error envelope `{ status, code, message, requestId }`.
- [ ] `/api/bookings` için idempotency-key header.
- [ ] OpenAPI parity: `server/config/openapi.ts` tüm endpoint'leri yansıtıyor mu doğrula; `/api/docs` Swagger UI ile.
- [ ] Prisma migration dosyasını ekle (`prisma migrate dev --name init`), `db:push` yerine migrate tercih.
- [ ] Redis fallback log'u structured.

### 📍 Phase 21: CI/CD & Observability ⬜

- [ ] `.github/workflows/ci.yml`: lint → typecheck → test → build → e2e → lighthouse-ci.
- [ ] Release workflow: tag → docker build → push → render deploy + vercel deploy.
- [ ] Sentry release + source map upload adımı.
- [ ] Uptime: `GET /api/health` Cron (Render'ın built-in'i veya UptimeRobot hook).

### 📍 Phase 22: E2E Critical-Green & Performance Audit ✅ (TAMAMLANDI — bu oturum, Plan A scope)

- [x] **Critical pipeline yeşil**: `sanity_check` 6/6 · `lead-gen` 2/2 · `conversion-elements` 2/2 (chromium).
- [x] **`playwright.config.ts`** — global `storageState` cookie-consent pre-seed (GDPR banner artifact intercept fix).
- [x] **`ContactForm.tsx`** — `data-testid="contact-form"` + `aria-label`.
- [x] **`lead-gen.spec.ts`** — form-scoped selector + bilingual success regex + i18n key fallback path.
- [x] **Lighthouse audit:** Performance 62, A11y 85, BP 92, **SEO 100** (local preview, CPU throttled).
- [ ] **Phase 24'e ertelendi**: Performance ≥90 (font preload + hero preload + keystatic lazy chunk genel), A11y ≥95 (5 audit fail: ARIA role children, contrast, heading order, form labels, visible-text accessible name), Core Web Vitals production CDN ölçümü, full E2E 297→100% green (selector → `data-testid` global migrasyon, Recharts upstream, mock-server CI spawn).

### 📍 Phase 23: Publish & Handoff ✅ (TAMAMLANDI — bu oturum)

- [x] `archive/phase-reports/ECYPRO_PUBLISH_READY_HANDOFF.md` üretildi: pipeline durumu, Lighthouse skorları, E2E özeti, ENV (backend + frontend), DNS, deploy steps (Vercel + Render + Docker), known issues, Phase 24 backlog.
- [x] `brain/memory.md` → Phase 21 + Phase 22 closure bloğu eklendi.
- [x] `brain/PUBLISH_MASTER_PLAN.md` → Phase 22/23 kutucuklar [x].
- [ ] `npm run deploy` smoke-test (dry-run) — kullanıcı onayı ile uygulanacak.
- [ ] Final commit + tag `v1.0.0` — kullanıcı onayı ile.

### 📍 Phase 24α: Residual Closure ✅ (TAMAMLANDI)

- [x] **A1** CookieBanner a11y: `useId`, `role="dialog"`, `aria-modal`, `aria-labelledby`, `htmlFor`/`id` toggles, `aria-hidden` decorative icons.
- [x] **A2** Contrast: `text-slate-500` → `text-slate-400` in CookieBanner descs + IndustriesPage.
- [x] **A4** DataFlowBackground SVG `aria-hidden="true"`.
- [x] **I1-I3** `framer-motion` → `motion/react`: `package.json`, Python codemod 48 files, typecheck 0/0, build 34 URLs.
- [x] **B2** Fonts self-host: `@fontsource/inter` + `@fontsource/playfair-display` npm; Google Fonts CDN removed from `index.html`; CSP updated.
- [x] **B3** Lazy chunks: all pages already `React.lazy()`.
- [x] **E1-E4** JSON-LD: ContactPage Breadcrumb, ServicesPage Breadcrumb, IndustriesPage Breadcrumb, ServiceDetailPage Service+Breadcrumb.
- [x] **F1** Sentry CI: `.github/workflows/release.yml` with step-level `if: env.SENTRY_AUTH_TOKEN != ''`.
- [x] **G1** README `## 🤖 Content Generation` section (env setup, usage, no-key fallback).
- [x] **J1** `src/components/ui/spotlight.tsx` — mouse-tracking radial gradient; integrated into Hero.
- [x] **J2** `src/components/ui/animated-beam.tsx` — SVG path animated beam with ResizeObserver.
- [x] **J3** `src/components/ui/number-ticker.tsx` — spring-animated counter; replaces `useCountUp` in KPI.
- [x] **C1** `data-testid`: Footer newsletter form/email/submit, BookingWizard form, LoginPage form/email/password/submit, RegisterPage form.
- [x] **C2** `data-testid`: Hero CTA primary/secondary, Navbar mobile-menu-toggle.
- [x] **C3** `newsletter.spec.ts` migrated to `getByTestId`.
- [x] **C4** `playwright.config.ts` `webServer` → array + mock-server port 3001.

**FV4:** typecheck 0/0, build ✅ 34 URL, test 29/29, `framer-motion` 0 imports.

### 📍 Phase 24 Ek Optimizasyonlar ✅ (TAMAMLANDI — bu oturum)

- [x] **A11y 97/100**: KPI `role="listitem"`, Pricing tier `role="list/listitem"`, Contact.tsx `htmlFor`+`id`+`aria-label`, Hero `h3→h2`.
- [x] **Best Practices 92/100**: 5 Pexels URL → Unsplash (3rd-party cookie kaldırıldı), `vite.config.ts` `sourcemap: 'hidden'`.
- [x] **CSP temizleme**: `performance.ts` + `headers.ts` Google Fonts CDN referansları kaldırıldı.
- [x] **vite.config.ts**: `framer-motion` chunk ref → `motion`.

**FV4 (bu oturum):** typecheck 0/0 · lint 0 · build 34 URL · e2e:fast 6/6 · Lighthouse A11y 97 · BP 92 · SEO 100.

### 📍 Phase 25 (Backlog): İşletme DB + İleri Optimizasyon ⬜

#### Phase 25a — Performance ≥90

- [ ] Lighthouse Performance ≥90: Hero preload, font display swap audit, keystatic bundle isolation.
- [ ] Core Web Vitals production CDN ölçümü (LCP <3s beklenir CDN'de).

#### Phase 25b — E2E Full-Green

- [ ] E2E 297/297: global `data-testid` migrasyon, mock-server CI auto-spawn.
- [ ] Recharts `<circle>` upstream: firefox+webkit upstream fix veya `dot={false}` toggle.

#### Phase 25c — istek1.txt Kapsam (Yeni Ürün Konsepti)

- [ ] `prompts/istek1.txt` analizi: Türkiye işletme veritabanı + APA akademik blog motorunu.
- [ ] `/industries` sayfasını Türkiye il/ilçe granülaritesiyle zenginleştir.
- [ ] `gen:content` pipeline — AI-powered işletme analizi + blog otomasyonu.
- [ ] `brain/PHASE_25_PLAN.md` — tam kapsam + SWOT + phase list.

#### Phase 25d — Backend Gelişmeler

- [ ] JWT blacklist / logout, email verification.
- [ ] Admin panel CRUD (bookings, users, content, analytics).
- [ ] SSE Redis pub/sub (multi-instance).
- [ ] OpenAI + Unsplash ile `npm run gen:content` ilk canlı üretim.

---

## 4. Bir Sonraki AI için Devir Protokolü

1. Bu dosyayı oku (`brain/PUBLISH_MASTER_PLAN.md`) ve `brain/memory.md`'yi oku.
2. `git status` + `npm run lint` + `npx tsc --noEmit` + `npm run build` → baseline yeşil mi?
3. Yukarıdaki `⬜` ilk phase'dan başla. Tamamlanan her item için kutu `[x]` yapılır.
4. Phase sonunda commit mesajı: `feat(publishXX): <phase name>`.
5. Tüm phase'ler tamam olunca Phase 23'e geç ve handoff üret.
6. **Kuralı bozma:** 0 TS hatası, 0 ESLint hatası, build yeşil olmadan commit yok.

---

## 5. Referans Komut Seti

```bash
# Hızlı sağlık
npx tsc --noEmit && npx tsc -p tsconfig.server.json --noEmit && npm run lint && npm run build

# Local stack (4 terminal değil, tek komut)
npm run dev

# Docker stack
docker compose up -d postgres redis
npm run db:push && npm run db:seed
npm run dev

# E2E
npm run test:e2e:fast        # sanity
npx playwright test          # full

# Lighthouse (preview ayakta iken)
npx lighthouse http://localhost:4173 --output json --output-path lighthouse-report.json
```

**Son güncelleme:** Phase 22 + Phase 23 closure (3 Mayıs 2026). Plan A publish-ready scope tamamlandı. Critical E2E yeşil (`sanity 6/6`, `lead-gen 2/2`, `conversion-elements 2/2`), Lighthouse SEO 100, A11y 85, BP 92, Performance 62. Repo bloat 178 MB silindi. `archive/phase-reports/ECYPRO_PUBLISH_READY_HANDOFF.md` üretildi.
**Sıradaki adım:** Kullanıcı onayı ile final commit + tag `v1.0.0`, sonra Phase 24 backlog (production optimization — Performance ≥90, A11y ≥95, full E2E green).
