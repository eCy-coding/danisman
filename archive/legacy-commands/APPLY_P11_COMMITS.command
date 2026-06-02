#!/usr/bin/env bash
# eCyPro — P11 Atomic Commit Chain (host-only)
# P11/8 — release-coordinator
#
# Applies P11 sprint commits on host. Idempotent.

set -euo pipefail
cd "$(dirname "$0")"

LOG="outputs/apply-p11-commits-$(date +%Y%m%d-%H%M%S).log"
mkdir -p outputs
exec > >(tee -a "$LOG") 2>&1

echo "=== eCyPro P11 atomic commit chain ==="
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

# ─── P11-C1 — i18n migration (emailService + contact.json) ─────────────
stage_commit \
  "fix(i18n): migrate emailService user-facing strings to i18next keys" \
  "P11/4 — emailService.ts no longer hardcodes user-visible TR strings. Uses i18n.t('contact:notifications.*') with the original TR text as defaultValue so callers without i18n init still see the original message. 7 keys added with TR + EN parity (contact.notifications.requiredFields, demoMode, success, genericError, bookingReceived, bookingDemoMode, bookingError). See outputs/P11_SPRINT_CLOSURE.md §4.3." \
  "src/services/emailService.ts" \
  "public/locales/tr/contact.json" \
  "public/locales/en/contact.json"

# ─── P11-C2 — Dismissible legal disclaimer ──────────────────────────────
stage_commit \
  "feat(legal): dismissible disclaimer banner with versioned localStorage" \
  "P11/4 — LegalDisclaimer now persists a dismissed state via legal-disclaimer-dismissed-v1 localStorage key. Bump LEGAL_DISCLAIMER_VERSION to re-show on material legal text updates. Cross-tab sync via storage event. Privacy-mode + SSR safe. i18n via legal.disclaimer.dismissAriaLabel (TR + EN). A11y: aria-label on dismiss button, focus-visible ring, role=alert + aria-live polite preserved." \
  "src/components/legal/LegalDisclaimer.tsx" \
  "public/locales/tr/legal.json" \
  "public/locales/en/legal.json"

# ─── P11-C3 — Sentry probe + integration-health Sentry add ─────────────
stage_commit \
  "feat(devops): Sentry test event probe + integration-health Sentry host check" \
  "P11/5 — scripts/probe-sentry-event.mjs sends a single synthetic event to the configured DSN to verify ingestion. integration-health.mjs --probe now also checks Sentry ingest host reachability (no PII sent). See outputs/P11_E2E.md." \
  "scripts/probe-sentry-event.mjs" \
  "scripts/integration-health.mjs"

# ─── P11-C4 — Host runner recipes (measure + visual baseline + commit chains) ──
stage_commit \
  "feat(ops): P11 host runner recipes for measure/visual-baseline/commit-chains" \
  "P11 — host-only orchestration: RUN_P11_MEASURE (Lighthouse 5-run × 6-page), RUN_VISUAL_BASELINE (Playwright screenshots × 20 routes × 2 viewports + axe-core + console), APPLY_P10_COMMITS (8-commit atomic chain), APPLY_P11_COMMITS (this chain), READY_TO_PUSH (pre-push validator). Sandbox cannot run headless Chromium nor write to .git/, so these live on the host." \
  "RUN_P11_MEASURE.command" \
  "RUN_VISUAL_BASELINE.command" \
  "scripts/capture-visual-baseline.mjs" \
  "APPLY_P10_COMMITS.command" \
  "APPLY_P11_COMMITS.command" \
  "READY_TO_PUSH.command"

# ─── P11-C5 — Production runbook + incident response ────────────────────
stage_commit \
  "docs(ops): production runbook + incident response procedures" \
  "P11/6 — operator-facing runbook for alarms (Sentry, Render, Hostinger, Telegram, GA4) with triage steps + decision matrices; incident response with P0/P1/P2/P3 severity tiers, communication templates, on-call structure (even for 1-person team), quarterly drill schedule." \
  "docs/PRODUCTION_RUNBOOK.md" \
  "docs/INCIDENT_RESPONSE.md"

# ─── P11-C6 — P11 reports ───────────────────────────────────────────────
stage_commit \
  "docs(p11): commit chain + perf + visual baseline + sprint closure + E2E + final reports" \
  "P11 sprint output reports: commit chain status, Lighthouse re-measure plan, visual regression baseline plan, sprint closure (5 limit items resolved/deferred), backdrop-blur audit, real integration E2E, push readiness, final go/no-go." \
  "outputs/P11_COMMIT_CHAIN.md" \
  "outputs/P11_PERF_FINAL.md" \
  "outputs/P11_VISUAL_BASELINE.md" \
  "outputs/P11_SPRINT_CLOSURE.md" \
  "outputs/P11_BACKDROP_BLUR_AUDIT.md" \
  "outputs/P11_E2E.md" \
  "outputs/P11_PUSH_READY.md" \
  "outputs/P11_FINAL.md"

echo
echo "──────────────────────────────────────────────────────────────"
echo "✅ P11 commit chain applied."
echo "Last 15 commits:"
git log --oneline -15
echo
echo "End: $(date)"
echo "Log: $LOG"
