# Changelog

All notable changes to EcyPro Premium Consulting are documented in this file.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning: SemVer-relaxed (sprint-bazlı: `vYYYY.MM.DD-PXX`).

## [Unreleased]

### Added (P56 — Gap closure)
- `SECURITY.md` — vulnerability disclosure policy
- `CHANGELOG.md` — keep-a-changelog kronolojik kayıt
- `LICENSE` — proprietary all-rights-reserved
- `public/ads.txt` — placeholder
- `.env.example` — newsletter/drip/indexnow keys eklendi
- Newsletter SPA pages: `/newsletter/confirmed`, `/newsletter/unsubscribed`, `/newsletter/invalid-token`
- NotFoundPage suggestion search (client-side route hints)
- `vercel.json` — refined Cache-Control headers

## [v2026.05.18-P55] — 2026-05-18

### Added
- BullMQ drip campaign worker — Redis sorted-set queue + DLQ + 60s cron + 3× exp backoff
- Newsletter lifecycle (`server/routes/newsletter-lifecycle.ts`): HMAC token confirm/unsubscribe/feedback
- IndexNow cron (`server/jobs/indexnow-cron.ts`) — 03:00 UTC daily Bing submit
- Lead scoring P55 variant (additive formula, hot/warm/cold)
- SMTP utility (`server/utils/drip-smtp.ts`) — MJML render + nodemailer + rate limit
- Admin campaigns endpoints + `AdminCampaignsPage.tsx`
- 2 new Playwright spec (critical paths + 21 services param)
- Image AVIF/WebP build script + font subset script
- Storybook stories: SocialProofFeed, ResponsiveImage
- Docs: `ARCHITECTURE.md`, `DEPLOYMENT.md`, `API.md`

### Changed
- `.lighthouserc.cjs` — added 3 URLs (pillar, annual-report, methodology)

## [v2026.05.17-P54] — 2026-05-17

### Added
- 5 pillar full content (~7500 kelime topical authority): stratejik-donusum, aile-sirketleri, operasyonel-mukemmellik, dijital-yapay-zeka, surdurulebilirlik-esg
- 21 service × 3 CTA flavor variant data (`src/data/cta-variants.ts`) + `getCtaVariant()` lookup
- Annual Report 2025 data + page (`/annual-report/2025`) + Report JSON-LD
- 3 MJML email templates: welcome, newsletter-confirm, discovery-call-confirm
- `ResponsiveImage` component — `<picture>` AVIF+WebP+JPEG + retina srcset
- `SocialProofFeed` component — anonim aktivite akışı, KVKK uyumlu

## [v2026.05.16-P53] — 2026-05-16

### Added
- Founder bios — 4 length variant × 2 lang
- Email signatures — founder + support × 2 lang × HTML+text
- Experiments lib (`src/lib/experiments.ts`) — A/B framework, localStorage sticky
- `ExitIntentModalP53` — conversion-optimized desktop & mobile triggers
- `MobileCtaBar` — sticky bottom CTA (mobil only)

## [v2026.05.15-P52] — 2026-05-15

### Added
- Real phone integration `+905417143000` (site-wide tel: links)
- WhatsApp deep link `https://wa.me/905417143000`
- 5 new lazy routes: `/pillar/:slug`, `/press`, `/speaking`, `/industry-reports/:slug`, `/webinars/:slug`
- Footer nav: 4 new links
- Sitemap: 10 new STATIC_ROUTES

## [v2026.05.14-P51] — 2026-05-14

### Added
- P0 Infrastructure (9 items): Sentry env-gated, GA4 env-gated, GSC verification meta, env validation
- P1 SEO+Tech (7 items): Helmet shim, canonical per-route, JSON-LD inject, breadcrumb everywhere
- P1 Conversion (5 items): trust signals strip, micro-CTAs, form trust microcopy, social proof, urgency reduced
- P2 Content+CRM (5 items): newsletter capture upgrade, lead scoring scaffold, Telegram notify, audit cursor pagination, idempotency

## [v2026.05.13-P50] — 2026-05-13

### Added
- SWOT + Gap Analysis comprehensive audit — `outputs/P50_SWOT.md` (100+ item baseline)

## [v2026.05.12-P49] — 2026-05-12

### Added
- 21 interactive service widgets: StrategicMaturityLadder, DealPipelineVisualizer, GenerationalTransitionTimeline, OperationsROICalculator, CustomerSegmentQuiz, OrgDesignMaturity, CrisisReadinessMatrix, AIMaturityRadar, DigitalReadinessScorecard, KVKKComplianceChecker, ESGScoreCard, IncentiveEligibilityChecker, MacroExposureDashboard, MarketConcentrationAnalyzer, UnionEngagementMatrix, EmploymentIncentiveCalculator, EmployerBrandHealth, MarketFeasibilityMatrix, CountryRiskRadar, UrbanReadinessScore, RegulatoryStakeholderMap
- 21 illustration SVG library
- `animations.ts` shared variants
- ServiceDetailLayout v2 — sticky CTA + breadcrumb + animations

## [v2026.05.11-P48] — 2026-05-11

### Added
- eCyPro brand system: indigo (#2563EB) + violet (#7C3AED) + gold (#F59E0B)
- Geometric e-mark + Pro gold-emphasis wordmark
- 4 logo variants: full / mark / wordmark / stacked + monochrome fallbacks
- `favicon.svg` + `og-share.svg`
- `BRAND_GUIDE.md`

## [v2026.05.10-P47] — 2026-05-10

### Added
- 21 service deep content (16-section structure × 21 services)
- `ServiceDetailLayout` standardize edildi
- Strategic Transformation pilot full build

## [v2026.05.05-P46] — 2026-05-05

### Fixed
- Helmet shim — react-helmet-async React 19 ile uyumsuz; useEffect bazlı manuel DOM yazımı
- Trust signals mini-bar (homepage)
- Performance preconnects (api.ecypro.com + fonts)
- Form trust microcopy
- Mobile UX touch targets ≥44px (global)

## [v2026.04-P45] — 2026-04

### Added
- Blog list/detail full functionality
- Case Studies list/detail
- /faq + /methodology + /data-rights content
- NotFoundPage branded
- /pricing yearly toggle
- /careers TR-EN mix fix
- /privacy TASLAK banner
- /login styling contrast fix

## [v2026.03-P42] — 2026-03

### Added
- Initial production-readiness sprint
- Mock/Simulation envanteri + content bucket sorting
- Branded SVG placeholder library
- Build + deploy pipeline

## Earlier (P1-P41)

Foundation work — auth, booking system, blog engine, admin dashboard, analytics, internationalization, PWA, queue infrastructure, GDPR compliance, webhook system, audit logging. Detaylı log için git history.
