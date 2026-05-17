#!/bin/bash
# P39 — Recover from broken rebase (local main = remote main = 6a9aa53)
set -eo pipefail
cd "$(dirname "$0")"

LOG="outputs/P39_RECOVER_$(date +%Y%m%d-%H%M%S).log"
mkdir -p outputs
exec > >(tee -a "$LOG") 2>&1

echo "================================================="
echo "P39 RECOVER — $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================="

echo "=== 0. Abort + cleanup rebase artifacts ==="
git rebase --abort 2>&1 || true
rm -rf .git/rebase-merge .git/rebase-apply 2>/dev/null || true
find .git -name "*.lock" -maxdepth 2 -delete 2>/dev/null || true

echo "=== 1. Restore working tree to main ==="
git checkout -f main 2>&1 | tail -5
git status -b --short | head -3

echo "=== 2. Reset index to HEAD (drop any phantom staging) ==="
git reset HEAD 2>&1 | tail -5

echo "=== 3. Restore moved files from backup (lighthouse, etc.) ==="
LATEST_BACKUP=$(ls -td outputs/p39-pre-rebase-backup-* outputs/p39-untracked-backup-* 2>/dev/null | head -1)
if [ -n "$LATEST_BACKUP" ]; then
  echo "Restoring from: $LATEST_BACKUP"
  for d in lighthouse-reports playwright-report test-results stats.html; do
    if [ -e "$LATEST_BACKUP/$d" ] && [ ! -e "$d" ]; then
      mv "$LATEST_BACKUP/$d" .
      echo "restored $d"
    fi
  done
fi

echo "=== 4. Verify remote sync ==="
git fetch origin main 2>&1 | tail -3
LOCAL_HEAD=$(git rev-parse HEAD)
REMOTE_HEAD=$(git rev-parse origin/main)
echo "Local  HEAD: $LOCAL_HEAD"
echo "Remote HEAD: $REMOTE_HEAD"
if [ "$LOCAL_HEAD" = "$REMOTE_HEAD" ]; then
  echo "✅ MATCH — local main == remote main"
else
  echo "⚠️ MISMATCH"
  exit 1
fi

echo "=== 5. Commit count on remote ==="
git rev-list --count origin/main | awk '{print "Remote main: " $1 " commits total"}'

echo "=== 6. Latest 5 commits on main ==="
git log --oneline -5

echo ""
echo "================================================="
echo "✅ RECOVER COMPLETE — $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================="

TELEGRAM_BOT_TOKEN="8858261035:AAFYeuQ1yLXRn10dSKAxkDjqnUoaRcN-oTg"
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=6244341128" \
  -d "text=✅ P39 RECOVER: local main restored. HEAD=$(git rev-parse --short HEAD) — eCy-coding/danisman synced." > /dev/null || true

echo ""
echo "Pencereyi kapatabilirsin."
