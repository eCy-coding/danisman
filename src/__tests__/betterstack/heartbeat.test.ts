import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const heartbeatScript = resolve(__dirname, '../../../scripts/heartbeat.mjs');

describe('heartbeat.mjs', () => {
  it('exits 0 when BETTERSTACK_HEARTBEAT_URL is not set', () => {
    const env = { ...process.env };
    delete env['BETTERSTACK_HEARTBEAT_URL'];
    const result = spawnSync('node', [heartbeatScript], { env, encoding: 'utf8' });
    expect(result.status).toBe(0);
  });

  it('prints "skipping" when URL absent', () => {
    const env = { ...process.env };
    delete env['BETTERSTACK_HEARTBEAT_URL'];
    const result = spawnSync('node', [heartbeatScript], { env, encoding: 'utf8' });
    expect(result.stdout).toContain('skipping');
  });

  it('exits 1 on unreachable URL after retries', () => {
    const env = {
      ...process.env,
      BETTERSTACK_HEARTBEAT_URL: 'https://this.domain.does.not.exist.ecypro-test/hb',
    };
    const result = spawnSync('node', [heartbeatScript], { env, encoding: 'utf8', timeout: 60000 });
    expect(result.status).toBe(1);
  }, 65000);

  it('logs FAILED after exhausting retries', () => {
    const env = {
      ...process.env,
      BETTERSTACK_HEARTBEAT_URL: 'https://this.domain.does.not.exist.ecypro-test/hb',
    };
    const result = spawnSync('node', [heartbeatScript], { env, encoding: 'utf8', timeout: 60000 });
    const combined = result.stdout + result.stderr;
    expect(combined).toContain('FAILED');
  }, 65000);
});
