---
doc: ECYPRO_SITE_CATEGORIZATION
title_tr: "eCyPro.com — Tüm Bölümlerin ve Çalışma Alanlarının Tam Kategorizasyonu"
title_en: "eCyPro.com — Complete Categorization of All Sections and Workspaces"
site: ecypro.com
brand: "eCyPro — Premium Consulting (KVKK + EU Regulatory)"
ecosystem: eCyverse
source_path: /Users/emrecnyngmail.com/Desktop/ecypro
stack:
  languages: "TypeScript ~5.8.2 (1062 files), MDX, CSS, MJML, Prisma/SQL, Bash (41), Python (4), JS/MJS, JSON/YAML"
  frontend: "React 19, TypeScript (strict), Vite 6, Tailwind CSS v4, React Router 7"
  backend: "Express 5, Prisma 7, PostgreSQL, Redis (ioredis), JWT"
  cms: "Keystatic"
  testing: "Vitest, Playwright (E2E), axe-core (a11y)"
  i18n: "i18next (EN + TR), 14 namespaces"
  integrations: "Calendly, EmailJS, Stripe, WhatsApp, Sentry, PostHog, Google Analytics"
counts:
  public_pages: 65          # src/pages/*.tsx (test dosyaları hariç)
  admin_pages: 49           # src/pages/admin/*.tsx (test dosyaları hariç)
  component_folders: 29     # src/components/*/
  admin_component_folders: 19
  blog_articles: 49         # src/content/blog/*.mdx
  case_studies: 1           # src/content/case-studies/ (atlas-freight)
  i18n_namespaces: 14       # × 2 dil (EN/TR)
  server_modules: 20        # server/*/
  top_nav_items: 7
audience: "Sıfır ön-bilgisi olan okuyucu + bu dokümanı parse edecek sonraki AI / Zero-knowledge reader + the next AI parsing this file"
language: "Bilingual TR + EN. Kod/route/id İngilizce. / Code, routes and ids stay in English."
generated: 2026-06-08
---

# eCyPro.com — Tam Kategorizasyon / Complete Categorization

> **Bu doküman ne işe yarar? / What is this document for?**
> **TR:** Bu doküman, `ecypro.com` web sitesinin **her bölümünü ve çalışma alanını** sıfırdan kategorize eder. Kaynak kodu (`/Users/emrecnyngmail.com/Desktop/ecypro`) ile birebir doğrulanmıştır. Siteyi hiç bilmeyen biri — veya bu dosyayı okuyacak başka bir yapay zeka — tüm projenin yapısını tek kaynaktan görebilsin diye yazılmıştır.
> **EN:** This document categorizes **every section and workspace** of the `ecypro.com` website from scratch. It is verified one-to-one against the source code (`/Users/emrecnyngmail.com/Desktop/ecypro`). It is written so that someone with no prior knowledge — or another AI reading this file — can grasp the entire project's structure from a single source.

---

## 0. Genel Bakış / Overview

**TR — Bu site nedir?**
eCyPro, **premium kurumsal danışmanlık** markasıdır. Ana uzmanlık alanı: **KVKK** (Türk veri koruma kanunu) ve **AB regülasyon uyumu**, organizasyonel dönüşüm, stratejik yönetim, dijital dönüşüm ve kültürel mühendislik. "eCyverse" adlı daha büyük bir ekosistemin danışmanlık koludur. Site iki dillidir (Türkçe + İngilizce) ve iki ana yüze sahiptir: (1) ziyaretçilere yönelik **public pazarlama/içerik sitesi**, (2) firmanın kendi ekibinin kullandığı **admin yönetim paneli** (CRM, içerik yönetimi, KVKK uyum modülleri).

**EN — What is this site?**
eCyPro is a **premium corporate consulting** brand. Core expertise: **KVKK** (Turkish data-protection law) and **EU regulatory compliance**, organizational transformation, strategic management, digital transformation, and cultural engineering. It is the consulting arm of a larger ecosystem called "eCyverse". The site is bilingual (Turkish + English) and has two faces: (1) a public-facing **marketing/content site** for visitors, and (2) an internal **admin management panel** used by the firm's own team (CRM, content management, KVKK compliance modules).

**Mimari özet / Architecture at a glance**
- **Frontend (SPA):** React 19 + React Router 7, `src/` altında. Tüm route'lar `src/App.tsx` (L389–1231) içinde tanımlı.
- **Backend (API):** Express 5 + Prisma 7 + PostgreSQL, `server/` altında.
- **İkililik / Duality:** Her public route hem kanonik İngilizce slug (`/about`) hem Türkçe alias (`/hakkimizda`) hem de `/:locale/...` (en/tr) önekli varyantla erişilebilir.

> **Kategorizasyon 13 eksende yapılır / Categorization is done across 13 axes:**
> **A.** Public Bilgi Mimarisi / Navigasyon — *Public Information Architecture / Navigation*
> **B.** İş-Fonksiyonu Kategorileri — *Business-Function Categories*
> **C.** Teknik Mimari (C1–C9) — *Technical Architecture*
> **D.** İçerik Taksonomisi — *Content Taxonomy*
> **G.** Diller & Teknolojiler — *Languages & Technologies*
> **H.** Veri Modeli (Prisma) — *Data Model*
> **I.** API Endpoint Envanteri — *API Routes*
> **J.** Statik Varlıklar, SEO & PWA — *Static Assets, SEO & PWA*
> **K.** Yapılandırma & Ortam — *Configuration & Environment*
> **L.** CI/CD & Deployment — *DevOps*
> **M.** Otomasyon Scriptleri — *Automation Scripts*
> **N.** Proje Dokümantasyonu — *Project Documentation*
> **E.** Sözlük — *Glossary*
> **F.** Kapsam Matrisi + Makine-Okunur İndeks — *Coverage Matrix + Machine-Readable Index*

> **Her kategori şu şablonla yazılır / Each category uses this template:**
> `Amaç/Purpose · Route(lar)/Route(s) · Dosya/File · İçerik/Content · Hedef-kullanıcı/Target user`

---

## A. Public Bilgi Mimarisi / Navigasyon — Public Information Architecture / Navigation

**TR:** Ziyaretçinin gördüğü navigasyon yapısı. Üst menü, mega-menüler, footer ve diller. **EN:** The navigation structure a visitor sees. Top menu, mega-menus, footer and languages.
**Kaynak / Source:** `src/data/copy/common.ts` (NAV_ITEMS L11–102, mega-menüler L104–328, contact L330–355, footer L360–404) · `src/components/layout/` (`Navbar.tsx`, `MegaMenu.tsx`, `Footer.tsx`, `MobileBottomNav.tsx`).

### A.1 — Üst Navigasyon / Top Navigation (7 öğe / items)

| id | TR label | EN label | href | Mega-menü? |
|----|----------|----------|------|-----------|
| `home` | Ana Sayfa | Home | `#hero` | — |
| `services` | Hizmetler | Services | `#services` | ✅ |
| `sektorler` | Sektörler | Industries | `/sektorler` | ✅ |
| `insights` | Perspektifler | Insights | `#insights` | ✅ |
| `pricing` | Fiyatlandırma | Pricing | `/pricing` | — |
| `about` | Hakkımızda | About Us | `/about` | — |
| `contact` | İletişim | Contact | `#contact` | — |

### A.2 — Services Mega-Menü / Services Mega-Menu
3 sütun / 3 columns: **Strateji/Strategy**, **Teknoloji/Technology**, **Performans/Performance** + öne çıkan/featured **AI Maturity Analysis**.
- **Strateji/Strategy:** Kurumsal Strateji / Corporate Strategy · M&A Advisory · Org Design.
- **Teknoloji/Technology:** AI & Data · Dijital Dönüşüm / Digital Transformation · Cloud & Platform.
- **Performans/Performance:** Revenue Growth · Cost Transformation · Digital Operations.

### A.3 — Sektörler Mega-Menü / Industries Mega-Menu (5 dikey / 5 verticals)
| id | TR | EN | href |
|----|----|----|------|
| `imalat` | İmalat Sanayi | Manufacturing | `/sektorler/imalat-sanayi` |
| `finansal` | Finansal Hizmetler | Financial Services | `/sektorler/finansal-hizmetler` |
| `ilac` | İlaç & Sağlık | Pharma & Healthcare | `/sektorler/ilac-saglik` |
| `perakende` | Perakende & E-Ticaret | Retail & E-Commerce | `/sektorler/perakende-e-ticaret` |
| `teknoloji` | Teknoloji & SaaS | Tech & SaaS | `/sektorler/teknoloji-saas` |

### A.4 — Insights (Perspektifler) Mega-Menü
Alt öğeler / children: **Blog** (`/blog`), **Vaka Analizleri / Case Studies** (`/case-studies`), **Çalışmalar / Works** (`/calismalar`). Öne çıkan/featured: **2026 AI Transformation Report**.

