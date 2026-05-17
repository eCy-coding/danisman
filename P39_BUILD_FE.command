#!/bin/bash
# P39 — Frontend production build + zip
set -eo pipefail
cd "$(dirname "$0")"

LOG="outputs/P39_BUILD_FE_$(date +%Y%m%d-%H%M%S).log"
mkdir -p outputs
exec > >(tee -a "$LOG") 2>&1

echo "================================================="
echo "P39 BUILD FE — $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================="

echo "=== 0. Stop dev:server if running ==="
# Don't kill — user may need it. Just warn.
lsof -nP -iTCP:5173 -sTCP:LISTEN 2>/dev/null | head -3 || true

echo "=== 1. Node + npm versions ==="
node -v
npm -v

echo "=== 2. Clean dist ==="
rm -rf dist
echo "removed old dist"

echo "=== 3. npm install (sync lock) ==="
npm ci --no-audit --no-fund 2>&1 | tail -10 || npm install --no-audit --no-fund 2>&1 | tail -10

echo "=== 4. Build (vite production) ==="
NODE_ENV=production npm run build 2>&1 | tail -30

echo "=== 5. Verify dist ==="
ls -la dist/ | head -15
echo "Total size:"
du -sh dist/

echo "=== 6. Zip dist ==="
TS=$(date +%Y%m%d-%H%M%S)
ZIP="outputs/ecypro-frontend-${TS}.zip"
cd dist
zip -rq "../$ZIP" .
cd ..
echo "✅ $ZIP ($(du -h "$ZIP" | cut -f1))"

echo "=== 7. Symlink latest ==="
ln -sf "ecypro-frontend-${TS}.zip" outputs/ecypro-frontend-LATEST.zip
ls -la outputs/ecypro-frontend-LATEST.zip

echo ""
echo "================================================="
echo "✅ BUILD FE COMPLETE — $(date '+%Y-%m-%d %H:%M:%S')"
echo "📦 Zip: $ZIP"
echo "================================================="

TELEGRAM_BOT_TOKEN="8858261035:AAFYeuQ1yLXRn10dSKAxkDjqnUoaRcN-oTg"
SIZE=$(du -h "$ZIP" | cut -f1)
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=6244341128" \
  -d "text=✅ P39: Frontend build complete. ${ZIP} (${SIZE})" > /dev/null || true

echo ""
echo "Pencereyi kapatabilirsin."
