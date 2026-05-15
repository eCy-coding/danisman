#!/bin/bash
# =============================================================================
# eCyPro — RUN_ALL master pipeline (P4 end-to-end automation)
# Generated: 2026-05-15 by Claude (Cowork P4)
#
# WHY:
#   Sandbox cannot:
#     - acquire .git/index.lock → cannot commit
#     - run esbuild darwin-arm64 binary → cannot `vite build`
#     - run headless Chrome → cannot Lighthouse / Playwright
#   Host (this Mac) can do all of the above. This script runs the full local
#   publish-readiness pipeline so Claude can verify results via the log file.
#
# USAGE:
#   Double-click in Finder, or:  bash ~/Desktop/ecypro/RUN_ALL.command
#
# NO PUSH. NO DEPLOY. Local-only.
# =============================================================================

set -uo pipefail

cd "$(dirname "$0")"
mkdir -p outputs

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG="outputs/run-all-log-${TIMESTAMP}.txt"
DONE_MARKER="outputs/run-all-done-${TIMESTAMP}.txt"

# Tee everything to log
exec > >(tee -a "$LOG") 2>&1

echo "============================================================"
echo " eCyPro RUN_ALL pipeline"
echo " Timestamp : $TIMESTAMP"
echo " Project   : $(pwd)"
echo " Node      : $(node --version 2>/dev/null || echo 'n/a')"
echo " npm       : $(npm --version 2>/dev/null || echo 'n/a')"
echo " Log       : $LOG"
echo "============================================================"
echo ""

# Helper: run a phase, capture exit code, never abort the script
run_phase() {
  local name="$1"; shift
  local start
  start=$(date +%s)
  echo ""
  echo "------------------------------------------------------------"
  echo "▶▶▶ $name"
  echo "    cmd: $*"
  echo "    started: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "------------------------------------------------------------"
  local rc=0
  "$@" || rc=$?
  local dur=$(( $(date +%s) - start ))
  if [ $rc -eq 0 ]; then
    echo ""
    echo "✅ $name  (exit=0, ${dur}s)"
  else
    echo ""
    echo "❌ $name  (exit=$rc, ${dur}s)"
  fi
  return 0
}

PHASE_FAILS=()
mark() {
  if [ "$1" -ne 0 ]; then PHASE_FAILS+=("$2"); fi
}

# =============================================================================
# Phase 1: Apply 41 atomic commits (COMMIT_RECIPE.sh --apply)
# =============================================================================
echo ""
echo "============================================================"
echo "=== Phase 1: Apply 41 atomic commits (recipe --apply) ==="
echo "============================================================"
P1_RC=0
bash outputs/COMMIT_RECIPE.sh --apply || P1_RC=$?
mark $P1_RC "Phase 1 (commits)"
echo "Phase 1 exit: $P1_RC"

# =============================================================================
# Phase 2: Typecheck (web + server, strict)
# =============================================================================
P2_RC=0
run_phase "Phase 2 — Typecheck (web + server)" npm run typecheck
P2_RC=${PIPESTATUS[0]:-0}
# capture rc properly from npm
( npm run typecheck >/dev/null 2>&1 ) && P2_RC=0 || P2_RC=$?
mark $P2_RC "Phase 2 (typecheck)"

# =============================================================================
# Phase 3: Lint
# =============================================================================
P3_RC=0
echo ""
echo "============================================================"
echo "=== Phase 3: ESLint ==="
echo "============================================================"
npm run lint || P3_RC=$?
mark $P3_RC "Phase 3 (lint)"
echo "Phase 3 exit: $P3_RC"

# =============================================================================
# Phase 4: Unit tests (Vitest)
# =============================================================================
P4_RC=0
echo ""
echo "============================================================"
echo "=== Phase 4: Unit tests (Vitest single-pass) ==="
echo "============================================================"
npm test -- --run --reporter=default || P4_RC=$?
mark $P4_RC "Phase 4 (unit tests)"
echo "Phase 4 exit: $P4_RC"

# =============================================================================
# Phase 5: Server tests
# =============================================================================
P5_RC=0
echo ""
echo "============================================================"
echo "=== Phase 5: Server tests (vitest server config) ==="
echo "============================================================"
npm run test:server || P5_RC=$?
mark $P5_RC "Phase 5 (server tests)"
echo "Phase 5 exit: $P5_RC"

