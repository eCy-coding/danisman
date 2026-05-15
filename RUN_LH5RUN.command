#!/bin/bash
# =============================================================================
# eCyPro — Lighthouse 5-run median runner (P6 measurement tool)
#
# WHY:
#   Sandbox cannot run headless Chrome. This script builds, starts vite preview
#   on :4173, runs scripts/lh-5run.mjs (mobile + slow 4G + 5 runs per page),
#   then tears down preview. Pass an optional tag arg via $1 (defaults baseline).
#
# USAGE (host):
#   bash ~/Desktop/ecypro/RUN_LH5RUN.command [tag]   # CLI
#   double-click in Finder                            # baseline tag
#
# NO PUSH. NO DEPLOY. Local-only.
# =============================================================================

set -uo pipefail
cd "$(dirname "$0")"
mkdir -p outputs

TAG="${1:-baseline}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG="outputs/lh5run-${TAG}-${TIMESTAMP}.txt"
DONE_MARKER="outputs/lh5run-${TAG}-done-${TIMESTAMP}.txt"

exec > >(tee -a "$LOG") 2>&1

echo "============================================================"
echo " eCyPro Lighthouse 5-run · tag=${TAG}"
echo " Timestamp : $TIMESTAMP"
echo " Log       : $LOG"
echo "============================================================"

# Phase 1 — Build
# - Always build for non-"baseline" tags (P6 iteration rounds need fresh dist)
# - For "baseline" tag, skip if dist/ is newer than vite.config.ts AND any src file
NEWEST_SRC=$(find src vite.config.ts index.html package.json 2>/dev/null -type f -newer dist/index.html 2>/dev/null | head -1)
if [ "$TAG" = "baseline" ] && [ -f dist/index.html ] && [ -z "$NEWEST_SRC" ] && [ "${LH_REBUILD:-0}" = "0" ]; then
  echo "▶ dist/ exists and is fresh. Skipping build. (LH_REBUILD=1 forces rebuild)"
else
  if [ -n "$NEWEST_SRC" ]; then echo "▶ src changes detected (e.g. $NEWEST_SRC) → rebuilding"; fi
  echo "▶ npm run build"
  if ! npm run build; then
    echo "❌ build failed"
    echo "FAIL build $(date)" > "$DONE_MARKER"
    exit 1
  fi
fi

# Phase 2 — Clear port 4173 before preview
echo "▶ Clearing port 4173"
PIDS=$(lsof -ti tcp:4173 2>/dev/null || true)
if [ -n "$PIDS" ]; then
  echo "  killing stale pids: $PIDS"
  kill -9 $PIDS 2>/dev/null || true
  sleep 1
fi

# Phase 3 — Start preview in background
echo "▶ Starting preview on :4173"
( npm run preview > "outputs/preview-lh5run-${TAG}-${TIMESTAMP}.log" 2>&1 ) &
PREVIEW_PID=$!
echo "  preview pid=$PREVIEW_PID"

# Wait up to 12s for preview to bind
for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
  if lsof -ti tcp:4173 2>/dev/null | grep -q .; then
    echo "  ✓ preview bound :4173 (after ${i}s)"
    break
  fi
  sleep 1
done

if ! lsof -ti tcp:4173 2>/dev/null | grep -q .; then
  echo "❌ preview did not bind :4173 in 12s"
  tail -30 "outputs/preview-lh5run-${TAG}-${TIMESTAMP}.log" 2>/dev/null || true
  kill -9 $PREVIEW_PID 2>/dev/null || true
  echo "FAIL preview $(date)" > "$DONE_MARKER"
  exit 1
fi

# Phase 4 — Run 5-run lighthouse
echo "▶ node scripts/lh-5run.mjs ${TAG}"
PREVIEW_URL=http://localhost:4173 node scripts/lh-5run.mjs "${TAG}"
LH_RC=$?

# Phase 5 — Tear down preview
echo "▶ Stopping preview"
LH_PIDS=$(lsof -ti tcp:4173 2>/dev/null || true)
if [ -n "$LH_PIDS" ]; then
  kill -9 $LH_PIDS 2>/dev/null || true
fi

if [ $LH_RC -eq 0 ]; then
  echo "OK $(date)" > "$DONE_MARKER"
  echo "✅ DONE — see outputs/lh-${TAG}-* directory for summary.{md,json}"
else
  echo "FAIL lh-5run rc=$LH_RC $(date)" > "$DONE_MARKER"
  echo "❌ lh-5run failed"
  exit $LH_RC
fi
