#!/usr/bin/env bash
# eCyPro — P12 Atomic Commit Chain (host-only)
# P12/6 — release-coordinator
#
# Sandbox cannot write .git/, so the operator runs this on the MacBook to
# materialize the P12 sprint as a chain of atomic, Conventional commits.
# Idempotent: safely re-runs after partial execution.
set -euo pipefail
cd "$(dirname "$0")"

LOG="outputs/apply-p12-commits-$(date +%Y%m%d-%H%M%S).log"
mkdir -p outputs
exec > >(tee -a "$LOG") 2>&1

echo "=== eCyPro P12 atomic commit chain ==="
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

# ─── P12-C1 — backdrop-blur sweep (53 files / 72 occurrences → 0) ────────
stage_commit \
  "refactor(ui): remove all backdrop-blur per CLAUDE.md doctrine (72→0)" \
  "P12/1 — a11y-fixer + perf-optimizer. CLAUDE.md mandates solid M3 surfaces, no glassmorphism / blur. 53 files cleaned across 9 clusters (Hero, SuccessStories, Navbar group, public sections, blog/case-studies, UI primitives, feature surfaces, integrations, admin pages). index.css .glass/.glass-card utilities refactored to opaque equivalents while keeping the names for call-site backwards-compat. TBT bekleyen kazanç 30-200 ms / route. Detay: outputs/P12_BACKDROP_BLUR_SWEEP.md." \
  "src/" \
  "index.css"

# ─── P12-C2a — Backend Telegram proxy endpoint ───────────────────────────
stage_commit \
  "feat(api): add /api/contact endpoint with Telegram proxy + zod validation" \
  "P12/2 — security-hardener + e2e-stabilizer. New route server/routes/contact.ts: zod schema (name/email/message/kind), contactLimiter (3 req/h per IP), honeypot field, and forwarding via server/lib/telegram.ts (notify). Mounted at /api/contact in server/routes/index.ts. Test suite covers happy path, invalid email (400), honeypot, missing-env in prod (503), missing-env in dev (200 demo)." \
  "server/routes/contact.ts" \
  "server/routes/contact.test.ts" \
  "server/routes/index.ts"

# ─── P12-C2b — FE refactor: drop VITE_TELEGRAM_*, use backend proxy ─────
stage_commit \
  "refactor(security): move Telegram bot token from FE to BE" \
  "P12/2 — security-hardener. src/services/emailService.ts no longer reads VITE_TELEGRAM_BOT_TOKEN / VITE_TELEGRAM_CHAT_ID. Submissions POST to \${VITE_API_URL}/contact where backend handles validation + rate limit + Telegram forward using server-only credentials. Demo Mode preserved when VITE_API_URL is empty. .env.production.example updated with REMOVED markers and migration note. Detay: outputs/P12_TELEGRAM_PROXY.md." \
  "src/services/emailService.ts" \
  ".env.production.example"

# ─── P12-C2c — CSP sıkılaştırma (api.telegram.org çıkarıldı) ─────────────
stage_commit \
  "chore(csp): remove api.telegram.org from connect-src after backend proxy" \
  "P12/2 + P12/3. index.html CSP: connect-src listesinden https://api.telegram.org çıkarıldı (FE artık çağırmıyor); api.emailjs.com hem script-src hem connect-src'tan çıkarıldı (legacy, runtime'da kullanılmıyor). Yeni: report-uri + report-to direktifleri Sentry CSP project'e bağlandı. public/.htaccess Report-To + NEL header'larla tamamlandı. Detay: outputs/P12_CSP_REPORTING.md." \
  "index.html" \
  "public/.htaccess"

# ─── P12-C3 — Sentry CSP violation listener ─────────────────────────────
stage_commit \
  "feat(security): capture CSP violations via securitypolicyviolation listener" \
  "P12/3 — security-hardener. src/lib/sentry.ts init() artık document üzerinde securitypolicyviolation listener kuruyor; her ihlali Sentry.captureMessage('CSP violation', { level: 'warning', tags: {csp_directive, csp_disposition}, extra: {...} }) ile rapor ediyor. Network bağımsız — adblocker / corporate proxy report-uri'yi engellese bile telemetri gelir. Detay: outputs/P12_CSP_REPORTING.md." \
  "src/lib/sentry.ts"

# ─── P12-C4 — Schema.org Person + IndexNow ──────────────────────────────
stage_commit \
  "feat(seo): add Person schema for founder + IndexNow submit script" \
  "P12/4 — seo-submitter. src/components/seo/SchemaOrg.tsx artık 4. JSON-LD bloğu olarak Person (founder) emit ediyor — Knowledge Graph signal. jobTitle i18n TR/EN. sameAs/knowsAbout doldurulmuş. public/indexnow-key-PLACEHOLDER.txt 32-hex placeholder; operatör Bing webmaster'dan gerçek key ile değiştirir. scripts/seo-submit.mjs IndexNow batch POST helper'ı. Article/Service/Breadcrumb/FAQPage zaten mevcuttu. Detay: outputs/P12_SCHEMA_ORG.md." \
  "src/components/seo/SchemaOrg.tsx" \
  "public/indexnow-key-PLACEHOLDER.txt" \
  "scripts/seo-submit.mjs"

# ─── P12-C5 — CI hardening (bundle-size + Lighthouse hard gates) ────────
stage_commit \
  "feat(ci): promote bundle-size + Lighthouse to hard gates" \
  "P12/5 — devops-publisher. .github/workflows/quality-gate.yml bundle-size job artık opsiyonel skip pattern'i kaldırıldı; .size-limit.json + size-limit devDep mevcudiyeti hard-fail kontrolüyle teyit ediliyor; npx size-limit hard gate; andresz1/size-limit-action PR'da otomatik diff yorumu basıyor. .lighthouserc.js categories:performance warn→error @ 0.60, LCP/TBT error eşiklerine alındı (5000 ms / 900 ms — CI noise tolerance ile). Detay: outputs/P12_CI_HARDENING.md." \
  ".github/workflows/quality-gate.yml" \
  ".lighthouserc.js"

# ─── P12-C6 — P12 reports + recipes ─────────────────────────────────────
stage_commit \
  "docs(p12): sprint closure reports + APPLY_P12_COMMITS recipe" \
  "P12/6 — orchestrator. 6 yeni rapor: backdrop-blur sweep, Telegram proxy, CSP reporting, Schema.org expansions, CI hardening, FINAL. Push readiness via APPLY_P12_COMMITS.command (this file). READY_TO_PUSH.command 10-kapı pre-push validator ile birlikte çalışır." \
  "outputs/P12_BACKDROP_BLUR_SWEEP.md" \
  "outputs/P12_TELEGRAM_PROXY.md" \
  "outputs/P12_CSP_REPORTING.md" \
  "outputs/P12_SCHEMA_ORG.md" \
  "outputs/P12_CI_HARDENING.md" \
  "outputs/P12_FINAL.md" \
  "APPLY_P12_COMMITS.command"

echo
echo "──────────────────────────────────────────────────────────────"
echo "P12 commit chain complete."
echo "  Commits added on this run:"
git log --oneline @{u}..HEAD 2>/dev/null || git log --oneline -8
echo
echo "Next steps:"
echo "  1) ./READY_TO_PUSH.command   (10-gate pre-push validator)"
echo "  2) git push origin main      (after green gate)"
