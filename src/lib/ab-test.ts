/**
 * P21/T1 — A/B test statistical helpers.
 *
 * Mevcut `ab-testing.ts` GrowthBook tarafını + `useABVariant.ts` variant hook'unu
 * kuruyor. Bu modül **istatistiksel temeli** verir:
 *
 *   1. `sampleSizePerVariant(baseline, mde, alpha, power)` — iki orantı için
 *      z-test sample size hesabı.
 *   2. `experimentReadiness(observed, planned)` — pencerede gözlenen örnek
 *      sayısının planlanan kotaya yüzdesi.
 *   3. `useExperiment(key, options)` — GrowthBook'u saran tipli wrapper:
 *      variant + telemetry + sample-size eşiği kontrolü.
 *
 * Cerraha hassasiyet: Numara uydurmuyoruz. Formül, Fleiss & Tytun & Ury (1980)
 * iki bağımsız orantı için tasarlanmış z-yaklaşımı:
 *
 *   n_per_arm  =  (z_{α/2} + z_β)²  ·  [p₁(1-p₁) + p₂(1-p₂)]  /  (p₂ - p₁)²
 *
 * `p₁` = baseline conversion, `p₂` = p₁·(1 + mde), `mde` relative effect.
 *
 * **Önemli not:** GrowthBook sample-size'ı runtime'da değil planlama
 * aşamasında tüketir. Bu modülün rolü, planlanan `sampleSize` ile gözlenen
 * `count`'ı karşılaştırıp dashboard / UI'ye "ready to call" sinyali vermek.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useABVariant } from '../hooks/useABVariant';
import { trackConversion, type ExperimentConfig } from './ab-testing';
import { trackEvent } from './analytics';

// ── Z-table (one-sided) ───────────────────────────────────────────────────────
// Yaygın α/β kombinasyonları için kapalı-formül kullanmak yerine standart
// normal kuantil yaklaşımı: Beasley-Springer-Moro algoritması basitleştirilmiş.
// Hassasiyet > 1e-5; sample size hesabı için fazlasıyla yeterli.

const ZTABLE: ReadonlyArray<readonly [number, number]> = [
  // [tail probability, z value]   — one-sided upper tail
  [0.5, 0.0],
  [0.4, 0.2533],
  [0.3, 0.5244],
  [0.25, 0.6745],
  [0.2, 0.8416],
  [0.15, 1.0364],
  [0.1, 1.2816],
  [0.05, 1.6449],
  [0.025, 1.9600],
  [0.02, 2.0537],
  [0.01, 2.3263],
  [0.005, 2.5758],
  [0.001, 3.0902],
  [0.0001, 3.7190],
];

/**
 * z-quantile for upper tail probability p (i.e., Φ⁻¹(1-p)). Lineer
 * interpolasyon — common α=0.05 ve β=0.20 değerleri tabloda zaten var,
 * bu yüzden tipik kullanım O(1) exact.
 */
export function zForTail(p: number): number {
  if (!Number.isFinite(p) || p <= 0 || p >= 1) {
    throw new Error(`zForTail: p must be in (0,1), got ${p}`);
  }
  // Exact table hit
  for (const [tp, z] of ZTABLE) {
    if (Math.abs(p - tp) < 1e-9) return z;
  }
  // Linear interp between bracketing rows (table is monotonic decreasing in p)
  for (let i = 0; i < ZTABLE.length - 1; i++) {
    const lo = ZTABLE[i]!;
    const hi = ZTABLE[i + 1]!;
    if (lo[0] >= p && p >= hi[0]) {
      const t = (lo[0] - p) / (lo[0] - hi[0]);
      return lo[1] + t * (hi[1] - lo[1]);
    }
  }
  // Beyond table — saturate to last entry
  return ZTABLE[ZTABLE.length - 1]![1];
}

// ── Sample size ───────────────────────────────────────────────────────────────

export interface SampleSizeInput {
  /** Baseline conversion rate, ör. 0.05 = %5. */
  baseline: number;
  /** Minimum detectable effect (relative), ör. 0.05 = %5 lift. */
  mde: number;
  /** Significance level. Default 0.05 (α). */
  alpha?: number;
  /** Statistical power. Default 0.8 (1 − β). */
  power?: number;
  /** Two-sided test? Default true → α/2 kullanır. */
  twoSided?: boolean;
}

