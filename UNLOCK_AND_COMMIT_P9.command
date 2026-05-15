#!/usr/bin/env bash
# UNLOCK_AND_COMMIT_P9.command
# Stale .git/index.lock'ı kaldırır ve P7 + P8 commit'lerini atomik şekilde yazar.
# Push YOK. Host Finder Cmd+O ile çalıştır.

set -u
cd "$(dirname "$0")"
TS="$(date +%Y%m%d-%H%M%S)"
LOG="outputs/unlock-commit-p9-${TS}.txt"
DONE="outputs/unlock-commit-p9-done-${TS}.txt"
mkdir -p outputs

exec > >(tee "$LOG") 2>&1
echo "=== UNLOCK_AND_COMMIT_P9 başlangıç $(date) ==="

echo ""
echo "--- 1) lock state ---"
ls -la .git/index.lock 2>&1 || echo "(no lock)"

echo ""
echo "--- 2) attempting removal ---"
if [ -f .git/index.lock ]; then
  chmod u+w .git/index.lock 2>/dev/null || true
  chflags nouchg,noschg .git/index.lock 2>/dev/null || true
  rm -f .git/index.lock 2>&1
  if [ -f .git/index.lock ]; then
    echo "!!! lock still present, trying sudo (will prompt) !!!"
    sudo rm -f .git/index.lock || true
  fi
fi
ls -la .git/index.lock 2>&1 || echo "lock removed OK"

echo ""
echo "--- 3) git config ---"
git config user.name  || git config user.name  "emre"
git config user.email || git config user.email "emrecnyn@gmail.com"

echo ""
echo "--- 4) git status (start) ---"
git status --short

# Helper — atomic commit
commit_files () {
  local msg="$1"; shift
  local files=("$@")
  echo ""
  echo "=== $msg ==="
  local present=()
  for f in "${files[@]}"; do
    if [ -e "$f" ] || git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
      present+=("$f")
    fi
  done
  if [ ${#present[@]} -eq 0 ]; then
    echo "(no files to add — skip)"
    return 0
  fi
  git add -- "${present[@]}"
  # commit only if there is something staged
  if git diff --cached --quiet; then
    echo "(nothing staged after add — skip)"
    return 0
  fi
  git commit -m "$msg" || echo "!!! commit failed"
}

echo ""
echo "===================================================================="
echo " P7 ROUND A/B/C + RELATED COMMITS"
echo "===================================================================="

commit_files "perf(boot): lazy-init Sentry + analytics via requestIdleCallback (Round A)
P7 Round A — defer non-critical boot work off the critical path. Falls back to setTimeout(1500) when requestIdleCallback is unavailable." \
  src/App.tsx

commit_files "perf(html): move 4 JSON-LD blocks to end of <body> (Round B)
P7 Round B — keep <head> small for faster parse + FCP. SEO-equivalent (Schema.org position-agnostic)." \
  index.html

commit_files "perf(bundle): drop console.* and debugger statements in production build (Round C)
P7 Round C — esbuild.drop = ['console','debugger'] when mode === 'production'. Net bundle reduction." \
  vite.config.ts

commit_files "perf(analytics): replace MutationObserver(body, subtree) with History API patch
P8 fix — ServicesPage Lighthouse PAGE_HUNG root cause was analyticsConsumer body-subtree observer firing on every DOM mutation. Switching to history.pushState/replaceState/popstate patches captures route changes deterministically and cuts the work entirely.
See outputs/P8_SERVICES_HANG_FIX.md" \
  src/lib/director/analytics-consumer.ts

commit_files "feat(observability): scrub PII via Sentry beforeSend + replay masking (FE+BE)
- FE beforeSend: redact email/IP/username, cookies, Authorization, query string
- FE beforeBreadcrumb: drop console.* breadcrumbs in production
- FE setUser: pass only id (no email/username bypass)
- FE session replay: maskAllText, maskAllInputs, blockAllMedia
- FE tracePropagationTargets: locked to first-party origins
- BE beforeSend: redact request.data/cookies/headers/query_string
See outputs/P8_SECURITY_AUDIT.md" \
  src/lib/sentry.ts server/index.ts

commit_files "fix(a11y): Footer target-size + LanguageToggle dynamic aria-label
Restore P5 a11y fixes that were never committed." \
  src/components/layout/Footer.tsx src/components/ui/LanguageToggle.tsx

commit_files "perf(services): lazy-mount heavy widgets, drop layout motion wrappers
ServicesPage tree weight reduction." \
  src/pages/ServicesPage.tsx src/components/services/ServiceCard.tsx

commit_files "chore(seo): refresh sitemap lastmod, rss, og-image, blog metadata" \
  public/sitemap.xml public/sitemap-en.xml public/sitemap-tr.xml public/rss.xml public/og-image.jpg src/data/blog-posts.json

commit_files "docs(perf): update PERFORMANCE_REPORT with P6/P7 baseline + plan" \
  docs/PERFORMANCE_REPORT.md

commit_files "chore(p7-p9): add host runner recipes (FIX/RUN/COMMIT/PRECHECK/UNLOCK)" \
  COMMIT_P7_ROUNDS.command DEPLOY_BACKEND_RENDER.command DEPLOY_FRONTEND_HOSTINGER.command \
  DEPLOY_PRECHECK.command FIX_AND_COMMIT.command FIX_P5.command FIX_P7.command \
  RUN_ALL.command RUN_LH5RUN.command RUN_LH5RUN_FIX.command RUN_P7_MEASURE.command \
  UNLOCK_AND_COMMIT_P9.command scripts/lh-5run.mjs .env.production.example

commit_files "docs(p7-p8): final phase reports (perf decision, hang fix, security, precheck, deploy bridge, ready)" \
  outputs/P7_COMMIT_TRIAGE.md outputs/P7_FINAL_REPORT.md outputs/P7_SERVICES_HANG_ROOT_CAUSE.md \
  outputs/P8_PERF_DECISION.md outputs/P8_SERVICES_HANG_FIX.md outputs/P8_SECURITY_AUDIT.md \
  outputs/P8_CSP_REVIEW.md outputs/P8_PRECHECK_TRIAGE.md outputs/READY_FOR_DEPLOY.md \
  outputs/DEPLOY_BRIDGE.md outputs/RESUME_STATE_REPORT.md

echo ""
echo "--- git status (end) ---"
git status --short

echo ""
echo "--- git log -15 ---"
git log --oneline -15

echo ""
echo "=== UNLOCK_AND_COMMIT_P9 bitti $(date) ==="
cp "$LOG" "$DONE"
