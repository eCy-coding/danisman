#!/usr/bin/env bash
# eCyPro — P10 Atomic Commit Chain (host-only)
# P11/1 — release-coordinator
#
# Why this lives here: sandbox cannot write to .git/. This recipe applies the
# 8 logical P10 commits on the user's host machine.
#
# Idempotent: each commit checks `git diff --cached --name-only` and skips
# if nothing is staged for that commit (already applied in a previous run).
#
# Usage:
#   chmod +x APPLY_P10_COMMITS.command
#   ./APPLY_P10_COMMITS.command
#
# Exit codes: 0 = all commits applied (or already applied), 1 = unexpected error.

set -euo pipefail

cd "$(dirname "$0")"

LOG="outputs/apply-p10-commits-$(date +%Y%m%d-%H%M%S).log"
mkdir -p outputs
exec > >(tee -a "$LOG") 2>&1

echo "=== eCyPro P10 atomic commit chain ==="
echo "Start: $(date)"
echo

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "❌ Not a git repo"
  exit 1
fi

# Refuse to run if working tree has staged changes already
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

  local missing=0
  for p in "${paths[@]}"; do
    if [[ ! -e "$p" ]]; then
      echo "  ⚠ Missing: $p (skip path)"
      missing=$((missing+1))
    fi
  done

  git add -- "${paths[@]}" 2>/dev/null || true

  if git diff --cached --quiet; then
    echo "  ✓ Nothing to commit (already applied or no changes). Skip."
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

# ─── C1 — CSP fix ────────────────────────────────────────────────────────
stage_commit \
  "fix(csp): allow api.telegram.org + cdn.growthbook.io" \
  "Contact form was blocked in production because connect-src did not list api.telegram.org. GrowthBook CDN added to script-src + connect-src so feature flag fetches do not raise CSP violations. See outputs/P10_URL_AUDIT.md §6." \
  "index.html"

# ─── C2 — env template ──────────────────────────────────────────────────
stage_commit \
  "docs(env): require Telegram tokens, deprecate EmailJS" \
  "P5 migration moved contact form notifications to Telegram (src/services/emailService.ts). The env template now reflects runtime reality: Telegram tokens are REQUIRED, EmailJS is optional/deprecated. See outputs/P10_INTEGRATIONS.md." \
  ".env.production.example"

# ─── C3 — integration-health script + 2 slash cmds ──────────────────────
stage_commit \
  "feat(devops): integration-health script + 2 slash commands" \
  "scripts/integration-health.mjs validates .env.production format + (optional --probe) hits live endpoints. Companion slash commands: /integration-health and /url-audit. Exit code 0/1 so it can gate DEPLOY_NOW." \
  "scripts/integration-health.mjs" \
  ".claude/commands/integration-health.md" \
  ".claude/commands/url-audit.md"

# ─── C4 — DEPLOY_NOW master orchestrator ────────────────────────────────
stage_commit \
  "feat(ops): DEPLOY_NOW.command master orchestrator + slash command" \
  "Single-click deploy chain across 7 stages (precheck → render → hostinger → DNS → SSL → smoke → SEO). Credential-gated, fail-safe: missing credentials emit manual instructions, never destructive operations." \
  "DEPLOY_NOW.command" \
  ".claude/commands/deploy-now.md"

# ─── C5 — ServicesPage perf + canonical (same file, cohesive) ───────────
stage_commit \
  "fix(services): break Lighthouse infinite render loop + normalize canonical" \
  "Two diagnostics in one file: (1) Hoist interest tags to module-level constant so useInterestTracker effect does not refire on every render; narrow usePersonalizationStore subscription to the scores slice. Both kill the Lighthouse PROTOCOL_TIMEOUT root cause. (2) Replace ecypro.com canonical + BreadcrumbList URLs with www.ecypro.com per index.html link rel=canonical. See outputs/P10_SERVICESPAGE_FINAL.md and P10_URL_AUDIT.md." \
  "src/pages/ServicesPage.tsx"

# ─── C6 — NotFoundPage polish ───────────────────────────────────────────
stage_commit \
  "feat(404): NotFoundPage i18n + noindex meta + correct internal links" \
  "TR/EN translation keys + <meta name='robots' content='noindex,nofollow'>. Fix /#services anchor (broken) to /services. See outputs/P10_CONTENT_FINAL.md." \
  "src/pages/NotFoundPage.tsx"

# ─── C7 — MAINTENANCE_GUIDE ─────────────────────────────────────────────
stage_commit \
  "docs(ops): MAINTENANCE_GUIDE for operators" \
  "Operator-facing one-stop guide: env variables, slash commands, deploy chain, common troubleshooting. Companion to PROJECT_COMPLETE.md." \
  "docs/MAINTENANCE_GUIDE.md"

# ─── C8 — P10 reports (only the ones marked PROJECT_COMPLETE) ───────────
stage_commit \
  "docs(p10): URL audit + integrations + servicespage + content + deploy + complete reports" \
  "P10 sprint output: URL inventory + audit, integrations health, ServicesPage RCA, content polish, deploy automation, PROJECT_COMPLETE consolidation." \
  "outputs/P10_URL_AUDIT.md" \
  "outputs/P10_INTEGRATIONS.md" \
  "outputs/P10_SERVICESPAGE_FINAL.md" \
  "outputs/P10_CONTENT_FINAL.md" \
  "outputs/P10_DEPLOY_AUTOMATION.md" \
  "outputs/PROJECT_COMPLETE.md"

echo
echo "──────────────────────────────────────────────────────────────"
echo "✅ P10 commit chain applied."
echo "Last 10 commits:"
git log --oneline -10
echo
echo "End: $(date)"
echo "Log: $LOG"
