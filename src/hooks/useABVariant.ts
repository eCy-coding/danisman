/**
 * P34-T04: useABVariant — A/B variant hook with local override support
 *
 * Returns the assigned variant for a given experiment key.
 * Respects local dev overrides (localStorage ab_override_{key}).
 *
 * Math: GrowthBook uses Murmur3 hash(userId + experimentKey) → deterministic bucket assignment.
 * This ensures the same user always sees the same variant (sticky assignment).
 *
 * Usage:
 *   const variant = useABVariant('hero-cta-variant', 'book');
 *   // → 'book' | 'explore' (or defaultVariant if GrowthBook unavailable)
 */

import { useFeature } from '@growthbook/growthbook-react';
import { getLocalOverride } from '../lib/ab-testing';

export function useABVariant(experimentKey: string, defaultVariant: string): string {
  // Check local override first (dev/QA testing)
  const override = getLocalOverride(experimentKey);
  if (override !== null) return override;

  // useFeature returns FeatureResult — value is the assigned variant
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const result = useFeature<string>(experimentKey);

  // If feature is off or not loaded: use default
  if (!result.on || result.value === null || result.value === undefined) {
    return defaultVariant;
  }

  return result.value;
}
