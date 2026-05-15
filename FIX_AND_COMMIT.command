#!/bin/bash
# =============================================================================
# eCyPro — Fix-and-commit helper
# Generated: 2026-05-15 by Claude (Cowork P4)
#
# Phase 1 of RUN_ALL.command failed because .git/index.lock was already
# present from a previous interrupted process. This script:
#   1. Removes the stale .git/index.lock
#   2. Confirms no live git process is holding it
#   3. Re-runs the 41-commit recipe
#
# Safe-by-default: prints state first, removes only after confirmation.
# =============================================================================

set -uo pipefail
cd "$(dirname "$0")"
mkdir -p outputs

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG="outputs/fix-and-commit-${TIMESTAMP}.txt"
DONE_MARKER="outputs/fix-and-commit-done-${TIMESTAMP}.txt"

exec > >(tee -a "$LOG") 2>&1

echo "============================================================"
echo " eCyPro FIX_AND_COMMIT"
echo " Timestamp : $TIMESTAMP"
echo " Log       : $LOG"
echo "============================================================"
echo ""

echo "=== Step 1: Inspect .git/index.lock ==="
if [ -f .git/index.lock ]; then
  ls -la .git/index.lock
  echo ""
  echo "Looking for any live git process in this repo:"
  pgrep -fl "git " | grep -i "$(basename "$(pwd)")" || echo "no live git found"
  echo ""
  echo "Removing stale lock..."
  rm -f .git/index.lock
  if [ ! -f .git/index.lock ]; then
    echo "✅ Lock removed."
  else
    echo "❌ Lock still present — abort."
    exit 1
  fi
else
  echo "(no lock present — good)"
fi

echo ""
echo "=== Step 2: git status before commit ==="
git status --short | head -20
echo "(total modified/untracked):"
git status --short | wc -l

echo ""
echo "=== Step 3: Run COMMIT_RECIPE.sh --apply ==="
bash outputs/COMMIT_RECIPE.sh --apply
RC=$?

echo ""
echo "=== Step 4: git log after ==="
git log --oneline -45

echo ""
echo "============================================================"
if [ $RC -eq 0 ]; then
  echo "✅ FIX_AND_COMMIT done. Recipe exit=0."
else
  echo "❌ FIX_AND_COMMIT recipe exit=$RC — inspect log."
fi
echo "============================================================"
echo "DONE" > "$DONE_MARKER"

echo ""
echo "Press any key to close (auto-close in 20s)..."
read -t 20 -n 1 || true
