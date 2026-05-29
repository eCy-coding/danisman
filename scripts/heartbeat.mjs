#!/usr/bin/env node
/**
 * BetterStack heartbeat ping.
 * Exits 0 on success or when URL not configured.
 * Exits 1 on network failure (signals missed heartbeat to cron runner).
 */
const url = process.env.BETTERSTACK_HEARTBEAT_URL;

if (!url) {
  console.log('[heartbeat] BETTERSTACK_HEARTBEAT_URL not set — skipping (owner Tier 3 setup pending)');
  process.exit(0);
}

async function ping(attempt = 1) {
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    console.log(`[heartbeat] OK — status ${res.status}`);
    process.exit(0);
  } catch (err) {
    if (attempt < 3) {
      console.warn(`[heartbeat] Attempt ${attempt} failed: ${err.message} — retrying in 5s…`);
      await new Promise((r) => setTimeout(r, 5000));
      return ping(attempt + 1);
    }
    console.error(`[heartbeat] FAILED after 3 attempts: ${err.message}`);
    process.exit(1);
  }
}

ping();