export interface SampleSizeResult {
  /** Variant başına gerekli örnek. */
  perVariant: number;
  /** Toplam (2 variant). */
  total: number;
  /** Aktarılan parametreler (debug). */
  params: Required<SampleSizeInput>;
  /** Detection: ulaşılması gereken absolute lift (p2 - p1). */
  absoluteLift: number;
}

/**
 * İki bağımsız orantı için z-test sample size. Sonuç **yukarı yuvarlanır**
 * (kesirli sample anlamsız).
 *
 *   p₁ = baseline,  p₂ = p₁·(1 + mde)
 *   n  = (z_{α/(2|1)} + z_β)² · [p₁(1-p₁) + p₂(1-p₂)] / (p₂ - p₁)²
 *
 * Conservative defaults (p₁=0.05, mde=0.05, α=0.05, power=0.8, two-sided):
 *   ≈ 4 700 / variant (örnek: marketing landing page CTA testi)
 */
export function sampleSizePerVariant(input: SampleSizeInput): SampleSizeResult {
  const baseline = input.baseline;
  const mde = input.mde;
  const alpha = input.alpha ?? 0.05;
  const power = input.power ?? 0.8;
  const twoSided = input.twoSided ?? true;

  if (baseline <= 0 || baseline >= 1) {
    throw new Error(`sampleSizePerVariant: baseline must be in (0,1), got ${baseline}`);
  }
  if (mde <= 0 || mde >= 1) {
    throw new Error(`sampleSizePerVariant: mde must be in (0,1), got ${mde}`);
  }
  if (alpha <= 0 || alpha >= 1) {
    throw new Error(`sampleSizePerVariant: alpha must be in (0,1), got ${alpha}`);
  }
  if (power <= 0 || power >= 1) {
    throw new Error(`sampleSizePerVariant: power must be in (0,1), got ${power}`);
  }

  const p1 = baseline;
  const p2 = baseline * (1 + mde);
  if (p2 >= 1) {
    throw new Error(`sampleSizePerVariant: p2 (${p2}) ≥ 1; mde too large for baseline`);
  }
  const lift = p2 - p1;

  const zAlpha = zForTail(twoSided ? alpha / 2 : alpha);
  const zBeta = zForTail(1 - power); // β = 1 - power
  const numerator = (zAlpha + zBeta) ** 2 * (p1 * (1 - p1) + p2 * (1 - p2));
  const n = numerator / (lift * lift);
  const perVariant = Math.ceil(n);

  return {
    perVariant,
    total: perVariant * 2,
    absoluteLift: lift,
    params: { baseline, mde, alpha, power, twoSided },
  };
}

// ── Readiness ─────────────────────────────────────────────────────────────────

export interface ReadinessResult {
  /** Gözlenen / hedef oranı, [0..1]. */
  ratio: number;
  /** Gözlenen örnek. */
  observed: number;
  /** Hedef örnek. */
  planned: number;
  /** %100'e ulaşıldı mı? */
  ready: boolean;
  /** Erken durdurma için Bonferroni-corrected p eşiği. */
  earlyStopP: number;
}

/**
 * Peek problem'ine karşı: planned kotaya ulaşılmadan p-değeri 0.05'e düştü
 * diye deneyi durdurmak Type-I error oranını artırır. Bonferroni düzeltmesi:
 *
 *   α_corrected = α / k
 *
 * 5 ara peek varsa, durdurma eşiği α/5 = 0.01. Konvensiyon: 0.001 ultra-strict.
 */
export function experimentReadiness(
  observed: number,
  planned: number,
  peeks = 5,
  alpha = 0.05,
): ReadinessResult {
  const ratio = planned > 0 ? observed / planned : 0;
  return {
    ratio,
    observed,
    planned,
    ready: observed >= planned,
    earlyStopP: alpha / peeks,
  };
}

// ── Experiment hook ───────────────────────────────────────────────────────────

