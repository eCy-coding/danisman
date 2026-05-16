#!/usr/bin/env bash
# eCyPro — P13 Atomic Commit Chain (host-only)
# P13/6 — release-coordinator
#
# Sandbox cannot write .git/, so the operator runs this on the MacBook to
# materialize the P13 sprint (backend hardness + RUM + GDPR + Assets/PWA +
# Analytics taxonomy) as a chain of atomic, Conventional commits.
# Idempotent: safely re-runs after partial execution.
set -euo pipefail
cd "$(dirname "$0")"

LOG="outputs/apply-p13-commits-$(date +%Y%m%d-%H%M%S).log"
mkdir -p outputs
exec > >(tee -a "$LOG") 2>&1

echo "=== eCyPro P13 atomic commit chain ==="
echo "Start: $(date)"
echo

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "❌ Not a git repo"
  exit 1
fi

if ! git diff --cached --quiet; then
  echo "❌ Found pre-existing staged changes. Run 'git reset' first."
  exit 1
fi

stage_commit () {
  local message="$1"
  local body="$2"
  shift 2
  local paths=("$@")

  echo
  echo "──────────────────────────────────────────────────────────────"
  echo "▶ Commit: ${message}"
  echo "  Files: ${paths[*]}"

  for p in "${paths[@]}"; do
    [[ ! -e "$p" ]] && echo "  ⚠ Missing: $p (skip path)"
  done

  git add -- "${paths[@]}" 2>/dev/null || true

  if git diff --cached --quiet; then
    echo "  ✓ Nothing to commit. Skip."
    return 0
  fi

  echo "  Staged diff stat:"
  git diff --cached --stat | sed 's/^/    /'

  if [[ -n "$body" ]]; then
    git commit -m "$message" -m "$body"
  else
    git commit -m "$message"
  fi
  echo "  ✅ Committed: $(git log -1 --oneline)"
}

# ─── P13-C1 — Graceful shutdown + Sentry flush + 503 drain ───────────────
stage_commit \
  "feat(backend): graceful shutdown with prisma disconnect + sentry flush + 503 drain" \
  "P13/1 — security-hardener. server/index.ts shutdown akışı yeniden yazıldı: re-entrant guard, 30s hard ceiling (env: SHUTDOWN_TIMEOUT_MS), Sentry.flush(4s) + shutdownDatabase(8s) Promise.allSettled, isShuttingDown flag'i health endpoint'inde 503 + Retry-After:15 döndürüyor → load balancer drain'i fark eder. Detay: outputs/P13_BACKEND_HARDNESS.md." \
  "server/index.ts" \
  "server/config/db.ts"

# ─── P13-C2 — Idempotency middleware (Idempotency-Key) ───────────────────
stage_commit \
  "feat(backend): idempotency middleware with Idempotency-Key header (RFC + Stripe style)" \
  "P13/1 — security-hardener + e2e-stabilizer. server/middleware/idempotency.ts: in-process LRU + TTL (default 24h), key+body hash, route isolation. Replay → Idempotent-Replay:true + cached body. Mismatch → 409 KEY_MISMATCH. Strict mode opsiyonel. 7 vitest case. Detay: outputs/P13_BACKEND_HARDNESS.md." \
  "server/middleware/idempotency.ts" \
  "server/middleware/idempotency.test.ts"

# ─── P13-C3 — Request timeout middleware ─────────────────────────────────
stage_commit \
  "feat(backend): per-request timeout middleware (30s global, 60s uploads)" \
  "P13/1 — security-hardener. server/middleware/timeout.ts: konfigüre edilebilir ceiling, multipart upload için ayrı limit, SSE + /api/health skip. Trigger'da 504 + REQUEST_TIMEOUT + requestId; res.locals.timedOut downstream consumer için. 4 vitest case. Env: REQUEST_TIMEOUT_MS, UPLOAD_TIMEOUT_MS." \
  "server/middleware/timeout.ts" \
  "server/middleware/timeout.test.ts"

# ─── P13-C4 — Pg pool tuning ─────────────────────────────────────────────
stage_commit \
  "chore(db): tune pg pool — max/idle/conn/query/statement timeouts via env" \
  "P13/1 — security-hardener. server/config/db.ts: 6 env knob (PG_POOL_MAX/MIN/IDLE_MS/CONN_MS/QUERY_MS + PG_STATEMENT_MS). pool.on('error') log + crash YOK. shutdownDatabase() Prisma+pool drain (8s ceiling) export'u shutdown handler tarafından kullanılır." \
  "server/config/db.ts"

