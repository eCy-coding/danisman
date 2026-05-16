/**
 * P18 BE Track 2 / Aşama 2 — Metrics module regression suite.
 *
 * Pins:
 *   - normaliseRouteLabel collapses UUID + numeric segments.
 *   - metrics.* helpers are safe to call without prom-client installed.
 *   - metrics.render returns a parseable exposition.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { metrics, normaliseRouteLabel, _metricsTesting } from './metrics';

describe('normaliseRouteLabel', () => {
  beforeEach(() => _metricsTesting.reset());

  it('preserves parameterised paths', () => {
    expect(normaliseRouteLabel('/admin/api-keys/:id')).toBe('/admin/api-keys/:id');
  });

  it('replaces UUIDs with :uuid', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    expect(normaliseRouteLabel(`/bookings/${id}/feedback`)).toBe('/bookings/:uuid/feedback');
  });

  it('replaces numeric segments with :num', () => {
    expect(normaliseRouteLabel('/users/1234/settings')).toBe('/users/:num/settings');
  });

  it('replaces long hex segments with :hex', () => {
    expect(normaliseRouteLabel('/raw/deadbeef0123abcd')).toBe('/raw/:hex');
  });

  it('handles empty + slash-only', () => {
    expect(normaliseRouteLabel('')).toBe('<unmatched>');
    expect(normaliseRouteLabel('/')).toBe('/');
  });
});

describe('metrics helpers (no prom-client)', () => {
  beforeEach(() => _metricsTesting.reset());

  it('never throws when emitting cache events', () => {
    expect(() => metrics.incCache('response', 'hit')).not.toThrow();
    expect(() => metrics.incCache('response', 'miss')).not.toThrow();
  });

  it('never throws when emitting BullMQ events', () => {
    expect(() => metrics.incBullmq('email', 'enqueued')).not.toThrow();
    expect(() => metrics.incBullmq('cron', 'failed')).not.toThrow();
    expect(() => metrics.setBullmqPending('image-resize', 3)).not.toThrow();
  });

  it('never throws when emitting HTTP events', () => {
    expect(() =>
      metrics.observeHttpRequest('GET', '/api/health', 200, 0.012),
    ).not.toThrow();
  });

  it('render returns a parseable text exposition (synthetic when prom-client absent)', async () => {
    const out = await metrics.render();
    expect(typeof out.body).toBe('string');
    expect(out.body.length).toBeGreaterThan(0);
    expect(out.contentType).toMatch(/text\/plain/);
  });
});
