#!/bin/bash
# =============================================================================
# eCyPro — Frontend deploy to Hostinger (PLACEHOLDER)
# Generated: 2026-05-15 by Claude (Cowork P4)
#
# THIS SCRIPT DOES NOTHING DESTRUCTIVE BY DEFAULT.
# It is a template waiting for SSH/SFTP credentials the user must supply.
#
# Required in `.env.deploy`:
#
#   HOSTINGER_SSH_HOST=ecypro.com
#   HOSTINGER_SSH_USER=u123456789       # cPanel / Hostinger SSH user
#   HOSTINGER_SSH_PORT=65002            # Hostinger default is 65002
#   HOSTINGER_SSH_PATH=/home/u123456789/public_html
#   # Optional: HOSTINGER_SSH_KEY=~/.ssh/hostinger_ed25519
#
# Then re-run this script. It will:
#   1. Verify dist/ exists (run RUN_ALL.command first if not)
#   2. dry-run rsync to show what would change
#   3. ASK before doing the real rsync
#   4. Live-rsync dist/ → ~/public_html/
#   5. Curl https://ecypro.com to smoke-check
#
# NO write to a production host happens until you confirm in step 3.
# =============================================================================

set -euo pipefail
cd "$(dirname "$0")"

ENV_FILE=".env.deploy"

if [ ! -f "$ENV_FILE" ]; then
  cat <<EOF
❌ $ENV_FILE not found.

Create it with the following keys (NOT committed — already in .gitignore):

  HOSTINGER_SSH_HOST=ecypro.com
  HOSTINGER_SSH_USER=u123456789
  HOSTINGER_SSH_PORT=65002
  HOSTINGER_SSH_PATH=/home/u123456789/public_html
  # HOSTINGER_SSH_KEY=~/.ssh/hostinger_ed25519   # optional

Then re-run:  bash $(basename "$0")
EOF
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

: "${HOSTINGER_SSH_HOST:?missing in $ENV_FILE}"
: "${HOSTINGER_SSH_USER:?missing in $ENV_FILE}"
: "${HOSTINGER_SSH_PORT:=65002}"
: "${HOSTINGER_SSH_PATH:?missing in $ENV_FILE}"

SSH_OPTS=(-o StrictHostKeyChecking=accept-new -p "$HOSTINGER_SSH_PORT")
if [ -n "${HOSTINGER_SSH_KEY:-}" ]; then
  SSH_OPTS+=(-i "$HOSTINGER_SSH_KEY")
fi

REMOTE="${HOSTINGER_SSH_USER}@${HOSTINGER_SSH_HOST}:${HOSTINGER_SSH_PATH}/"

echo "=== Step 1/5 — Verify dist/ ==="
if [ ! -d dist ] || [ ! -f dist/index.html ]; then
  echo "❌ dist/index.html not found. Run RUN_ALL.command first."
  exit 1
fi
SIZE=$(du -sh dist | cut -f1)
COUNT=$(find dist -type f | wc -l | tr -d ' ')
echo "✓ dist/ ready: $SIZE across $COUNT files"

echo ""
echo "=== Step 2/5 — SSH connectivity test ==="
ssh "${SSH_OPTS[@]}" "${HOSTINGER_SSH_USER}@${HOSTINGER_SSH_HOST}" "echo connected; pwd; ls -la ${HOSTINGER_SSH_PATH} | head -10"

echo ""
echo "=== Step 3/5 — DRY-RUN rsync (no writes) ==="
rsync -avz --delete --dry-run --itemize-changes \
  -e "ssh ${SSH_OPTS[*]}" \
  dist/ "$REMOTE" | head -200

echo ""
echo "Above is the DRY-RUN. To proceed with the actual upload, type EXACTLY:"
echo "    DEPLOY"
echo "Anything else aborts."
read -r CONFIRM
if [ "$CONFIRM" != "DEPLOY" ]; then
  echo "Aborted by user. No changes pushed."
  exit 0
fi

echo ""
echo "=== Step 4/5 — Live rsync ==="
rsync -avz --delete \
  -e "ssh ${SSH_OPTS[*]}" \
  dist/ "$REMOTE"

echo ""
echo "=== Step 5/5 — Smoke check live URL ==="
sleep 3
curl -sS -o /dev/null -w "HTTP %{http_code} in %{time_total}s\n" "https://${HOSTINGER_SSH_HOST}/" || true
echo ""
echo "Browse: https://${HOSTINGER_SSH_HOST}/"
echo "Done."
