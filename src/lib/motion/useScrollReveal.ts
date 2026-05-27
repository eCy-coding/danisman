/**
 * useScrollReveal — GSAP ScrollTrigger scroll-reveal hook.
 *
 * WHY: Section-level scroll entrance animations (fadeUp, slideIn, stagger).
 * GSAP ScrollTrigger chosen over IntersectionObserver for scrub + timeline control.
 *
 * Usage:
 *   const { ref } = useScrollReveal<HTMLDivElement>();
 *   <div ref={ref}> ... </div>
 *
 * Stagger children:
 *   const { ref } = useScrollReveal<HTMLUListElement>({ stagger: 0.08, selector: 'li' });
 */

import { useEffect, useRef } from 'react';
import { useReducedMotion } from './useReducedMotion';

export interface ScrollRevealOptions {
  /** Element selector for stagger children. Defaults to element itself. */
  selector?: string;
  /** translateY from (px). Default 32. */
  fromY?: number;
  /** Initial opacity. Default 0. */
  fromOpacity?: number;
  /** Stagger delay between children (seconds). Default 0 (no stagger). */
  stagger?: number;
  /** GSAP ease. Default 'power2.out'. */
  ease?: string;
  /** Duration (seconds). Default 0.6. */
  duration?: number;
  /** ScrollTrigger start. Default 'top 85%'. */
  start?: string;
  /** Animate once only (no reverse on scroll up). Default true. */
  once?: boolean;
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {},
) {
  const ref = useRef<T>(null);
  const shouldReduce = useReducedMotion();

  const {
    selector,
    fromY = 32,
    fromOpacity = 0,
    stagger = 0,
    ease = 'power2.out',
    duration = 0.6,
    start = 'top 85%',
    once = true,
  } = options;

  useEffect(() => {
    if (shouldReduce || !ref.current) return;

    let cleanup: (() => void) | undefined;

    // Dynamic import — GSAP only loaded when hook is actually used
    // ScrollTrigger is registered by initGSAP() inside gsap-config; no direct import needed here
    import('./gsap-config').then(({ gsap }) => {
      if (!ref.current) return;

      const targets = selector
        ? ref.current.querySelectorAll<HTMLElement>(selector)
        : [ref.current];

      if (!targets.length) return;

      // Set initial state
      gsap.set(targets, { opacity: fromOpacity, y: fromY });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ref.current,
          start,
          once,
        },
      });

      tl.to(targets, {
        opacity: 1,
        y: 0,
        duration,
        ease,
        stagger,
      });

      cleanup = () => {
        tl.kill();
        // Reset to visible if unmounted mid-animation
        gsap.set(targets, { clearProps: 'all' });
      };
    });

    return () => cleanup?.();
  }, [shouldReduce, selector, fromY, fromOpacity, stagger, ease, duration, start, once]);

  return { ref };
}