# =============================================================================
# Phase 6: Content QA (parity + missing)
# =============================================================================
P6_RC=0
echo ""
echo "============================================================"
echo "=== Phase 6: Content QA (parity + missing) ==="
echo "============================================================"
npm run qa:parity || P6_RC=$?
node scripts/content-qa.mjs --check missing || P6_RC=$?
mark $P6_RC "Phase 6 (content QA)"
echo "Phase 6 exit: $P6_RC"

# =============================================================================
# Phase 7: Build (vite, the big one — needs host arm64 esbuild)
# =============================================================================
P7_RC=0
echo ""
echo "============================================================"
echo "=== Phase 7: Production build (vite) ==="
echo "============================================================"
npm run build || P7_RC=$?
mark $P7_RC "Phase 7 (build)"
echo "Phase 7 exit: $P7_RC"
if [ -d dist ]; then
  echo "dist/ exists, top-level entries:"
  ls -la dist | head -20
fi

# =============================================================================
# Phase 8: Bundle size budget (size-limit)
# =============================================================================
P8_RC=0
echo ""
echo "============================================================"
echo "=== Phase 8: Size-limit budget check ==="
echo "============================================================"
if npx --no-install size-limit --help >/dev/null 2>&1; then
  npx size-limit || P8_RC=$?
elif [ -f node_modules/.bin/size-limit ]; then
  node_modules/.bin/size-limit || P8_RC=$?
else
  echo "⚠️  size-limit not installed locally. Skipping. Install with:"
  echo "    npm install -D size-limit @size-limit/preset-app"
  P8_RC=0
fi
mark $P8_RC "Phase 8 (size-limit)"
echo "Phase 8 exit: $P8_RC"

# =============================================================================
# Phase 9: Smoke test (preview + smoke-test.mjs)
# =============================================================================
P9_RC=0
PREVIEW_PID=""
echo ""
echo "============================================================"
echo "=== Phase 9: Smoke test on preview (localhost:4173) ==="
echo "============================================================"
if [ -d dist ]; then
  # P5-3c — Clear port 4173 before launching preview. P4 + first P5 RUN_ALL
  # passes all saw "Port 4173 is in use, trying another one... :4174" which
  # meant smoke was hitting whatever stale server was squatting on 4173,
  # not our fresh preview — every "missing content" failure had body=13690B
  # from that other process. Kill it first so vite preview can bind 4173.
  STALE=$(lsof -ti tcp:4173 2>/dev/null || true)
  if [ -n "$STALE" ]; then
    echo "▶ Clearing stale process(es) on port 4173: $STALE"
    kill $STALE 2>/dev/null || true
    sleep 1
    kill -9 $STALE 2>/dev/null || true
    sleep 1
  fi

  ( npm run preview > outputs/preview-${TIMESTAMP}.log 2>&1 ) &
  PREVIEW_PID=$!
  echo "preview pid=$PREVIEW_PID, waiting 8s for boot..."
  sleep 8

  # Sanity-check that preview really bound 4173 (and didn't fall back to 4174).
  BOUND=$(lsof -ti tcp:4173 2>/dev/null || true)
  if [ -z "$BOUND" ]; then
    echo "❌ Nothing listening on :4173 after 8s — preview likely failed."
    tail -20 outputs/preview-${TIMESTAMP}.log 2>/dev/null || true
    P9_RC=1
  elif kill -0 "$PREVIEW_PID" 2>/dev/null; then
    echo "✓ preview bound :4173 (pids: $BOUND)"
    node scripts/smoke-test.mjs --url http://localhost:4173 || P9_RC=$?
  else
    echo "❌ preview server died before smoke could run"
    tail -20 outputs/preview-${TIMESTAMP}.log 2>/dev/null || true
    P9_RC=1
  fi
  # P5-3c — Keep preview alive for Phase 10 (Lighthouse). It will be cleaned
  # up at the bottom of Phase 10. Previously Phase 9 killed preview here and
  # Phase 10 reported P=0/A=0/SEO=0 because lighthouse.ts assumes a server is
  # already running.
