/**
 * P49 — Animation utilities for ServiceDetailLayout + diğer interactive section'lar.
 *
 * Sağladıkları:
 *   - useInView(ref, options): element viewport'a girdi mi?
 *   - useCountUp(target, duration, trigger): animasyonlu sayı sayacı
 *
 * IntersectionObserver tabanlı, framer-motion dependency yok. Lightweight,
 * StrictMode-safe, prefers-reduced-motion aware.
 */

import { useEffect, useState, useRef, type RefObject } from 'react';

export interface UseInViewOptions {
  /** rootMargin için pre-trigger ofset (px) */
  rootMargin?: string;
  /** 0..1, kaç oran viewport'ta görünmeli */
  threshold?: number;
  /** once görününce observer'ı durdur */
  once?: boolean;
}

/**
 * Bir ref'in viewport'a girip girmediğini izler.
 * Default: -80px rootMargin (pre-trigger), 0.15 threshold, once=true.
 */
export function useInView<T extends Element = HTMLDivElement>(
  ref: RefObject<T | null>,
  { rootMargin = '-80px', threshold = 0.15, once = true }: UseInViewOptions = {},
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setInView(true); // SSR / legacy fallback
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, rootMargin, threshold, once]);

  return inView;
}

/**
 * Hedef sayıya ulaşana kadar progresif arttıran animatör.
 * trigger=true geldiğinde başlar. prefers-reduced-motion ise direkt hedef.
 */
export function useCountUp(
  target: number,
  durationMs: number = 1400,
  trigger: boolean = true,
): number {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!trigger || startedRef.current) return;
    startedRef.current = true;

    // Reduced motion guard
    if (typeof window !== 'undefined') {
      const mql = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      if (mql?.matches) {
        setValue(target);
        return;
      }
    }

    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      // Ease-out-cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, trigger]);

  return value;
}

/**
 * Bir sayıyı kullanıcı dostu formatla (1200 → "1.2k", 1500000 → "1.5M")
 */
export function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}