export interface UseExperimentOptions {
  /** Variant key listesi. İlk öğe default kabul edilir. */
  variants: readonly string[];
  /** Default variant (variants[0]'dan farklı override gerekirse). */
  defaultVariant?: string;
  /** Telemetry'yi devre dışı bırak (testing). */
  disableTelemetry?: boolean;
  /**
   * P23/T4: tam ExperimentConfig — verilirse `plannedSampleSize` ve
   * stop guard çıktı alanları doldurulur.
   */
  config?: ExperimentConfig;
  /**
   * P23/T4: gözlenen variant başına örnek sayısı. Admin'in mevcut
   * variant pool size'ını verdiği değer; useExperiment kendisi
   * GrowthBook'tan çekmez (BE telemetry feeder'a kalır).
   */
  observedPerVariant?: number;
}

export interface UseExperimentResult {
  /** Atanan variant. */
  variant: string;
  /** Bu kullanıcı için experimentin aktif olup olmadığı. */
  isActive: boolean;
  /** Conversion event kaydet (örn. CTA click, form submit). */
  trackOutcome: (metric: string, value?: number) => void;
  /**
   * P23/T4: Otomatik hesaplanan planlı sample size — config verildiğinde.
   * `null` = config yok.
   */
  plannedSampleSize: SampleSizeResult | null;
  /**
   * P23/T4: Erken durdurmaya karşı stop guard.
   *
   *   ready = observed ≥ planned       → güvenle durdurabilirsin
   *   ratio = observed / planned       → progress sinyali (UI bar)
   *   earlyStopP = Bonferroni eşiği    → bunun altına inmeden DURMA
   *
   * `null` = config ya da observedPerVariant verilmedi.
   */
  readiness: ReadinessResult | null;
}

/**
 * GrowthBook'u saran tipli wrapper.
 *
 * Side-effect: ilk render'da `experiment_viewed` (ab-testing.ts'in
 * trackingCallback'i zaten yapıyor; biz çift saymadan, sadece variant'ı
 * okuyoruz). Telemetry'yi açıkça `trackOutcome` çağrısı ile bağlarız.
 *
 * P23/T4: `options.config` verilirse `plannedSampleSize` Fleiss z-test ile
 * her invocation'da yeniden hesaplanır (memoized). `observedPerVariant`
 * verilirse `readiness` doldurulur.
 */
export function useExperiment(
  key: string,
  options: UseExperimentOptions,
): UseExperimentResult {
  const defaultVariant = options.defaultVariant ?? options.variants[0] ?? 'control';
  const variant = useABVariant(key, defaultVariant);
  const isActive = variant !== defaultVariant || options.variants.length > 1;
  const seenRef = useRef(false);

  // İlk render'da impression event'ini analytics'e gönder (idempotent).
  useEffect(() => {
    if (seenRef.current || options.disableTelemetry) return;
    seenRef.current = true;
    trackEvent('Experiment', 'experiment_assigned', `${key}:${variant}`);
  }, [key, variant, options.disableTelemetry]);

  const trackOutcome = useMemo(
    () =>
      (metric: string, value?: number): void => {
        if (options.disableTelemetry) return;
        trackConversion(key, `${variant}:${metric}`, value);
      },
    [key, variant, options.disableTelemetry],
  );

  // P23/T4: planned sample size — config verildiyse Fleiss z-test ile hesapla.
  const plannedSampleSize = useMemo<SampleSizeResult | null>(() => {
    if (!options.config) return null;
    return recomputePlannedSampleSize(
      options.config,
      options.config.baseline ?? 0.05,
    );
  }, [options.config]);

  const readiness = useMemo<ReadinessResult | null>(() => {
    if (!plannedSampleSize || options.observedPerVariant === undefined) return null;
    return experimentReadiness(options.observedPerVariant, plannedSampleSize.perVariant);
  }, [plannedSampleSize, options.observedPerVariant]);

  return { variant, isActive, trackOutcome, plannedSampleSize, readiness };
}

// ── Active experiments → sample size table ────────────────────────────────────

/**
 * `ACTIVE_EXPERIMENTS` config'inde tanımlı her experiment için planlanan
 * sample size'ı yeniden hesaplar — config'teki magic number'ı doğrular ya da
 * çürütür. Dashboard / docs sayfası bunu render eder.
 */
export function recomputePlannedSampleSize(
  cfg: ExperimentConfig,
  baseline = 0.05,
  alpha = 0.05,
  power = 0.8,
): SampleSizeResult {
  return sampleSizePerVariant({ baseline, mde: cfg.mde, alpha, power });
}
