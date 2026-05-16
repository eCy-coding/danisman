#!/usr/bin/env node
/**
 * eCyPro — Sentry test event probe
 * P11/5 — e2e-stabilizer
 *
 * Sends a single test event to Sentry to verify FE DSN + ingestion path.
 * Use only after PII scrub config is applied (beforeSend redaction).
 *
 * Usage:
 *   node scripts/probe-sentry-event.mjs                 # uses .env.production
 *   SENTRY_DSN=https://... node scripts/probe-sentry-event.mjs
 *
 * Exit: 0 = event accepted (HTTP 200), 1 = failure.
 */

import fs from 'node:fs';
import process from 'node:process';

function loadEnv(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    let v = t.slice(eq + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    out[t.slice(0, eq).trim()] = v;
  }
  return out;
}

const env = { ...loadEnv('.env.production'), ...process.env };
const DSN = env.VITE_SENTRY_DSN || env.SENTRY_DSN;

if (!DSN || DSN.includes('__FILL_ME__')) {
  console.error('❌ VITE_SENTRY_DSN missing or placeholder');
  process.exit(1);
}

let url, publicKey, projectId;
try {
  const u = new URL(DSN);
  publicKey = u.username;
  projectId = u.pathname.replace(/^\//, '');
  url = `${u.protocol}//${u.host}/api/${projectId}/store/`;
} catch (e) {
  console.error('❌ Invalid DSN:', e.message);
  process.exit(1);
}

const event = {
  event_id: crypto.randomUUID().replace(/-/g, ''),
  timestamp: new Date().toISOString(),
  level: 'info',
  platform: 'javascript',
  message: 'eCyPro P11 integration health check (probe-sentry-event.mjs)',
  tags: { probe: 'true', source: 'p11-e2e' },
  extra: { note: 'No PII — synthetic test event' },
};

const auth =
  `Sentry sentry_version=7,sentry_client=ecypro-probe/1.0,sentry_key=${publicKey}`;

console.log(`▶ POST ${url}`);
try {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Sentry-Auth': auth },
    body: JSON.stringify(event),
    signal: AbortSignal.timeout(10000),
  });
  const text = await res.text();
  console.log(`  HTTP ${res.status}`);
  console.log(`  Body: ${text.slice(0, 200)}`);
  if (res.ok) {
    console.log(`✅ Sentry event accepted (event_id=${event.event_id})`);
    process.exit(0);
  } else {
    console.error(`❌ Sentry rejected the event (status ${res.status})`);
    process.exit(1);
  }
} catch (e) {
  console.error('❌ Request failed:', e.message);
  process.exit(1);
}
