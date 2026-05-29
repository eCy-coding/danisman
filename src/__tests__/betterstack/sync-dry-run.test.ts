import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const syncScript = resolve(__dirname, '../../../scripts/betterstack-sync.mjs');

describe('betterstack-sync.mjs dry-run (no token)', () => {
  function runSync() {
    const env = { ...process.env };
    delete env['BETTERSTACK_API_TOKEN'];
    return spawnSync('node', [syncScript], { env, encoding: 'utf8' });
  }

  it('exits 0 when BETTERSTACK_API_TOKEN is absent', () => {
    const result = runSync();
    expect(result.status).toBe(0);
  });

  it('prints "skipping sync" message', () => {
    const result = runSync();
    expect(result.stdout).toContain('skipping sync');
  });

  it('references "owner Tier 3" in skip message', () => {
    const result = runSync();
    expect(result.stdout).toContain('owner Tier 3');
  });

  it('produces no stderr on dry-run', () => {
    const result = runSync();
    expect(result.stderr).toBe('');
  });
});
