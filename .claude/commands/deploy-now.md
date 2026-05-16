---
description: "Master orchestrator: pre-checks → backend → frontend → smoke (credentials gated)"
allowed-tools:
  - Bash(bash DEPLOY_NOW.command:*)
---

# /deploy-now — Master Deploy Orchestrator

Runs `DEPLOY_NOW.command` if it exists, otherwise prints the credential checklist.

Pre-conditions checked (read-only):
- npm run typecheck, lint, test --run, build
- /integration-health PASS
- git working tree clean
- 17 atomic commits ahead of origin/main

If all green AND credentials present → runs in order:
1. Backend deploy (Render)
2. Frontend deploy (Hostinger)
3. DNS check
4. SSL check
5. Live smoke (DEPLOY_LIVE_SMOKE.command)
6. IndexNow + Indexing API submission

If credentials missing → prints which env vars + CLIs to set, exit 1.
