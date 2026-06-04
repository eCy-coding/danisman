/**
 * lenis-config.ts — Lenis smooth scroll singleton.
 *
 * WHY: Premium B2B feel. Physics-based inertia scroll (Stripe/Linear aesthetic).
 * Must be a singleton — multiple Lenis instances conflict.
 *
 * Usage:
 *   // In App.tsx root useEffect:
 *   import { getLenis, startLenis, stopLenis } from '@/lib/motion/lenis-config';
 *   useEffect(() => {
 *     startLenis();
 *     return stopLenis;
 *   }, []);
 *
 * React Router v7 integration:
 *   Call lenis.scrollTo(0, { immediate: true }) on route change (see useNavigationScroll).
 */

import Lenis from 'lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let lenis: Lenis | null = null;
let rafId: number | null = null;

export interface LenisOptions {
  /** 0.0–1.0 scroll inertia. Lower = longer deceleration. Default 0.09 */
  lerp?: number;
  /** true = smooth mouse wheel (default) */
  smoothWheel?: boolean;
  /** Easing function */
  easing?: (t: number) => number;
}

const DEFAULT_OPTIONS: LenisOptions = {
  lerp: 0.09,
  smoothWheel: true,
  // Custom premium easing: expo-like deceleration
  easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
};

/**
 * Check OS-level reduced-motion preference (WCAG 2.3.3 + Apple HIG +
 * Material Design accessibility guidance). Users who set
 * "Reduce Motion" / "Bewegung reduzieren" in their OS settings get the
 * browser's native instant scroll path instead of Lenis's inertia
 * physics — both for vestibular comfort and battery / CPU savings on
 * older devices.
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Initialise and start Lenis scroll loop. Wires GSAP ScrollTrigger tick. */
export function startLenis(options: LenisOptions = {}): void {
  if (lenis) return; // Already running

  // S13-R2-P2 — respect OS-level prefers-reduced-motion. Lenis adds a
  // physics-based inertia layer over native scroll; users who explicitly
  // opt out of motion (vestibular disorders, low-spec hardware, battery
  // saver) must NOT be force-smoothed. Bail before instantiation —
  // browser falls back to its standard instant scroll, GSAP ScrollTrigger
  // wires itself to native scroll events automatically.
  if (prefersReducedMotion()) return;

  lenis = new Lenis({
    ...DEFAULT_OPTIONS,
    ...options,
  });

  // Wire GSAP ScrollTrigger to Lenis time
  lenis.on('scroll', () => {
    ScrollTrigger.update();
  });

  // RAF loop
  function raf(time: number) {
    lenis!.raf(time);
    rafId = requestAnimationFrame(raf);
  }
  rafId = requestAnimationFrame(raf);
}

/** Stop Lenis and cancel RAF. Call on component unmount. */
export function stopLenis(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  lenis?.destroy();
  lenis = null;
}

/** Access Lenis instance directly for programmatic scroll. */
export function getLenis(): Lenis | null {
  return lenis;
}

/**
 * Scroll to top on route change.
 * Usage: call in useEffect watching location.pathname
 */
export function scrollToTop(immediate = false): void {
  if (!lenis) {
    window.scrollTo(0, 0);
    return;
  }
  lenis.scrollTo(0, { immediate });
}
