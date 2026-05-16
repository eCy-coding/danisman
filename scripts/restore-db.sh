#!/usr/bin/env bash
# EcyPro — Database restore script (P15-BE Aşama 5).
#
# Companion to scripts/backup-db.sh. Restores a pg_dump archive (custom
# or plain SQL, optionally GPG-encrypted) into the database pointed at
# by DATABASE_URL. Refuses to overwrite a production database without
# an explicit `--confirm production` flag and an interactive typed
# confirmation — destructive operations must be loud.
#
# Usage:
#   scripts/restore-db.sh <backup-file> [--confirm production|staging|dev]
#
# Examples:
#   scripts/restore-db.sh backups/ecypro_20260516_020000.dump
#   scripts/restore-db.sh /tmp/yesterday.dump.gpg --confirm staging
#
# Exit codes:
#   0  success
#   1  missing prerequisite (file, DATABASE_URL, pg_restore)
#   2  user declined the typed confirmation
#   3  restore failed

set -euo pipefail

BACKUP_FILE="${1:-}"
ENVIRONMENT_FLAG="${3:-${2:-}}"

log() { printf '[restore-db] %s\n' "$*" >&2; }
die() { log "$*"; exit "${2:-1}"; }

# --- preflight -------------------------------------------------------------
[[ -z "$BACKUP_FILE" ]] && die "Usage: $0 <backup-file> [--confirm production|staging|dev]" 1
[[ ! -f "$BACKUP_FILE" ]] && die "FATAL: backup file not found: $BACKUP_FILE" 1
[[ -z "${DATABASE_URL:-}" ]] && die "FATAL: DATABASE_URL is not set." 1
command -v pg_restore >/dev/null 2>&1 || die "FATAL: pg_restore not in PATH." 1

# --- environment classification -------------------------------------------
# Best-effort: detect production by hostname; user must still confirm.
DB_HOST="$(printf '%s\n' "$DATABASE_URL" | sed -E 's#.*@([^:/?]+).*#\1#')"
case "$DB_HOST" in
  *.render.com|*prod*|*production*|api.ecypro.com)
    DETECTED_ENV="production"
    ;;
  *staging*|*stg*)
    DETECTED_ENV="staging"
    ;;
  localhost|127.0.0.1|*\.local|*dev*)
    DETECTED_ENV="dev"
    ;;
  *)
    DETECTED_ENV="unknown"
    ;;
esac

log "Backup:      $BACKUP_FILE"
log "Target host: $DB_HOST (detected env: $DETECTED_ENV)"

# --- confirmation gate ----------------------------------------------------
# Production target: require both --confirm production AND a typed string.
if [[ "$DETECTED_ENV" == "production" ]]; then
  if [[ "${2:-}" != "--confirm" || "${3:-}" != "production" ]]; then
    die "Production restore requires: $0 $BACKUP_FILE --confirm production" 2
  fi
  log "DESTRUCTIVE OPERATION — type 'restore production now' to proceed:"
  read -r typed
  if [[ "$typed" != "restore production now" ]]; then
    die "Confirmation phrase mismatch — aborting." 2
  fi
fi

# --- decrypt if GPG-encrypted ---------------------------------------------
WORK_FILE="$BACKUP_FILE"
TMP_DUMP=""
if [[ "$BACKUP_FILE" == *.gpg ]]; then
  [[ -z "${BACKUP_ENCRYPTION_KEY:-}" ]] && die "FATAL: backup is GPG-encrypted but BACKUP_ENCRYPTION_KEY not set." 1
  command -v gpg >/dev/null 2>&1 || die "FATAL: gpg not in PATH." 1
  TMP_DUMP="$(mktemp --suffix=.dump)"
  trap '[[ -n "$TMP_DUMP" ]] && rm -f "$TMP_DUMP"' EXIT
  log "Decrypting to $TMP_DUMP"
  gpg --batch --yes --passphrase "$BACKUP_ENCRYPTION_KEY" \
      --decrypt --output "$TMP_DUMP" "$BACKUP_FILE"
  WORK_FILE="$TMP_DUMP"
fi

# --- detect format --------------------------------------------------------
# pg_restore custom format starts with the magic header "PGDMP".
if head -c 5 "$WORK_FILE" | grep -q '^PGDMP'; then
  FORMAT="custom"
elif file "$WORK_FILE" 2>/dev/null | grep -qi gzip; then
  FORMAT="gzip-sql"
else
  FORMAT="plain-sql"
fi
log "Format: $FORMAT"

# --- restore --------------------------------------------------------------
log "Starting restore — this will drop existing objects in the target DB."
case "$FORMAT" in
  custom)
    pg_restore --no-owner --no-privileges --clean --if-exists \
      --dbname="$DATABASE_URL" "$WORK_FILE" || die "FATAL: pg_restore failed." 3
    ;;
  gzip-sql)
    if ! command -v psql >/dev/null 2>&1; then
      die "FATAL: psql not in PATH (needed for plain SQL restore)." 1
    fi
    gunzip -c "$WORK_FILE" | psql "$DATABASE_URL" --single-transaction \
      --set ON_ERROR_STOP=on || die "FATAL: psql restore failed." 3
    ;;
  plain-sql)
    if ! command -v psql >/dev/null 2>&1; then
      die "FATAL: psql not in PATH (needed for plain SQL restore)." 1
    fi
    psql "$DATABASE_URL" --single-transaction --set ON_ERROR_STOP=on \
      --file="$WORK_FILE" || die "FATAL: psql restore failed." 3
    ;;
esac

log "Restore complete. Recommended next steps:"
log "  1. npm run db:generate         # regenerate Prisma client"
log "  2. npm run typecheck:server    # ensure schema still aligns"
log "  3. tail -n50 backups/restore.log  # save this output for the post-mortem"
log "  4. Smoke critical flows: login, list bookings, admin/users."
exit 0
