# Roadmap 50 — PHASE 35: Auth + Security Hardening

**Tier:** 2 (YÜKSEK) · **Skor:** 5.0 · **Süre:** 1 hafta · **Todo:** T41-T50

**Stratejik Hedef:** Production-ready enterprise auth + OWASP Top 10 zero critical. JWT blacklist, 2FA, email verification, CSP strict mode.

**Mevcut Durum:** Phase 7 + 9 tamamlandı — PBKDF2 + JWT + Rate limiting + Security headers aktif. Phase 31+ deferred: JWT blacklist, logout, email verify, 2FA, CSP nonce.

---

## ✅ P35-T01 (T41): JWT Blacklist (Redis) + Logout Endpoint

- **NEDEN:** JWT stateless — logout "client tarafta token sil" yeterli değil. Çalınan token expiry'ye kadar geçerli (şu an 7 gün). Blacklist olmadan gerçek logout imkansız.
- **ÖNEM:** P0 — Security. Çalınan token scenario'su için kritik.
- **YÖNTEM:** `server/lib/jwt-blacklist.ts`: Redis key `jwt:blacklist:{jti}` TTL = remaining token lifetime. `POST /api/auth/logout` → decode token → jti extract → blacklist'e ekle. `verifyJWT` middleware her token için blacklist check. `server/middleware/auth.ts` update.
- **TEST:** `curl -X POST /api/auth/logout -H "Authorization: Bearer ..."` → 200 OK. Sonra aynı token ile `GET /api/auth/me` → 401 "Token revoked". Redis `GET jwt:blacklist:{jti}` → "1" değeri.

## ✅ P35-T02 (T42): Refresh Token Rotation

- **NEDEN:** Mevcut JWT access token 7 gün (çok uzun security için). Best practice: 15dk access + 7 gün refresh + rotation on use. Çalınan refresh token bir kere kullanılabilir.
- **ÖNEM:** P1 — Enterprise security standart.
- **YÖNTEM:** `POST /api/auth/login` → access (15dk) + refresh (7g) token dön. Refresh token DB'de hash'li kayıt (`RefreshToken` model Prisma). `POST /api/auth/refresh` → eski refresh invalidate + yeni access + refresh döndür. Rotation family tracking: reuse detected → tüm family revoke.
- **TEST:** Login → 2 token al. 15dk+1 sonra access token refresh → yeni token çifti. Eski refresh ile retry → 401 "Refresh token used" + DB'de family revoked.

## ✅ P35-T03 (T43): Email Verification Flow

