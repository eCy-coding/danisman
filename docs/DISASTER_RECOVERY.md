# EcyPro Disaster Recovery Runbook

**Status:** ACTIVE
**Owner:** Platform / On-call
**Last updated:** 2026-05-16
**Test cadence:** quarterly drill (next: 2026-08-16)

---

## 1) Targets

| Metric                             | Target       | Definition                                              |
| ---------------------------------- | ------------ | ------------------------------------------------------- |
| **RTO** (recovery time objective)  | **1 hour**   | Time from incident declared → critical user flows green |
| **RPO** (recovery point objective) | **24 hours** | Maximum acceptable data loss                            |
| **MTTR** drill target              | < 30 minutes | Time the practiced runbook should consume               |

These targets drive the backup cadence (daily dumps + weekly + monthly
promotions) and the architectural choices (no on-host writes other than
Postgres + Redis; both have point-in-time-recovery upstream).

---

## 2) Threat scenarios

### 2.1 Database corruption (single bad migration / write)

- **Detect:** errors spike on `/api/v1/health/services` (`db: degraded`),
  `prisma.$queryRaw` failures in logs, application 500s on read.
- **Mitigate:** put the platform in maintenance mode (`MAINTENANCE_MODE=1`
  env var → server short-circuits with 503 except `/api/health`).
- **Recover:** restore the most recent good daily backup with
  `scripts/restore-db.sh` (see § 4).
- **Postmortem:** review the migration that triggered the corruption;
  add a regression guard to `prisma/migrations/<id>/migration.sql`.

### 2.2 Accidental deletion (DROP TABLE, DELETE without WHERE)

- **Detect:** missing rows reported by support / admin dashboard;
  unexpected drop in row counts on the `/admin/stats` page.
- **Mitigate:** immediately revoke write access for the offending role
  (`ALTER ROLE <name> NOLOGIN;`).
- **Recover:** identify the smallest backup window covering the
  deletion. Restore to a **staging instance**, export the affected
  rows, and `INSERT … ON CONFLICT DO NOTHING` into production. Avoid
  full-DB restore unless damage is platform-wide.
- **Postmortem:** audit the role permission grant chain; add a row to
  ADR / docs/SECURITY.md if a process gap is found.

### 2.3 Region / host outage (Render or Hostinger goes down)

- **Detect:** uptime monitor (`statuspage / hetrixtools`) reports the
  primary host unreachable for > 5 minutes.
- **Mitigate:** flip DNS over to the standby region if one is
  provisioned (Hostinger Senaryo C — see `docs/adr/ADR-001-hosting-strategy.md`).
  Otherwise, communicate via `/status` page + Telegram channel; the
  status page is intentionally hosted on a different platform from the
  app so it can be updated during an outage.
- **Recover:** Render incidents typically resolve in < 1h. If longer,
  spin up a temporary Vercel/Fly.io target from `Dockerfile` (already
  in repo) and point DNS there using the prepared standby script.
- **Postmortem:** if outage > 4h, escalate the multi-region rebuild
  in ADR-001 from "deferred" to "next sprint".

### 2.4 Compromised credentials (leaked DATABASE_URL / JWT secret)

- **Detect:** unexpected admin actions in the audit log, sessions from
  unknown IPs, abnormal traffic patterns.
- **Mitigate:**
  1. Rotate the leaked secret in Render / Hostinger dashboard
     (`DATABASE_URL`, `JWT_SECRET`, `CAL_WEBHOOK_SECRET`).
  2. Call `revokeAllUserSessions(userId, 'COMPROMISE')` against the
     suspected account, or run `UPDATE "Session" SET "revokedAt" = NOW()
WHERE …` server-wide if scope is broader.
  3. Force a fresh deploy so the new secret bakes into running
     containers.
- **Recover:** users re-authenticate; their data is intact. Audit-log
  every action taken during the response.
- **Postmortem:** rotate every secret older than 90 days; review the
  `.env` distribution path.

### 2.5 Total backup loss (every dump deleted)

- **Detect:** restore drill fails; `ls backups/` empty; S3 bucket
  empty.
- **Mitigate:** **this is the worst case**. Switch to read-only mode
  immediately (`MAINTENANCE_MODE=read-only`).
- **Recover:** use Render PostgreSQL **point-in-time recovery** as the
  fallback layer of defence (Render keeps WAL for ≥ 7 days on paid
  plans). This is the system's "backup of backups".
- **Postmortem:** treat as a P0 incident; document the failure of the
  backup pipeline; add monitoring to alert if no successful backup has
  run for > 48h.

---

## 3) Backup architecture