# ─── P13-C5 — Contact route honors Idempotency-Key ───────────────────────
stage_commit \
  "feat(contact): honor Idempotency-Key on POST /api/contact for retry-safety" \
  "P13/1 — security-hardener. server/routes/contact.ts: idempotency({ ttlMs: 24h }) middleware'i contactLimiter sonrasına eklendi. Lenient mode — header eksikse pass-through (geriye dönük uyum). Double-click veya network retry → tek Telegram mesajı." \
  "server/routes/contact.ts"

# ─── P13-C6 — RUM: Web Vitals → Sentry ───────────────────────────────────
stage_commit \
  "feat(rum): collect Web Vitals via web-vitals + send to Sentry measurements" \
  "P13/2 — perf-optimizer. src/lib/rum.ts: onCLS/FCP/INP/LCP/TTFB → Sentry.setMeasurement + addBreadcrumb + poor-rating captureMessage. Sample rate prod %10 / dev %100, VITE_RUM_SAMPLE_RATE override. tracedOp/tracedSync helper'ları kritik path async/sync için. App.tsx idle window'da initRUM() init. Mevcut monitor.ts beacon path'i korundu." \
  "src/lib/rum.ts" \
  "src/App.tsx"

# ─── P13-C7 — Sentry RUM dashboard docs ──────────────────────────────────
stage_commit \
  "docs(observability): Sentry RUM dashboard + 6 alert rule templates" \
  "P13/2 — perf-optimizer + security-hardener. outputs/SENTRY_DASHBOARD_CONFIG.md: 8 dashboard widget (LCP/INP/CLS P75, error rate, top slow transactions, CSP violation rate, replay viewing, vital by country) + 6 alert rule (LCP/INP/CLS regression, error rate, new release spike, CSP spike) + release tracking + replay config + first-week success metrics." \
  "outputs/SENTRY_DASHBOARD_CONFIG.md"

# ─── P13-C8 — GDPR backend endpoints ─────────────────────────────────────
stage_commit \
  "feat(gdpr): add /api/gdpr/{export,delete,status} endpoints with rate limit + idempotency + audit" \
  "P13/3 — e2e-stabilizer + content-qa-auditor. server/routes/gdpr.ts: KVKK Madde 11 + GDPR Art. 15-17 başvuru endpoint'leri. Zincir: idempotency(24h) → rate limit (1/24h/email) → zod validation → honeypot → Winston audit + Telegram admin alert → TR/EN ack response. server/routes/gdpr.test.ts 8 case. Routes mount /api/gdpr." \
  "server/routes/gdpr.ts" \
  "server/routes/gdpr.test.ts" \
  "server/routes/index.ts"

# ─── P13-C9 — DataRightsPage frontend ────────────────────────────────────
stage_commit \
  "feat(gdpr): add /privacy/data-rights page with KVKK/GDPR form + a11y + i18n" \
  "P13/3 — a11y-fixer. src/pages/DataRightsPage.tsx: radiogroup (export|delete) + email + reason + honeypot + Idempotency-Key (crypto.randomUUID). aria-required/invalid/describedby, role=alert/status, focus ring, TR/EN inline lang switch. LegalLayout içine gömülü. App.tsx iki route mount (root + lang-prefixed)." \
  "src/pages/DataRightsPage.tsx" \
  "src/App.tsx"

# ─── P13-C10 — Consent v2 versioned ──────────────────────────────────────
stage_commit \
  "feat(consent): v2 versioned consent record with v1 migration + onConsentChange API" \
  "P13/3 — content-qa-auditor. src/lib/consent.ts: CONSENT_VERSION=2, STORAGE_KEY_V2='ecypro_cookie_consent_v2'. v1 → v2 read-time migration (essential→necessary). API: getConsent/setConsent/hasConsent/clearConsent/onConsentChange. Custom event 'ecypro:consent-changed' broadcast. Mevcut CookieBanner v1 anahtarı korundu (backwards-compat)." \
  "src/lib/consent.ts"

# ─── P13-C11 — Asset pipeline script ─────────────────────────────────────
stage_commit \
  "feat(assets): add generate-assets.mjs for responsive image + og + favicon pipeline" \
  "P13/4 — seo-submitter. scripts/generate-assets.mjs: sharp tabanlı 4 modül — favicon set (16/32/180/192/512), hero AVIF+WebP+JPG x 4 width, og-image varyantları (default + about + 3 services + blog), manifest icon validation. CLI flags --favicon/--hero/--og/--validate/--all/--dry-run. Sandbox arm64 mismatch → host'ta çalışır." \
  "scripts/generate-assets.mjs"

