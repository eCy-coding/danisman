#!/usr/bin/env node
/**
 * eCyPro — Integration Health Check
 * P10 Aşama 2 — DevOps-Publisher
 *
 * Validates every external integration is correctly wired and ready for prod.
 * Reads .env.production (NOT bundled, host-only) and reports presence + format.
 *
 * Exit codes:
 *   0 — all required integrations green
 *   1 — at least one REQUIRED integration missing or malformed
 *
 * Usage:
 *   node scripts/integration-health.mjs               # uses .env.production
 *   node scripts/integration-health.mjs --env=.env.dev
 *   node scripts/integration-health.mjs --probe       # also probe live endpoints
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);
const envFlag = args.find((a) => a.startsWith('--env='));
const envPath = envFlag ? envFlag.slice('--env='.length) : '.env.production';
const probe = args.includes('--probe');

function loadEnv(file) {
  const abs = path.resolve(process.cwd(), file);
  if (!fs.existsSync(abs)) return {};
  const raw = fs.readFileSync(abs, 'utf8');
  const out = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    out[key] = val;
  }
  return out;
}

const env = loadEnv(envPath);

const C = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function badge(status) {
  if (status === 'PASS') return `${C.green}✅ PASS${C.reset}`;
  if (status === 'FAIL') return `${C.red}❌ FAIL${C.reset}`;
  if (status === 'WARN') return `${C.yellow}⚠  WARN${C.reset}`;
  return `${C.dim}··${C.reset}`;
}

const checks = [];

function check({ name, key, value, status, detail }) {
  checks.push({ name, key, value, status, detail });
}

const FILLER = /__FILL_ME__/;
const NON_EMPTY = (v) => typeof v === 'string' && v.trim().length > 0 && !FILLER.test(v);

// ─── REQUIRED ────────────────────────────────────────────
const VITE_API_URL = env.VITE_API_URL;
check({
  name: 'API base URL (frontend → backend)',
  key: 'VITE_API_URL',
  value: VITE_API_URL,
  status:
    VITE_API_URL === ''
      ? 'WARN'
      : NON_EMPTY(VITE_API_URL) && /^https?:\/\//.test(VITE_API_URL)
        ? 'PASS'
        : 'FAIL',
  detail:
    VITE_API_URL === ''
      ? 'Boş — Plan A simulation mode (in-memory adapters)'
      : NON_EMPTY(VITE_API_URL)
        ? `Plan C hybrid → ${VITE_API_URL}`
        : 'Geçersiz değer',
});

const SENTRY_DSN = env.VITE_SENTRY_DSN;
check({
  name: 'Sentry frontend DSN',
  key: 'VITE_SENTRY_DSN',
  value: SENTRY_DSN,
  status: NON_EMPTY(SENTRY_DSN)
    ? /^https:\/\/[^@]+@[^/]+\/\d+$/.test(SENTRY_DSN)
      ? 'PASS'
      : 'FAIL'
    : 'FAIL',
  detail: NON_EMPTY(SENTRY_DSN) ? 'Format ✓' : 'Boş veya placeholder — error reporting kapalı',
});

const GA_ID = env.VITE_GA_TRACKING_ID;
check({
  name: 'Google Analytics 4 Measurement ID',
  key: 'VITE_GA_TRACKING_ID',
  value: GA_ID,
  status: NON_EMPTY(GA_ID) ? (/^G-[A-Z0-9]{8,12}$/.test(GA_ID) ? 'PASS' : 'FAIL') : 'FAIL',
  detail: NON_EMPTY(GA_ID) ? 'Format ✓ (G-XXXXXXXXXX)' : 'Boş veya placeholder',
});

const TG_TOKEN = env.VITE_TELEGRAM_BOT_TOKEN;
const TG_CHAT = env.VITE_TELEGRAM_CHAT_ID;
check({
  name: 'Telegram Bot Token (contact form)',
  key: 'VITE_TELEGRAM_BOT_TOKEN',
  value: TG_TOKEN,
  status: NON_EMPTY(TG_TOKEN) ? (/^\d+:[A-Za-z0-9_-]+$/.test(TG_TOKEN) ? 'PASS' : 'FAIL') : 'FAIL',
  detail: NON_EMPTY(TG_TOKEN) ? 'Format ✓ (digits:secret)' : 'Boş — form Demo Mode (alert sent to logs)',
});
check({
  name: 'Telegram Chat ID',
  key: 'VITE_TELEGRAM_CHAT_ID',
  value: TG_CHAT,
  status: NON_EMPTY(TG_CHAT) ? (/^-?\d+$/.test(TG_CHAT) ? 'PASS' : 'FAIL') : 'FAIL',
  detail: NON_EMPTY(TG_CHAT) ? 'Format ✓ (numeric)' : 'Boş — pair with bot token',
});

const PROD_URL = env.VITE_PROD_URL;
check({
  name: 'Production canonical URL',
  key: 'VITE_PROD_URL',
  value: PROD_URL,
  status: NON_EMPTY(PROD_URL) && /^https:\/\//.test(PROD_URL) ? 'PASS' : 'FAIL',
  detail: NON_EMPTY(PROD_URL) ? 'Format ✓' : 'Boş — sitemap.xml + JSON-LD canonical etkilenir',
});

// ─── OPTIONAL ────────────────────────────────────────────

const GB_KEY = env.VITE_GROWTHBOOK_CLIENT_KEY;
check({
  name: 'GrowthBook Client Key (feature flags)',
  key: 'VITE_GROWTHBOOK_CLIENT_KEY',
  value: GB_KEY,
  status: NON_EMPTY(GB_KEY) ? 'PASS' : 'WARN',
  detail: NON_EMPTY(GB_KEY) ? 'Aktif' : 'Boş — feature flag fetch kapalı (fail-open: tüm flag false)',
});

const CLARITY = env.VITE_CLARITY_PROJECT_ID;
check({
  name: 'Microsoft Clarity (session recording)',
  key: 'VITE_CLARITY_PROJECT_ID',
  value: CLARITY,
  status: NON_EMPTY(CLARITY) ? 'PASS' : 'WARN',
  detail: NON_EMPTY(CLARITY) ? 'Aktif' : 'Opsiyonel — kapalı',
});

const LIVECHAT = env.VITE_LIVECHAT_PROVIDER;
check({
  name: 'Live Chat Provider',
  key: 'VITE_LIVECHAT_PROVIDER',
  value: LIVECHAT,
  status: ['', 'crisp', 'tawk', 'intercom', undefined].includes(LIVECHAT)
    ? NON_EMPTY(LIVECHAT)
      ? 'PASS'
      : 'WARN'
    : 'FAIL',
  detail: NON_EMPTY(LIVECHAT) ? `Provider: ${LIVECHAT}` : 'Kapalı (opsiyonel)',
});

// ─── HOST-ONLY (sourcemap upload) ────────────────────────
const SENTRY_AUTH = env.SENTRY_AUTH_TOKEN;
const SENTRY_ORG = env.SENTRY_ORG;
const SENTRY_PROJECT = env.SENTRY_PROJECT;
check({
  name: 'Sentry release upload (host-only)',
  key: 'SENTRY_AUTH_TOKEN+ORG+PROJECT',
  value: NON_EMPTY(SENTRY_AUTH) ? '<redacted>' : '',
  status: NON_EMPTY(SENTRY_AUTH) && NON_EMPTY(SENTRY_ORG) && NON_EMPTY(SENTRY_PROJECT) ? 'PASS' : 'WARN',
  detail:
    NON_EMPTY(SENTRY_AUTH) && NON_EMPTY(SENTRY_ORG) && NON_EMPTY(SENTRY_PROJECT)
      ? 'release:sentry hazır'
      : '`npm run release:sentry` çalışmaz (source-map upload kapalı)',
});

// ─── SUMMARY ─────────────────────────────────────────────
console.log(`\n${C.cyan}━━━ eCyPro Integration Health (env: ${envPath}) ━━━${C.reset}\n`);
console.log(
  `${'INTEGRATION'.padEnd(46)} ${'KEY'.padEnd(30)}  ${'STATUS'.padEnd(10)}  DETAIL`,
);
console.log('─'.repeat(120));
for (const c of checks) {
  console.log(
    `${c.name.padEnd(46)} ${c.key.padEnd(30)}  ${badge(c.status).padEnd(20)}  ${c.detail}`,
  );
}

const pass = checks.filter((c) => c.status === 'PASS').length;
const warn = checks.filter((c) => c.status === 'WARN').length;
const fail = checks.filter((c) => c.status === 'FAIL').length;

console.log('─'.repeat(120));
console.log(
  `\n${C.green}PASS=${pass}${C.reset}  ${C.yellow}WARN=${warn}${C.reset}  ${C.red}FAIL=${fail}${C.reset}\n`,
);

// ─── OPTIONAL LIVE PROBE ─────────────────────────────────
if (probe) {
  console.log(`${C.cyan}━━━ Live probe (--probe flag) ━━━${C.reset}\n`);
  const probes = [];
  if (NON_EMPTY(VITE_API_URL)) probes.push({ name: 'Backend /health', url: `${VITE_API_URL.replace(/\/api\/?$/, '')}/api/health` });
  if (NON_EMPTY(TG_TOKEN)) probes.push({ name: 'Telegram getMe', url: `https://api.telegram.org/bot${TG_TOKEN}/getMe` });
  if (NON_EMPTY(GB_KEY) && NON_EMPTY(env.VITE_GROWTHBOOK_API_HOST))
    probes.push({ name: 'GrowthBook features', url: `${env.VITE_GROWTHBOOK_API_HOST}/api/features/${GB_KEY}` });
  if (NON_EMPTY(PROD_URL)) probes.push({ name: 'Production root', url: PROD_URL });

  // P11/5 — Sentry DSN host reachability (no PII sent, just CDN check)
  if (NON_EMPTY(SENTRY_DSN)) {
    try {
      const u = new URL(SENTRY_DSN);
      probes.push({ name: 'Sentry ingest host', url: `https://${u.host}/api/0/` });
    } catch {
      // malformed DSN — already caught upstream
    }
  }

  for (const p of probes) {
    try {
      const res = await fetch(p.url, { method: 'GET', signal: AbortSignal.timeout(5000) });
      console.log(`${p.name.padEnd(30)}  ${res.ok ? badge('PASS') : badge('FAIL')}  HTTP ${res.status}  ${p.url}`);
    } catch (e) {
      console.log(`${p.name.padEnd(30)}  ${badge('FAIL')}  ${e.message}  ${p.url}`);
    }
  }
  console.log('');
}

process.exit(fail > 0 ? 1 : 0);
