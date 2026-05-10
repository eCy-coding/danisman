#!/usr/bin/env bash
# P40-T09: Blue-Green Deployment Switch Script
#
# Performs a zero-downtime API slot switch:
#   1. Determine target slot (blue=3001, green=3002)
#   2. Start new PM2 process on target port
#   3. Health-check target until ready (max 30s)
#   4. Rewrite nginx upstream + reload (graceful, ~5ms)
#   5. Stop old PM2 process
#
# Prerequisites:
#   - PM2 installed globally (`npm install -g pm2`)
#   - nginx installed + this config at /etc/nginx/sites-enabled/ecypro
#   - App built at /var/www/ecypro/dist/server/index.js
#
# Usage:
#   bash scripts/blue-green-switch.sh blue   # deploy to blue slot (port 3001)
#   bash scripts/blue-green-switch.sh green  # deploy to green slot (port 3002)
#
# The script auto-detects current active slot and switches to the other.

set -euo pipefail

NGINX_CONF="/etc/nginx/sites-available/ecypro"
APP_SCRIPT="/var/www/ecypro/dist/server/index.js"
HEALTH_URL_BASE="http://127.0.0.1"
HEALTH_PATH="/api/health"
HEALTH_RETRIES=30
HEALTH_INTERVAL=1  # seconds between health checks

BLUE_PORT=3001
GREEN_PORT=3002
BLUE_NAME="ecypro-blue"
GREEN_NAME="ecypro-green"

# ─── Determine target slot ─────────────────────────────────

TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then
  # Auto-detect: read current active port from nginx upstream block
  CURRENT_PORT=$(grep -Po '127\.0\.0\.1:\K\d+' "$NGINX_CONF" | head -1)
  if [[ "$CURRENT_PORT" == "$BLUE_PORT" ]]; then
    TARGET="green"
  else
    TARGET="blue"
  fi
  echo "[blue-green] Auto-detected current=$CURRENT_PORT → deploying to $TARGET"
fi

if [[ "$TARGET" == "blue" ]]; then
  TARGET_PORT=$BLUE_PORT
  TARGET_NAME=$BLUE_NAME
  OLD_NAME=$GREEN_NAME
elif [[ "$TARGET" == "green" ]]; then
  TARGET_PORT=$GREEN_PORT
  TARGET_NAME=$GREEN_NAME
  OLD_NAME=$BLUE_NAME
else
  echo "[blue-green] ❌ Unknown target: $TARGET (use 'blue' or 'green')"
  exit 1
fi

echo "[blue-green] 🚀 Deploying to $TARGET slot (port $TARGET_PORT)"

# ─── Step 1: Start new PM2 instance on target port ────────

echo "[blue-green] Starting $TARGET_NAME on port $TARGET_PORT..."
PORT=$TARGET_PORT \
  NODE_ENV=production \
  pm2 start "$APP_SCRIPT" \
    --name "$TARGET_NAME" \
    --instances 1 \
    --no-autorestart \
    2>&1 | tail -5

# ─── Step 2: Health check loop ────────────────────────────

echo "[blue-green] Health-checking $TARGET_NAME..."
HEALTH_URL="${HEALTH_URL_BASE}:${TARGET_PORT}${HEALTH_PATH}"
for i in $(seq 1 $HEALTH_RETRIES); do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
  if [[ "$HTTP_CODE" == "200" ]]; then
    echo "[blue-green] ✅ Health check passed after ${i}s"
    break
  fi
  if [[ "$i" -eq "$HEALTH_RETRIES" ]]; then
    echo "[blue-green] ❌ Health check failed after ${HEALTH_RETRIES}s (last status: $HTTP_CODE)"
    pm2 delete "$TARGET_NAME" 2>/dev/null || true
    exit 1
  fi
  echo "[blue-green]   Attempt $i/$HEALTH_RETRIES... status=$HTTP_CODE"
  sleep "$HEALTH_INTERVAL"
done

# ─── Step 3: Flip nginx upstream ──────────────────────────

echo "[blue-green] Flipping nginx upstream to port $TARGET_PORT..."
# Replace active slot port in nginx config (sed in-place)
sed -i "s/server 127\.0\.0\.1:[0-9]\+;  # ACTIVE SLOT/server 127.0.0.1:${TARGET_PORT};  # ACTIVE SLOT/" "$NGINX_CONF"

# Validate config before reload
nginx -t 2>&1
echo "[blue-green] nginx config valid — reloading..."
nginx -s reload
echo "[blue-green] ✅ nginx reloaded (zero-downtime)"

# ─── Step 4: Stop old PM2 instance ────────────────────────

echo "[blue-green] Stopping old slot: $OLD_NAME..."
pm2 delete "$OLD_NAME" 2>/dev/null || echo "[blue-green] $OLD_NAME was not running"

# ─── Step 5: Save PM2 state ───────────────────────────────
pm2 save --force

echo ""
echo "[blue-green] 🎉 Deployment complete!"
echo "  Active slot : $TARGET ($TARGET_PORT)"
echo "  Old slot    : $OLD_NAME (stopped)"
echo "  nginx       : reloaded"
