# 8-Stream Orchestrator — Stream Briefs

Cascade'in her oturumda `mission.json` okuyarak kaldığı yerden devam etmesi için referans.

---

## S1 — SEO External Setup
**Status:** 🔴 `blocked_external` — KULLANICI GEREKLİ
**Todos:** T01 (GSC), T02 (GA4), T03 (Sitemap), T08 (Bing+Yandex)

**Kullanıcı Adımları:**
1. `search.google.com/search-console` → Add Property → Domain (DNS TXT)
2. `analytics.google.com` → Create Property → Web stream → kopyala `G-XXXXXXXXXX` → `.env` ve Hostinger/Vercel'de `VITE_GA_TRACKING_ID` ekle
3. GSC → Sitemaps → `https://ecypro.com/sitemap.xml` submit
4. `bing.com/webmasters` → Add site → GSC import
5. `webmaster.yandex.com` → property + DNS TXT

**Cascade Görevi:** Tamamlandı mı kontrol et, `.env.example`'da placeholder'ları onayla.

---

## S2 — SEO Baseline + IndexNow
**Status:** 🟡 `partial` — T09 ✅, T06 ❌ eksik
**Todos:** T06 (`seo-weekly-diff.ts`), T09 (`indexnow-push.ts`)

**Cascade Görevi:** `scripts/seo-weekly-diff.ts` yaz (CSV delta hesaplama).

**Test:**
```bash
npx tsx scripts/seo-weekly-diff.ts --help
npm run seo:indexnow  # public/{key}.txt + Bing push
```

---

## S3 — SEO Indexing Scripts
**Status:** ✅ `done`
**Todos:** T04 (`audit-canonical.ts`), T07 (`indexing-api-push.ts`)

**Doğrulama:**
```bash
npm run build && npm run audit:canonical  # 41 pages canonical ✅
npm run seo:index  # GOOGLE_INDEXING_KEY_PATH gerekli
```

---

## S4 — SEO Frontend + Schema
**Status:** ✅ `done`
**Todos:** T05 (`analytics.ts`), T10 (`audit-jsonld.ts`)

**Doğrulama:**
```bash
npm run build && npm run audit:jsonld  # JSON-LD valid ✅
```
`src/lib/analytics.ts`: trackCTA, trackScrollDepth, trackForm, trackROICalc, trackBooking.

---

## S5 — Auth Core — JWT + Session
**Status:** ✅ `done`
**Todos:** T41 (JWT Blacklist + Logout), T49 (Session Dashboard)

**Doğrulama:**
- `server/lib/jwt-blacklist.ts` — Redis SET EX + memory fallback
- `server/middleware/auth.ts` — `isBlacklisted` her token verify'da çalışıyor
- `server/routes/sessions.ts` — GET/DELETE sessions endpoints
- `authController.ts` → login: session upsert, logout: blacklistToken + revokeAllUserTokens

---

## S6 — Auth Identity — Refresh + Email
**Status:** ✅ `done`
**Todos:** T42 (Refresh Token), T43 (Email Verify)

**Doğrulama:**
- `server/lib/refresh-token.ts` — rotation + family revoke
- `authController.ts` — refresh endpoint, verifyEmail, sendVerifyEmail
- `prisma/schema.prisma` — `RefreshToken` + `EmailVerification` models

---

## S7 — Auth UX — 2FA + CSP
**Status:** ✅ `done`
**Todos:** T44 (2FA TOTP), T45 (CSP Nonce)

**Doğrulama:**
- `server/lib/totp.ts` + `server/lib/totp.test.ts`
- `server/routes/totp.ts` → `/api/auth/2fa/*`
- `server/middleware/cspNonce.ts` — per-request nonce, production strict
- `User.totpSecret` / `totpEnabled` / `backupCodes` Prisma fields

---

## S8 — Security CI
**Status:** ✅ `done`
**Todos:** T46 (OWASP ZAP), T47 (Redis Rate Limiter), T48 (HIBP), T50 (npm audit)

**Doğrulama:**
- `.github/workflows/security-zap.yml` — Monday 03:00 UTC cron + workflow_dispatch
- `server/middleware/rateLimiter.ts` — Lua atomic EVAL, multi-instance safe
- `server/lib/hibp.ts` — wired in `authController.ts` register
- `.github/workflows/ci.yml` — `security-audit` job, `--audit-level=high`

---

## Entegrasyon Kapısı

Tüm S1-S8 done/external sonrası:
```bash
npm run typecheck   # 0/0
npm run lint        # 0 error
npm run test        # mevcut 106+ / pass
npm run test:e2e:fast  # 6/6
npm run build       # sitemap ≥41 URL
```

Geçerse:
```bash
git tag phase-31-35-closed
# brain/memory.md → closure bloğu
```
