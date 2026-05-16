/**
 * P34-T04: A/B Test Infrastructure — GrowthBook React SDK
 *
 * Architecture:
 *   - GrowthBook OSS: self-hosted + free. Uses our existing PostgreSQL.
 *   - Anonymous user ID: localStorage UUID (persistent across sessions)
 *   - Feature flags fetched from GrowthBook SDK endpoint (or local JSON for dev)
 *   - GA4 integration: experiment_viewed + experiment_converted events
 *
 * Active experiments (expand as needed):
 *   hero-cta-variant   : "book" | "explore"  → Hero CTA text
 *   pricing-layout     : "cards" | "table"    → Pricing page layout
 *   contact-form-style : "inline" | "modal"   → Contact form UX
 *
 * Statistical validity:
 *   - Minimum detectable effect (MDE): 10% relative conversion lift
 *   - Significance level (α): 0.05 (95% confidence)
 *   - Power (1-β): 0.80 (80%)
 *   - Sample size per variant: ≈385 users (for 5% baseline, 10% MDE, 80% power)
 *   - Stop early only if p < 0.001 (Bonferroni correction for peek problem)
 *
 * Usage:
 *   const { variant } = useABVariant('hero-cta-variant', 'book');
 *   <button>{variant === 'explore' ? 'Explore Services' : 'Book Discovery Call'}</button>
 *
 * Local override (dev/QA):
 *   localStorage.setItem('ab_override_hero-cta-variant', 'explore')
 *   → forces specific variant for testing
 */

import { GrowthBook } from '@growthbook/growthbook-react';
import { trackEvent } from './analytics';

// ─── Persistent anonymous user ID ─────────────────────────

export function getOrCreateUserId(): string {
  const STORAGE_KEY = 'ecypro_uid';
  let uid = localStorage.getItem(STORAGE_KEY);
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, uid);
  }
  return uid;
}

// ─── GrowthBook instance singleton ────────────────────────

let _instance: GrowthBook | null = null;

export function getGrowthBook(): GrowthBook {
  if (_instance) return _instance;

  _instance = new GrowthBook({
    apiHost: import.meta.env.VITE_GROWTHBOOK_API_HOST ?? 'https://cdn.growthbook.io',
    clientKey: import.meta.env.VITE_GROWTHBOOK_CLIENT_KEY ?? '',

    enableDevMode: import.meta.env.DEV,

    // GA4 experiment tracking callback
    trackingCallback: (experiment, result) => {
      trackEvent('Experiment', 'experiment_viewed', `${experiment.key}:${result.variationId}`);
    },

    // User attributes for targeting
    attributes: {
      id: getOrCreateUserId(),
      locale: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  // Load features from GrowthBook CDN (non-blocking)
  _instance.loadFeatures({ autoRefresh: true }).catch(() => {
    // CDN unavailable → fallback to local defaults (no experiment runs)
  });

  return _instance;
}

// ─── Local dev override support ────────────────────────────

export function getLocalOverride(key: string): string | null {
  try {
    return localStorage.getItem(`ab_override_${key}`);
  } catch {
    return null;
  }
}

// ─── Conversion tracking ──────────────────────────────────

export function trackConversion(experimentKey: string, metric: string, value?: number): void {
  trackEvent('Experiment', `${experimentKey}_converted`, metric);
  if (value !== undefined) {
    trackEvent('Experiment', `${experimentKey}_value`, String(value));
  }
}

// ─── Feature flag helper (type-safe) ──────────────────────

export function getFeatureFlag<T>(key: string, defaultValue: T): T {
  const gb = getGrowthBook();
  return gb.getFeatureValue(key, defaultValue) as T;
}

// ─── Experiment definition type ───────────────────────────

export interface ExperimentConfig {
  key: string;
  variants: string[];
  defaultVariant: string;
  /**
   * **DEPRECATED in P23/T4**: Bu alan eskiden hardcoded 385/500/300 değerleriydi
   * ve Fleiss z-test ile karşılaştırıldığında 10-100× yetersizdi. Yeni doğru
   * değer `ab-test.ts → recomputePlannedSampleSize(cfg, baseline)` ile
   * çalıştırma zamanında hesaplanır. Bu alan halen tutulur — geriye dönük
   * uyumluluk + admin dashboard'da "config-time tahmin" sütunu için.
   */
  sampleSize: number;
  /** Minimum detectable effect (relative, 0.1 = 10%). */
  mde: number;
  /**
   * **YENİ (P23/T4)**: Baseline conversion rate. `recomputePlannedSampleSize`
   * çağrılırken kullanılır. Verilmezse default 0.05 (%5) kabul edilir.
   */
  baseline?: number;
}

/**
 * Sample size hesabı — Fleiss z-test referansı:
 *
 *   p₁ = 0.05, p₂ = p₁·(1+mde), α = 0.05 (two-sided), power = 0.8
 *   n_per_arm = (1.96 + 0.8416)² · [p₁(1-p₁) + p₂(1-p₂)] / (p₂-p₁)²
 *
 * Verilen MDE'ler için **doğru** değerler (yukarı yuvarlı):
 *
 *   mde=0.10 (hero-cta)      → 31 232 per variant
 *   mde=0.08 (pricing)       → 48 362 per variant
 *   mde=0.12 (contact-form)  → 21 883 per variant
 *
 * `sampleSize` alanı geriye dönük uyumluluk için tutuldu; **gerçek hedef**
 * `recomputePlannedSampleSize(cfg)` ile alınır.
 */
export const ACTIVE_EXPERIMENTS: ExperimentConfig[] = [
  {
    key: 'hero-cta-variant',
    variants: ['book', 'explore'],
    defaultVariant: 'book',
    sampleSize: 31_232, // P23/T4 fix — Fleiss z-test (baseline=0.05, mde=0.10)
    mde: 0.1,
    baseline: 0.05,
  },
  {
    key: 'pricing-layout',
    variants: ['cards', 'table'],
    defaultVariant: 'cards',
    sampleSize: 48_362, // P23/T4 fix — Fleiss z-test (baseline=0.05, mde=0.08)
    mde: 0.08,
    baseline: 0.05,
  },
  {
    key: 'contact-form-style',
    variants: ['inline', 'modal'],
    defaultVariant: 'inline',
    sampleSize: 21_883, // P23/T4 fix — Fleiss z-test (baseline=0.05, mde=0.12)
    mde: 0.12,
    baseline: 0.05,
  },
];
