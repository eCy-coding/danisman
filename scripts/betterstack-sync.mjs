#!/usr/bin/env node
/**
 * BetterStack monitor sync — idempotent.
 * Matches monitors by name; creates or updates as needed.
 * Dry-runs gracefully when BETTERSTACK_API_TOKEN is absent.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_BASE = 'https://uptime.betterstack.com/api/v2';

const token = process.env.BETTERSTACK_API_TOKEN;

if (!token) {
  console.log(
    '[betterstack-sync] BETTERSTACK_API_TOKEN not set — skipping sync (owner Tier 3 setup pending)'
  );
  process.exit(0);
}

const config = JSON.parse(
  readFileSync(join(__dirname, 'betterstack-monitors.json'), 'utf8')
);

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...opts.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`BetterStack API ${res.status} at ${path}: ${body}`);
  }
  return res.json();
}

async function fetchAllMonitors() {
  const all = [];
  let url = '/monitors';
  while (url) {
    const data = await apiFetch(url);
    all.push(...data.data);
    url = data.pagination?.next ? new URL(data.pagination.next).pathname + new URL(data.pagination.next).search : null;
  }
  return all;
}

function buildPayload(monitor) {
  const base = { monitor_type: monitor.monitor_type, name: monitor.name };
  if (monitor.monitor_type === 'heartbeat') {
    return {
      ...base,
      expected_period: monitor.expected_period,
      grace_period: monitor.grace_period,
    };
  }
  return {
    ...base,
    url: monitor.url,
    check_frequency: monitor.check_frequency,
    expected_status_codes: monitor.expected_status_codes,
    regions: monitor.regions,
    ...(monitor.ssl_expiration_check !== undefined && {
      ssl_expiration: monitor.ssl_expiration_check ? 30 : 0,
    }),
    ...(monitor.follow_redirects !== undefined && {
      follow_redirects: monitor.follow_redirects,
    }),
    ...(monitor.recovery_period !== undefined && {
      recovery_period: monitor.recovery_period,
    }),
    ...(monitor.confirmation_period !== undefined && {
      confirmation_period: monitor.confirmation_period,
    }),
  };
}

async function main() {
  console.log('[betterstack-sync] Fetching existing monitors…');
  const existing = await fetchAllMonitors();
  const existingByName = Object.fromEntries(existing.map((m) => [m.attributes.name, m]));

  const results = { created: [], updated: [], skipped: [] };

  for (const monitor of config.monitors) {
    const payload = buildPayload(monitor);
    const match = existingByName[monitor.name];

    if (!match) {
      console.log(`  + Creating "${monitor.name}"…`);
      await apiFetch('/monitors', { method: 'POST', body: JSON.stringify(payload) });
      results.created.push(monitor.name);
    } else {
      // Check if any relevant field changed
      const attrs = match.attributes;
      const needsUpdate =
        (payload.url && payload.url !== attrs.url) ||
        (payload.check_frequency && payload.check_frequency !== attrs.check_frequency) ||
        (payload.expected_period && payload.expected_period !== attrs.expected_period);

      if (needsUpdate) {
        console.log(`  ~ Updating "${monitor.name}"…`);
        await apiFetch(`/monitors/${match.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
        results.updated.push(monitor.name);
      } else {
        console.log(`  = Skipping "${monitor.name}" (no changes)`);
        results.skipped.push(monitor.name);
      }
    }
  }

  console.log('\n[betterstack-sync] Summary:');
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error('[betterstack-sync] ERROR:', err.message);
  process.exit(1);
});
