import React, { Suspense, useEffect, useRef, useState } from 'react';

interface LazyMountProps {
  children: React.ReactNode;
  /** Reserved height before mount so the gate doesn't trigger layout shift. */
  placeholderHeight?: number;
  /** How far before entering the viewport to begin mounting. */
  rootMargin?: string;
}

/**
 * IntersectionObserver-gated mount for below-fold heavy components. Defers both
 * the dynamic-import eval and React hydration of the child until it nears the
 * viewport, freeing the main thread so the above-fold LCP element can paint at
 * first frame instead of after the route's heavy widgets hydrate. Mirrors the
 * /services InteractiveLazyMount that holds that route's mobile LCP at ~1.06s.
 */
export const LazyMount: React.FC<LazyMountProps> = ({
  children,
  placeholderHeight = 480,
  rootMargin = '320px',
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setShouldMount(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldMount(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} style={{ minHeight: shouldMount ? undefined : placeholderHeight }}>
      {shouldMount ? (
        <Suspense fallback={<div style={{ minHeight: placeholderHeight }} />}>{children}</Suspense>
      ) : null}
    </div>
  );
};

export default LazyMount;
