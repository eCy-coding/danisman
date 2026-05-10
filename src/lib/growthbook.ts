/**
 * P34-T04: GrowthBook A/B Testing & Feature Flags
 *
 * Consent-gated: GrowthBook only loads features when analytics consent = true.
 *
 * Usage:
 *   import { useFeatureIsOn, useFeatureValue } from "@growthbook/growthbook-react";
 *   const isOn = useFeatureIsOn("my-feature");
 *
 * Setup:
 *   1. growthbook.io → Create project → SDK Connection → copy Client Key
 *   2. Set .env: VITE_GROWTHBOOK_CLIENT_KEY=sdk-...
 *   3. Optional self-host: VITE_GROWTHBOOK_API_HOST=https://cdn.growthbook.io
 *
 * Fail-open: if VITE_GROWTHBOOK_CLIENT_KEY is not set → GrowthBook still
 * initialises but serves empty feature set (all isOn → false, all values → null).
 */

import { GrowthBook } from '@growthbook/growthbook-react';

const API_HOST =
  (import.meta.env.VITE_GROWTHBOOK_API_HOST as string | undefined) ?? 'https://cdn.growthbook.io';

const CLIENT_KEY = (import.meta.env.VITE_GROWTHBOOK_CLIENT_KEY as string | undefined) ?? '';

export const gb = new GrowthBook({
  apiHost: API_HOST,
  clientKey: CLIENT_KEY,
  enableDevMode: import.meta.env.DEV === true,
  trackingCallback: (experiment, result) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'experiment_viewed', {
        experiment_id: experiment.key,
        variant_id: result.variationId,
      });
    }
  },
});

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

let _loaded = false;

/** Load features from GrowthBook CDN. Call once after consent is granted. */
export async function loadGrowthBookFeatures(): Promise<void> {
  if (!CLIENT_KEY) return;
  if (_loaded) return;
  _loaded = true;
  try {
    await gb.loadFeatures({ autoRefresh: true });
  } catch {
    _loaded = false;
  }
}

/** Destroy and reset the GrowthBook instance (call on consent withdraw). */
export function destroyGrowthBook(): void {
  _loaded = false;
  gb.setFeatures({});
  gb.setAttributes({});
}

/** Update visitor attributes (call after login / locale change). */
export function setGrowthBookAttributes(attrs: Record<string, unknown>): void {
  gb.setAttributes({ ...gb.getAttributes(), ...attrs });
}
