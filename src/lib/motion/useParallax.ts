/**
 * useParallax — GSAP ScrollTrigger scroll-linked parallax hook.
 *
 * WHY: Hero image depth effect + section divider parallax = premium Stripe-like feel.
 * Scrub mode: element moves in sync with scroll (no bounce/snap).
 *
 * Usage:
 *   const { ref } = useParallax<HTMLDivElement>({ speed: 0.2 });
 *   <div ref={ref}> hero image / bg </div>
 *
 * speed 0.1 = subtle, 0.3 = noticeable, 0.5 = dramatic
 */

import { useEffect, useRef } from 'react';
import { useReducedMotion } from './useReducedMotion';

export interface ParallaxOptions {
  /**
   * Parallax speed ratio. 0 = no movement, 1 = full scroll speed.
   * Negative values = reverse direction. Default 0.15.
   */
  speed?: number;
  /** translateX instead of translateY. Default false. */
  horizontal?: boolean;
  /** Custom ScrollTrigger start. Default 'top bottom'. */
  start?: string;
  /** Custom ScrollTrigger end. Default 'bottom top'. */
  end?: string;
}

export function useParallax<T extends HTMLElement = HTMLDivElement>(options: ParallaxOptions = {}) {
  const ref = useRef<T>(null);
  const shouldReduce = useReducedMotion();

  const { speed = 0.15, horizontal = false, start = 'top bottom', end = 'bottom top' } = options;

  useEffect(() => {
    if (shouldReduce || !ref.current) return;

    let cleanup: (() => void) | undefined;

    import('./gsap-config').then(({ gsap, ScrollTrigger }) => {
      if (!ref.current) return;

      // Total scroll distance × speed = translateY range
      const distance = ref.current.offsetHeight * speed * 100;
      const prop = horizontal ? 'x' : 'y';

      const trigger = ScrollTrigger.create({
        trigger: ref.current,
        start,
        end,
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress;
          gsap.set(ref.current, {
            [prop]: `${(progress - 0.5) * distance}px`,
          });
        },
      });

      cleanup = () => {
        trigger.kill();
        if (ref.current) gsap.set(ref.current, { clearProps: prop });
      };
    });

    return () => cleanup?.();
  }, [shouldReduce, speed, horizontal, start, end]);

  return { ref };
}
