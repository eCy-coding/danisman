import { useEffect } from 'react';
import { usePersonalizationStore } from '@/lib/stores/personalizationStore';
import { Logger } from '@/lib/logger';

export const useInterestTracker = (tags: string[], pageId: string) => {
  const trackVisit = usePersonalizationStore((state) => state.trackVisit);

  useEffect(() => {
    // Skip tracking for SSR/testing/automation to avoid noisy console output and heavy state writes
    const isAutomation = typeof navigator !== 'undefined' && navigator.webdriver;
    const isServer = typeof window === 'undefined';

    if (isServer || isAutomation) return;

    if (tags.length > 0 && pageId) {
      try {
        trackVisit(tags, pageId);
      } catch (e) {
        // Silently fail in tests; log only for real users to keep traces clean
        if (!isAutomation) {
          Logger.warn('[InterestTracker] Failed to track visit', e);
        }
      }
    }
  }, [pageId, tags, trackVisit]);
};
