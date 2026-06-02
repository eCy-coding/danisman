#!/usr/bin/env tsx
/**
 * preflight-env.ts
 * CLI: tsx scripts/preflight-env.ts [--dry-run]
 *
 * Normal mode: reads process.env, exits 1 if any REQUIRED var is missing.
 * Dry-run:     parses .env file, warns only, no exit(1).
 */

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Variable lists
// ---------------------------------------------------------------------------

const VERCEL_REQUIRED = [
  'VITE_SENTRY_DSN_FRONTEND',
  'VITE_POSTHOG_KEY',
  'SENTRY_AUTH_TOKEN',
  'SENTRY_ORG',
  'SENTRY_PROJECT',
];

const VERCEL_OPTIONAL = [
  'VITE_POSTHOG_HOST',
  'VITE_GOOGLE_TAG_ID',
  'VITE_CALENDLY_URL',
  'VITE_APP_VERSION',
];

const RENDER_REQUIRED = [
  'DATABASE_URL',
  'RESEND_API_KEY',
  'NOTION_API_KEY',
  'NOTION_DB_PROSPECTS',
  'JWT_SECRET',
];

const RENDER_OPTIONAL = [
  'BETTERSTACK_HEARTBEAT_URL',
  'BETTERSTACK_HEARTBEAT_SECRET',
  'SENTRY_DSN',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
  'CALENDLY_WEBHOOK_SIGNING_KEY',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseDotEnv(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return result;
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    const value = line
      .slice(eqIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (key) result[key] = value;
  }
  return result;
}

function checkVar(
  key: string,
  env: Record<string, string | undefined>,
  required: boolean,
  dryRun: boolean,
): boolean {
  const present = key in env && env[key] !== '' && env[key] !== undefined;
  const status = present ? 'PASS' : required ? 'FAIL' : 'WARN';
  const icon = present ? '✓' : required ? '✗' : '~';
  const label = required ? '(required)' : '(optional)';
  console.log(`  ${icon} ${status}  ${key} ${label}`);
  if (!present && required && !dryRun) return false;
  return true;
}

function checkGroup(
  platform: string,
  required: string[],
  optional: string[],
  env: Record<string, string | undefined>,
  dryRun: boolean,
): boolean {
  console.log(`\n── ${platform} ──`);
  let allOk = true;
  for (const key of required) {
    if (!checkVar(key, env, true, dryRun)) allOk = false;
  }
  for (const key of optional) {
    checkVar(key, env, false, dryRun);
  }
  return allOk;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const dryRun = process.argv.includes('--dry-run');

let env: Record<string, string | undefined>;

if (dryRun) {
  const envFile = path.resolve(process.cwd(), '.env');
  console.log(`[preflight-env] dry-run — reading ${envFile}`);
  env = parseDotEnv(envFile);
} else {
  console.log('[preflight-env] checking process.env');
  env = process.env as Record<string, string | undefined>;
}

console.log('');

const vercelOk = checkGroup('VERCEL', VERCEL_REQUIRED, VERCEL_OPTIONAL, env, dryRun);
const renderOk = checkGroup('RENDER', RENDER_REQUIRED, RENDER_OPTIONAL, env, dryRun);

console.log('');

const allOk = vercelOk && renderOk;

if (allOk) {
  console.log('✓ All required env vars present.');
} else if (dryRun) {
  console.warn('~ Missing required vars detected (dry-run: no exit 1).');
} else {
  console.error('✗ Missing required env vars. Aborting.');
  process.exit(1);
}
