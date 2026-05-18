# ARCHITECTURE — EcyPro Premium Consulting

> Sistem mimarisi yüksek-seviye özeti. Detaylı kod referansları için `CLAUDE.md` ve in-file JSDoc'lara bakın.

## Genel Görünüm

EcyPro Premium Consulting iki bağımsız servis olarak dağıtılır:

- **Frontend** — Vite + React 19 + TypeScript strict. Vercel'de host edilir; statik build artefaktları edge CDN'den sunulur.
- **Backend** — Express 5 + Prisma 7 + Postgres + Redis. Render'da Node servisi olarak çalışır; PostgreSQL Neon'da, Redis Upstash'te yönetilir.

İki servis arasında HTTP REST üzerinden konuşulur (`/api/*`). Frontend'in tüm dışa açık trafiği `https://www.ecypro.com`; backend `https://api.ecypro.com` altındadır. CORS allowlist + JWT auth ile sınırlı.

```
   ┌──────────────────┐  HTTPS  ┌──────────────────┐
   │   Vercel CDN     │ ──────► │  Render Node     │
   │  React SPA       │ ◄────── │  Express + BullMQ│
   │  (Vite dist/)    │  JSON   │  Prisma 7        │
   └────────┬─────────┘         └────────┬─────────┘
            │                            │
            │ analytics                  │ pg / redis
            ▼                            ▼
   ┌──────────────────┐         ┌──────────────────┐
   │ GA4 + Sentry +   │         │ Neon Postgres +  │
   │ Search Console   │         │ Upstash Redis    │
   └──────────────────┘         └──────────────────┘
```

## Frontend Bileşenleri

