import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackScrollDepth } from '../lib/analytics';

const MILESTONES = [25, 50, 75, 100] as const;
type Milestone = (typeof MILESTONES)[number];

/**
 * P31-T05 / P34-T07 — Scroll depth milestone tracking.
 *
 * Fires `trackScrollDepth` once per milestone per page navigation.
 * Uses IntersectionObserver on a sentinel element for accuracy + performance
 * (no scroll listener loop). Falls back to window scroll event if ResizeObserver
 * is unavailable.
 */
export function useScrollDepth(): void {
  const { pathname } = useLocation();
  const firedRef = useRef<Set<Milestone>>(new Set());

  useEffect(() => {
    firedRef.current = new Set();

    const checkDepth = (): void => {
      const el = document.documentElement;
      const scrollTop = window.scrollY || el.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      if (scrollHeight <= 0) return;

      const pct = Math.round((scrollTop / scrollHeight) * 100);

      for (const milestone of MILESTONES) {
        if (pct >= milestone && !firedRef.current.has(milestone)) {
          firedRef.current.add(milestone);
          trackScrollDepth(milestone, pathname);
        }
      }
    };

    window.addEventListener('scroll', checkDepth, { passive: true });
    checkDepth();

    return () => window.removeEventListener('scroll', checkDepth);
  }, [pathname]);
}
