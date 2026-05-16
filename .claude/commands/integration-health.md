---
description: "Run integration health-check (env vars + format + optional live probe)"
allowed-tools:
  - Bash(node scripts/integration-health.mjs:*)
---

# /integration-health — Integration Wiring Verification

Reads `.env.production` (or `--env=<file>`) and validates every external integration:
- VITE_API_URL, VITE_SENTRY_DSN, VITE_GA_TRACKING_ID
- VITE_TELEGRAM_BOT_TOKEN + VITE_TELEGRAM_CHAT_ID (contact form)
- VITE_PROD_URL, VITE_GROWTHBOOK_CLIENT_KEY, VITE_CLARITY_PROJECT_ID
- SENTRY_AUTH_TOKEN + ORG + PROJECT (host-only, source-map upload)

Usage:
  node scripts/integration-health.mjs
  node scripts/integration-health.mjs --probe   # live endpoint probe

Exit 0 = all REQUIRED green. Exit 1 = at least one FAIL.

Run this BEFORE DEPLOY_NOW.command to catch credential gaps early.
