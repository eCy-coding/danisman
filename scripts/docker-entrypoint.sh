#!/usr/bin/env sh
# ─── BE-11 — Docker container entrypoint ──────────────────────────────────
# Runs Prisma migrations BEFORE starting the API process.
# Render/Railway run migrations at build-time via buildCommand; for plain
# Docker (compose, Hostinger VPS, k8s) we run them at container start so the
# database can spin up alongside the app.
set -e

echo "[entrypoint] NODE_ENV=${NODE_ENV:-development} PORT=${PORT:-3001}"

if [ -n "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] applying pending migrations..."
  npx prisma migrate deploy || {
    echo "[entrypoint] FATAL: prisma migrate deploy failed"
    exit 1
  }
else
  echo "[entrypoint] WARN: DATABASE_URL not set, skipping migrate deploy"
fi

# Resolve compiled entry path. With tsconfig.server.json (rootDir: ".",
# include: "server/**/*.ts") the output is dist/server/index.js. Some legacy
# builds emit dist/server/server/index.js — fall back if needed.
ENTRY="dist/server/index.js"
if [ ! -f "$ENTRY" ] && [ -f "dist/server/server/index.js" ]; then
  ENTRY="dist/server/server/index.js"
fi

echo "[entrypoint] starting node ${ENTRY}"
exec node "$ENTRY"