- **Router:** React Router v7. 5 katman: marketing pages, services, dashboard, admin, locale routes (i18next).
- **State:** Zustand (UI), TanStack Query (server data), React Hook Form + Zod (forms).
- **SEO:** Custom Helmet shim (`src/lib/seo-helmet.tsx`) — react-helmet-async React 19 ile uyumsuz olduğu için useEffect bazlı manuel DOM yazımı.
- **A/B Test:** `src/lib/experiments.ts` — ENV `VITE_AB_TESTS` ile config; localStorage sticky assignment; analytics event emit.
- **Branding:** P48 indigo (#2563EB) + violet (#7C3AED) + gold (#F59E0B) palette; tasarım doktrini "AI Studio Tech" (opak surface, glassmorphism yok, Golden Ratio + Fibonacci spacing).

## Backend Bileşenleri

- **HTTP:** Express 5 — `server/index.ts` entry. Tüm route'lar `server/routes/index.ts` ile bağlanır.
- **Auth:** JWT + bcrypt. Refresh token rotation + JWT blacklist (Redis). TOTP 2FA destekli admin login.
- **DB:** Prisma 7 — `prisma/schema.prisma`. Migration: `npx prisma migrate dev`.
- **Cache:** Redis (ioredis) — rate limit, idempotency, JWT blacklist, drip campaign queue, campaign metadata.
- **Queue:** BullMQ (Redis-backed). 5 queue: email / gdpr-export / cron / image-resize / webhook-out.
- **Workers:** `server/workers/*.ts` — email-worker, cron-worker, image-resize-worker, gdpr-export-worker, webhook-delivery-worker. Standalone `server/workers/standalone.ts` entry point ile ayrı process olarak deploy edilebilir.
- **Mailer:** `server/lib/mailer.ts` — Resend primary + Telegram fallback. P55: SMTP utility (`server/utils/drip-smtp.ts`) drip campaign için MJML render + nodemailer.
- **Observability:** Sentry + winston logger + Prometheus metrics endpoint (`/api/metrics`).

## Veri Akışları

### Discovery Call Booking
1. User `/contact` formu doldurur → `POST /api/contact` → `ContactSubmission` insert + Telegram notify.
2. (Opsiyonel) `enrollSubscriber({ sequenceKey: 'contact-followup-tr' })` → drip queue → ack mail T+0, follow-up T+1d, T+5d.

### Newsletter Subscribe (double opt-in)
1. Footer formu → `POST /api/newsletter/subscribe` → `NewsletterSubscriber` create (consent=false).
2. HMAC token üretilir → confirm mail gönderilir.
3. User `GET /api/newsletter/confirm/:token` → consent=true + welcome drip enroll.
4. Welcome sekansı: T+0 hoş geldin, T+3 metodoloji, T+7 case study, T+14 discovery invite.

### Admin Newsletter Campaign
1. Admin `/admin/newsletter/campaigns` → kampanya oluştur (subject + body + audienceFilter).
2. `POST /api/admin/newsletter/campaigns/:id/send` → `prisma.newsletterSubscriber.findMany` ile audience → her subscriber için `enrollSubscriber()` ile drip queue'ya yaz.
3. Drip worker tick'leri (60s aralık) MJML render + SMTP send.

## Storage Modeli

Prisma'da modellenen ana tablolar:
- `User`, `Session`, `RefreshToken`, `EmailVerification`, `ApiKey` — kimlik
- `ContactSubmission`, `Booking`, `BookingFeedback`, `Lead` — CRM
- `NewsletterSubscriber` — pazarlama
- `Analytics`, `Interaction`, `AuditLog`, `ArchivedAuditLog` — telemetri
- `Service`, `SiteConfig`, `Image` — içerik
- `WebhookEvent`, `WebhookSubscription`, `WebhookDelivery` — entegrasyon

Redis'te yaşayanlar (in-memory, persistence opsiyonel):
- Rate limit + idempotency anahtarları
- JWT blacklist
- BullMQ queue + job state
- Drip campaign queue (sorted set) + DLQ (list)
- Newsletter campaign metadata (in-memory store, no DB)
- HMAC confirm/unsubscribe token'lar (self-contained, no Redis state)

## Güvenlik Hattı

- HTTPS only (Vercel + Render zorunlu)
- CORS allowlist `ALLOWED_ORIGINS` env
- CSP header (Helmet middleware)
- Rate limit: IP başına 5/dk newsletter subscribe; 60/dk public API
- KVKK/GDPR compliance: consent banner, double opt-in, right-to-erasure endpoint, GDPR export queue
- Audit log: tüm admin işlemleri `AuditLog` tablosuna yazılır

## CI/CD

- **Lint + typecheck + test:** Lefthook pre-push hook'u ile zorunlu (`npm run typecheck && npm run build`).
- **E2E:** Playwright suite — 20+ spec, kritik path + 21 servis + SEO + a11y.
- **Lighthouse CI:** `.lighthouserc.cjs` ile prod URL'larda Perf ≥85, A11y ≥95, BP ≥90, SEO ≥95.
- **Vercel:** `git push origin main` → auto deploy. PR'lar preview deploy alır.
- **Render:** push tetikli auto-deploy. Worker process'i `server/workers/standalone.ts` üzerinden ayrı servis olarak çalışır.

## Tasarım Doktrini

- Glassmorphism / `backdrop-blur` YASAKLAR — opak M3 surface (`#1E1F20`).
- Magic number yok — Fibonacci/φ tablosundan (`text-golden-base`, `p-fib-6`, `gap-fib-7`).
- Tipografi: Inter (sans-serif).
- Brand renkleri: secondary=#F59E0B (gold), accent=#7C3AED (violet), primary=#2563EB (indigo).
- 44px+ touch target zorunlu.

## Sprint Tarihçesi (özet)

P1-P30 foundation → P31-P42 conversion + analytics → P43-P46 SEO + UX polish → P47 21 service deep content → P48 brand system → P49 21 interactive widget → P50 SWOT audit → P51 P0+P1+P2 infrastructure → P52 phone + routes → P53 founder bios + exit intent → P54 pillars + CTA variants + annual report → P55 backend workers + admin campaigns + E2E + perf + docs.
