/**
 * P23/T4 — A/B sample size fix doğrulaması.
 *
 * ACTIVE_EXPERIMENTS güncellenmiş değerleri Fleiss z-test ile eşleşmeli.
 */
import { describe, it, expect } from 'vitest';
import { ACTIVE_EXPERIMENTS } from './ab-testing';
import { recomputePlannedSampleSize } from './ab-test';

describe('P23/T4 — ACTIVE_EXPERIMENTS sample size correctness', () => {
  for (const cfg of ACTIVE_EXPERIMENTS) {
    it(`${cfg.key}: stored sampleSize ≈ recomputed (Fleiss z-test)`, () => {
      const r = recomputePlannedSampleSize(cfg, cfg.baseline ?? 0.05);
      // Stored değer hesaplanan ile ≤ %5 toleransta olmalı.
      const tolerance = Math.max(50, Math.floor(r.perVariant * 0.05));
      expect(Math.abs(cfg.sampleSize - r.perVariant)).toBeLessThanOrEqual(tolerance);
    });

    it(`${cfg.key}: sampleSize ≫ eski hardcoded değerler (385/500/300)`, () => {
      // Regresyon koruması — P21 raporunda flag'lenen problem geri gelmesin
      expect(cfg.sampleSize).toBeGreaterThan(10_000);
    });
  }

  it('hero-cta-variant: kanonik 31 232 değeri', () => {
    const cfg = ACTIVE_EXPERIMENTS.find((c) => c.key === 'hero-cta-variant')!;
    const r = recomputePlannedSampleSize(cfg, 0.05);
    expect(r.perVariant).toBe(31_232);
  });
});