```
                     ┌──────────────────┐
   cron@2am ───────► │ scripts/         │
                     │ backup-db.sh     │
                     └────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         backups/daily/  backups/weekly/  backups/monthly/
         (7 retained)    (4 retained)     (3 retained)
                              │
                              ▼ (BACKUP_REMOTE_PUSH=1)
                       S3 / Backblaze B2
                       (off-host copy)
                              │
                              ▼ (every Sunday)
                       Quarterly DR drill
                       restores to staging
```

The pre-existing P40-T07 backup script handles GPG encryption and S3
upload. The script is idempotent and safe to re-run.

---

## 4) Restore procedure (step-by-step)

This is the **paper checklist**; the on-call engineer should follow it
top-to-bottom during an incident.

```
1.  Declare the incident in #incident channel (Telegram + status page).

2.  Stop write traffic:
      export MAINTENANCE_MODE=1
      pm2 restart ecypro-api   # or render dashboard restart

3.  Identify the target backup:
      ls -lh backups/daily/    # most recent first
      ls -lh backups/weekly/   # last 4 Sundays
      ls -lh backups/monthly/  # last 3 first-of-month

4.  Provision a temporary staging DB (Render → "Fork from snapshot" or
    create a new Postgres instance):
      export STAGING_URL=postgresql://...

5.  Test-restore to staging FIRST (never restore straight to prod):
      DATABASE_URL=$STAGING_URL ./scripts/restore-db.sh \
        backups/daily/ecypro_20260515_020000.dump

6.  Smoke the restored staging DB:
      DATABASE_URL=$STAGING_URL npx tsx scripts/health-smoke.mjs
      # or hit /api/v1/health/services from a curl loop

7.  If smoke green → restore to production:
      ./scripts/restore-db.sh backups/daily/ecypro_20260515_020000.dump \
        --confirm production
      # script will require typing "restore production now"

8.  Regenerate Prisma client + reload app:
      npm run db:generate
      pm2 restart ecypro-api
      unset MAINTENANCE_MODE
      pm2 restart ecypro-api

9.  Verify critical flows:
      curl -fsSL https://api.ecypro.com/api/v1/health
      curl -fsSL https://api.ecypro.com/api/v1/status
      # Login from a real client, verify session list

10. Post-incident:
      - Time-stamp every step taken.
      - Update /status page to "operational".
      - File a postmortem under docs/postmortems/YYYY-MM-DD-<slug>.md
      - Open a ticket for any process gap discovered.
```

---

## 5) Cron schedule (operator-side)

Recommended `crontab -e` on the host running the backup script:

```cron
# Daily backup at 02:00 UTC (low-traffic window)
0 2 * * * cd /opt/ecypro && /bin/bash scripts/backup-db.sh \
  >> /var/log/ecypro-backup.log 2>&1

# Drift detector — confirm spec-vs-code daily
0 3 * * * cd /opt/ecypro && node scripts/api-contract-test.mjs \
  >> /var/log/ecypro-api-contract.log 2>&1

# Quarterly drill reminder (push Telegram message — manual restore)
0 9 1 */3 * cd /opt/ecypro && curl -s -X POST \
  "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  -d "chat_id=$TELEGRAM_CHAT_ID&text=DR drill due this week"
```

Render-managed deployments should configure the daily backup as a
**Render Cron Job** with `command: bash scripts/backup-db.sh`, sharing
the same `DATABASE_URL` and `BACKUP_ENCRYPTION_KEY` env vars as the
web service.

---

## 6) Quarterly drill checklist

```
[ ] Pick the most recent weekly backup as the source.
[ ] Restore to a freshly-created staging DB.
[ ] Time the procedure end-to-end (target < 30 minutes).
[ ] Run npx playwright test test:e2e:fast against the restored staging.
[ ] Confirm Prisma generate + typecheck succeed.
[ ] Tear down the staging DB.
[ ] File the drill report under docs/dr-drills/YYYY-Q<N>.md including:
      - Source backup file + size
      - Time-to-restore
      - Any failures or warnings
      - Process gaps + action items
```

If the drill consumes more than the **MTTR drill target of 30 minutes**,
that is a P1 follow-up: file a ticket, debug the slow path, and re-run
within the same quarter.

---

## 7) Quick reference

| Question                             | Answer                                                             |
| ------------------------------------ | ------------------------------------------------------------------ |
| Where do backups live?               | `./backups/{daily,weekly,monthly}/` + S3 if `BACKUP_REMOTE_PUSH=1` |
| How fresh is the most recent backup? | `ls -lt backups/daily/ \| head -1`                                 |
| How long to restore?                 | Drill target 30 min, RTO 1 h                                       |
| How much data could we lose?         | Up to 24 h (RPO)                                                   |
| How is this tested?                  | Quarterly DR drill (next 2026-08-16)                               |
| Where is the script?                 | `scripts/backup-db.sh` and `scripts/restore-db.sh`                 |
| Where is the policy?                 | This file (`docs/DISASTER_RECOVERY.md`)                            |