### A.5 — Footer
4 bölüm / 4 sections: **Company** (Blog, Careers, Locations) · **Services** · **Legal** (Privacy, Terms, Cookies) · **Newsletter signup**. Telif / Copyright: "© 2026 eCyPro Consulting".

### A.6 — Diller & CTA / Languages & CTAs
- **Diller / Languages:** EN + TR (`LanguageSwitcher.tsx`, `src/components/ui/LanguageToggle`). Locale `/:locale` öneki ile veya `/locale-detect` otomatik tespitiyle.
- **CTA envanteri / CTA inventory:** "Görüşme Planla / Book a Call" · "ÜCRETSİZ ANALİZ / FREE ANALYSIS" (→ `/maturity-assessment`) · WhatsApp butonu (`wa.me/905417143000`) · Discovery call.
- **İletişim / Contact:** `info@ecypro.com` · `+90 541 714 30 00` · İstanbul · LinkedIn/Twitter/Instagram `@ecypro`.

---

## B. İş-Fonksiyonu Kategorileri — Business-Function Categories

**TR:** Sayfaları "ne işe yarar" sorusuna göre gruplar (teknik dosya değil, iş amacı). **EN:** Groups pages by "what business job they do" (business purpose, not technical file).

### B1 — Pazarlama & Lead Capture / Marketing & Lead Capture
**Amaç/Purpose:** Ziyaretçiyi müşteri adayına (lead) çevirmek. / Convert visitors into leads.
**Hedef/Target:** Potansiyel müşteri / prospective client.

| Sayfa / Page | Route (kanonik + TR alias) | Dosya / File | İçerik / Content |
|--------------|----------------------------|--------------|------------------|
| Landing | `/` | `pages/LandingPage.tsx` | Hero, vizyon-strateji-sonuç, hizmet özetleri |
| Services | `/services` · `/hizmetler/*` | `pages/ServicesPage.tsx`, `ServiceDetailPage.tsx` | Hizmet kataloğu + detay |
| Pricing | `/pricing` · `/fiyatlandirma` | `pages/PricingPage.tsx` | Fiyat kademeleri / tiers |
| Pricing Calculator | `/pricing-calculator` · `/fiyatlandirma-hesabi` | `pages/PricingCalculatorPage.tsx` | Dinamik fiyat lead magnet |
| Quick Check | `/quick-check` · `/hizli-kontrol` | `pages/QuickCheckPage.tsx` | Hızlı uyum kontrolü lead magnet |
| Maturity Assessment | `/maturity-assessment` | `pages/AssessmentPage.tsx` | AI olgunluk değerlendirme quiz |
| Discovery | `/discovery` | `pages/DiscoveryPage.tsx` (+ `Discovery.tsx`) | Çok adımlı keşif formu |
| Discovery Call | `/discovery-call` | `pages/DiscoveryCallPage.tsx` | Calendly randevu embed |
| Thank You | `/thank-you` | `pages/ThankYouPage.tsx` | Dönüşüm sonrası teşekkür |
| Denetim Hazırlık | `/araclar/denetim-hazirlik-skoru` | `pages/DenetimHazirlikPage.tsx` | KVKK denetim hazırlık skoru aracı |

Destek bileşenleri / supporting components: `components/marketing/` (exit-intent modal, mobile CTA bar), `components/discovery/`, `components/booking/`.

### B2 — İçerik & Düşünce Liderliği / Content & Thought Leadership
**Amaç/Purpose:** SEO + otorite + organik trafik. / SEO + authority + organic traffic.

| Sayfa / Page | Route | Dosya / File |
|--------------|-------|--------------|
| Blog hub + post | `/blog`, `/blog/:slug` | `pages/BlogPage.tsx`, `BlogPostPage.tsx` |
| Insights hub | `/insights` · `/perspektifler` | `pages/InsightsPage.tsx` |
| Insight article | `/insights/:slug` | `pages/InsightArticle.tsx` |
| Insight category | `/insights/:domain/:subDomain?` | `pages/InsightCategory.tsx` |
| Insight series | `/insights/series/:slug/:part?` | `pages/InsightSeries.tsx` |
| Insight tag | `/insights/tag/:slug` | `pages/InsightTag.tsx` |
| Insight author | `/insights/author/:slug` | `pages/InsightAuthor.tsx` |
| Insight archive | `/insights/archive/:year?/:month?` | `pages/InsightArchive.tsx` |
| Insight search | `/insights/search` | `pages/InsightSearch.tsx` |
| Case Studies | `/case-studies`, `/case-studies/:slug` | `pages/CaseStudiesPage.tsx`, `CaseStudyDetailPage.tsx` |
| Çalışmalar (TR kanonik) | `/calismalar` | `pages/CalismalarPage.tsx` |
| Pillar content | `/pillar/:slug` | `pages/PillarPage.tsx` |
| Industry Report | `/industry-reports/:slug` | `pages/IndustryReportPage.tsx` |
| Webinar | `/webinars/:slug` | `pages/WebinarLandingPage.tsx` |
| Annual Report | `/annual-report/2025` | `pages/AnnualReportPage.tsx` |

### B3 — Sektör Microsite'leri / Industry Microsites
**Amaç/Purpose:** Her dikey için özelleştirilmiş giriş sayfası. / Tailored landing per vertical.
Hub: `/sektorler` → `pages/SektorlerPage.tsx`. Ayrıca `/industries` → `pages/IndustriesPage.tsx` (EN hub).
Microsite'ler / microsites: `SektorlerImalatPage`, `SektorlerFinansalPage`, `SektorlerIlacPage`, `SektorlerPerakendePage`, `SektorlerTeknolojPage` (route'lar A.3'te).

### B4 — Şirket & Güven / Company & Trust
**Amaç/Purpose:** Kurumsal güvenilirlik, kredibilite. / Corporate credibility.

| Sayfa / Page | Route (kanonik · TR alias) | Dosya / File |
|--------------|----------------------------|--------------|
| About | `/about` · `/about-us` · `/hakkimizda` | `pages/AboutPage.tsx` |
| Team | `/team` · `/ekip` | `pages/TeamPage.tsx` |
| Methodology | `/methodology` · `/metodoloji` | `pages/MethodologyPage.tsx` |
| Partners | `/partners` · `/is-ortaklari` | `pages/PartnersPage.tsx` |
| Founder | `/founder` | `pages/FounderPage.tsx` (bio + manifesto + Big4 vs Boutique) |
| Güvence | `/guvence` | `pages/GuvencePage.tsx` (KVKK + bağımsızlık güven sayfası) |
| Press Kit | `/press` · `/basin` | `pages/PressKitPage.tsx` |
| Speaking | `/speaking` · `/konusmalar` | `pages/SpeakingPage.tsx` |
| Events | `/events` · `/etkinlikler` | `pages/EventsPage.tsx` |
| Locations | `/locations` · `/lokasyonlar` | `pages/LocationsPage.tsx` |
| Careers | `/careers` · `/kariyer` | `pages/CareersPage.tsx` |
| FAQ | `/faq` · `/sss` | `pages/FaqPage.tsx` |
| Contact | `/contact` · `/iletisim` | `pages/ContactPage.tsx` |

### B5 — Yasal / Legal
**Amaç/Purpose:** KVKK/GDPR yasal uyum, zorunlu metinler. / KVKK/GDPR legal compliance.
| Sayfa / Page | Route (· TR alias) | Dosya / File |
|--------------|---------------------|--------------|
| Privacy | `/privacy` · `/gizlilik` | `pages/PrivacyPage.tsx` |
| Data Rights | `/privacy/data-rights` · `/data-rights` | `pages/DataRightsPage.tsx` |
| Terms | `/terms` · `/kosullar` | `pages/TermsPage.tsx` |
| Cookies | `/cookies` · `/cerezler` | `pages/CookiePage.tsx` |

Bileşenler / components: `components/legal/`.