# ─── P13-C12 — Manifest finalize ─────────────────────────────────────────
stage_commit \
  "chore(pwa): finalize manifest with id, scope, shortcuts, separated maskable icons" \
  "P13/4 — seo-submitter + devops-publisher. vite.config.ts VitePWA manifest: id=/, lang=tr, dir=ltr, scope=/, start_url=/?source=pwa, display=standalone, display_override, orientation=portrait, categories=[business,productivity,finance], shortcuts (Hizmetler + Rezervasyon), icons purpose=any ile maskable ayrıldı (Chromium safe-zone)." \
  "vite.config.ts"

# ─── P13-C13 — PWA install prompt ────────────────────────────────────────
stage_commit \
  "feat(pwa): smart install prompt with engagement-based timing (3+ pageview / 2+ min)" \
  "P13/4 — devops-publisher. src/components/pwa/InstallPrompt.tsx: beforeinstallprompt yakala, engagement criteria (≥3 pageview VEYA ≥2 dakika) ile gate. Dismiss → 7 gün cooldown. Storage version v2 (pwa-install-dismissed-v2). gtag pwa_install_prompt + pwa_install_dismiss events. a11y: role=dialog + aria-labelledby/describedby + focus ring. MainLayout aside içine mount." \
  "src/components/pwa/InstallPrompt.tsx" \
  "src/components/layout/MainLayout.tsx"

# ─── P13-C14 — Offline UX + workbox navigateFallback ─────────────────────
stage_commit \
  "feat(pwa): offline fallback page (i18n TR/EN) + workbox navigateFallback wiring" \
  "P13/4 — devops-publisher. public/offline.html: standalone HTML (4KB), TR+EN dil switcher, brand kart, online/offline canlı badge, retry button, auto-reload, meta robots noindex. vite.config.ts: includeAssets += offline.html, workbox.navigateFallback=/offline.html + denylist (/api, /admin)." \
  "public/offline.html" \
  "vite.config.ts"

# ─── P13-C15 — Analytics taxonomy ────────────────────────────────────────
stage_commit \
  "feat(analytics): comprehensive event taxonomy with type-safe emit() helper" \
  "P13/5 — content-qa-auditor + seo-submitter. src/lib/analytics-events.ts: 7 kategori (navigation/engagement/conversion/error/system/consent/pwa) + 27 event union + EventMap payload tipleri. emit<K>() compile-time type-safe; emitRaw() escape hatch. Auto-context: timestamp/path/title/language/event_category. window.gtag legacy bağlantı korundu." \
  "src/lib/analytics-events.ts"

# ─── P13-C16 — Analytics dev guide ───────────────────────────────────────
stage_commit \
  "docs(analytics): developer guide for adding new events + GA4 dimension setup" \
  "P13/5 — content-qa-auditor. docs/ANALYTICS.md: hızlı başlangıç + event ekleme prosedürü (3 yer) + naming kuralları + kategori rehberi + payload kuralları (PII yasak, 100 char clamp) + legacy uyum + test/doğrulama + consent gating + 15 GA4 custom dimension setup + checklist + anti-pattern." \
  "docs/ANALYTICS.md"

# ─── P13-C17 — P13 reports + recipe ──────────────────────────────────────
stage_commit \
  "docs(p13): sprint closure reports + APPLY_P13_COMMITS recipe" \
  "P13/6 — orchestrator + release-coordinator. 6 yeni rapor: backend hardness, RUM, GDPR, assets/PWA, analytics taxonomy, FINAL. Sentry dashboard config. Push readiness via APPLY_P13_COMMITS.command (this file). READY_TO_PUSH.command 10-kapı validator zincirde kalır." \
  "outputs/P13_BACKEND_HARDNESS.md" \
  "outputs/P13_RUM.md" \
  "outputs/P13_GDPR.md" \
  "outputs/P13_ASSETS_PWA.md" \
  "outputs/P13_ANALYTICS_TAXONOMY.md" \
  "outputs/P13_FINAL.md" \
  "outputs/RESUME_STATE_REPORT.md" \
  "APPLY_P13_COMMITS.command"

echo
echo "──────────────────────────────────────────────────────────────"
echo "P13 commit chain complete."
echo "  Commits added on this run:"
git log --oneline @{u}..HEAD 2>/dev/null || git log --oneline -17
echo
echo "Next steps:"
echo "  1) ./READY_TO_PUSH.command   (10-gate pre-push validator)"
echo "  2) git push origin main      (after green gate)"
