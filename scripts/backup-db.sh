#!/usr/bin/env bash
# P40-T07: Database Backup Script
#
# Creates encrypted PostgreSQL dumps and uploads to:
#   - Local storage (./backups/)
#   - S3-compatible storage (Backblaze B2 / AWS S3)
#
# Retention policy:
#   - Daily:   7 days
#   - Weekly:  4 weeks (Sunday backups kept)
#   - Monthly: 12 months (1st of month backups kept)
#
# Schedule via cron (add to crontab with `crontab -e`):
#   0 2 * * * /bin/bash /path/to/scripts/backup-db.sh >> /var/log/ecypro-backup.log 2>&1
#
# ENV required (set in .env or system environment):
#   DATABASE_URL        — PostgreSQL connection string
#   BACKUP_ENCRYPTION_KEY — GPG passphrase (min 32 chars)
#   AWS_ACCESS_KEY_ID   — S3/B2 access key (optional)
#   AWS_SECRET_ACCESS_KEY — S3/B2 secret key (optional)
#   BACKUP_S3_BUCKET    — S3 bucket name (optional, e.g. s3://ecypro-backups)
#   AWS_ENDPOINT_URL    — B2 endpoint (optional, e.g. https://s3.us-west-002.backblazeb2.com)

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
DATE="$(date -u +%Y%m%d_%H%M%S)"
DOW="$(date -u +%u)"  # 1=Mon … 7=Sun
DOM="$(date -u +%d)"  # Day of month (01-31)
BACKUP_NAME="ecypro_${DATE}.dump"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# ─── Load .env if present ────────────────────────────────────────────────────
if [ -f "$PROJECT_ROOT/.env" ]; then
  # shellcheck disable=SC1091
  set -a; source "$PROJECT_ROOT/.env"; set +a
fi

DATABASE_URL="${DATABASE_URL:-}"
BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"
BACKUP_S3_BUCKET="${BACKUP_S3_BUCKET:-}"

# ─── Validation ──────────────────────────────────────────────────────────────
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not set" >&2
  exit 1
fi

# ─── Setup ───────────────────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
echo "🗄️  eCyPro DB Backup — $(date -u '+%Y-%m-%d %H:%M:%S UTC')"

# ─── Dump ────────────────────────────────────────────────────────────────────
echo "  📦 Creating dump: $BACKUP_NAME"
pg_dump --format=custom --no-acl --no-owner "$DATABASE_URL" \
  --file="$BACKUP_PATH"

DUMP_SIZE=$(du -sh "$BACKUP_PATH" | awk '{print $1}')
echo "  ✅ Dump created: $DUMP_SIZE"

# ─── Encrypt (optional) ──────────────────────────────────────────────────────
UPLOAD_PATH="$BACKUP_PATH"
if [ -n "$BACKUP_ENCRYPTION_KEY" ]; then
  ENCRYPTED_PATH="${BACKUP_PATH}.gpg"
  echo "  🔐 Encrypting…"
  gpg --batch --yes --passphrase "$BACKUP_ENCRYPTION_KEY" \
    --symmetric --cipher-algo AES256 \
    --output "$ENCRYPTED_PATH" "$BACKUP_PATH"
  rm -f "$BACKUP_PATH"
  UPLOAD_PATH="$ENCRYPTED_PATH"
  echo "  ✅ Encrypted: $(du -sh "$UPLOAD_PATH" | awk '{print $1}')"
fi

# ─── Upload to S3/B2 (optional) ──────────────────────────────────────────────
if [ -n "$BACKUP_S3_BUCKET" ] && command -v aws &>/dev/null; then
  S3_ARGS=()
  if [ -n "${AWS_ENDPOINT_URL:-}" ]; then
    S3_ARGS+=(--endpoint-url "$AWS_ENDPOINT_URL")
  fi
  echo "  ☁️  Uploading to $BACKUP_S3_BUCKET…"
  aws s3 cp "$UPLOAD_PATH" \
    "${BACKUP_S3_BUCKET}/daily/$(basename "$UPLOAD_PATH")" \
    "${S3_ARGS[@]}" --storage-class STANDARD_IA
  echo "  ✅ Uploaded to S3"

  # Weekly backup (Sunday = DOW 7)
  if [ "$DOW" = "7" ]; then
    aws s3 cp "$UPLOAD_PATH" \
      "${BACKUP_S3_BUCKET}/weekly/$(basename "$UPLOAD_PATH")" \
      "${S3_ARGS[@]}" --storage-class STANDARD_IA
    echo "  📅 Weekly backup uploaded"
  fi

  # Monthly backup (1st of month)
  if [ "$DOM" = "01" ]; then
    aws s3 cp "$UPLOAD_PATH" \
      "${BACKUP_S3_BUCKET}/monthly/$(basename "$UPLOAD_PATH")" \
      "${S3_ARGS[@]}" --storage-class GLACIER_IR
    echo "  📅 Monthly backup uploaded (Glacier IR)"
  fi
fi

# ─── Local retention: keep last 7 daily backups ──────────────────────────────
echo "  🧹 Pruning local backups (keeping last 7)…"
ls -t "$BACKUP_DIR"/ecypro_*.dump.gpg 2>/dev/null | tail -n +8 | xargs -r rm -f
ls -t "$BACKUP_DIR"/ecypro_*.dump 2>/dev/null | tail -n +8 | xargs -r rm -f

REMAINING=$(ls "$BACKUP_DIR"/ecypro_* 2>/dev/null | wc -l | tr -d ' ')
echo "  ✅ Local backups: $REMAINING file(s) remaining"

echo "  🎉 Backup complete: $(basename "$UPLOAD_PATH")"
