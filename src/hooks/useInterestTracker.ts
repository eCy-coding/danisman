import { useEffect, useRef } from 'react';
import { usePersonalizationStore } from '@/lib/stores/personalizationStore';
import { Logger } from '@/lib/logger';

// P25 — Lighthouse PAGE_HUNG hardening:
// 1. navigator.webdriver alone is unreliable in Lighthouse (chrome-launcher does
//    NOT set automation flags), so we additionally sniff the user-agent for
//    "Lighthouse" / "Chrome-Lighthouse" / "HeadlessChrome".
// 2. We dedupe by a (pageId|tagsKey) signature via useRef so even if a caller
//    accidentally passes a new array reference each render, trackVisit only
//    fires once per unique key — breaking any potential render→effect→set→
//    re-render loop at the hook boundary.
const isAutomationEnv = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  if (navigator.webdriver) return true;
  const ua = navigator.userAgent || '';
  return /Lighthouse|HeadlessChrome|PhantomJS|jsdom/i.test(ua);
};

export const useInterestTracker = (tags: readonly string[] | string[], pageId: string) => {
  const trackVisit = usePersonalizationStore((state) => state.trackVisit);
  const lastKeyRef = useRef<string>('');

  useEffect(() => {
    if (typeof window === 'undefined' || isAutomationEnv()) return;
    if (!pageId || tags.length === 0) return;

    const key = `${pageId}|${[...tags].sort().join(',')}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    try {
      trackVisit([...tags], pageId);
    } catch (e) {
      Logger.warn('[InterestTracker] Failed to track visit', e);
    }
  }, [pageId, tags, trackVisit]);
};
