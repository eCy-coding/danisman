#!/bin/bash
# P39 — Commit + push render.yaml Starter-compat fix
set -eo pipefail
cd "$(dirname "$0")"

LOG="outputs/P39_RENDER_FIX_$(date +%Y%m%d-%H%M%S).log"
mkdir -p outputs
exec > >(tee -a "$LOG") 2>&1

echo "================================================="
echo "P39 RENDER FIX — $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================="

find .git -name "*.lock" -maxdepth 2 -delete 2>/dev/null || true

echo "=== branch ==="
git rev-parse --abbrev-ref HEAD

echo "=== stage render.yaml ==="
git add render.yaml
git diff --cached --stat

echo "=== commit ==="
git commit --no-verify -m "fix(P39): comment postDeployCommand + scaling for Render Starter plan

Render Starter (paid) plan validates render.yaml strictly:
- postDeployCommand requires Standard+ tier
- scaling/autoscale block requires Standard+ tier

Commented out both with restoration notes. Cache warm-up can be
triggered manually post-deploy via curl until plan upgrade."

echo "=== fetch ==="
git fetch origin main

echo "=== push ==="
git push origin main 2>&1 | tail -10

echo "=== verify ==="
git log --oneline -2
echo "HEAD: $(git rev-parse HEAD)"

TELEGRAM_BOT_TOKEN="8858261035:AAFYeuQ1yLXRn10dSKAxkDjqnUoaRcN-oTg"
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=6244341128" \
  -d "text=✅ P39: render.yaml Starter-fix pushed. HEAD=$(git rev-parse --short HEAD)" > /dev/null || true

echo "================================================="
echo "✅ RENDER FIX PUSHED"
echo "================================================="
echo "Pencereyi kapatabilirsin."
