# Secret Rotation Plan — eCy-coding/danisman

**Generated:** 2026-05-22 (sprint H4)
**Scope:** GitHub Actions secrets + variables on `eCy-coding/danisman`.
**Baseline:** All secrets were (re)set 2026-05-18 → 2026-05-21. **None are 90+ days
old** — nothing is rotation-overdue at launch. This plan sets the forward cadence.

> Values are never recorded here — only names, last-update timestamps, and sensitivity.

## Rotation Cadence by Sensitivity

| Tier | Cadence | Rationale |
|---|---|---|
| **HIGH** | 30 days | API tokens granting account/infra control. Compromise = full takeover. |
| **MEDIUM** | 60 days | Scoped/observability tokens; leak is contained but actionable. |
| **LOW / static** | 90 days or never | Non-secret identifiers; rotate only if upstream resource is recreated. |

## Inventory + Schedule

### HIGH — rotate every 30 days (next due ~2026-06-20)

| Secret | Last set | Provider | Where consumed |
|---|---|---|---|
| `CF_API_TOKEN` | 2026-05-21 | Cloudflare | Edge/DNS/WAF API (sprint H5 scripts) |
| `VERCEL_TOKEN` | 2026-05-21 | Vercel | Deploy API |
| `RENDER_API_KEY` | 2026-05-21 | Render | Backend deploy API |
| `SUPABASE_ACCESS_TOKEN` | 2026-05-21 | Supabase | DB/admin API |
| `NEON_API_KEY` | 2026-05-18 | Neon | Postgres branch API |
| `NOTION_API_KEY` | 2026-05-21 | Notion | CRM sync (prospects/deliverables/notes) |
| `RESEND_API_KEY` | 2026-05-21 | Resend | Transactional email |
| `CALENDLY_TOKEN` | 2026-05-21 | Calendly | Booking webhook/API |
| `SENTRY_AUTH_TOKEN` | 2026-05-21 | Sentry | Source-map upload (release.yml, ci.yml) |

### MEDIUM — rotate every 60 days (next due ~2026-07-20)

| Secret | Last set | Notes |
|---|---|---|
| `POSTHOG_KEY` | 2026-05-21 | Project API key (analytics ingest). |
| `POSTHOG_HOST` | 2026-05-21 | Endpoint host; rotate only if instance moves. |
| `SENTRY_DSN_FRONTEND` | 2026-05-21 | DSN (semi-public); rotate on suspected abuse. |
| `SENTRY_DSN_BACKEND` | 2026-05-21 | DSN (semi-public). |
| `BETTERSTACK_HEARTBEAT_URL` | 2026-05-20 | Heartbeat URL; rotate if leaked (enables fake pings). |

### LOW / static identifiers — NOT sensitive (consider migrating to Variables)

These are resource **IDs**, not credentials. Storing them as encrypted Secrets is
harmless but misleading; they should ideally be repo **Variables**.

| Name | Type | Recommendation |
|---|---|---|
| `CF_ZONE_ID`, `CF_ACCOUNT_ID` | Cloudflare IDs | → move to Variables |
| `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | Vercel IDs | → move to Variables |
| `RENDER_SERVICE_ID` | Render ID | → move to Variables |
| `NOTION_DB_PROSPECTS/DELIVERABLES/NOTES` | Notion DB IDs | → move to Variables |
| `NEON_PROJECT_ID` (already a Variable) | Neon ID | ✓ correct |

## ⚠️ Findings — workflow ↔ secret mismatches (fix before relying on CI)

Workflows reference secrets that are **not defined**, so they silently resolve empty:

| Referenced in workflow | Defined? | Effect |
|---|---|---|
| `VITE_SENTRY_DSN` (ci.yml build) | ❌ (defined name is `SENTRY_DSN_FRONTEND`) | Frontend Sentry DSN empty in CI build → no error reporting wired |
| `SNYK_TOKEN` (security.yml) | ❌ | Snyk scan step has no token → skips/fails |
| `VITE_API_URL` (ci/build) | ❌ | API base URL empty in CI build |
| `LHCI_GITHUB_APP_TOKEN` (lighthouse) | ❌ | LHCI status check not posted |
| `SENTRY_ORG` / `SENTRY_PROJECT` (release.yml as secrets) | ❌ as secret | release.yml reads them as `secrets.*`; only ci.yml has `vars` fallback |
| `ZAP_TARGET_URL` (security-zap.yml) | ❌ | Falls back to hardcoded default — OK but undocumented |

**Action:** either define the missing secrets/vars or align workflow names with the
defined `SENTRY_DSN_FRONTEND` etc. Out of scope for this sprint (CI is billing-locked,
see `docs/CI_BILLING_LOCK_REDLINE.md`) — tracked here for post-launch.

## Rotation Procedure (per secret)

1. Generate a new token in the provider console (scoped to least privilege).
2. `gh secret set <NAME> --repo eCy-coding/danisman` (paste new value).
3. Update the same value in the runtime platform (Vercel/Render env) if consumed there.
4. Verify a deploy/health check passes with the new value.
5. Revoke the old token in the provider console.
6. Record the rotation date (this file's "Last set" column is the source of truth).

## Calendar

| Date | Action |
|---|---|
| 2026-06-20 | Rotate all HIGH-tier tokens (30-day) |
| 2026-07-20 | Rotate MEDIUM-tier (60-day) + 2nd HIGH cycle |
| 2026-08-19 | Review LOW/static; 3rd HIGH cycle |
