#!/bin/bash
# =============================================================================
# eCyPro — Backend deploy to Render (PLACEHOLDER)
# Generated: 2026-05-15 by Claude (Cowork P4)
#
# THIS SCRIPT DOES NOTHING DESTRUCTIVE BY DEFAULT.
# It is a template waiting for two pieces of data the user must supply:
#
#   1. RENDER_API_KEY    — from https://dashboard.render.com/u/settings#api-keys
#   2. RENDER_SERVICE_ID — the service ID for ecypro-api (srv-xxxxxxxx)
#
# Fill in `.env.deploy` (NOT checked into git) with:
#
#     RENDER_API_KEY=rnd_xxxxxxxxxxxxxxxx
#     RENDER_SERVICE_ID=srv-xxxxxxxx
#
# Then re-run this script. It will:
#   a) verify creds via `render whoami` (or curl /v1/owners)
#   b) trigger a deploy via the Render API
#   c) tail the deploy log until "live" or "failed"
#
# NO `git push` happens here — Render reads from the connected GitHub repo,
# which means a separate `git push origin main` is required first. Do that
# only after running RUN_ALL.command and reviewing the 41 local commits.
# =============================================================================

set -euo pipefail
cd "$(dirname "$0")"

ENV_FILE=".env.deploy"

if [ ! -f "$ENV_FILE" ]; then
  cat <<EOF
❌ $ENV_FILE not found.

Create it with the following keys (NOT committed — already in .gitignore):

  RENDER_API_KEY=rnd_xxxxxxxxxxxxxxxx
  RENDER_SERVICE_ID=srv-xxxxxxxx

Then re-run:  bash $(basename "$0")
EOF
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

: "${RENDER_API_KEY:?RENDER_API_KEY missing in $ENV_FILE}"
: "${RENDER_SERVICE_ID:?RENDER_SERVICE_ID missing in $ENV_FILE}"

echo "=== Step 1/3 — Verify Render credentials ==="
curl -fsSL \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Accept: application/json" \
  https://api.render.com/v1/owners > /tmp/render-owners-$$.json
echo "✓ Credentials accepted. Owner sample:"
head -c 400 /tmp/render-owners-$$.json
echo ""

echo ""
echo "=== Step 2/3 — Trigger deploy ==="
DEPLOY_RESPONSE=$(curl -fsSL -X POST \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"clearCache":"do_not_clear"}' \
  "https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys")
echo "$DEPLOY_RESPONSE"

DEPLOY_ID=$(echo "$DEPLOY_RESPONSE" | grep -oE '"id":"dep-[^"]+' | head -1 | sed 's/"id":"//')
echo ""
echo "Deploy id: ${DEPLOY_ID:-unknown}"

echo ""
echo "=== Step 3/3 — Poll deploy status ==="
echo "Open https://dashboard.render.com to watch live logs."
echo "Polling every 15s (Ctrl+C to stop)..."

if [ -n "${DEPLOY_ID:-}" ]; then
  for i in $(seq 1 60); do
    STATUS=$(curl -fsSL \
      -H "Authorization: Bearer $RENDER_API_KEY" \
      -H "Accept: application/json" \
      "https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys/${DEPLOY_ID}" \
      | grep -oE '"status":"[^"]+' | head -1 | sed 's/"status":"//')
    echo "[$(date +%H:%M:%S)] status=$STATUS"
    case "$STATUS" in
      live) echo "✅ Deploy is LIVE"; break ;;
      build_failed|update_failed|canceled) echo "❌ Deploy ended: $STATUS"; exit 2 ;;
    esac
    sleep 15
  done
fi

echo ""
echo "Done. Verify health endpoint:"
echo "  curl https://api.ecypro.com/health"
