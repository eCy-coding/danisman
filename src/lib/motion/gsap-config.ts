/**
 * gsap-config.ts — GSAP + ScrollTrigger bootstrap.
 *
 * WHY: Plugin registration must happen once before any GSAP usage.
 * Centralised here so tree-shake stays clean; consumers just call initGSAP().
 *
 * Usage:
 *   import { initGSAP, gsap } from '@/lib/motion/gsap-config';
 *   initGSAP(); // call in App.tsx useEffect or root layout
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let initialised = false;

/** Register plugins and set global defaults. Idempotent — safe to call multiple times. */
export function initGSAP(): void {
  if (initialised) return;
  initialised = true;

  gsap.registerPlugin(ScrollTrigger);

  gsap.defaults({
    duration: 0.6,
    ease: 'power2.out',
  });

  // Sync ScrollTrigger with Lenis tick (wired in lenis-config.ts after Lenis init)
  ScrollTrigger.config({
    // Ensures proper layout on resize
    limitCallbacks: true,
  });
}

/** Refresh all ScrollTriggers. Call after route change or dynamic content mount. */
export function refreshScrollTriggers(): void {
  ScrollTrigger.refresh();
}

/** Kill all ScrollTrigger instances. Call on route unmount to prevent leaks. */
export function killScrollTriggers(): void {
  ScrollTrigger.getAll().forEach((st) => st.kill());
}

export { gsap, ScrollTrigger };
