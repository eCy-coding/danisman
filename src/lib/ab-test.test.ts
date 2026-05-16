/**
 * P21/T1 — A/B test math unit tests.
 *
 * Doğrulanan değerler bağımsız literatür / sample size kalkülatörleriyle
 * cross-check edilebilir (Evan Miller, Optimizely, R `pwr::pwr.2p.test`).
 */

import { describe, expect, it } from 'vitest';
import {
  experimentReadiness,
  recomputePlannedSampleSize,
  sampleSizePerVariant,
  zForTail,
} from './ab-test';
import type { ExperimentConfig } from './ab-testing';

describe('zForTail', () => {
  it('returns canonical z-values', () => {
    expect(zForTail(0.05)).toBeCloseTo(1.6449, 3);
    expect(zForTail(0.025)).toBeCloseTo(1.96, 3);
    expect(zForTail(0.01)).toBeCloseTo(2.3263, 3);
    expect(zForTail(0.2)).toBeCloseTo(0.8416, 3); // power 0.8 → β = 0.2
  });

  it('interpolates between table rows', () => {
    const z = zForTail(0.03);
    // 0.03 is between (0.025, 1.96) and (0.05, 1.6449)
    expect(z).toBeGreaterThan(1.6449);
    expect(z).toBeLessThan(1.96);
  });

  it('rejects invalid probabilities', () => {
    expect(() => zForTail(0)).toThrow();
    expect(() => zForTail(1)).toThrow();
    expect(() => zForTail(Number.NaN)).toThrow();
  });
});

describe('sampleSizePerVariant', () => {
  it('matches canonical scenario: p1=0.05, mde=0.1, two-sided', () => {
    // Fleiss z-test cross-check (p1=0.05, p2=0.055, α=0.05, power=0.8, 2-sided):
    //   n = (1.96 + 0.8416)² × (0.05·0.95 + 0.055·0.945) / (0.005)²
    //     = 7.848 × 0.099475 / 0.000025
    //     ≈ 31 230 per variant
    const r = sampleSizePerVariant({ baseline: 0.05, mde: 0.1 });
    expect(r.perVariant).toBeGreaterThan(30_000);
    expect(r.perVariant).toBeLessThan(33_000);
    expect(r.total).toBe(2 * r.perVariant);
  });

  it('matches conservative scenario: p1=0.05, mde=0.05', () => {
    // p1=0.05, p2=0.0525, lift=0.0025 → ~4× canonical (lift halved → n quadruples)
    // ≈ 122 000 per variant
    const r = sampleSizePerVariant({ baseline: 0.05, mde: 0.05 });
    expect(r.perVariant).toBeGreaterThan(115_000);
    expect(r.perVariant).toBeLessThan(130_000);
  });

  it('matches aggressive scenario: p1=0.1, mde=0.2', () => {
    // p1=0.1, p2=0.12, lift=0.02 → ≈ 3 850 per variant
    const r = sampleSizePerVariant({ baseline: 0.1, mde: 0.2 });
    expect(r.perVariant).toBeGreaterThan(3_000);
    expect(r.perVariant).toBeLessThan(4_500);
  });

  it('computes absolute lift correctly', () => {
    const r = sampleSizePerVariant({ baseline: 0.05, mde: 0.1 });
    expect(r.absoluteLift).toBeCloseTo(0.005, 6);
  });

  it('one-sided requires fewer samples than two-sided', () => {
    const two = sampleSizePerVariant({ baseline: 0.05, mde: 0.1, twoSided: true });
    const one = sampleSizePerVariant({ baseline: 0.05, mde: 0.1, twoSided: false });
    expect(one.perVariant).toBeLessThan(two.perVariant);
  });

  it('rejects out-of-range parameters', () => {
    expect(() => sampleSizePerVariant({ baseline: 0, mde: 0.1 })).toThrow();
    expect(() => sampleSizePerVariant({ baseline: 0.5, mde: 0 })).toThrow();
    expect(() => sampleSizePerVariant({ baseline: 0.6, mde: 1.0 })).toThrow();
  });

  it('rejects when p2 ≥ 1', () => {
    expect(() => sampleSizePerVariant({ baseline: 0.9, mde: 0.5 })).toThrow();
  });
});

describe('experimentReadiness', () => {
  it('reports half-way progress', () => {
    const r = experimentReadiness(500, 1000);
    expect(r.ratio).toBe(0.5);
    expect(r.ready).toBe(false);
  });

  it('flags ready when observed meets planned', () => {
    const r = experimentReadiness(1000, 1000);
    expect(r.ready).toBe(true);
  });

  it('applies Bonferroni correction to early-stop p', () => {
    const r = experimentReadiness(0, 1000, 5, 0.05);
    expect(r.earlyStopP).toBeCloseTo(0.01, 6);
  });

  it('handles planned=0 gracefully', () => {
    const r = experimentReadiness(0, 0);
    expect(r.ratio).toBe(0);
    expect(r.ready).toBe(true); // 0 ≥ 0
  });
});

describe('recomputePlannedSampleSize', () => {
  it('recomputes against ACTIVE_EXPERIMENTS-style config', () => {
    const cfg: ExperimentConfig = {
      key: 'demo',
      variants: ['a', 'b'],
      defaultVariant: 'a',
      sampleSize: 385, // stored estimate
      mde: 0.1,
    };
    const r = recomputePlannedSampleSize(cfg, 0.05);
    // 385 in the config was for absolute (not relative) — relative 10% on 5% baseline
    // requires far more (~14k). Test that recomputed > stored, exposing the magic number.
    expect(r.perVariant).toBeGreaterThan(cfg.sampleSize);
  });
});
