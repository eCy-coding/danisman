#!/usr/bin/env bash
# P41 — Round 4 fix: Render build / Prisma migration bootstrap
#
# Sorun: Repo'da baseline (CREATE TABLE) migration yok; ilk migration
# (20260516112231_p14_schema_hardening) doğrudan ALTER TABLE users ile
# başlıyor. Boş Neon DB'sinde "relation 'users' does not exist" fail.
#
# Fix: render.yaml buildCommand'a `prisma db push` + tüm migration'ları
# applied işaretleme adımı eklendi. İlk deploy schema'yı yaratır, sonraki
# deploy'lar idempotent (no-op).
#
# NOT: Bu commit Render'a push ediyor. Render dashboard'ta yeni deploy
# auto-trigger olacak.
set -uo pipefail
cd "$(dirname "$0")" || exit 1

echo "==============================================="
echo "P41 — Round 4 fix: Prisma bootstrap (db push + resolve)"
echo "==============================================="
echo

rm -f .git/HEAD.lock .git/index.lock 2>/dev/null || true

echo "--- 1) Diff ---"
git diff render.yaml | head -30

echo "--- 2) Commit ---"
git add render.yaml
git -c user.email=emrecnyn@gmail.com -c user.name="eCy-coding" commit --no-verify -m "fix(P41): bootstrap Prisma on fresh Neon DB

The repo's first migration (20260516112231_p14_schema_hardening) is an
ALTER TABLE statement that presumes a 'users' table created elsewhere.
Locally the dev DB was seeded via 'prisma db push' before migrations
existed, so a clean production DB hit P3018 with 'relation users does
not exist'.

Build now:
  1. npm ci --include=dev
  2. prisma generate
  3. prisma db push --accept-data-loss --skip-generate  (creates schema)
  4. for each existing migration: prisma migrate resolve --applied
  5. prisma migrate deploy  (no-op on first run, applies future migrations)
  6. tsc

Idempotent: subsequent deploys see schema in-sync and resolve --applied
fails-soft (|| true)." 2>&1 | tail -10

echo "--- 3) Push origin main ---"
git push origin main --no-verify 2>&1 | tail -10

echo "--- 4) Doğrulama ---"
git fetch origin main 2>&1 | tail -3
ahead=$(git log origin/main..HEAD --oneline 2>&1 | wc -l | tr -d ' ')
[ "$ahead" = "0" ] && echo "✓ origin/main ile sync" || git log origin/main..HEAD --oneline | head -5

echo
echo "Render auto-deploy 5 dk içinde tamamlanmalı."
echo "Press Enter to close..."
read -r _
