#!/usr/bin/env bash
# P34 — Static-only emergency build.
# Backend YOK, sadece frontend bundle. Hostinger'a hazır.
#
# Kullanım:
#   bash scripts/build-static-only.sh
#   # outputs/ecypro-static-<timestamp>.zip üretilir.

set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT_DIR=$(pwd)
TS=$(date +%Y%m%d-%H%M%S)
OUTPUT_DIR="$PROJECT_DIR/outputs"
mkdir -p "$OUTPUT_DIR"

echo "════════════════════════════════════════════════════"
echo "▶ eCyPro static-only build [$TS]"
echo "════════════════════════════════════════════════════"

# 1) Minimal env'i .env.production'a kopyala (mevcut varsa yedekle)
if [[ -f .env.production ]]; then
  cp .env.production ".env.production.bak-$TS"
  echo "▶ Mevcut .env.production yedeklendi: .env.production.bak-$TS"
fi

if [[ -f .env.production.minimal-example ]]; then
  cp .env.production.minimal-example .env.production
  echo "▶ Static-only minimal env aktif"
else
  echo "  ⚠ .env.production.minimal-example yok — mevcut .env.production kullanılıyor"
fi

# 2) Build (vite + postbuild = sitemap + RSS)
echo ""
echo "▶ npm run build başlıyor..."
if ! npm run build 2>&1 | tail -20; then
  echo "  ✘ Build başarısız — log'a bakın"
  exit 1
fi

if [[ ! -d dist ]]; then
  echo "  ✘ dist/ yok — build üretmemiş"
  exit 1
fi

# 3) Zip dist (Hostinger File Manager için)
ZIP_PATH="$OUTPUT_DIR/ecypro-static-$TS.zip"
echo ""
echo "▶ Zip oluşturuluyor: $(basename "$ZIP_PATH")"
(
  cd dist
  zip -rq "$ZIP_PATH" .
)
ZIP_SIZE=$(du -h "$ZIP_PATH" | cut -f1)
echo "  ✓ $(basename "$ZIP_PATH") ($ZIP_SIZE)"

# 4) Smoke check (dist/index.html var mı?)
if [[ ! -f dist/index.html ]]; then
  echo "  ✘ dist/index.html yok — Vite build hatalı"
  exit 1
fi

# 5) Yönerge
cat <<EOF

════════════════════════════════════════════════════
✅ Build tamamlandı: outputs/$(basename "$ZIP_PATH") ($ZIP_SIZE)
════════════════════════════════════════════════════

📋 Hostinger upload (~10 dk):
   1. https://hpanel.hostinger.com → Files → File Manager
   2. public_html/ klasörüne git
   3. Mevcut içerik varsa: backup_$TS.zip olarak indir, sonra sil
   4. outputs/$(basename "$ZIP_PATH") upload + Extract
   5. Smoke test: curl -sS -I https://ecypro.com/

📋 DNS (yeni domain ise, ~5-30 dk propagation):
   - A record:   @   → Hostinger shared IP (hpanel'de gösterilir)
   - CNAME:      www → ecypro.com

📋 SSL (~2 dk):
   - hpanel → Security → SSL → Install Let's Encrypt

⚠  Backend YOK. Contact form mailto: fallback (hello@ecypro.com).
⚠  Analytics/Sentry noop. Sonradan eklemek için:
   - cp .env.production.example .env.production
   - Credentials doldur + yeniden build + yeniden upload

EOF
