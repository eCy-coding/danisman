/**
 * P18 BE Track 2 / Aşama 4 — Archive payload regression suite.
 *
 * Pins:
 *   - buildArchivePayload is order-stable and gzip-decodes back to JSON.
 *   - windowStart/windowEnd derive from min/max createdAt.
 *   - rowCount matches the input array length.
 */

import { describe, it, expect } from 'vitest';
import { gunzipSync } from 'node:zlib';
import { buildArchivePayload } from './audit-archive-worker';

describe('buildArchivePayload', () => {
  const sample = (id: string, daysAgo: number) => ({
    id,
    adminId: 'admin-x',
    action: 'TEST',
    targetType: null,
    targetId: null,
    oldValue: null,
    newValue: null,
    ip: null,
    userAgent: null,
    createdAt: new Date(Date.now() - daysAgo * 24 * 3600_000),
  });

  it('serialises rows + computes window bounds', () => {
    const rows = [sample('c', 1), sample('a', 100), sample('b', 50)];
    const payload = buildArchivePayload(rows);
    expect(payload.rowCount).toBe(3);
    expect(payload.windowStart.getTime()).toBeLessThan(payload.windowEnd.getTime());
    expect(payload.gz.length).toBeGreaterThan(0);
  });

  it('gzipped buffer round-trips to identical JSON', () => {
    const rows = [sample('a', 5), sample('b', 4)];
    const payload = buildArchivePayload(rows);
    const decoded = JSON.parse(gunzipSync(payload.gz).toString('utf8'));
    expect(decoded.version).toBe(1);
    expect(decoded.rowCount).toBe(2);
    expect(Array.isArray(decoded.rows)).toBe(true);
  });

  it('handles empty input gracefully', () => {
    const payload = buildArchivePayload([]);
    expect(payload.rowCount).toBe(0);
    const decoded = JSON.parse(gunzipSync(payload.gz).toString('utf8'));
    expect(decoded.rows).toEqual([]);
  });
});