- **NEDEN:** Şu an register sonrası email verify yok. Fake email ile spam register mümkün. Email verification = minimum bot deterrent.
- **ÖNEM:** P1 — Anti-abuse + email domain validation.
- **YÖNTEM:** `User` model: `emailVerified: DateTime?`, `emailVerifyToken: String?` (hashed). Register sonrası: token generate → email gönder (P37-T02'deki Resend.com). Email link: `https://ecypro.com/verify-email?token=...`. `GET /api/auth/verify-email?token=...` → token valid+not expired (24h) → `emailVerified = now`. Unverified user'lar belirli endpoint'lere erişemez (middleware gate).
- **TEST:** Register → inbox'a email gelir. Link'e tıkla → `emailVerified` set. Unverified user `GET /api/bookings` → 403 "Email not verified".

## ✅ P35-T04 (T44): 2FA TOTP Admin Panel

- **NEDEN:** Admin panel login = high-value target. Password-only 2FA'sız = tek vektör. TOTP (Google Authenticator, Authy) standart.
- **ÖNEM:** P1 — Admin account compromise risk azaltma.
- **YÖNTEM:** `speakeasy` + `qrcode` npm packages. `User.totpSecret: String?`, `User.totpEnabled: Boolean`. Admin settings page → "Enable 2FA" → QR code göster → user Google Authenticator scan → verification code gir → secret save. Login flow: password verify → eğer 2FA enabled → 6-digit TOTP prompt → `speakeasy.totp.verify` → success.
- **TEST:** Admin login → 2FA prompt görünür. Google Authenticator 6-digit code → success. Yanlış code → 401. Backup codes (8 adet, hash'li) generate + download.

## ✅ P35-T05 (T45): CSP Strict Mode (Nonce-Based)

- **NEDEN:** Şu an CSP `'unsafe-inline'` kullanıyor (dev mode kolaylık). Production için XSS koruma kritik: nonce-based CSP.
- **ÖNEM:** P1 — XSS mitigation enterprise-grade.
- **YÖNTEM:** Express middleware: her request için crypto.randomUUID nonce generate → `res.locals.cspNonce`. Inline script'lere `<script nonce="{nonce}">` ekle (SSR/Vite plugin gerekli). CSP header: `Content-Security-Policy: script-src 'self' 'nonce-{nonce}' 'strict-dynamic'`. Vite plugin: `vite-plugin-csp` veya custom middleware. Dev mode 'unsafe-inline' kalabilir (HMR için).
- **TEST:** Production build → `curl -I https://ecypro.com/` → `Content-Security-Policy` header strict. Browser DevTools Console → CSP violation 0. `https://csp-evaluator.withgoogle.com/` → "Safe" rating.

## ✅ P35-T06 (T46): OWASP ZAP Automated Scan (CI)

- **NEDEN:** Security issues manuel tespit yavaş. OWASP ZAP otomatik scan (SQLi, XSS, CSRF, headers) CI'da her PR'da çalışmalı.
- **ÖNEM:** P1 — Continuous security validation.
- **YÖNTEM:** `.github/workflows/security-zap.yml`: `zaproxy/action-baseline@v0.10.0` action → target staging URL → baseline scan (~5dk). Report artifact upload. Critical finding → PR block. Alternative: `action-full-scan` daily cron (30dk).
- **TEST:** PR → ZAP scan step → "0 High, 0 Medium" pass. Report artifact downloadable. 1 fake vulnerability inject test → scan catch ederse validation.

## ✅ P35-T07 (T47): Redis-Distributed Rate Limiter

- **NEDEN:** Phase 13'te Redis rate limiter var (memory fallback). Multi-instance deployment'ta her instance kendi memory'de sayar → rate limit bypass. Distributed Redis counter şart.
- **ÖNEM:** P1 — Scalability + rate limit effectiveness.
- **YÖNTEM:** `server/middleware/rateLimiter.ts` zaten Redis-backed (`ioredis`). Audit: `redis.incr(key)` + `redis.expire(key, ttl)` atomic (Lua script ideal). `rate-limit-redis` npm alternative. Multi-instance test: `docker-compose up --scale api=3`.
- **TEST:** `docker-compose up --scale api=3 -d`. 3 instance'a dağıtılmış 150 request/15min → 100 başarılı + 50 rate limited (aggregate, instance-specific değil).

## ✅ P35-T08 (T48): Password Breach Detection (HIBP API)

- **NEDEN:** Have I Been Pwned "Passwords API" k-anonymity ile ücretsiz password breach check. Register/login'de user'ın password'u breached listesindeyse uyar.
- **ÖNEM:** P2 — Proactive user security. En yaygın attack: credential stuffing.
- **YÖNTEM:** `server/lib/hibp.ts`: password SHA-1 hash → ilk 5 char API call (`https://api.pwnedpasswords.com/range/{prefix}`) → response'ta suffix match ara → count. Count > 0 → register'da uyar + zorla değiştir. Rate limit 1/sec (HIBP cloudflare behind). Async, blocking değil.
- **TEST:** Register with "password123" → HIBP response → "This password has been seen 120,000+ times" uyarı. Register form submit engelle (zorla farklı password).

## ✅ P35-T09 (T49): Admin Session Management Dashboard

- **NEDEN:** Admin hangi session'ların aktif, hangi cihazdan login olduğunu görmeli. Şüpheli session revoke imkanı.
- **ÖNEM:** P2 — Admin security UX.
- **YÖNTEM:** `Session` Prisma model: `userId`, `jti`, `userAgent`, `ip`, `createdAt`, `lastSeenAt`, `revokedAt`. JWT verify middleware `lastSeenAt` update. Admin panel `/admin/sessions` route: user seç → aktif session list → "Revoke" button → T41 JWT blacklist'e ekle.
- **TEST:** Admin kendi session list → 2 session (desktop + mobile). Mobile "Revoke" → mobile logout (401 next request).

## ✅ P35-T10 (T50): Security Audit Report (npm audit + Snyk)

- **NEDEN:** Dependency vulnerabilities periodic scan. `npm audit` built-in ama Snyk daha kapsamlı (CVSS + fix PR suggest).
- **ÖNEM:** P1 — Supply chain security.
- **YÖNTEM:** `.github/workflows/ci.yml` → `npm audit --audit-level=high` step (CI fail if high+). Snyk (free tier: 200 scan/ay) GitHub integration: PR'larda Snyk Bot yorumu. Aylık manuel: `npx snyk test && npx snyk monitor`.
- **TEST:** CI → `npm audit` step 0 High/Critical. Snyk dashboard → Project low-risk. Vulnerability found → automated PR open.

---

## Phase 35 Kapatma Kriterleri

- [x] 10/10 todo `✅`
- [x] JWT blacklist Redis + logout endpoint
- [x] Refresh token rotation + family revoke
- [x] Email verification flow (24h token)
- [x] 2FA TOTP admin + backup codes
- [x] CSP nonce-based strict mode production
- [x] OWASP ZAP CI scan 0 High
- [x] Redis distributed rate limiter multi-instance test
- [x] HIBP password breach check
- [x] Admin session management dashboard
- [x] npm audit + Snyk CI entegre
- [ ] Tag: `git tag phase-35-closed`

**Bir Sonraki:** `roadmap_60.md` — Phase 36 Admin Panel + CMS.