else
  echo "⚠️  dist/ yok (Phase 7 patladı), smoke atlanıyor"
  P9_RC=1
fi
mark $P9_RC "Phase 9 (smoke)"
echo "Phase 9 exit: $P9_RC"

# =============================================================================
# Phase 10: Lighthouse audit
# =============================================================================
P10_RC=0
echo ""
echo "============================================================"
echo "=== Phase 10: Lighthouse audit ==="
echo "============================================================"
# P5-3c — Verify preview is still alive (Phase 9 used to kill it). If not,
# spawn a fresh one before lighthouse runs.
LH_PREVIEW_BOUND=$(lsof -ti tcp:4173 2>/dev/null || true)
LH_PREVIEW_PID=""
if [ -z "$LH_PREVIEW_BOUND" ]; then
  echo "▶ No preview on :4173 — spawning a fresh one for lighthouse."
  ( npm run preview > outputs/preview-lh-${TIMESTAMP}.log 2>&1 ) &
  LH_PREVIEW_PID=$!
  sleep 8
fi
if npm run lh:audit; then
  P10_RC=0
else
  P10_RC=$?
  echo "⚠️  lh:audit failed or skipped (headless Chrome / config). Continuing."
fi
# Tear down preview (whether started here or kept alive from Phase 9).
LH_PIDS=$(lsof -ti tcp:4173 2>/dev/null || true)
if [ -n "$LH_PIDS" ]; then
  echo "Stopping preview after lighthouse (pids: $LH_PIDS)"
  kill $LH_PIDS 2>/dev/null || true
  sleep 1
  kill -9 $LH_PIDS 2>/dev/null || true
fi
[ -n "${PREVIEW_PID:-}" ] && kill "$PREVIEW_PID" 2>/dev/null || true
mark $P10_RC "Phase 10 (lighthouse)"
echo "Phase 10 exit: $P10_RC"

# =============================================================================
# Phase 11: Prisma baseline migration (only if .env DATABASE_URL present)
# =============================================================================
P11_RC=0
echo ""
echo "============================================================"
echo "=== Phase 11: Prisma baseline migration (conditional) ==="
echo "============================================================"
if [ -f .env ] && grep -qE '^DATABASE_URL=' .env; then
  if [ -d prisma/migrations/baseline_p3_2026_05_15 ]; then
    echo "⚠️  Baseline migration already exists; skipping."
  else
    npx prisma migrate dev --name baseline_p3_2026_05_15 || P11_RC=$?
    if [ $P11_RC -eq 0 ] && [ -d prisma/migrations ]; then
      git add prisma/migrations || true
      git diff --cached --quiet || git commit -m "chore(db): add P3 baseline migration (2026-05-15)

Captures current Prisma schema as the baseline migration so future
deployments have a deterministic SQL artifact rather than db push only.

Generated by RUN_ALL.command Phase 11." || true
    fi
  fi
else
  echo "⚠️  .env or DATABASE_URL missing — skipping Prisma baseline."
fi
mark $P11_RC "Phase 11 (prisma)"
echo "Phase 11 exit: $P11_RC"

# =============================================================================
# Phase 12: Git log summary
# =============================================================================
echo ""
echo "============================================================"
echo "=== Phase 12: Git log summary (last 50) ==="
echo "============================================================"
git log --oneline -50 || true

# =============================================================================
# Phase 13: Final git status
# =============================================================================
echo ""
echo "============================================================"
echo "=== Phase 13: Final git status ==="
echo "============================================================"
git status --short || true
echo ""
echo "Branch + remote:"
git branch -vv || true
git remote -v || true

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "============================================================"
echo "=== SUMMARY ==="
echo "============================================================"
if [ ${#PHASE_FAILS[@]} -eq 0 ]; then
  echo "🟢 All phases reported success."
else
  echo "🟡 Phases with non-zero exit:"
  for f in "${PHASE_FAILS[@]}"; do echo "   - $f"; done
fi
echo ""
echo "Log file: $LOG"
echo "=== DONE @ $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="

# Sentinel for the poller — also keep terminal window open
echo "DONE" > "$DONE_MARKER"

echo ""
echo "Press any key to close this window..."
# Don't actually block forever; auto-close after 30s but allow keypress
read -t 30 -n 1 || true
