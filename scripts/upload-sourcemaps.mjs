#!/usr/bin/env node
/**
 * upload-sourcemaps.mjs — Create Sentry release + upload sourcemaps.
 *
 * Usage:
 *   npm run release:sentry
 *
 * Required env (host-side; never in browser bundle):
 *   SENTRY_AUTH_TOKEN   user/org/internal token with "Project: Release" scope
 *   SENTRY_ORG          Sentry org slug          (e.g. "ecypro")
 *   SENTRY_PROJECT      Sentry project slug      (e.g. "frontend")
 *
 * Optional:
 *   SENTRY_RELEASE      override release name    (defaults to package.json version + git short SHA)
 *   SENTRY_URL_PREFIX   url prefix for hosted sourcemaps (default "~/assets")
 *
 * Behavior:
 *   1. Compute release name (or use SENTRY_RELEASE).
 *   2. Verify dist/ exists with .map files.
 *   3. Create release, associate commits (git), upload sourcemaps, finalize release.
 *   4. After successful upload, delete *.map from dist/ to avoid shipping them to clients.
 *
 * Idempotent: if release already exists, `releases new` is a no-op.
 */

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, unlinkSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const DIST = path.join(ROOT, 'dist');

// FE upload defaults to the frontend project; falls back to legacy SENTRY_PROJECT.
process.env.SENTRY_PROJECT =
  process.env.SENTRY_PROJECT_FRONTEND || process.env.SENTRY_PROJECT;

const required = ['SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`[sentry] missing env: ${missing.join(', ')}`);
  console.error('         Add them to your shell or CI environment. Aborting.');
  process.exit(1);
}

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, stdio: 'inherit', env: process.env });
}
function shOut(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
}

// Build a release name — MUST match vite.config.ts SENTRY_RELEASE (ecypro@<short-sha>)
// and src/lib/sentry.ts runtime tag.
function deriveReleaseName() {
  if (process.env.SENTRY_RELEASE) return process.env.SENTRY_RELEASE;
  let sha = 'dev';
  try {
    sha = shOut('git rev-parse --short HEAD');
  } catch {
    /* not a git repo */
  }
  return `ecypro@${sha}`;
}

const RELEASE = deriveReleaseName();
const URL_PREFIX = process.env.SENTRY_URL_PREFIX || '~/assets';

function findMaps(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...findMaps(full));
    else if (name.endsWith('.map')) out.push(full);
  }
  return out;
}

if (!existsSync(DIST)) {
  console.error('[sentry] dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

const maps = findMaps(DIST);
if (maps.length === 0) {
  console.warn('[sentry] No *.map files in dist/. Skipping upload.');
  process.exit(0);
}

console.log(`[sentry] release: ${RELEASE}`);
console.log(`[sentry] org:     ${process.env.SENTRY_ORG}`);
console.log(`[sentry] project: ${process.env.SENTRY_PROJECT}`);
console.log(`[sentry] maps:    ${maps.length}`);

// sentry-cli is provided via @sentry/vite-plugin transitively or installed globally.
// Fallback to `npx --yes @sentry/cli` if `sentry-cli` not found.
const CLI = (() => {
  try {
    shOut('command -v sentry-cli');
    return 'sentry-cli';
  } catch {
    return 'npx --yes @sentry/cli';
  }
})();

sh(`${CLI} releases new "${RELEASE}"`);
try {
  sh(`${CLI} releases set-commits --auto "${RELEASE}"`);
} catch {
  console.warn('[sentry] set-commits --auto failed (no remote tracked?), continuing.');
}
// sentry-cli 3.x: `releases files` replaced by `sourcemaps upload`
sh(`${CLI} sourcemaps upload --release "${RELEASE}" --url-prefix "${URL_PREFIX}" "${DIST}/assets"`);
sh(`${CLI} releases finalize "${RELEASE}"`);

// Defense: remove *.map from dist after successful upload so they aren't served.
for (const m of maps) {
  try {
    unlinkSync(m);
  } catch (e) {
    console.warn(`[sentry] could not unlink ${m}:`, e.message);
  }
}

console.log(`[sentry] ✓ release ${RELEASE} finalized, sourcemaps uploaded, .map files purged from dist/`);
