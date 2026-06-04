# Heartbeat Runbook

## Overview

Two mechanisms keep BetterStack informed of service health:
- **GitHub Actions** (`heartbeat.yml`) — fires every 5 min via cron.
- **Server endpoint** (`/api/v1/heartbeat/cron`) — called by Render's built-in cron or an external scheduler.

## Required Env Vars

| Variable | Where set | Purpose |
|---|---|---|
| `BETTERSTACK_HEARTBEAT_URL` | Render env + GH secret | Target ping URL from BetterStack monitor |
| `BETTERSTACK_HEARTBEAT_SECRET` | Render env | HMAC key for server endpoint signature check |

## GitHub Actions

`heartbeat.yml` runs `scripts/heartbeat.mjs` every 5 minutes.
The script retries up to 3 times on transient network failures before marking the step failed.

## Server Endpoint

```
POST /api/v1/heartbeat/cron
X-Heartbeat-Signature: sha256=<hex>
```

The signature is `HMAC-SHA256(BETTERSTACK_HEARTBEAT_SECRET, request body)`.
Returns `200 OK` with `{ ok: true }` on success.

## Local Cron (macOS)

```bash
cp scripts/cron/heartbeat-betterstack.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/heartbeat-betterstack.plist
```

## Linux Cron

```cron
*/5 * * * * node /path/to/scripts/heartbeat.mjs
```

## Troubleshoot

Logs: `/tmp/ecypro-heartbeat.log`

If pings stop appearing in BetterStack:
1. Check GH Actions for `heartbeat` workflow failures.
2. Verify `BETTERSTACK_HEARTBEAT_URL` secret is set in the repo.
3. Check `/tmp/ecypro-heartbeat.log` on Render for server-side failures.
4. Confirm BetterStack monitor is not paused.
