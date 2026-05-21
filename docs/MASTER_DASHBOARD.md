# EcyPro — Master Observability Dashboard

> Son güncelleme: 2026-05-22 (Track 4 Observability sprint)
> Kaynak: live health + Sentry API + repo audit. Detay: `~/Documents/eCyPro-memory/P1_P100_FINAL_AUDIT_20260522.md`

## Sistem Durumu (Live)

| Servis | Durum | Detay | Doğrulama |
|--------|-------|-------|-----------|
| **Frontend (Vercel)** | 🟢 UP | `www.ecypro.com`, server: Vercel, HSTS `max-age=63072000` aktif | `curl -sI https://www.ecypro.com` |
| **API (Render)** | 🟢 UP | `api.ecypro.com/api/health` → `ok`, v1.0.0, uptime ✓, env=production | `curl -s .../api/health` |
| **Sentry** | 🟢 ACTIVE | org `ecy`, release `ecypro@dfd1e90` (2026-05-21), PII scrub on (FE+BE) | Releases API |
| **PostHog** | 🟢 WIRED | Funnel events: contact_submit, quick_check_completed, pricing_calculator_completed, calendly_booked, email_subscribed | repo + `/capture/` |
| **Cloudflare** | 🟡 PARTIAL | DNS + proxy aktif; **SSL mode Full(Strict) açık TODO** | cf-zone-watcher |

## Observability Katmanları

| Katman | Araç | Konfig |
|--------|------|--------|
| Error tracking | Sentry (FE+BE) | `src/lib/integrations/sentry.ts`, `server/index.ts:36` |
| PII scrubbing | Sentry beforeSend | email/ip/username/cookies/auth-header/query redact |
| Product analytics | PostHog | `src/lib/posthog.ts`, `server/lib/posthog-server.ts` |
| Web Vitals / RUM | Web Vitals + `src/lib/rum-stats.ts` | pathname template PII strip |
| Structured logs | Winston | `server/config/logger.ts` |
| HTTP metrics | `server/observability/metrics.ts` | http-metrics-middleware |
| Health probe | `/api/health` | render.yaml healthcheck |
| Session replay | Clarity (masked) | `src/lib/clarity.ts`, data-clarity-mask |

## CI/CD Pipeline (13 workflow)

| Workflow | Amaç | Perms |
|----------|------|-------|
| ci.yml | lint+typecheck+test+npm audit | ✓ least-priv |
| quality-gate.yml | kalite kapısı | ✓ |
| security.yml / security-zap.yml | SAST + OWASP ZAP DAST | ✓ |
| a11y-ci.yml | axe-core a11y | ✓ |
| lighthouse-ci.yml / lighthouse.yml | perf budget | ✓ |
| db-migration-gate.yml | migration guard | ✓ |
| release.yml | semver + CHANGELOG + Sentry release | ✓ |
| server-tests.yml | backend test | ✓ |
| visual-regression.yml | UI diff | ✓ |
| docker.yml | container build | ✓ |
| claude-smoke.yml | smoke test | ✓ |

Pre-commit: gitleaks. Pre-push: typecheck+build (lefthook + husky).

## Açık Aksiyonlar

| Öncelik | Aksiyon | Sahip | Tür |
|---------|---------|-------|-----|
| 🔴 P1 | Cloudflare SSL → Full (Strict) | manuel CF panel | Güvenlik |
| 🟡 P2 | Mobile LCP fresh lighthouse → ≥70 doğrula | otomatik | Perf |
| 🟡 P3 | `.github/dependabot.yml` ekle | repo | Governance |
| 🟢 P4 | Prisma route userId-scope audit | repo | Güvenlik |
| 🟢 P5 | backup-db.sh cron + offsite doğrula | ops | Operasyonel |

## Audit Skoru
**31 item · PASS 26 · PARTIAL 2 · verify 3 · FAIL 0**
