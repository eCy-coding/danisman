# Roadmap 100 — PHASE 40: Observability + DevOps (Production Scale)

**Tier:** 3 (ORTA) · **Skor:** 2.0 · **Süre:** 1 hafta · **Todo:** T91-T100

**Stratejik Hedef:** Production-grade observability + deployment automation. "Bir şey kırıldı" anında fark et, bir tık ile fix. SLI/SLO tracking, incident response.

**Mevcut Durum:** Sentry init edildi (Phase 9), `/api/health` endpoint var, Winston JSON log var. Ama: source map upload yok, Lighthouse CI yok, uptime monitoring yok, status page yok, incident runbook yok.

---

## ⬜ P40-T01 (T91): Sentry Source Maps CI (Tag-Based Release)

- **NEDEN:** Sentry error'larda sourcemap olmadan minified stack trace = debug imkansız. Source maps upload her release'de olmalı.
- **ÖNEM:** P0 — Production debugging sine qua non.
- **YÖNTEM:** `.github/workflows/release.yml` (Phase 24α'da oluştu, ama `if: env.SENTRY_AUTH_TOKEN != ''` conditional). Production secret `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT` GitHub Secrets. Trigger: git tag `v*`. `@sentry/cli` releases create + upload sourcemaps + finalize.
- **TEST:** Tag `v1.0.1` push → Actions run → Sentry project → Releases → v1.0.1 + source maps uploaded. Production error → Sentry issue → source mapped (original file + line).

## ⬜ P40-T02 (T92): Lighthouse CI (Fail-on-Regression)

- **NEDEN:** Performance regression'ı otomatik yakala. Bir PR'ın LCP'yi 3s+ yaptığı fark edilmeli.
- **ÖNEM:** P1 — Performance guard.
- **YÖNTEM:** `@lhci/cli` npm dev dep. `.lighthouserc.js` config: assert `performance: 0.85`, `accessibility: 0.98`, `seo: 1.0`. `.github/workflows/lighthouse.yml` → `lhci autorun --collect.url=...` staging URL. PR comment bot + fail on assertion violation.
- **TEST:** PR that degrades Hero image → Lighthouse CI fail "performance score below 0.85". PR block until fix.

## ⬜ P40-T03 (T93): Log Aggregation (Better Stack / Logflare)

- **NEDEN:** Winston local log yetersiz. Multi-instance + search + alerting için centralized logging şart. Better Stack (Logtail) developer-friendly ücretsiz tier.
- **ÖNEM:** P1 — Multi-instance ve arama için kritik.
- **YÖNTEM:** betterstack.com → free tier (1GB/month). `@logtail/winston` transport → Winston logger'a ekle. Alternatif: Axiom.co (free 500GB/ay!). Structured log query: `source:api AND level:error AND requestId:xxx`.
- **TEST:** Test error `throw new Error('test')` → Better Stack dashboard'da 1-2 sn içinde. Search + filter + alert rule.

## ⬜ P40-T04 (T94): Uptime Monitoring (UptimeRobot)

- **NEDEN:** Site downtime'ı fark edemeden saatler geçebilir. UptimeRobot 5-min interval check + email/SMS/Slack alert.
- **ÖNEM:** P0 — Proactive incident response.
- **YÖNTEM:** uptimerobot.com free (50 monitor). Monitor'lar: (a) `https://ecypro.com/` HTTP 200, (b) `https://ecypro.com/api/health` HTTP 200 + keyword "ok", (c) `/api/ready` readiness, (d) SSL expiration 30d warning. Alert contact: email + Telegram/Slack.
- **TEST:** `/api/health` 5 dk down → UptimeRobot alert email/Slack. Up olunca "Resolved" alert.

## ⬜ P40-T05 (T95): Status Page (status.ecypro.com)

- **NEDEN:** Downtime oldugunda user'lar kendi internet / provider arar. Status page "biz farkındayız + ne oluyor" gösterir → trust preservation.
- **ÖNEM:** P2 — User trust + support load reduction.
- **YÖNTEM:** **Instatus** (free tier 5 components) veya **Statuspage.io** (atlassian, paid). Alternatif: self-hosted UpTimeKuma (Docker). Subdomain `status.ecypro.com` → Vercel CNAME. UptimeRobot integration auto-update status.
- **TEST:** `https://status.ecypro.com` → 3 component (Website, API, DB) all green. Downtime simulate → component red within 2min.

## ⬜ P40-T06 (T96): Process Monitor (PM2 / systemd)

- **NEDEN:** Backend crash edince auto-restart şart. Render/Vercel managed ama self-hosted Docker için PM2 + systemd.
- **ÖNEM:** P1 — Self-hosted deployment için kritik.
- **YÖNTEM:** Production deployment: Render (managed, auto-restart built-in) → kullanılacaksa gerek yok. Self-hosted VPS ise: PM2 `pm2 start ecosystem.config.js` (4 instance cluster mode) + `pm2 startup` systemd integration. Log rotation PM2 built-in.
- **TEST:** Process kill `kill -9 {pid}` → PM2 auto-restart 1-2 sn. `pm2 status` → "online, restarts: 1".

## ⬜ P40-T07 (T97): Database Backup Automation

- **NEDEN:** PostgreSQL data = 1 numaralı loss risk. Backup olmadan hata = tam veri kaybı.
- **ÖNEM:** P0 — Disaster recovery.
- **YÖNTEM:** Render PostgreSQL (managed) daily backup built-in (7 gün retention). Self-hosted için `pg_dump` cron job → AWS S3 / Backblaze B2 (ucuz). `scripts/backup-db.sh`: `pg_dump -Fc -f backup.dump $DATABASE_URL && aws s3 cp backup.dump s3://backups/...`. Encryption at rest (S3 SSE). Retention: 7 daily, 4 weekly, 12 monthly.
- **TEST:** Cron tick → backup file S3'te mevcut. Restore test: empty DB + `pg_restore backup.dump` → data recovered.

## ⬜ P40-T08 (T98): Docker Registry CI/CD (GHCR)

- **NEDEN:** Self-hosted deployment için Docker image CI'da build + push. GitHub Container Registry (GHCR) ücretsiz.
- **ÖNEM:** P2 — Deployment automation.
- **YÖNTEM:** `.github/workflows/docker.yml` → `docker/build-push-action@v5` → GHCR `ghcr.io/{user}/ecypro:{tag}`. Multi-arch (amd64+arm64). Layer cache Actions cache.
- **TEST:** Tag push → GHCR'da image görünür. `docker pull ghcr.io/.../ecypro:latest` → run success.

## ⬜ P40-T09 (T99): Blue-Green Deployment

- **NEDEN:** Zero-downtime deployment. Production'da kullanıcı hiç "Sunucu bakımda" görmemeli.
- **ÖNEM:** P2 — Enterprise deployment pattern.
- **YÖNTEM:** Vercel/Render built-in atomic deployment (instant swap). Self-hosted için: nginx upstream 2 backend instance (blue + green). Deploy → green'e yeni versiyon → health check pass → nginx traffic shift → blue eski versiyon.
- **TEST:** Deploy during traffic → 0 failed request. `curl` in loop while deploy → 100% 200 OK.

## ⬜ P40-T10 (T100): Incident Runbook + Postmortem Template

- **NEDEN:** Incident olunca panik yerine checklist. "Step 1: Check status page. Step 2: Check Sentry. Step 3:..." hazır prosedür.
- **ÖNEM:** P1 — Incident response efficiency + learning loop.
- **YÖNTEM:** `docs/INCIDENT_RUNBOOK.md`: (a) Severity definitions (SEV1-SEV4). (b) On-call rotation (tek kişi Emre şimdilik). (c) Incident response steps (Detect → Diagnose → Mitigate → Communicate → Resolve → Postmortem). (d) Common incidents playbook (DB down, API 5xx spike, SSL expire, Sentry error surge). Postmortem template (blameless, 5-whys, action items).
- **TEST:** Test incident scenario (manual /health 503) → runbook steps execute → MTTR (mean time to recovery) log. Postmortem 1 sample doldur.

---

## Phase 40 Kapatma Kriterleri

- [ ] 10/10 todo `✅`
- [ ] Sentry source maps CI release flow
- [ ] Lighthouse CI fail-on-regression
- [ ] Log aggregation (Better Stack / Axiom)
- [ ] UptimeRobot 4 monitor + alerts
- [ ] Status page live (Instatus / UpTimeKuma)
- [ ] PM2 / Render auto-restart
- [ ] DB backup cron S3 + restore tested
- [ ] Docker image GHCR automated
- [ ] Blue-green deployment validated
- [ ] Incident runbook + postmortem template
- [ ] Tag: `git tag phase-40-closed`

---

# 🎯 100-TODO ROADMAP KAPATMA — EcyPro Production-Scale

## Final Matris

```
Tier 1 (Kritik)  : Phase 31-33  | 30 todo  | SEO + Keyword + Performance
Tier 2 (Yüksek)  : Phase 34-37  | 40 todo  | Conversion + Security + Admin + Booking
Tier 3 (Orta)    : Phase 38-40  | 30 todo  | Authority + i18n + DevOps

Toplam           : 100 todo     | 10 phase | 10-12 hafta (1 engineer FT)
```

## Tamamlanma Tanımı (DoD)

Tüm 100 todo için:
- `✅` checkbox işaretli
- İlgili kod/config commit + merge master
- `typecheck && lint && test` CI yeşil
- Git tag `phase-{31..40}-closed`
- `brain/memory.md`'ye phase closure bloğu

## Başarı Metrikleri (3 ay sonra — hedef)

- **SEO:** 41/41 sayfa Google indexed, 10+ keyword top-50, DA 25+
- **Traffic:** 500+ organic visitors/month, 50+ email subscribers, 5+ bookings/month
- **Performance:** Lighthouse Performance ≥90 production (CDN), LCP ≤2.0s
- **Security:** OWASP Top 10 zero critical, 2FA enabled admin, 0 Sentry high-severity
- **Operations:** 99.9% uptime, <5min incident detection, automated backups

## Son Söz

**İstek3.txt arkadaş tavsiyesi** bu roadmap'in kurucu bloğudur. SEO/GSC/GA4 kurulumu olmadan diğer hiçbir özellik ROI üretmez. Tier 1 (Phase 31-33) tamamlanmadan Tier 2/3'e geçmek **matematiksel hata**.

**Önerilen Başlangıç:** `roadmap_10.md` T01 — Google Search Console property doğrulama. 15 dakikalık iş, 3 aylık SEO'nun temelini atar.

**Son Güncelleme:** 5 Mayıs 2026 — 100-todo roadmap üretim tamamlandı.
