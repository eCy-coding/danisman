#!/usr/bin/env bash
# eCyPro — Push readiness gate (host-only)
# P11/7 — release-coordinator
#
# Runs every quality gate that should be green before pushing main. Prints the
# exact push command if all gates pass — DOES NOT push automatically. Push
# remains a deliberate, explicit user action.

set -uo pipefail
cd "$(dirname "$0")"

TS=$(date +%Y%m%d-%H%M%S)
LOG="outputs/ready-to-push-${TS}.log"
mkdir -p outputs
exec > >(tee -a "$LOG") 2>&1

echo "============================================================"
echo " eCyPro — Push readiness gate"
echo " Timestamp : $TS"
echo " Log       : $LOG"
echo "============================================================"

PASS=0
FAIL=0
WARN=0

ok () { echo "✅ $*"; PASS=$((PASS+1)); }
fail () { echo "❌ $*"; FAIL=$((FAIL+1)); }
warn () { echo "⚠  $*"; WARN=$((WARN+1)); }

# ─── 1. Git status ─────────────────────────────────────────────────────
echo
echo "▶ 1. Git working tree"
STATUS_LINES=$(git status --porcelain | grep -vE "^\?\?\s+outputs/" | grep -v "^M outputs/" || true)
if [ -z "$STATUS_LINES" ]; then
  ok "Working tree clean (outputs/ ignored for this check)"
else
  warn "Uncommitted changes outside outputs/:"
  echo "$STATUS_LINES" | head -10 | sed 's/^/    /'
fi

# ─── 2. Branch is main ─────────────────────────────────────────────────
echo
echo "▶ 2. Branch is main"
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "main" ]; then
  ok "Current branch: main"
else
  fail "Current branch: $BRANCH (expected main)"
fi

# ─── 3. Remote configured ──────────────────────────────────────────────
echo
echo "▶ 3. Remote origin configured"
REMOTE=$(git remote get-url origin 2>/dev/null || true)
if [ -n "$REMOTE" ]; then
  ok "origin: $REMOTE"
else
  fail "No 'origin' remote configured. Add it before pushing:"
  echo "    git remote add origin git@github.com:<user>/ecypro.git"
fi

# ─── 4. Commits ahead of origin ────────────────────────────────────────
echo
echo "▶ 4. Commits ahead of origin/main"
if git rev-parse --verify origin/main >/dev/null 2>&1; then
  AHEAD=$(git rev-list --count origin/main..HEAD)
  if [ "$AHEAD" -gt 0 ]; then
    ok "$AHEAD commits ahead of origin/main"
    git log --oneline origin/main..HEAD | head -30 | sed 's/^/    /'
  else
    warn "0 commits ahead — nothing to push"
  fi
else
  warn "origin/main not yet known (first push). Counting from initial commit:"
  COUNT=$(git rev-list --count HEAD)
  echo "    HEAD = $COUNT total commits"
fi

# ─── 5. Typecheck ──────────────────────────────────────────────────────
echo
echo "▶ 5. TypeScript typecheck (web + server)"
if npm run typecheck > "outputs/ready-typecheck-${TS}.log" 2>&1; then
  ok "Typecheck PASS"
else
  fail "Typecheck FAIL — see outputs/ready-typecheck-${TS}.log"
fi

# ─── 6. Lint ───────────────────────────────────────────────────────────
echo
echo "▶ 6. ESLint"
if npm run lint > "outputs/ready-lint-${TS}.log" 2>&1; then
  ok "Lint PASS"
else
  fail "Lint FAIL — see outputs/ready-lint-${TS}.log"
fi

# ─── 7. Unit tests ─────────────────────────────────────────────────────
echo
echo "▶ 7. Vitest (web + server)"
if npm test -- --run > "outputs/ready-test-${TS}.log" 2>&1; then
  ok "Tests PASS"
else
  fail "Tests FAIL — see outputs/ready-test-${TS}.log"
fi

# ─── 8. Build ──────────────────────────────────────────────────────────
echo
echo "▶ 8. Production build"
if npm run build > "outputs/ready-build-${TS}.log" 2>&1; then
  ok "Build PASS"
else
  fail "Build FAIL — see outputs/ready-build-${TS}.log"
fi

# ─── 9. Integration health ─────────────────────────────────────────────
echo
echo "▶ 9. Integration health (env validation only, no live probe)"
if [ -f .env.production ]; then
  if node scripts/integration-health.mjs > "outputs/ready-integ-${TS}.log" 2>&1; then
    ok "Integration health PASS (0 FAIL)"
  else
    warn "Integration health has FAIL items — see outputs/ready-integ-${TS}.log"
  fi
else
  warn ".env.production missing — skip integration health"
fi

# ─── 10. Gitleaks (secret scan) ────────────────────────────────────────
echo
echo "▶ 10. Secret scan (gitleaks)"
if command -v gitleaks >/dev/null 2>&1; then
  if gitleaks detect --no-banner --redact > "outputs/ready-gitleaks-${TS}.log" 2>&1; then
    ok "No secrets detected"
  else
    fail "gitleaks found potential secrets — see outputs/ready-gitleaks-${TS}.log"
  fi
else
  warn "gitleaks not installed (brew install gitleaks recommended)"
fi

# ─── Summary ───────────────────────────────────────────────────────────
echo
echo "════════════════════════════════════════════════════════════"
echo " Summary: PASS=$PASS  WARN=$WARN  FAIL=$FAIL"
echo "════════════════════════════════════════════════════════════"
echo

if [ $FAIL -gt 0 ]; then
  echo "🛑 Not ready to push. Resolve the $FAIL FAIL items above, then re-run."
  exit 1
fi

# ─── Push instruction (NOT executed) ──────────────────────────────────
echo "✅ All gates green."
echo
echo "Manual next step (Claude will NOT push for you):"
echo
echo "    git push origin main"
echo
echo "After push:"
echo "    cp .env.production.example .env.production    # if not already"
echo "    \$EDITOR .env.production                       # fill real values"
echo "    ./DEPLOY_NOW.command                           # deploy chain"
echo
exit 0
