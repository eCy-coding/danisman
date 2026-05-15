#!/bin/bash
# =============================================================================
# eCyPro — SETUP_LOCAL_POSTGRES.command (P5-6)
# Generated: 2026-05-15 by Claude (Cowork P5)
#
# WHY:
#   Phase 11 of RUN_ALL.command fails because `npx prisma migrate dev` cannot
#   connect to a local Postgres. This script provisions a development Postgres
#   on the host (Mac), creates the `ecypro` database, wires .env, and runs the
#   baseline migration. Idempotent — every step is safe to re-run.
#
# USAGE:
#   Double-click in Finder, or:  bash ~/Desktop/ecypro/SETUP_LOCAL_POSTGRES.command
#
# NO PUSH. NO PROD. Local-only Prisma baseline.
# =============================================================================

set -uo pipefail

cd "$(dirname "$0")"
mkdir -p outputs

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG="outputs/setup-postgres-${TIMESTAMP}.txt"
DONE_MARKER="outputs/setup-postgres-done-${TIMESTAMP}.txt"

exec > >(tee -a "$LOG") 2>&1

echo "============================================================"
echo " eCyPro local-Postgres setup"
echo " Timestamp : $TIMESTAMP"
echo " Project   : $(pwd)"
echo "============================================================"
echo ""

# ----------------------------------------------------------------------------
# Step 1 — Homebrew check (install if missing)
# ----------------------------------------------------------------------------
if ! command -v brew >/dev/null 2>&1; then
  echo "❌ Homebrew not found. Install it manually from https://brew.sh first."
  echo "   (We do NOT auto-install Homebrew — it requires sudo and user consent.)"
  exit 1
fi
echo "✓ Homebrew: $(brew --version | head -1)"

# ----------------------------------------------------------------------------
# Step 2 — Install postgresql@16 if missing (idempotent)
# ----------------------------------------------------------------------------
if ! brew list postgresql@16 >/dev/null 2>&1; then
  echo "▶ Installing postgresql@16 via Homebrew..."
  brew install postgresql@16
else
  echo "✓ postgresql@16 already installed"
fi

# ----------------------------------------------------------------------------
# Step 3 — Start postgresql@16 service (idempotent)
# ----------------------------------------------------------------------------
SVC_STATE=$(brew services list 2>/dev/null | awk '$1=="postgresql@16"{print $2}')
if [ "$SVC_STATE" != "started" ]; then
  echo "▶ Starting postgresql@16 service..."
  brew services start postgresql@16
  sleep 3
else
  echo "✓ postgresql@16 service already started"
fi

# Ensure brew's pg binaries are on PATH for this script
PG_PREFIX=$(brew --prefix postgresql@16)
export PATH="$PG_PREFIX/bin:$PATH"

# ----------------------------------------------------------------------------
# Step 4 — Wait for socket readiness (up to 15s)
# ----------------------------------------------------------------------------
echo "▶ Waiting for Postgres to accept connections..."
for i in $(seq 1 15); do
  if pg_isready -q -h localhost; then
    echo "✓ Postgres is ready (took ${i}s)"
    break
  fi
  sleep 1
done
if ! pg_isready -q -h localhost; then
  echo "❌ Postgres did not become ready within 15s. Check 'brew services list'."
  exit 1
fi

# ----------------------------------------------------------------------------
# Step 5 — Create `ecypro` database (idempotent)
# ----------------------------------------------------------------------------
if psql -lqt | cut -d \| -f 1 | grep -qw ecypro; then
  echo "✓ Database 'ecypro' already exists"
else
  echo "▶ Creating database 'ecypro'..."
  createdb ecypro
fi

# ----------------------------------------------------------------------------
# Step 6 — Ensure DATABASE_URL is in .env (idempotent, won't clobber existing)
# ----------------------------------------------------------------------------
TARGET_URL="postgresql://$(whoami)@localhost:5432/ecypro?schema=public"
if [ ! -f .env ]; then
  echo "▶ Creating .env (was missing)"
  : > .env
fi
if grep -qE '^DATABASE_URL=' .env; then
  CURRENT=$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2-)
  echo "✓ DATABASE_URL already set in .env: $CURRENT"
  echo "   (Not overwriting — remove the line manually if you want the new value.)"
else
  echo "▶ Appending DATABASE_URL to .env"
  echo "DATABASE_URL=$TARGET_URL" >> .env
fi

# Also seed JWT_SECRET if missing (Prisma doesn't need it, but server tests do)
if ! grep -qE '^JWT_SECRET=' .env; then
  echo "▶ Appending JWT_SECRET (dev-only) to .env"
  echo "JWT_SECRET=dev-jwt-secret-please-rotate-in-prod-min-32-chars-pad-here" >> .env
fi

# ----------------------------------------------------------------------------
# Step 7 — Prisma generate + migrate dev (creates baseline migration)
# ----------------------------------------------------------------------------
echo "▶ Running prisma generate"
npx --no-install prisma generate || npx prisma generate

if [ -d prisma/migrations/baseline_p3_2026_05_15 ]; then
  echo "✓ Baseline migration directory already exists — skipping migrate dev"
else
  echo "▶ Running prisma migrate dev (name: baseline_p3_2026_05_15)"
  npx --no-install prisma migrate dev --name baseline_p3_2026_05_15 \
    || npx prisma migrate dev --name baseline_p3_2026_05_15
fi

# ----------------------------------------------------------------------------
# Step 8 — Stage + commit the new migration (no push, sandbox-safe)
# ----------------------------------------------------------------------------
if [ -d prisma/migrations ]; then
  # Pre-clean any stale locks (sandbox FS quirk)
  [ -f .git/index.lock ] && mv .git/index.lock .git/index.lock.delme.$$ 2>/dev/null || true
  git add prisma/migrations || true
  if git diff --cached --quiet 2>/dev/null; then
    echo "✓ No new migration files to commit (already in tree)"
  else
    git commit -m "chore(db): P5 baseline migration (2026-05-15)

Captures the current Prisma schema as a deterministic SQL artifact so
deployments use 'prisma migrate deploy' instead of relying on 'db push'.

Generated by SETUP_LOCAL_POSTGRES.command (P5-6).

LOCAL ONLY — no push." 2>&1 | tail -3
  fi
fi

echo ""
echo "============================================================"
echo " ✅ Postgres + Prisma baseline ready."
echo "    DATABASE_URL: $TARGET_URL"
echo "    Next:  npm run db:studio    # browse"
echo "           npm run test:server  # should now pass env checks"
echo "============================================================"

touch "$DONE_MARKER"
echo ""
echo "Press any key to close this window..."
read -n 1 -s -r
