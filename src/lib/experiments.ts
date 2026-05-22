/**
 * P53.E1 — Lightweight A/B testing framework.
 *
 * ENV `VITE_AB_TESTS` syntax: `testKey1:variant=weight,variant=weight;testKey2:...`
 * Example: `hero-cta:original=50,bold-emphasis=50`
 *
 * LocalStorage sticky assignment (kullanıcı sayfaya geri gelirse aynı variant'ı görür).
 * Analytics event: `experiment_view` ve `experiment_conversion`.
 */

import { useEffect, useState } from 'react';
import { trackWidgetInteraction } from './integrations/analytics';

const STORAGE_PREFIX = 'ecypro:ab:';

interface VariantWeight {
  variant: string;
  weight: number;
}

function parseConfig(raw: string): Record<string, VariantWeight[]> {
  const out: Record<string, VariantWeight[]> = {};
  if (!raw) return out;
  for (const block of raw.split(';')) {
    const [test, rest] = block.split(':');
    if (!test || !rest) continue;
    const variants: VariantWeight[] = [];
    for (const part of rest.split(',')) {
      const [variant, w] = part.split('=');
      const weight = parseFloat(w ?? '1');
      if (variant && Number.isFinite(weight) && weight > 0) {
        variants.push({ variant: variant.trim(), weight });
      }
    }
    if (variants.length > 0) out[test.trim()] = variants;
  }
  return out;
}

const RAW_CONFIG =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_AB_TESTS
    ? String(import.meta.env.VITE_AB_TESTS).trim()
    : '';
const CONFIG = parseConfig(RAW_CONFIG);

function pickVariant(variants: VariantWeight[]): string {
  const total = variants.reduce((sum, v) => sum + v.weight, 0);
  let r = Math.random() * total;
  for (const v of variants) {
    r -= v.weight;
    if (r <= 0) return v.variant;
  }
  return variants[0]?.variant ?? 'control';
}

/**
 * Get assigned variant for a test. Default: 'control' if not configured.
 * Sticky via localStorage; first visit picks weighted variant.
 */
export function getVariant(testKey: string, defaultVariant = 'control'): string {
  const variants = CONFIG[testKey];
  if (!variants || variants.length === 0) return defaultVariant;

  const storageKey = `${STORAGE_PREFIX}${testKey}`;
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored && variants.some((v) => v.variant === stored)) return stored;
  } catch {
    /* localStorage blocked */
  }

  const picked = pickVariant(variants);
  try {
    localStorage.setItem(storageKey, picked);
  } catch {
    /* ignore */
  }
  return picked;
}

/** React hook variant. */
export function useExperiment(testKey: string, defaultVariant = 'control'): string {
  const [variant, setVariant] = useState<string>(defaultVariant);

  useEffect(() => {
    const v = getVariant(testKey, defaultVariant);
    setVariant(v);
    trackWidgetInteraction('experiment', 'view', `${testKey}:${v}`);
  }, [testKey, defaultVariant]);

  return variant;
}

/** Conversion tracking — call when user converts in this experiment. */
export function trackConversion(testKey: string, variant: string, conversionType: string): void {
  trackWidgetInteraction('experiment', 'conversion', `${testKey}:${variant}:${conversionType}`);
}
