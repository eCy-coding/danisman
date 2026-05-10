/**
 * P33-T04: useInViewDefer — IntersectionObserver-based deferred rendering
 *
 * Delays rendering of below-fold content until it enters the viewport.
 * This reduces initial JS parse/execute time, improving TBT and LCP.
 *
 * Behavior:
 *   - Returns `inView = false` until the root element is within `rootMargin`
 *   - Once triggered, permanently returns `inView = true` (never goes back)
 *   - `rootMargin: '300px'` means render starts 300px before viewport edge
 *
 * Performance notes:
 *   - One shared IntersectionObserver per instance (no polling, no scroll listeners)
 *   - Works with SSR: defaults to false, hydrates on client
 *   - disconnects observer after first intersection (no memory leak)
 *
 * Usage:
 *   const { ref, inView } = useInViewDefer();
 *   return (
 *     <div ref={ref} className="min-h-[400px]">
 *       {inView ? <HeavySection /> : null}
 *     </div>
 *   );
 */

import { useEffect, useRef, useState } from 'react';

interface UseInViewDeferOptions {
  rootMargin?: string; // default: '300px 0px' — pre-load 300px before entry
  threshold?: number; // default: 0
}

interface UseInViewDeferResult {
  ref: React.RefObject<HTMLDivElement | null>;
  inView: boolean;
}

export function useInViewDefer(options: UseInViewDeferOptions = {}): UseInViewDeferResult {
  const { rootMargin = '300px 0px', threshold = 0 } = options;
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true); // fallback: immediately render (SSR or old browser)
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect(); // one-shot: stop observing after first trigger
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return { ref, inView };
}
