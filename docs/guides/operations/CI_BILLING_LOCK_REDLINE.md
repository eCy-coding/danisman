# CI/CD REDLINE — GitHub Actions Account Billing Lock

**Status:** 🔴 BLOCKED (account-level, not fixable in-repo)
**Detected:** 2026-05-21, sprint H1
**Owner action required:** Emre (GitHub account billing)

## Root Cause (definitive)

All 13 workflows in `eCy-coding/danisman` have been failing since ~2026-05-17.
Every job dies in 4–6 seconds with **no runner assigned** (`runner=NONE`, `steps=0`).

Exact GitHub annotation message (captured via `check-runs/annotations` API):

> **"The job was not started because your account is locked due to a billing issue."**

This is an **account-wide lock**. The repo is **public** (GitHub-hosted runners are
normally free for public repos), so this is a **failed payment / billing block on the
`eCy-coding` account**, not a minutes/spending-limit issue and **not** a workflow defect.

### Evidence
- Live `workflow_dispatch` of `claude-smoke.yml` (2026-05-21 23:02:56Z) → completed in 5s,
  both jobs `runner=NONE`, `steps=0`, conclusion=failure.
- `claude-smoke.yml` reported run-level **success** only because its jobs use
  `continue-on-error: true`, which masked the underlying runner failure. Its "green"
  history was a false positive.
- Repo Actions permissions: `enabled=true`, `allowed_actions=all` → Actions not disabled.
- Action versions already current (`actions/checkout@v4`, `actions/setup-node@v4`).
- No `write-all` / over-privilege found in any workflow.

**Conclusion:** No YAML, permission, or runner change can turn these workflows green
while the account billing lock is in place.

## Fix (human, outside repo)

1. Go to **https://github.com/settings/billing** (account `eCy-coding`).
2. Resolve the flagged billing issue (update/retry payment method, settle balance).
3. Wait for the account lock to clear (usually minutes after payment succeeds).
4. Re-trigger any workflow (`gh workflow run ci.yml --repo eCy-coding/danisman`) and
   confirm a runner is assigned (`runner_name` non-empty, steps > 0).

## REDLINE — Launch Bypass (CI gates dead until billing fixed)

Launch (Mon 2026-05-25 09:00) **must not depend on GitHub Actions** until the lock clears.
Run the quality gate **locally** and deploy via the provider CLI:

```bash
# Local quality gate (replaces CI)
npm run lint
npm run typecheck
npm run test -- --run
npm run build

# Deploy — Vercel (frontend), bypasses GitHub Actions entirely
vercel --prod
```

- Vercel's own Git integration / CLI deploy does **not** require GitHub Actions runners.
- Pre-push hooks (lefthook: typecheck + build) still run locally and remain the gate.
- Re-enable CI as the source of truth **only after** `runner_name` is confirmed non-empty.

## In-repo hardening shipped alongside (PR `feat/sprint-h1-ci-recovery`)

Least-privilege default `permissions:` added to read-only workflows so they are correct
the moment billing unlocks:

| Workflow | Added |
|---|---|
| `ci.yml` | `contents: read` |
| `security.yml` | `contents: read` |
| `lighthouse.yml` | `contents: read` |
| `security-zap.yml` | `contents: read` + `pull-requests: write` (PR comment) |

`docker.yml` (GHCR push: `packages: write` + OIDC `id-token: write`) and `release.yml`
left untouched — their elevated scopes are required and correctly job-scoped.
