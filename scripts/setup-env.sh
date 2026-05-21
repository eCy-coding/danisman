#!/usr/bin/env bash
# eCyPro — Ortam kurulum scripti
# Çalıştır: bash scripts/setup-env.sh
# Güvenli: mevcut .env'deki dolu değerlere dokunmaz.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env"
EXAMPLE_FILE="$ROOT/.env.example"

echo "=== eCyPro Setup ==="

# ── 1. .env dosyası oluştur ───────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  cp "$EXAMPLE_FILE" "$ENV_FILE"
  echo "[+] .env oluşturuldu (.env.example kopyası)"
else
  echo "[~] .env zaten mevcut — sadece boş değerler doldurulacak"
fi

# ── 2. Yardımcı: boş satıra değer ata ────────────────────
set_if_empty() {
  local key="$1"
  local val="$2"
  # Satır mevcutsa ve değeri boşsa doldur
  if grep -qE "^${key}=\"\"$" "$ENV_FILE" 2>/dev/null; then
    # macOS ve Linux uyumlu sed
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|^${key}=\"\"$|${key}=\"${val}\"|" "$ENV_FILE"
    else
      sed -i "s|^${key}=\"\"$|${key}=\"${val}\"|" "$ENV_FILE"
    fi
    echo "[+] $key otomatik üretildi"
  fi
}

# ── 3. Kripto sırları üret ────────────────────────────────
JWT_VAL="$(openssl rand -hex 64)"
HMAC_VAL="$(openssl rand -hex 32)"
TOTP_VAL="$(openssl rand -hex 32)"
INDEXNOW_VAL="$(openssl rand -hex 16)"

set_if_empty "JWT_SECRET"          "$JWT_VAL"
set_if_empty "BOOKING_HMAC_SECRET" "$HMAC_VAL"
set_if_empty "TOTP_ENCRYPTION_KEY" "$TOTP_VAL"
set_if_empty "INDEXNOW_KEY"        "$INDEXNOW_VAL"

# ── 4. Mevcut INDEXNOW_KEY'i oku ─────────────────────────
EXISTING_KEY="$(grep -E '^INDEXNOW_KEY=' "$ENV_FILE" 2>/dev/null | sed 's/INDEXNOW_KEY="\(.*\)"/\1/' | tr -d '"')" || true
if [ -n "$EXISTING_KEY" ] && [ "$EXISTING_KEY" != '""' ]; then
  INDEXNOW_TXT="$ROOT/public/${EXISTING_KEY}.txt"
  if [ ! -f "$INDEXNOW_TXT" ]; then
    echo "$EXISTING_KEY" > "$INDEXNOW_TXT"
    echo "[+] IndexNow key dosyası oluşturuldu: public/${EXISTING_KEY}.txt"
  else
    echo "[~] IndexNow key dosyası zaten mevcut"
  fi
fi

# ── 5. secrets/ klasörü (gitignored) ─────────────────────
if [ ! -d "$ROOT/secrets" ]; then
  mkdir -p "$ROOT/secrets"
  echo "[+] secrets/ klasörü oluşturuldu (gitignored)"
fi

# ── 6. prisma generate ───────────────────────────────────
echo ""
echo "--- Prisma client üretiliyor..."
cd "$ROOT"
npx prisma generate
echo "[+] prisma generate tamam"

echo ""
echo "=== Kurulum tamamlandı ==="
echo ""
echo "Sonraki adımlar:"
echo "  1. .env içindeki boş değerleri doldur (RESEND_API_KEY, VITE_GA_TRACKING_ID vb.)"
echo "  2. PostgreSQL çalışıyorsa: npx prisma db push"
echo "  3. Sunucuyu başlat: npm run dev"
echo ""
echo "Dış servis gerektiren env değerleri:"
echo "  • RESEND_API_KEY       → resend.com"
echo "  • VITE_GA_TRACKING_ID  → analytics.google.com"
echo "  • VITE_CLARITY_PROJECT_ID → clarity.microsoft.com"
echo "  • VITE_GROWTHBOOK_CLIENT_KEY → growthbook.io"
echo "  • LOGTAIL_SOURCE_TOKEN → betterstack.com"
echo "  • CAL_COM_API_KEY        → cal.com (Settings → Developer → API Keys)"
echo "  • CAL_COM_EVENT_TYPE_ID  → cal.com event type URL"
echo "  • CAL_COM_USERNAME       → cal.com username (e.g. emre)"
echo "  • CAL_COM_WEBHOOK_SECRET → cal.com (Settings → Webhooks)"
echo "  • GOOGLE_INDEXING_KEY_PATH → cloud.google.com (JSON key)"
