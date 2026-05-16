/**
 * P21/T1 — RUM stats unit tests.
 *
 * 1) PSquaredQuantile median tahmini, sıralanmış array'in median'ından
 *    %5'ten daha az sapmamalı (n=500).
 * 2) templatePath ID-like segmentleri yer tutucuya çevirmeli.
 * 3) maskIp IPv4 son okteti sıfırlamalı.
 * 4) Welford outlier filtresi 3-sigma üstünü reddetmeli.
 * 5) RumAggregator bot kullanıcı ajanını drop etmeli.
 */

import { describe, expect, it } from 'vitest';
import {
  PSquaredQuantile,
  RumAggregator,
  Welford,
  emailDomain,
  maskIp,
  shouldDropSample,
  templatePath,
  DEFAULT_RUM_STATS_CONFIG,
} from './rum-stats';

describe('PSquaredQuantile', () => {
  it('estimates median within ~5% of true value', () => {
    // Lognormal-ish distribution mimicking LCP samples (ms).
    const samples: number[] = [];
    let seed = 42;
    const rand = (): number => {
      // Mulberry32 — deterministic, fast.
      seed = (seed + 0x6d2b79f5) | 0;
      let t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = 0; i < 500; i++) {
      // Exponential samples around 2000ms
      samples.push(Math.max(50, 2000 * -Math.log(1 - rand())));
    }
    const median = new PSquaredQuantile(0.5);
    for (const x of samples) median.push(x);
    const sorted = [...samples].sort((a, b) => a - b);
    const trueMedian = sorted[Math.floor(sorted.length * 0.5)];
    const est = median.value();
    expect(Math.abs(est - trueMedian) / trueMedian).toBeLessThan(0.05);
  });

  it('estimates p95 within ~10% of true value', () => {
    const samples: number[] = [];
    for (let i = 0; i < 500; i++) samples.push(100 + i);
    const p95 = new PSquaredQuantile(0.95);
    for (const x of samples) p95.push(x);
    const sorted = [...samples].sort((a, b) => a - b);
    const trueP95 = sorted[Math.floor(sorted.length * 0.95)];
    const est = p95.value();
    expect(Math.abs(est - trueP95) / trueP95).toBeLessThan(0.1);
  });

  it('rejects p ≤ 0 or p ≥ 1', () => {
    expect(() => new PSquaredQuantile(0)).toThrow();
    expect(() => new PSquaredQuantile(1)).toThrow();
  });

  it('returns NaN when no samples seen', () => {
    expect(Number.isNaN(new PSquaredQuantile(0.5).value())).toBe(true);
  });
});

describe('templatePath', () => {
  it('replaces numeric IDs with :id', () => {
    expect(templatePath('/user/123/profile')).toBe('/user/:id/profile');
  });

  it('replaces UUIDs with :uuid', () => {
    expect(templatePath('/orders/550e8400-e29b-41d4-a716-446655440000')).toBe('/orders/:uuid');
  });

  it('replaces date-like path segments', () => {
    expect(templatePath('/blog/2026/05/16/some-slug')).toBe('/blog/:y/:m/:d/some-slug');
  });

  it('keeps short stable segments', () => {
    expect(templatePath('/about/team')).toBe('/about/team');
  });

  it('handles root and empty', () => {
    expect(templatePath('/')).toBe('/');
    expect(templatePath('')).toBe('');
  });
});

describe('maskIp', () => {
  it('zeros last octet of IPv4', () => {
    expect(maskIp('192.168.1.42')).toBe('192.168.1.0');
  });

  it('zeros last group of IPv6', () => {
    expect(maskIp('2001:db8::1:2:3:4')).toBe('2001:db8::1:2:3:0');
  });

  it('returns empty on empty', () => {
    expect(maskIp('')).toBe('');
  });
});

describe('emailDomain', () => {
  it('extracts domain', () => {
    expect(emailDomain('alice@example.com')).toBe('example.com');
  });

  it('returns empty when no @', () => {
    expect(emailDomain('not-an-email')).toBe('');
  });
});

describe('Welford', () => {
  it('flags > 3σ outliers after warmup', () => {
    const w = new Welford();
    for (let i = 0; i < 100; i++) w.push(100 + (i % 5));
    expect(w.isOutlier(10_000)).toBe(true);
    expect(w.isOutlier(102)).toBe(false);
  });

  it('does not flag during warmup', () => {
    const w = new Welford();
    for (let i = 0; i < 5; i++) w.push(100);
    expect(w.isOutlier(10_000)).toBe(false);
  });
});

describe('shouldDropSample', () => {
  it('drops known crawler User-Agents', () => {
    expect(
      shouldDropSample(
        { userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)' },
        DEFAULT_RUM_STATS_CONFIG,
      ),
    ).toBe(true);
  });

  it('drops slow-2g connections', () => {
    expect(
      shouldDropSample(
        { userAgent: 'Mozilla/5.0', connectionType: 'slow-2g' },
        DEFAULT_RUM_STATS_CONFIG,
      ),
    ).toBe(true);
  });

  it('keeps normal browser', () => {
    expect(
      shouldDropSample(
        { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', connectionType: '4g' },
        DEFAULT_RUM_STATS_CONFIG,
      ),
    ).toBe(false);
  });
});

describe('RumAggregator', () => {
  it('aggregates samples and emits snapshot on flush', () => {
    const captured: unknown[] = [];
    const agg = new RumAggregator((snap) => captured.push(snap));
    agg.setRoute('/user/123/profile');
    for (let i = 0; i < 50; i++) {
      agg.push(
        { name: 'LCP', value: 1500 + i, rating: 'good' },
        { userAgent: 'Mozilla/5.0', connectionType: '4g' },
      );
    }
    agg.flush();
    expect(captured.length).toBe(1);
    const snap = captured[0] as {
      route: string;
      sampleCount: number;
      vitals: Record<string, { p75: number }>;
    };
    expect(snap.route).toBe('/user/:id/profile');
    expect(snap.sampleCount).toBe(50);
    expect(snap.vitals.LCP.p75).toBeGreaterThan(1500);
    expect(snap.vitals.LCP.p75).toBeLessThan(1600);
  });

  it('respects maxSamplesPerWindow', () => {
    const captured: unknown[] = [];
    const agg = new RumAggregator((snap) => captured.push(snap), { maxSamplesPerWindow: 10 });
    for (let i = 0; i < 50; i++) {
      agg.push(
        { name: 'LCP', value: 1500, rating: 'good' },
        { userAgent: 'Mozilla/5.0', connectionType: '4g' },
      );
    }
    agg.flush();
    const snap = captured[0] as { sampleCount: number };
    expect(snap.sampleCount).toBe(10);
  });

  it('skips flush when no samples', () => {
    const captured: unknown[] = [];
    const agg = new RumAggregator((snap) => captured.push(snap));
    agg.flush();
    expect(captured.length).toBe(0);
  });
});
