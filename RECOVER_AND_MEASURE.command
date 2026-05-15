#!/usr/bin/env bash
# RECOVER_AND_MEASURE.command
# Stale lock'ı temizler, kalan iki dosyayı commit eder, ardından RUN_P7_MEASURE'ı çağırır.
# Push YOK.

set -u
cd "$(dirname "$0")"
TS="$(date +%Y%m%d-%H%M%S)"
LOG="outputs/recover-and-measure-${TS}.txt"
mkdir -p outputs

exec > >(tee "$LOG") 2>&1
echo "=== RECOVER_AND_MEASURE başlangıç $(date) ==="

echo ""
echo "--- 1) lock cleanup ---"
ls -la .git/index.lock 2>&1 || echo "(no lock)"
rm -f .git/index.lock 2>&1 || true
ls -la .git/index.lock 2>&1 || echo "lock cleared"

echo ""
echo "--- 2) any orphaned tmp objects ---"
find .git/objects -type f -name 'tmp_obj_*' 2>/dev/null | head -5 || true
find .git/objects -type f -name 'tmp_obj_*' -delete 2>/dev/null || true

echo ""
echo "--- 3) commit pending env template + gitignore ---"
git add .env.production.example .gitignore 2>&1
if git diff --cached --quiet; then
  echo "(nothing staged — skip env commit)"
else
  git commit -m "chore(env): track .env.production.example template + gitignore public/_test probe"
fi

echo ""
echo "--- 4) git status (should be clean) ---"
git status --short

echo ""
echo "--- 5) git log -12 ---"
git log --oneline -12

echo ""
echo "=== Şimdi RUN_P7_MEASURE.command tetikleniyor (15-20 dk) ==="
exec bash ./RUN_P7_MEASURE.command
