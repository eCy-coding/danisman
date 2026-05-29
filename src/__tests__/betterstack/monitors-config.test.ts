import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const config = JSON.parse(
  readFileSync(resolve(__dirname, '../../../scripts/betterstack-monitors.json'), 'utf8'),
) as { monitors: Record<string, unknown>[] };

describe('betterstack-monitors.json', () => {
  it('has monitors array', () => {
    expect(Array.isArray(config.monitors)).toBe(true);
  });

  it('has exactly 5 monitors', () => {
    expect(config.monitors).toHaveLength(5);
  });

  it('each monitor has a non-empty name', () => {
    for (const m of config.monitors) {
      expect(typeof m['name']).toBe('string');
      expect((m['name'] as string).length).toBeGreaterThan(0);
    }
  });

  it('each monitor has a valid monitor_type', () => {
    for (const m of config.monitors) {
      expect(['status', 'heartbeat']).toContain(m['monitor_type']);
    }
  });

  it('status monitors have https url and positive check_frequency', () => {
    for (const m of config.monitors) {
      if (m['monitor_type'] !== 'status') continue;
      expect(m['url'] as string).toMatch(/^https:\/\//);
      expect(typeof m['check_frequency']).toBe('number');
      expect(m['check_frequency'] as number).toBeGreaterThan(0);
    }
  });

  it('heartbeat monitor has expected_period > grace_period', () => {
    const hb = config.monitors.find((m) => m['monitor_type'] === 'heartbeat');
    expect(hb).toBeDefined();
    expect(typeof hb!['expected_period']).toBe('number');
    expect(typeof hb!['grace_period']).toBe('number');
    expect(hb!['grace_period'] as number).toBeLessThan(hb!['expected_period'] as number);
  });

  it('status monitors include eu region', () => {
    for (const m of config.monitors) {
      if (m['monitor_type'] !== 'status') continue;
      expect(Array.isArray(m['regions'])).toBe(true);
      expect(m['regions'] as string[]).toContain('eu');
    }
  });

  it('all urls point to ecypro.com', () => {
    for (const m of config.monitors) {
      if (!m['url']) continue;
      expect(m['url'] as string).toContain('ecypro.com');
    }
  });
});