### B6 — Hesap & İşlem / Account & Transactional
**Amaç/Purpose:** Kullanıcı kimlik doğrulama + işlemsel akışlar. / User auth + transactional flows.
- **Auth:** `/login` · `/register` · `/forgot-password` · `/verify-email` → `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `VerifyEmailPage`.
- **Booking yönetimi / management:** `/booking/manage` (yeniden planla/iptal), `/feedback/:bookingId` (NPS) → `BookingManagePage`, `BookingFeedbackPage`.
- **Newsletter durumu / status:** `/newsletter/confirmed|unsubscribed|invalid-token` → `NewsletterStatusPage`.
- **User dashboard:** `/app/*` → `DashboardPage.tsx` (+ `components/dashboard/`).

### B7 — Sistem & Hata / System & Error
`/status` (`StatusPage`), `/500` (`ServerErrorPage`), `/404` (`NotFoundPage`), `/locale-detect` (locale yönlendirme), `/antigravity-terminal` (easter-egg `TerminalPage`).

---

## C. Teknik Mimari — Technical Architecture

### C1 — Frontend Route Haritası / Frontend Route Map
**Kaynak / Source:** `src/App.tsx` (L389–1231).
- **Kanonik İngilizce route'lar** (örn. `/about`) + **Türkçe alias route'lar** (örn. `/hakkimizda`, `/ekip`, `/hizmetler/*`, `/perspektifler`, `/sss`, `/cerezler`, `/gizlilik`, `/kosullar`, `/metodoloji`, `/is-ortaklari`, `/basin`, `/konusmalar`, `/etkinlikler`, `/lokasyonlar`, `/kariyer`, `/iletisim`, `/fiyatlandirma`, `/fiyatlandirma-hesabi`, `/hizli-kontrol`).
- **Locale-prefixed varyantlar** `/:locale/...` (en/tr) — tüm ana route'lar bu önekle de tanımlı (L903–1166).
- **Locale tespiti / detection:** `/locale-detect` → `LocaleRedirect` (tarayıcı dilini algılar, `/tr` veya `/en`'e yönlendirir).

### C2 — Admin Paneli / Admin Panel
**Amaç/Purpose:** Firmanın iç işletim sistemi — içerik, CRM, uyum, analitik. / The firm's internal operating system.
**Route kökü / root:** `/admin/*` (nested router, `src/App.tsx`). Giriş: `/admin/login`. **Hedef/Target:** sadece firma ekibi (auth + RBAC korumalı) / firm staff only.
**Sayfalar / pages:** `src/pages/admin/` (49 dosya). **Bileşenler / components:** `src/components/admin/` (19 alt-klasör / subfolders).

Admin nested route'ları işleve göre gruplanmış / grouped by function:

| Grup / Group | Nested route'lar / routes | Açıklama / Description |
|--------------|---------------------------|-----------------------|
| **Genel Bakış / Overview** | `overview`, `dashboard` | Ana panel, KPI snapshot |
| **İçerik / Content** | `blog`, `blog/:slug/edit`, `services`, `services/:slug/edit`, `pages`, `pages/:id/edit`, `collections/:type`, `media` | Blog/hizmet/sayfa/medya editörü |
| **Insights Yönetimi / Mgmt** | `insights`, `insights/categories`, `insights/posts`, `insights/posts/new`, `insights/posts/:id/edit`, `insights/metadata` (+ search/tag/author/series/archive) | Perspektif içerik üretimi |
| **CRM & Satış / Sales** | `leads`, `leads/:id`*, `contacts`, `crm`, `deals`, `retainers`, `outreach` | Müşteri adayı→anlaşma hattı (*detay route bileşende) |
| **Booking** | `bookings` | Randevu yönetimi |
| **Newsletter** | `newsletter`, `newsletter/campaigns`, `newsletter/campaigns/new` | Bülten + kampanya sihirbazı |
| **Analitik / Analytics** | `analytics`, `dev-analytics` | Site + teknik analitik |
| **KVKK Compliance Shield** | `dsar`, `consent`, `ropa`, `breach`, `verbis`, `retention` | Veri koruma uyum modülleri (bkz. Sözlük) |
| **Regülasyon / Regulatory** | `esg`, `fintech-compliance`, `succession` | ESG, fintech, halefiyet uyumu |
| **Sistem / System** | `users`, `sessions`, `audit-log`, `security`, `settings`, `settings/tabs`, `profile`, `help` | Kullanıcı/oturum/güvenlik/ayar |
| **RBAC** | (`AdminRBACPage`, `components/admin/rbac/`) | Rol-tabanlı erişim kontrolü |
| **AI** | `ai` | AI asistan (`OllamaAssistant.tsx`, `PromptTaskBoard.tsx`) |

Admin component alt-klasörleri / subfolders (19): `auth`, `breach`, `clients`, `command-palette`, `consent`, `deals`, `dsar`, `filters`, `layout`, `leads`, `outreach`, `rbac`, `realtime`, `retainer`, `retention`, `ropa`, `skeleton`, `ui`, `verbis`.

### C3 — Backend / API
**Konum / Location:** `server/` (Express 5 + Prisma 7 + PostgreSQL + Redis). **Modüller / modules (20):**
`config`, `controllers`, `routes`, `middleware`, `services`, `db`, `schemas` (Zod doğrulama), `jobs`, `queues`, `workers`, `emails`, `observability` (Sentry + Winston), `lib`, `utils`, `types`, `terminal`, `scripts`, `test`, `test-utils`.
**Sorumluluklar / responsibilities:** JWT auth, booking yönetimi, newsletter gönderimi, lead/CRM API'leri, KVKK uyum kayıtları, arka-plan işleri (jobs/queues/workers).

### C4 — Cross-cutting Altyapı / Cross-cutting Infrastructure
**Konum / Location:** `src/components/` (29 top-level klasör). İşleve göre / by function:
- **i18n:** `public/locales/{en,tr}/*.json` (14 namespace: admin, blog, caseStudies, common, contact, forms, founder, insights, legal, liveChat, newsletter, pricing, services, translation) + `src/i18n/keys/insights.ts`.
- **SEO:** `components/seo/` (`SchemaOrg`, `SeoManager`, `StructuredData` — meta/OG/JSON-LD/hreflang/canonical).
- **Layout:** `components/layout/` (`MainLayout`, `AuthLayout`, `DashboardLayout`, `Navbar`, `Footer`, `MegaMenu`, `MobileBottomNav`, `PageLoadingBar`, `PageWrapper`, `Contact`).
- **Routing guards:** `components/routing/` (LocaleRoute, LocaleRedirect, ProtectedRoute, AdminGuard) + `components/auth/`.
- **State/providers:** `components/providers/` (AppProviders, i18n, Zustand store, TanStack Query).
- **Analytics:** `components/analytics/` (GA, Sentry, Web Vitals, RUM, personalization) + PostHog.
- **PWA:** `components/pwa/` (manifest, service worker, install prompt).
- **Integrations:** `components/integrations/` (Calendly, EmailJS, Stripe, WhatsApp, live chat, Keystatic CMS).
- **Diğer / others:** `common`, `ui` (atomik), `forms`, `sections` (landing blokları), `features/` (assessment, booking, case-studies, consulting, interactive, roadmap), `chat`, `social`, `error`, `debug`, `dev`.

### C5 — Custom Hooks (`src/hooks/`, 32)
**Amaç/Purpose:** Yeniden kullanılabilir React mantığı. / Reusable React logic.
Örnek / examples: `useAdminAuth` (admin oturum), `useCan` (RBAC izin kontrolü), `useApi` (HTTP), `useAdminLeads`/`useAdminBookings`/`useAdminEvents` (admin veri), `useABVariant` (A/B test), `useFormAnalytics` (form izleme), `useBodyLock` (modal scroll kilidi), `useAdminShortcuts` (klavye kısayolu).

### C6 — Server Services / İş Mantığı — Business Logic (`server/services/`, 10)
**Amaç/Purpose:** Saf iş kuralları (route'tan ayrı). / Pure business rules, decoupled from routes.
`billing-calculator` (faturalama hesabı), `lead-scoring` (lead puanlama), `lead-pipeline` (satış hattı), `spamFilter` (spam filtre), `viewCounter` (görüntülenme), `notion` (Notion senkron), `breach-deadline` (ihlal süre takibi), `dsar-sla` (DSAR SLA), `insightsSearch` (içerik arama), `contact-ack` (iletişim onayı).

### C7 — Server Middleware (`server/middleware/`, 21)
**Amaç/Purpose:** İstek ara-katmanı — güvenlik, auth, hız sınırı, önbellek. / Request middleware — security, auth, rate-limit, cache.
`auth` + `api-key-auth`, `requirePermission`/`require-role` (RBAC), `rate-limit-tier`/`rateLimiter`/`rateLimitComments` (hız sınırı), `cors`, `cspNonce` (CSP), `idempotency`, `originGuard`, `verify-webhook`, `audit` (denetim), `sentry`, `cache`/`cache-control`, `timeout`, `request-id`, `health-probe`, `security`.

### C8 — Arka-plan İşleri / Background Workers, Jobs & Queues (BullMQ)
**Amaç/Purpose:** Asenkron/zamanlanmış işler. / Async & scheduled work.
- **Workers (`server/workers/`):** `email-worker`, `gdpr-export-worker`, `image-resize-worker`, `cache-warmup-worker`, `cron-worker`, `webhook-delivery-worker`, `audit-archive-worker`.
- **Jobs (`server/jobs/`):** `booking-reminders`, `drip-campaign`, `monthly-retainer-billing`, `indexnow-cron`, `process-outbox`, `flushViewCountJob`.
- **Queues (`server/queues/`):** BullMQ kuyruk + öncelik / queue + priority.

### C9 — Server Lib + Terminal + Storybook
- **`server/lib/`:** `calcom-api` (Cal.com), `calendar`, `circuit-breaker` (devre kesici), `csv-export`, `crypto/`, `api-response`, `audit-cursor`.
- **`server/terminal/`:** web terminal sunucusu (node-pty + xterm) — `/antigravity-terminal`.
- **`.storybook/`:** UI bileşen kataloğu / component catalog (`main.ts`, `preview.ts`).

---

## D. İçerik Taksonomisi — Content Taxonomy

### D1 — Blog (`src/content/blog/`, 49 `.mdx`)
Konu kümeleri / topic clusters (örnek dosyalarla / with sample files):
- **AI / ML:** `ai-tabanli-kpi-tahminlemesi-6-adim`, `ai-yatirim-roi-hesaplama`, `gpt-tabanli-musteri-hizmetleri-roi`, `measuring-ai-investment-roi`, `lean-ai-operational-excellence`, `yapay-zeka-yonetim-devrimi`, `yapay-zeka-ile-is-sureclerini-optimize-etme`, `uretim-hattinda-mlops-ilk-90-gun`.
- **KVKK / GDPR / Veri / Data:** `gdpr-kvkk-farklari`, `kvkk-uyum-sureci-adim-adim`, `veri-yonetisimi-kvkk-gdpr-uyum`, `veri-odakli-karar-verme`.
- **M&A:** `ma-90-gunluk-kural`, `ma-degerleme-due-diligence-rehberi`, `sinir-otesi-ma-degerleme-tuzaklari`.
- **ESG / Sürdürülebilirlik / Sustainability:** `esg-strateji-kurumsal-surdurulebilirlik`, `csrd-uyumunda-2026-hareket-plani`, `karbon-muhasebesi-scope-1-2-3-ilk-adimlar`, `net-zero-eylem-plani`.
- **Aile Şirketi / Family Business:** `aile-anayasasi-5-maddelik-cekirdek`, `aile-sirketleri-kurumsallasma-yonetisim`, `aile-sirketleri-stratejik-gecis`, `nesil-gecisinde-3-yillik-sermaye-devir-stratejisi`.
- **Dijital Dönüşüm / Digital Transformation:** `dijital-donusum-kpi-ornekleri`, `dijital-donusum-stratejisi-nasil-olusturulur`, `stratejik-dijital-donusum-2026`.
- **Operasyon / Operations:** `operasyonel-verimlilik-nasil-arttirilir`, `surecler-nasil-standardize-edilir`, `tedarik-zinciri-optimizasyonu-lean-six-sigma`, `turk-kobi-lean-six-sigma`, `proje-yonetimi-best-practices`.
- **Strateji / Strategy:** `stratejik-planlama-rehberi`, `stratejik-danismanlik-hizmetleri-secim-kilavuzu`, `vizyon-strateji-sonuc-trinity`, `premium-consulting-komoditelesemez`, `boardroom-agility-uncertainty`, `makroekonomik-risk-yonetimi-2026`.
- **İK & Değişim / HR & Change:** `insan-kaynaklari-stratejisi-talent-management`, `organizasyonel-degisim-yonetimi`, `kurumsal-kultur-donusumu`, `kriz-yonetimi-iletisim-cercevesi`.
- **Uluslararası / International:** `global-pazarlara-acilma`, `uluslararasi-pazar-giris-stratejisi-turquality`.
- **Endüstriyel İlişkiler / Industrial Relations:** `endustriyel-iliskiler-toplu-sozlesme-stratejisi`, `is-uyusmazliklari-arabuluculuk-stratejisi`.
- **Diğer / Other:** `akilli-sehirler-kamu-politikasi-dijital-yonetim`, `noropazarlama-tuketici-davranisi-stratejisi`, `danismanlik-ucretleri-nasil-belirlenir`, `kpi-belirleme-ve-olcme-yontemleri`.

### D2 — Case Studies (`src/content/case-studies/`)
Mevcut / present: **`atlas-freight`** (1 vaka). Route'lar: `/case-studies/:slug`, TR `/calismalar`.

### D3 — Insights Domain Taksonomisi / Domain Taxonomy
**Kaynak / Source:** `src/i18n/keys/insights.ts` + `insights.en.ts`, runtime `public/locales/{tr,en}/insights.json`.
Yapı / structure: `domain` → `subDomain` (kategori navigasyonu), ek eksenler / extra axes: `tag`, `series` (çok parçalı / multi-part), `author`, `archive` (yıl/ay / year-month), `search`.

---

## G. Diller & Teknolojiler — Languages & Technologies

**TR:** Proje hangi dillerle yazılmış ve hangi kütüphane/araçlar kullanılmış — amaca göre kategorize. Tümü `package.json` ve gerçek dosya taramasıyla doğrulandı. **EN:** What languages the project is written in and which libraries/tools are used — categorized by purpose. All verified against `package.json` and a real file scan.

### G1 — Diller / Languages
| Dil / Language | Sayım / Count | Kullanım / Usage |
|----------------|---------------|------------------|
| **TypeScript** `~5.8.2` | 1062 dosya (506 `.ts` + 556 `.tsx`) | Ana dil — frontend + backend + scriptler. Strict mode. |
| **TSX / JSX** | 556 | React bileşenleri / React components. |
| **MDX** | 49 | Blog içeriği (Markdown + JSX) / blog content. |
| **CSS** | 4 | Tailwind giriş + global stiller / Tailwind entry + globals. |
| **MJML** | 3 | E-posta şablonları / email templates. |
| **Prisma schema** | 1 (`schema.prisma`) | Veritabanı modeli, provider = `postgresql`. |
| **SQL** | — | PostgreSQL migrations (`prisma/migrations/`). |
| **Bash / Shell** | 41 `.sh` (+ root, `.command`) | Dev/deploy/security/orchestration scriptleri. |
| **Python** | 4 `.py` | `e2e_health.py`, `e2e_coverage_report.py`, `seo_audit.py`. |
| **JS / MJS** | birkaç / few | Build + zx scriptleri / build & zx scripts. |
| **JSON / YAML** | çok / many | Config + i18n çevirileri / config & i18n translations. |
| **`.plist`** | 1 | macOS LaunchAgent (otomasyon / automation). |

> **Not / Note:** `package.json` içinde `engines`/`packageManager` tanımlı değil. / `engines`/`packageManager` are not declared in `package.json`.

### G2 — Frontend Framework & Routing
React `19.2` (`react`, `react-dom`, `react-is`) · React Router `7.11` (`react-router-dom`) · `react-error-boundary`. **Amaç/Purpose:** SPA render + client-side routing + hata sınırları.

### G3 — State / Data / Form
Zustand `5` (global state) · TanStack Query `5` (`@tanstack/react-query`) + Table `8` + Virtual `3` (server-state, tablo, sanal liste) · react-hook-form `7` + `@hookform/resolvers` (form) · **Zod `4`** (şema doğrulama / schema validation) · axios (HTTP).

### G4 — UI / Stil / İkon — UI / Styling / Icons
Tailwind CSS `4` (+ `@tailwindcss/postcss`, `@tailwindcss/typography`, autoprefixer, postcss) · Radix UI (`@radix-ui/react-slider`) · lucide-react (ikon) · class-variance-authority + clsx + tailwind-merge (variant/class yönetimi) · cmdk (command palette) · sonner (toast bildirim) · focus-trap-react (a11y) · `@fontsource/inter` + `@fontsource/playfair-display` (fontlar) · `@dnd-kit/*` (sürükle-bırak / drag-and-drop).

### G5 — Animasyon / Görselleştirme — Animation / Visualization
motion `12` (Framer Motion) · gsap (timeline animasyon) · lenis (smooth scroll) · recharts `3` (grafik / charts) · mermaid `11` (diagram) · katex (matematik render) · shiki (kod syntax highlight) · yet-another-react-lightbox (görsel galeri).

### G6 — İçerik / Markdown / CMS — Content / Markdown / CMS
MDX (`@mdx-js/react`, `@mdx-js/rollup`) · react-markdown `10` · marked `17` · **Keystatic CMS** `@keystatic/core` (git-tabanlı içerik yönetimi / git-based content management).

### G7 — i18n / Çoklu Dil — Internationalization
i18next `25` + react-i18next `16` + i18next-browser-languagedetector + i18next-http-backend + i18next-icu. **Amaç/Purpose:** EN/TR çeviri, tarayıcı dil tespiti, ICU çoğul/format.

### G8 — Backend / DB / Cache
Express `5` · **Prisma `7`** (`@prisma/client`, `@prisma/adapter-pg`) · pg `8` (PostgreSQL sürücü) · ioredis `5` (Redis) · jsonwebtoken (JWT auth) · express-validator · cors · dotenv · node-cron (zamanlanmış iş) · ws `8` (WebSocket / realtime) · node-pty + `@xterm/xterm` + xterm (web terminal). **Seed:** `prisma/` altında 7 seed scripti + migrations + `dev.db`.

### G9 — E-posta / Bildirim — Email / Notifications
Resend `6` (transactional e-posta) · EmailJS (`@emailjs/browser`, client-side) · MJML şablonları (`server/emails`) · ics (takvim daveti / calendar invite).

### G10 — Observability / Analytics
Sentry (`@sentry/node`, `@sentry/react`, `@sentry/profiling-node`, `@sentry/vite-plugin` — hata izleme) · Winston `3` + Logtail (`@logtail/node`, `@logtail/winston` — loglama) · PostHog (`posthog-js` — ürün analitiği) · web-vitals (performans metrik) · GrowthBook (`@growthbook/growthbook-react` — feature flag / A/B).

### G11 — Güvenlik — Security
speakeasy + qrcode (2FA / TOTP) · jsonwebtoken (token auth) · express-validator (girdi doğrulama) · `scripts/security-scan.sh` (tarama). **Admin:** `TwoFactorSettings.tsx`, RBAC.

### G12 — AI
openai SDK `6` · Ollama (lokal LLM — `components/admin/OllamaAssistant.tsx`, `scripts/ollama-launch.sh`) · `components/admin/PromptTaskBoard.tsx`. **Admin route:** `/admin/ai`.

### G13 — Build / Dev Tooling
**Vite `6`** (`@vitejs/plugin-react`) · esbuild · tsx (TS runner) · concurrently · vite-plugin-pwa + vite-plugin-compression + vite-plugin-image-optimizer · rollup-plugin-visualizer (bundle analiz) · sharp + svgo (görsel optim) · size-limit + `@size-limit/file` (bundle bütçe) · `@sparticuz/chromium` (headless render).

### G14 — Test / Kalite — Test / Quality
**Vitest `4`** + `@vitest/coverage-istanbul` (unit + coverage) · Testing Library (`react`, `dom`, `jest-dom`, `user-event`) · **Playwright `1.59`** + `@axe-core/playwright` (E2E + a11y) · supertest (API test) · jsdom · Lighthouse + `@lhci/cli` (performans CI) · **ESLint `9`** + typescript-eslint + jsx-a11y + react-hooks + react-refresh · **Prettier** · Husky + lefthook + lint-staged (git hook) · TypeDoc (API doküman).

### G15 — CLI / Script Tooling
zx · execa · commander (CLI arg) · inquirer (interaktif prompt) · chalk · ora (spinner) · ssh2 (uzak bağlantı). **Amaç/Purpose:** dev orchestration, deploy, maintenance scriptleri (`scripts/`).

---

## H. Veri Modeli — Data Model (Prisma, 60 model + 32 enum)

**TR:** Veritabanı şeması — sistemin sakladığı tüm varlıklar (tablolar). **EN:** Database schema — every entity (table) the system stores.
**Kaynak / Source:** `prisma/schema.prisma` (provider `postgresql`). Domaine göre gruplanmış / grouped by domain:

| Domain | Modeller / Models |
|--------|-------------------|
| **Auth / Kimlik** | `User`, `Session`, `RefreshToken`, `EmailVerification`, `ApiKey` |
| **İçerik & Insights / Content** | `BlogPost`, `InsightCategory`, `Author`, `GuestAuthor`, `Series`, `Tag`, `Comment`, `DraftRevision`, `EditorComment`, `ViewLog` |
| **CRM & Gelir / Revenue** | `Lead`, `LeadActivity`, `Deal`, `Retainer`, `Milestone`, `Invoice`, `OutreachWave`, `OutreachProspect`, `Client`, `CRMReport`, `EmailSequence` |
| **KVKK Uyum / Compliance** | `DSARRequest`, `DSARAuditEntry`, `BreachIncident`, `ROPAProcess`, `ConsentRecord`, `RetentionPolicy`, `IndependenceCheck` |
| **Regülasyon / Regulatory** | `ESGPillar`, `ESGDatapoint`, `ESGAssessment`, `FintechComplianceItem`, `Regulator`, `SuccessionRoadmap`, `SuccessionMilestone`, `SuccessionKPI` |
| **Booking** | `Booking`, `BookingFeedback` |
| **Webhook / Entegrasyon** | `WebhookEvent`, `WebhookSubscription`, `WebhookDelivery`, `IntegrationOutbox` |
| **Analytics** | `Analytics`, `Interaction` |
| **RBAC** | `Permission`, `RolePermission`, `RoleChangeAudit`, `ViewAsSession` |
| **Newsletter** | `NewsletterSubscriber` |
| **Founder** | `FounderLetter` |
| **Sistem / İçerik altyapı** | `Service`, `SiteConfig`, `Image`, `AuditLog`, `ArchivedAuditLog`, `ContactSubmission`, `DataResidencyTag` |

**Enum'lar (32) / Enums:** `UserRole`, `AuditResult`, `BookingStatus`, `InteractionType`, `DealType`, `DealStage`, `Currency`, `RetainerStatus`, `MilestoneStatus`, `InvoiceStatus`, `WaveStatus`, `ProspectStatus`, `DSARType`, `DSARStatus`, `BreachStatus`, `ROPAStatus`, `LetterStatus`, `SuccessionStatus`, `SuccessionMilestoneStatus`, `ESGStatus`, `ComplianceItemStatus`, `ResidencyLocation`, `Domain`, `PostStatus`, `Language`, `ArticleType`, `TagAxis`, `SeriesStatus`, `CommentStatus`, `CategoryStatus`, vb.

---

## I. API Endpoint Envanteri — API Routes (`server/routes/`, 69 route)

**TR:** Backend'in sunduğu tüm HTTP uç noktaları. **EN:** All HTTP endpoints the backend exposes. **Hedef/Target:** frontend + entegrasyonlar.

### I.1 — Public / Ziyaretçi API
`auth`, `bookings`, `contact`, `discovery`, `newsletter` + `newsletter-lifecycle`, `quick-check`, `pricing-calc`, `public-services`, `public-insights-posts`, `public-insights-search`, `search`, `comments`, `feedback`, `manage` (booking yönetimi), `gdpr`, `calendly`, `geo`, `ai`, `insights-seo`, `health` + `health-k8s`, `metrics`, `heartbeat`, `stream`, `totp`, `sessions`, `upload` + `uploads-get`, `webhooks`.

### I.2 — Admin API (`admin-*`, 32)
**İçerik / Content:** `admin-content`, `admin-collections`, `admin-media`, `admin-campaigns`, `admin-comments`, `admin-insights` (+`-categories`, `-dashboard`).
**CRM / Satış:** `admin-leads` (+`-notes`), `admin-deals`, `admin-retainers`, `admin-outreach`, `admin-revenue`*.
**KVKK / Uyum:** `admin-dsar`, `admin-breach`, `admin-ropa`, `admin-verbis`, `admin-retention`, `admin-consent`/`admin-kvkk-consent`, `admin-independence`.
**Regülasyon:** `admin-esg`, `admin-fintech-compliance`, `admin-succession`.
**Sistem:** `admin-dashboard`, `admin-analytics-stream`, `admin-rbac`, `admin-security`, `admin-queues`, `admin-integrations`, `admin-webhooks`, `admin-revalidate`, `admin-events`.
*(test dosyalarıyla doğrulanmış route'lar; bazı route'lar yalnız test üzerinden görünür / verified via test files.)*

---

## J. Statik Varlıklar, SEO & PWA — Static Assets, SEO & PWA (`public/`)

**TR:** Sunucusuz servis edilen dosyalar — arama motoru, sosyal paylaşım, PWA. **EN:** Statically served files — search engine, social sharing, PWA.

| Kategori / Category | Dosyalar / Files |
|---------------------|------------------|
| **SEO — Sitemap (5)** | `sitemap.xml`, `sitemap-index.xml`, `sitemap-en.xml`, `sitemap-tr.xml`, `sitemap-insights-1.xml` |
| **SEO — RSS (6)** | `rss.xml`, `insights-rss.xml`, `insights-esg-rss.xml`, `insights-fintech-rss.xml`, `insights-m-a-rss.xml`, `insights-aile-sirketi-rss.xml` |
| **SEO — Diğer** | `robots.txt`, `ads.txt`, `humans.txt`, `geo-data.json`, `health.json` |
| **PWA** | `site.webmanifest`, `sw.js` (service worker), `offline.html`, `pwa-192x192.png`, `pwa-512x512.png` |
| **Social / OG** | `og-default.jpg`, `og-image.jpg`, `og-image.svg`, `twitter-card.svg`, `/og/` |
| **İkon / Favicon** | `favicon.ico/.png`, `favicon-16/32x32.png`, `apple-touch-icon.png` |
| **Görsel & Asset** | `fonts/`, `brand/`, `clients/`, `case-studies/`, `tools/`, `founder.{jpg,webp,avif,svg}` (+@2x), `bg-grid.svg` |

> **11 XML dosyası** (5 sitemap + 6 RSS) `scripts/generate-sitemap.ts` ve `generate-rss.ts` ile üretilir. / 11 XML files generated by the scripts.

---

## K. Yapılandırma & Ortam — Configuration & Environment (root, ~20 config + ~15 `.env`)

**TR:** Projeyi derleyen/çalıştıran ayar dosyaları. **EN:** Settings files that build/run the project.

| Grup / Group | Dosyalar / Files |
|--------------|------------------|
| **Build** | `vite.config.ts`, `postcss.config.js`, `eslint.config.js`, `tsconfig.json`, `tsconfig.server.json` |
| **Test** | `playwright.config.ts`, `playwright.bilingual.config.ts`, `playwright.smoke.config.ts`, `vitest.config.ts`, `vitest.config.server.ts`, `vitest.server.config.ts`, `lighthouserc.json` |
| **CMS / DB** | `keystatic.config.ts`, `prisma.config.ts` |
| **Deploy** | `vercel.json` (Vercel), `ecosystem.config.cjs` (PM2) |
| **Kalite / Quality** | `commitlint.config.cjs` (commit lint), `knip.json` (kullanılmayan kod), `typedoc.json` (API doc) |
| **Ortam / Env** | `.env`, `.env.local`, `.env.production` + varyantlar (`.vercel`, `.minimal-example`, `.deploy.example`, vb. ~15) |

---

## L. CI/CD & Deployment — DevOps (`.github/workflows/`, 19)

**TR:** Otomatik test/güvenlik/dağıtım hatları (her push'ta çalışır). **EN:** Automated test/security/deploy pipelines (run on each push).

| Grup / Group | Workflow'lar |
|--------------|--------------|
| **Kalite / Quality** | `ci.yml`, `quality-gate.yml`, `server-tests.yml` |
| **Güvenlik / Security** | `security.yml`, `security-zap.yml` (OWASP ZAP), `gitleaks.yml` (sır taraması / secret scan) |
| **Performans & A11y** | `lighthouse.yml`, `lighthouse-ci.yml`, `a11y-ci.yml`, `visual-regression.yml` |
| **Test / E2E** | `e2e-smoke.yml`, `claude-smoke.yml` |
| **DB** | `db-migration-gate.yml`, `schema-validator.yml` |
| **Release / Build** | `release.yml`, `docker.yml` |
| **Monitoring** | `heartbeat.yml`, `betterstack-sync.yml`, `indexnow-on-deploy.yml` |

**Deploy hedefleri / targets:** Vercel (`vercel.json`), PM2 (`ecosystem.config.cjs`), Docker (`docker.yml` + `docker-entrypoint.sh`), blue-green (`scripts/blue-green-switch.sh`), tunnel (`scripts/start-tunnel.sh`).

---

## M. Otomasyon Scriptleri — Automation Scripts (`scripts/`, ~150)

**TR:** Geliştirme/dağıtım/bakım otomasyonu (61 ts + 41 sh + 32 mjs + 8 .command + 4 py + 5 js). **EN:** Dev/deploy/maintenance automation. Amaca göre / by purpose:

| Amaç / Purpose | Örnek scriptler / example scripts |
|----------------|-----------------------------------|
| **SEO / Audit** | `audit-{broken-links,canonical,h1-keywords,img-alt,internal-links,jsonld,spacing}`, `generate-{sitemap,rss,blog-index}`, `indexnow-{push,submit}`, `indexing-api-push`, `seo-watch`, `seo-weekly-diff`, `seo_audit.py`, `backlink-monitor` |
| **Media / Asset** | `optimize-images`, `font-subset`, `watch-media`/`watch-media` |
| **Deploy** | `deploy`, `smart-deploy`, `deploy-{wp,microweber,browser}`, `build-{wp-theme,static-only}`, `blue-green-switch`, `prepare-microweber` |
| **DB** | `backup-db`, `restore-db`, `seed`, `seed-real-data` (+ `prisma/seed-*`) |
| **Güvenlik / Security** | `security-scan`, `sec-watch`, `preflight-env`, `setup-env` |
| **Bakım / Maintenance** | `auto-maintenance`, `clean-docker`, `deep-clean`, `cleanup-storage`, `analyze-storage`, `optimize-mac`, `zero-waste`, `nuke-waste` |
| **CRM / İş** | `crm-watch`, `funnel-report`, `broken-link-outreach` |
| **E2E / Health** | `start-e2e-servers`, `e2e_health.py`, `e2e_coverage_report.py`, `service-health`, `launch-readiness` |
| **Orchestration / AI** | `orchestrator`, `dispatcher`, `run_tools`, `ollama-launch` |
| **i18n** | `i18n-audit`, `i18n-suggest` |

---

## N. Proje Dokümantasyonu — Project Documentation (`docs/`, 13 alt-klasör)

**TR:** Geliştirici/operasyon dokümantasyonu. **EN:** Developer/operations documentation.
`adr` (mimari kararlar / architecture decision records), `architecture`, `brand` (marka kılavuzu), `db` (veritabanı), `deployment`, `guides` (rehberler), `operations`, `phase-archive` (geçmiş faz arşivi), `prompts`, `reference`, `runbooks` (operasyon prosedürleri), `security`, `team`. + kök dokümanlar / root docs: `README.md`, `WORKFLOW.md`, `PERFORMANCE_REPORT.md`, `FC_V37_HANDOFF.md`, **bu doküman / this doc**.

---

## E. Sözlük — Glossary (sıfır-bilgi okuyucu için / for the zero-knowledge reader)

| Terim / Term | Açıklama / Explanation |
|--------------|------------------------|
| **KVKK** | Kişisel Verilerin Korunması Kanunu — Türkiye'nin veri koruma yasası. / Turkey's personal-data protection law. |
| **GDPR** | General Data Protection Regulation — AB veri koruma tüzüğü. / EU data protection regulation. |
| **DSAR** | Data Subject Access Request — bir kişinin kendi verilerine erişim/silme talebi. / A person's request to access/delete their data. |
| **ROPA** | Records of Processing Activities — veri işleme faaliyetleri kaydı (KVKK/GDPR zorunluluğu). / Mandatory register of data-processing activities. |
| **VERBIS** | Türkiye veri sorumluları sicili; burada vendor/üçüncü-taraf risk değerlendirme modülü. / Turkish data-controllers registry; here a vendor/third-party risk module. |
| **Consent Ledger** | Kullanıcı izinlerinin (onay) zaman damgalı kaydı. / Time-stamped record of user consents. |
| **Breach notification** | Veri ihlali bildirim kaydı. / Data-breach incident log. |
| **Retention** | Veri saklama süresi politikası. / Data-retention policy. |
| **RBAC** | Role-Based Access Control — kim neye erişebilir kuralları. / Who-can-access-what rules. |
| **Retainer** | Süreklilik arz eden danışmanlık sözleşmesi (aylık ödeme). / Ongoing retainer consulting contract. |
| **Lead / Deal / Outreach** | Müşteri adayı / satış fırsatı / proaktif erişim kampanyası. / Prospect / sales opportunity / proactive outreach. |
| **ESG** | Environmental, Social, Governance — kurumsal sürdürülebilirlik. / Corporate sustainability framework. |
| **CSRD** | Corporate Sustainability Reporting Directive — AB sürdürülebilirlik raporlama. / EU sustainability reporting directive. |
| **M&A** | Mergers & Acquisitions — şirket birleşme/satın almaları. / Mergers and acquisitions. |
| **Due Diligence** | Satın alma öncesi detaylı inceleme. / Pre-acquisition deep review. |
| **Perspektifler / Insights** | Sitenin uzun-form düşünce-liderliği içerik merkezi. / The site's long-form thought-leadership content hub. |
| **Sektör / Industry microsite** | Bir dikey sektöre özel açılış sayfası. / Vertical-specific landing page. |
| **Mega-menu** | Üst menüde açılan çok sütunlu büyük açılır menü. / Large multi-column dropdown in the top nav. |
| **i18n / locale** | Çoklu dil altyapısı (EN/TR) / URL dil öneki. / Internationalization (EN/TR) / URL language prefix. |
| **Keystatic CMS** | İçerik yönetim sistemi (git-tabanlı). / Git-based content management system. |
| **Lead magnet** | Ücretsiz araç/quiz karşılığı iletişim bilgisi toplama. / Free tool/quiz that captures contact info. |

---

## F. Kapsam Matrisi + Makine-Okunur İndeks — Coverage Matrix + Machine-Readable Index

### F.1 — Kapsam Matrisi / Coverage Matrix (gerçek dosya sayımıyla doğrulanmış / verified against real file counts)

| Kategori / Category | Eksen / Axis | Sayım / Count | Kaynak / Source |
|---------------------|--------------|---------------|-----------------|
| Public pages | A, B | 65 | `src/pages/*.tsx` (tests hariç) |
| Admin pages | C2 | 49 | `src/pages/admin/*.tsx` (tests hariç) |
| Top nav items | A.1 | 7 | `common.ts` NAV_ITEMS |
| Industry microsites | A.3, B3 | 5 | `pages/Sektorler*Page.tsx` |
| Component folders | C4 | 29 | `src/components/*/` |
| Admin component folders | C2 | 19 | `src/components/admin/*/` |
| Admin function groups | C2 | 12 | bu doküman / this doc |
| KVKK compliance modules | C2 | 6 | dsar/consent/ropa/breach/verbis/retention |
| Blog articles | D1 | 49 | `src/content/blog/*.mdx` |
| Case studies | D2 | 1 | `src/content/case-studies/` |
| Insight content axes | D3 | 8 | domain/subdomain/tag/series/author/archive/search/article |
| i18n namespaces | C4 | 14 × 2 dil | `public/locales/{en,tr}/` |
| Server modules | C3 | 20 | `server/*/` |
| Languages | G1 | 12 | `package.json` + `find` taraması |
| TypeScript files | G1 | 1062 (506 ts + 556 tsx) | `find src server` |
| Shell scripts | G1 | 41 `.sh` | `scripts/` + root |
| Python scripts | G1 | 4 `.py` | `scripts/` |
| Tech sub-categories | G | 15 (G1–G15) | bu doküman / this doc |
| Prisma models | H | 60 | `prisma/schema.prisma` |
| Prisma enums | H | 32 | `prisma/schema.prisma` |
| API routes | I | 69 (32 admin) | `server/routes/*.ts` |
| Public static/SEO/PWA | J | 11 XML + manifest/sw/og/favicon | `public/` |
| Root config files | K | ~20 + ~15 `.env` | proje kökü / root |
| CI/CD workflows | L | 19 | `.github/workflows/` |
| Automation scripts | M | ~150 | `scripts/` |
| Docs subfolders | N | 13 | `docs/*/` |
| Custom hooks | C5 | 32 | `src/hooks/` |
| Server services | C6 | 10 | `server/services/` |
| Server middleware | C7 | 21 | `server/middleware/` |
| Glossary terms | E | 21 | bu doküman / this doc |

### F.2 — Makine-Okunur İndeks / Machine-Readable Index
**TR:** Aşağıdaki JSON, bu dokümanı okuyacak sonraki AI'nin parse edebilmesi için sitenin yapılandırılmış haritasıdır. **EN:** The JSON below is the structured site map so the next AI parsing this document can consume it programmatically.

```json
{
  "site": "ecypro.com",
  "brand": "eCyPro Premium Consulting",
  "ecosystem": "eCyverse",
  "source_path": "/Users/emrecnyngmail.com/Desktop/ecypro",
  "axes": {
    "A_navigation": {
      "top_nav": ["home", "services", "sektorler", "insights", "pricing", "about", "contact"],
      "mega_menus": ["services", "sektorler", "insights"],
      "footer_sections": ["company", "services", "legal", "newsletter"],
      "languages": ["en", "tr"]
    },
    "B_business_functions": {
      "B1_marketing_lead_capture": ["/", "/services", "/pricing", "/pricing-calculator", "/quick-check", "/maturity-assessment", "/discovery", "/discovery-call", "/thank-you", "/araclar/denetim-hazirlik-skoru"],
      "B2_content": ["/blog", "/insights", "/case-studies", "/calismalar", "/pillar/:slug", "/industry-reports/:slug", "/webinars/:slug", "/annual-report/2025"],
      "B3_industry_microsites": ["/sektorler", "/sektorler/imalat-sanayi", "/sektorler/finansal-hizmetler", "/sektorler/ilac-saglik", "/sektorler/perakende-e-ticaret", "/sektorler/teknoloji-saas", "/industries"],
      "B4_company_trust": ["/about", "/team", "/methodology", "/partners", "/founder", "/guvence", "/press", "/speaking", "/events", "/locations", "/careers", "/faq", "/contact"],
      "B5_legal": ["/privacy", "/privacy/data-rights", "/terms", "/cookies"],
      "B6_account_transactional": ["/login", "/register", "/forgot-password", "/verify-email", "/booking/manage", "/feedback/:bookingId", "/newsletter/confirmed", "/app/*"],
      "B7_system_error": ["/status", "/404", "/500", "/locale-detect", "/antigravity-terminal"]
    },
    "C_technical": {
      "frontend_router": "src/App.tsx",
      "locale_variants": "/:locale/* (en|tr)",
      "turkish_aliases": ["/hakkimizda", "/ekip", "/hizmetler", "/perspektifler", "/fiyatlandirma", "/iletisim", "/gizlilik", "/kosullar", "/cerezler", "/sss", "/metodoloji", "/is-ortaklari", "/basin", "/konusmalar", "/etkinlikler", "/lokasyonlar", "/kariyer", "/hizli-kontrol", "/fiyatlandirma-hesabi", "/calismalar", "/guvence"],
      "admin_root": "/admin/*",
      "admin_function_groups": {
        "overview": ["overview", "dashboard"],
        "content": ["blog", "services", "pages", "collections/:type", "media"],
        "insights_mgmt": ["insights", "insights/categories", "insights/posts", "insights/metadata"],
        "crm_sales": ["leads", "contacts", "crm", "deals", "retainers", "outreach"],
        "booking": ["bookings"],
        "newsletter": ["newsletter", "newsletter/campaigns"],
        "analytics": ["analytics", "dev-analytics"],
        "kvkk_compliance_shield": ["dsar", "consent", "ropa", "breach", "verbis", "retention"],
        "regulatory": ["esg", "fintech-compliance", "succession"],
        "system": ["users", "sessions", "audit-log", "security", "settings", "profile", "help"],
        "rbac": ["rbac"],
        "ai": ["ai"]
      },
      "backend_dir": "server/",
      "backend_modules": ["config", "controllers", "routes", "middleware", "services", "db", "schemas", "jobs", "queues", "workers", "emails", "observability", "lib", "utils", "types", "terminal", "scripts"],
      "cross_cutting": ["i18n", "seo", "layout", "routing", "providers", "analytics", "pwa", "integrations", "auth", "forms", "ui", "sections", "features"]
    },
    "D_content_taxonomy": {
      "blog_count": 49,
      "blog_clusters": ["AI/ML", "KVKK/GDPR", "M&A", "ESG", "Family Business", "Digital Transformation", "Operations", "Strategy", "HR/Change", "International", "Industrial Relations"],
      "case_studies": ["atlas-freight"],
      "insight_axes": ["domain", "subDomain", "tag", "series", "author", "archive", "search", "article"]
    },
    "G_languages_tech": {
      "languages": {
        "typescript": {"version": "~5.8.2", "files": 1062, "note": "506 ts + 556 tsx, primary"},
        "mdx": {"files": 49, "use": "blog content"},
        "css": {"files": 4, "use": "tailwind + globals"},
        "mjml": {"files": 3, "use": "email templates"},
        "prisma": {"files": 1, "provider": "postgresql"},
        "sql": {"use": "postgresql migrations"},
        "bash": {"files": 41, "use": "dev/deploy/security scripts"},
        "python": {"files": 4, "use": "e2e health, coverage, seo audit"},
        "js_mjs": {"use": "build & zx scripts"},
        "json_yaml": {"use": "config + i18n"},
        "plist": {"files": 1, "use": "macos launchagent"}
      },
      "frontend": ["react@19.2", "react-router-dom@7.11", "react-error-boundary"],
      "state_data_form": ["zustand@5", "@tanstack/react-query@5", "@tanstack/react-table", "@tanstack/react-virtual", "react-hook-form@7", "zod@4", "axios"],
      "ui_styling": ["tailwindcss@4", "@radix-ui/react-slider", "lucide-react", "class-variance-authority", "clsx", "tailwind-merge", "cmdk", "sonner", "focus-trap-react", "@dnd-kit"],
      "animation_viz": ["motion@12", "gsap", "lenis", "recharts@3", "mermaid@11", "katex", "shiki", "yet-another-react-lightbox"],
      "content_cms": ["@mdx-js/react", "@mdx-js/rollup", "react-markdown@10", "marked@17", "@keystatic/core"],
      "i18n": ["i18next@25", "react-i18next@16", "i18next-browser-languagedetector", "i18next-http-backend", "i18next-icu"],
      "backend_db": ["express@5", "prisma@7", "@prisma/adapter-pg", "pg@8", "ioredis@5", "jsonwebtoken", "express-validator", "cors", "node-cron", "ws@8", "node-pty", "@xterm/xterm"],
      "email_notify": ["resend@6", "@emailjs/browser", "mjml", "ics"],
      "observability_analytics": ["@sentry/node", "@sentry/react", "@sentry/profiling-node", "winston@3", "@logtail/winston", "posthog-js", "web-vitals", "@growthbook/growthbook-react"],
      "security": ["speakeasy", "qrcode", "jsonwebtoken", "express-validator"],
      "ai": ["openai@6", "ollama (local)"],
      "build_tooling": ["vite@6", "@vitejs/plugin-react", "esbuild", "tsx", "concurrently", "vite-plugin-pwa", "vite-plugin-compression", "vite-plugin-image-optimizer", "rollup-plugin-visualizer", "sharp", "svgo", "size-limit", "@sparticuz/chromium"],
      "test_quality": ["vitest@4", "@vitest/coverage-istanbul", "@testing-library/react", "@playwright/test@1.59", "@axe-core/playwright", "supertest", "jsdom", "lighthouse", "@lhci/cli", "eslint@9", "typescript-eslint", "prettier", "husky", "lefthook", "lint-staged", "typedoc"],
      "cli_script": ["zx", "execa", "commander", "inquirer", "chalk", "ora", "ssh2"]
    },
    "H_data_model": {
      "source": "prisma/schema.prisma",
      "provider": "postgresql",
      "model_count": 60,
      "enum_count": 32,
      "domains": {
        "auth": ["User", "Session", "RefreshToken", "EmailVerification", "ApiKey"],
        "content_insights": ["BlogPost", "InsightCategory", "Author", "GuestAuthor", "Series", "Tag", "Comment", "DraftRevision", "EditorComment", "ViewLog"],
        "crm_revenue": ["Lead", "LeadActivity", "Deal", "Retainer", "Milestone", "Invoice", "OutreachWave", "OutreachProspect", "Client", "CRMReport", "EmailSequence"],
        "kvkk_compliance": ["DSARRequest", "DSARAuditEntry", "BreachIncident", "ROPAProcess", "ConsentRecord", "RetentionPolicy", "IndependenceCheck"],
        "regulatory": ["ESGPillar", "ESGDatapoint", "ESGAssessment", "FintechComplianceItem", "Regulator", "SuccessionRoadmap", "SuccessionMilestone", "SuccessionKPI"],
        "booking": ["Booking", "BookingFeedback"],
        "webhook": ["WebhookEvent", "WebhookSubscription", "WebhookDelivery", "IntegrationOutbox"],
        "analytics": ["Analytics", "Interaction"],
        "rbac": ["Permission", "RolePermission", "RoleChangeAudit", "ViewAsSession"],
        "newsletter": ["NewsletterSubscriber"],
        "founder": ["FounderLetter"],
        "system": ["Service", "SiteConfig", "Image", "AuditLog", "ArchivedAuditLog", "ContactSubmission", "DataResidencyTag"]
      }
    },
    "I_api_routes": {
      "source": "server/routes/",
      "route_count": 69,
      "admin_route_count": 32,
      "public": ["auth", "bookings", "contact", "discovery", "newsletter", "quick-check", "pricing-calc", "public-services", "public-insights-posts", "public-insights-search", "search", "comments", "feedback", "manage", "gdpr", "calendly", "geo", "ai", "insights-seo", "health", "metrics", "heartbeat", "stream", "totp", "sessions", "upload", "webhooks"],
      "admin_prefix": "admin-*"
    },
    "J_static_seo_pwa": {
      "source": "public/",
      "sitemaps": ["sitemap.xml", "sitemap-index.xml", "sitemap-en.xml", "sitemap-tr.xml", "sitemap-insights-1.xml"],
      "rss": ["rss.xml", "insights-rss.xml", "insights-esg-rss.xml", "insights-fintech-rss.xml", "insights-m-a-rss.xml", "insights-aile-sirketi-rss.xml"],
      "seo_other": ["robots.txt", "ads.txt", "humans.txt", "geo-data.json", "health.json"],
      "pwa": ["site.webmanifest", "sw.js", "offline.html", "pwa-192x192.png", "pwa-512x512.png"],
      "social_og": ["og-default.jpg", "og-image.jpg", "twitter-card.svg"]
    },
    "K_config_env": {
      "build": ["vite.config.ts", "postcss.config.js", "eslint.config.js", "tsconfig.json", "tsconfig.server.json"],
      "test": ["playwright.config.ts", "playwright.bilingual.config.ts", "playwright.smoke.config.ts", "vitest.config.ts", "vitest.config.server.ts", "vitest.server.config.ts", "lighthouserc.json"],
      "cms_db": ["keystatic.config.ts", "prisma.config.ts"],
      "deploy": ["vercel.json", "ecosystem.config.cjs"],
      "quality": ["commitlint.config.cjs", "knip.json", "typedoc.json"],
      "env_variants": "~15 .env files"
    },
    "L_cicd_deploy": {
      "source": ".github/workflows/",
      "workflow_count": 19,
      "groups": {
        "quality": ["ci", "quality-gate", "server-tests"],
        "security": ["security", "security-zap", "gitleaks"],
        "perf_a11y": ["lighthouse", "lighthouse-ci", "a11y-ci", "visual-regression"],
        "test": ["e2e-smoke", "claude-smoke"],
        "db": ["db-migration-gate", "schema-validator"],
        "release": ["release", "docker"],
        "monitoring": ["heartbeat", "betterstack-sync", "indexnow-on-deploy"]
      },
      "deploy_targets": ["vercel", "pm2", "docker", "blue-green", "tunnel"]
    },
    "M_automation_scripts": {
      "source": "scripts/",
      "approx_count": 150,
      "by_purpose": {
        "seo_audit": ["audit-*", "generate-sitemap", "generate-rss", "indexnow-push", "seo-watch", "seo_audit.py"],
        "media": ["optimize-images", "font-subset", "watch-media"],
        "deploy": ["deploy", "smart-deploy", "deploy-wp", "deploy-microweber", "blue-green-switch", "build-wp-theme"],
        "db": ["backup-db", "restore-db", "seed", "seed-real-data"],
        "security": ["security-scan", "sec-watch", "preflight-env"],
        "maintenance": ["auto-maintenance", "clean-docker", "deep-clean", "optimize-mac", "zero-waste"],
        "crm": ["crm-watch", "funnel-report", "broken-link-outreach"],
        "e2e_health": ["start-e2e-servers", "e2e_health.py", "e2e_coverage_report.py"],
        "orchestration": ["orchestrator", "dispatcher", "run_tools", "ollama-launch"]
      }
    },
    "N_project_docs": {
      "source": "docs/",
      "subfolders": ["adr", "architecture", "brand", "db", "deployment", "guides", "operations", "phase-archive", "prompts", "reference", "runbooks", "security", "team"]
    },
    "C_technical_deep": {
      "custom_hooks": {"source": "src/hooks/", "count": 32},
      "server_services": {"source": "server/services/", "count": 10, "items": ["billing-calculator", "lead-scoring", "lead-pipeline", "spamFilter", "viewCounter", "notion", "breach-deadline", "dsar-sla", "insightsSearch", "contact-ack"]},
      "server_middleware": {"source": "server/middleware/", "count": 21},
      "background": {"workers": ["email", "gdpr-export", "image-resize", "cache-warmup", "cron", "webhook-delivery", "audit-archive"], "jobs": ["booking-reminders", "drip-campaign", "monthly-retainer-billing", "indexnow-cron", "process-outbox"], "queue": "bullmq"},
      "server_lib": ["calcom-api", "calendar", "circuit-breaker", "csv-export", "crypto", "api-response", "audit-cursor"],
      "storybook": ".storybook/"
    }
  },
  "counts": {
    "public_pages": 65, "admin_pages": 49, "component_folders": 29,
    "admin_component_folders": 19, "blog_articles": 49, "case_studies": 1,
    "i18n_namespaces": 14, "server_modules": 20, "top_nav_items": 7,
    "languages": 12, "typescript_files": 1062, "shell_scripts": 41, "python_scripts": 4,
    "prisma_models": 60, "prisma_enums": 32, "api_routes": 69, "cicd_workflows": 19,
    "automation_scripts": 150, "docs_subfolders": 13, "custom_hooks": 32,
    "server_services": 10, "server_middleware": 21, "axes": 13
  }
}
```

---

## Doğrulama Notu / Verification Note
**TR:** Tüm sayımlar ve route'lar `2026-06-08` tarihinde kaynak kod üzerinden (`ls`, `grep`) doğrulanmıştır. Kaynak: `/Users/emrecnyngmail.com/Desktop/ecypro`. Yan kopyalar `~/eCyproDanismanlik` ve `~/ecypro-backend` bu kapsam dışındadır (eski/prototip).
**EN:** All counts and routes were verified against source code (`ls`, `grep`) on `2026-06-08`. Source: `/Users/emrecnyngmail.com/Desktop/ecypro`. Side copies `~/eCyproDanismanlik` and `~/ecypro-backend` are out of scope (legacy/prototype).
