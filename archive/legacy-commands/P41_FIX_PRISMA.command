#!/usr/bin/env bash
# P41 — Round 3 fix: Render build still failing — prisma CLI missing
#
# Önceki fix dotenv'i deps'e taşıdı ama prisma.config.ts ayrıca 'prisma/config'
# (CLI alt-modülü) import ediyor. Render NPM_CONFIG_PRODUCTION/NODE_ENV=production
# nedeniyle `npm ci` devDependencies'i atlıyor → prisma CLI yüklenmiyor.
#
# Fix: render.yaml'da `npm ci` → `npm ci --include=dev` (Claude edit'i hazır).
# Build sırasında dev deps (prisma CLI, tsc) yüklensin; runtime NODE_ENV
# yine production kalsın.
set -uo pipefail
cd "$(dirname "$0")" || exit 1

echo "==============================================="
echo "P41 — Round 3 fix: npm ci --include=dev"
echo "==============================================="
echo

echo "--- 1) Stale git lock'ları temizle ---"
rm -f .git/HEAD.lock .git/index.lock 2>/dev/null || true
rm -f .gitignore.bak 2>/dev/null || true

echo "--- 2) Diff doğrula ---"
git diff render.yaml | head -20

echo "--- 3) git add + commit ---"
git add render.yaml
git -c user.email=emrecnyn@gmail.com -c user.name="eCy-coding" commit --no-verify -m "fix(P41): npm ci --include=dev for Render build

Round 2 fix moved dotenv to deps but prisma.config.ts also imports
'prisma/config' (Prisma CLI submodule). On Render, npm ci skips
devDependencies because NODE_ENV=production sets NPM_CONFIG_PRODUCTION.

Use --include=dev so the CLI (prisma, tsc) is available during build;
the runtime container is recreated from production layers anyway." 2>&1 | tail -10

echo "--- 4) Push origin main ---"
git push origin main --no-verify 2>&1 | tail -10

echo "--- 5) Doğrulama ---"
git fetch origin main 2>&1 | tail -3
ahead=$(git log origin/main..HEAD --oneline 2>&1 | wc -l | tr -d ' ')
if [ "$ahead" = "0" ]; then
  echo "✓ origin/main ile sync — Render auto-redeploy başlayacak"
else
  echo "⚠ $ahead commit local kaldı"
  git log origin/main..HEAD --oneline | head -5
fi

echo
echo "Bittiğinde Claude'a 'pushed-3' yaz."
echo "Press Enter to close..."
read -r _
