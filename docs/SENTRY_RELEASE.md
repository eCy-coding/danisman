# Sentry Release & Source-Map Upload

**Phase:** 110a
**Status:** config-ready, env-gated (no-op without secrets)

## Pipeline Overview

The Vite build pipeline ([`vite.config.ts`](../vite.config.ts) line ~199) runs
`@sentry/vite-plugin` only when `SENTRY_AUTH_TOKEN` is present in the
environment. The plugin:

- Creates a Sentry release named after `npm_package_version` (default: package
  version, set to `${{ github.sha }}` in CI).
- Uploads minified bundles + hidden source-maps from `./dist/**`.
- Tags the release with the deploy environment (defaults to `production`).

The CI workflow ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml))
build job propagates the secrets only when the repository owner has configured
them, so external forks and PRs without secret access still build successfully.

## Required Secrets

Set these in **GitHub → Settings → Secrets and variables → Actions**:

| Name                | Type     | Description                                                        |
| ------------------- | -------- | ------------------------------------------------------------------ |
| `SENTRY_AUTH_TOKEN` | Secret   | Sentry CLI auth token with `project:releases` + `org:read` scopes  |
| `VITE_SENTRY_DSN`   | Secret   | DSN for the **frontend** Sentry project (also bundled into client) |
| `SENTRY_ORG`        | Variable | Sentry organization slug (default: `ecypro`)                       |
| `SENTRY_PROJECT`    | Variable | Sentry project slug (default: `ecypro-frontend`)                   |

Alternative: use repository **Variables** (not Secrets) for `SENTRY_ORG` and
`SENTRY_PROJECT` if your org policy treats them as non-secret.

## Local Verification

```bash
# Without token — plugin is silent, build works as normal.
npm run build

# With token — plugin uploads to Sentry.
export SENTRY_AUTH_TOKEN=sntrys_…
export SENTRY_ORG=ecypro
export SENTRY_PROJECT=ecypro-frontend
export VITE_SENTRY_DSN=https://…ingest.sentry.io/…
export VITE_APP_VERSION=$(git rev-parse HEAD)
npm run build
```

## Server-Side (Next: P110b)

`@sentry/node` already initializes when `SENTRY_DSN` is set in the server
environment ([`server/index.ts`](../server/index.ts) line ~12). The next sub-phase
will:

- Add `pino` structured logger with request-id correlation.
- Push logs to Loki / Grafana Cloud (or another aggregator).
- Wire `Sentry.captureException` to bubble up critical-rate alerts.

## Verification After Configuration

1. Add the secrets above in GitHub.
2. Push to `main` — CI build job should print `✅ Sentry release uploaded for <sha>`.
3. In Sentry → Releases, the new release appears with bundles + source-maps.
4. Trigger an error in production → Sentry should symbolicate it back to the
   original TypeScript file/line.

## Rollback

Remove `SENTRY_AUTH_TOKEN` from GitHub secrets. The next CI run will print
`ℹ️ SENTRY_AUTH_TOKEN not set — release upload skipped`. No code change needed.
