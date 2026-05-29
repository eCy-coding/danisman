#!/usr/bin/env node
/**
 * upload-sourcemaps-server.mjs — Create Sentry release + upload BACKEND sourcemaps.
 *
 * Usage (Render build, after `npm run build:server`):
 *   npm run release:sentry:server
 *
 * Required env (host-side; never in browser bundle):
 *   SENTRY_AUTH_TOKEN        token with "Project: Releases" scope
 *   SENTRY_ORG               org slug (e.g. "ecypro")
 *   SENTRY_PROJECT_BACKEND   backend project slug (e.g. "ecypro-backend")
 *
 * Optional:
 *   SENTRY_RELEASE           override (default `ecypro@<short-sha>` — matches server/index.ts)
 *
 * tsc emits CommonJS (no bundler debug-IDs) → use `sourcemaps inject` + `upload`.
 * Idempotent: `releases new` is a no-op if the release already exists.
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST_SERVER = path.join(ROOT, 'dist', 'server');

const required = ['SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT_BACKEND'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`[sentry:server] missing env: ${missing.join(', ')}. Aborting.`);
  process.exit(1);
}

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, stdio: 'inherit', env: process.env });
}
function shOut(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function deriveReleaseName() {
  if (process.env.SENTRY_RELEASE) return process.env.SENTRY_RELEASE;
  const raw =
    process.env.RENDER_GIT_COMMIT ||
    (() => {
      try {
        return shOut('git rev-parse --short HEAD');
      } catch {
        return 'dev';
      }
    })();
  return `ecypro@${raw.slice(0, 7)}`;
}

if (!existsSync(DIST_SERVER)) {
  console.error('[sentry:server] dist/server not found. Run `npm run build:server` first.');
  process.exit(1);
}

const RELEASE = deriveReleaseName();
const PROJECT = process.env.SENTRY_PROJECT_BACKEND;

const CLI = (() => {
  try {
    shOut('command -v sentry-cli');
    return 'sentry-cli';
  } catch {
    return 'npx --yes @sentry/cli';
  }
})();

console.log(`[sentry:server] release: ${RELEASE} | project: ${PROJECT}`);

sh(`${CLI} releases --project "${PROJECT}" new "${RELEASE}"`);
try {
  sh(`${CLI} releases --project "${PROJECT}" set-commits --auto "${RELEASE}"`);
} catch {
  console.warn('[sentry:server] set-commits --auto failed, continuing.');
}
// inject debug-IDs into emitted JS + maps, then upload.
sh(`${CLI} sourcemaps inject --project "${PROJECT}" "${DIST_SERVER}"`);
sh(
  `${CLI} sourcemaps upload --project "${PROJECT}" --release "${RELEASE}" "${DIST_SERVER}"`,
);
sh(`${CLI} releases --project "${PROJECT}" finalize "${RELEASE}"`);
sh(
  `${CLI} releases --project "${PROJECT}" deploys "${RELEASE}" new --env "${process.env.NODE_ENV ?? 'production'}"`,
);

console.log(`[sentry:server] ✓ release ${RELEASE} finalized + sourcemaps uploaded`);
