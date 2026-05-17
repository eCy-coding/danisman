#!/bin/bash
# P39 — Push RETRY (lock-safe, fail-strict)
set -eo pipefail
cd "$(dirname "$0")"

REPO_DIR="$(pwd)"
LOG="$REPO_DIR/outputs/P39_PUSH_RETRY_$(date +%Y%m%d-%H%M%S).log"
mkdir -p outputs

# Disable any tee tricks so set -e propagates
{
echo "================================================="
echo "P39 PUSH RETRY — $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================="

echo "=== 0. Kill rogue git ==="
pkill -f "git " 2>/dev/null || true
sleep 1

echo "=== 1. Force-clean locks ==="
find .git -name "*.lock" -maxdepth 2 -print -delete 2>/dev/null || true
ls .git/*.lock 2>/dev/null && echo "WARN: still locks" || echo "no locks left"

echo "=== 2. Identity ==="
git config user.name
git config user.email

echo "=== 3. Status ==="
git status --short | wc -l | awk '{print "Dirty files:", $1}'
git log --oneline -1

echo "=== 4. Fetch ==="
git fetch origin main

echo "=== 5. Position ==="
LOCAL_AHEAD=$(git rev-list --count origin/main..HEAD)
REMOTE_AHEAD=$(git rev-list --count HEAD..origin/main)
echo "Local ahead: $LOCAL_AHEAD | Remote ahead: $REMOTE_AHEAD"

echo "=== 6. Pre-rebase lock cleanup ==="
find .git -name "*.lock" -maxdepth 2 -print -delete 2>/dev/null || true

echo "=== 7. Rebase ==="
if [ "$REMOTE_AHEAD" -gt 0 ]; then
  git rebase origin/main 2>&1 | tail -20
  REBASE_EXIT=$?
  echo "rebase exit: $REBASE_EXIT"
  if [ $REBASE_EXIT -ne 0 ]; then
    echo "❌ REBASE FAILED — aborting"
    git rebase --abort 2>/dev/null || true
    exit 1
  fi
else
  echo "skip rebase"
fi

echo "=== 8. PUSH ==="
git push origin main 2>&1 | tee /tmp/push_output.txt
PUSH_EXIT=${PIPESTATUS[0]}
echo "push exit: $PUSH_EXIT"

if [ "$PUSH_EXIT" -ne 0 ]; then
  echo ""
  echo "❌ PUSH FAILED (exit=$PUSH_EXIT)"
  if grep -q "non-fast-forward\|rejected" /tmp/push_output.txt; then
    echo "Remote diverged. Retry rebase forcefully."
    find .git -name "*.lock" -maxdepth 2 -delete 2>/dev/null
    git pull --rebase origin main 2>&1 | tail -10
    echo "=== retry push ==="
    git push origin main 2>&1 | tail -10
    PUSH_EXIT2=$?
    if [ $PUSH_EXIT2 -ne 0 ]; then
      echo "❌ Second push also failed (exit=$PUSH_EXIT2)"
      exit $PUSH_EXIT2
    fi
  else
    exit $PUSH_EXIT
  fi
fi

echo ""
echo "=== 9. Verify on remote ==="
git fetch origin main
LOCAL_HEAD=$(git rev-parse HEAD)
REMOTE_HEAD=$(git rev-parse origin/main)
echo "Local  HEAD: $LOCAL_HEAD"
echo "Remote HEAD: $REMOTE_HEAD"
if [ "$LOCAL_HEAD" = "$REMOTE_HEAD" ]; then
  echo "✅ HEADs match — push verified"
else
  echo "⚠️ HEADs differ"
fi

echo "================================================="
echo "✅ PUSH COMPLETE — $(date '+%Y-%m-%d %H:%M:%S')"
echo "📜 Log: $LOG"
echo "================================================="

TELEGRAM_BOT_TOKEN="8858261035:AAFYeuQ1yLXRn10dSKAxkDjqnUoaRcN-oTg"
TELEGRAM_CHAT_ID="6244341128"
HEAD_SHA=$(git rev-parse --short HEAD)
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=${TELEGRAM_CHAT_ID}" \
  -d "text=✅ P39 RETRY: GitHub push tamamlandı. HEAD=${HEAD_SHA} → eCy-coding/danisman:main" > /dev/null || true

echo ""
echo "Pencereyi kapatabilirsin."
} 2>&1 | tee "$LOG"
