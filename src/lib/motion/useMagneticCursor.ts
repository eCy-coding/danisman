/**
 * useMagneticCursor — CTA button magnetic hover effect.
 *
 * WHY: Premium micro-interaction for primary CTA buttons.
 * Element "attracts" cursor toward its center on hover (Linear/Vercel pattern).
 *
 * Usage:
 *   const { ref } = useMagneticCursor<HTMLButtonElement>({ strength: 0.3 });
 *   <button ref={ref}>Keşif Görüşmesi</button>
 *
 * strength 0.1 = subtle, 0.4 = strong. Default 0.25.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from './useReducedMotion';

export interface MagneticCursorOptions {
  /** 0–1 attraction strength. Default 0.25. */
  strength?: number;
  /** Restore spring speed (seconds). Default 0.4. */
  restoreDuration?: number;
  /** GSAP ease for restore. Default 'elastic.out(1, 0.4)'. */
  restoreEase?: string;
}

export function useMagneticCursor<T extends HTMLElement = HTMLButtonElement>(
  options: MagneticCursorOptions = {},
) {
  const ref = useRef<T>(null);
  const shouldReduce = useReducedMotion();

  const { strength = 0.25, restoreDuration = 0.4, restoreEase = 'elastic.out(1, 0.4)' } = options;

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      import('./gsap-config').then(({ gsap }) => {
        if (!ref.current) return;
        gsap.to(ref.current, {
          x: dx * strength,
          y: dy * strength,
          duration: 0.15,
          ease: 'power2.out',
        });
      });
    },
    [strength],
  );

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    import('./gsap-config').then(({ gsap }) => {
      if (!ref.current) return;
      gsap.to(ref.current, {
        x: 0,
        y: 0,
        duration: restoreDuration,
        ease: restoreEase,
      });
    });
  }, [restoreDuration, restoreEase]);

  useEffect(() => {
    if (shouldReduce || !ref.current) return;

    const el = ref.current;
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      // Reset position on unmount
      import('./gsap-config').then(({ gsap }) => {
        gsap.set(el, { clearProps: 'x,y' });
      });
    };
  }, [shouldReduce, handleMouseMove, handleMouseLeave]);

  return { ref };
}
