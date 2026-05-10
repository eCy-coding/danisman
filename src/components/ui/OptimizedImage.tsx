import React, { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
}

/**
 * P33-T07: OptimizedImage — lazy loading, blur-up placeholder, native loading.
 *
 * Features:
 *  - `loading="lazy"` (native browser, zero JS overhead for below-fold)
 *  - `decoding="async"` — offloads image decoding from main thread
 *  - `fetchpriority="high"` when priority=true (LCP candidate)
 *  - Intersection Observer based eager-render trigger (above-fold)
 *  - Blur-up skeleton while image loads
 *  - Explicit width/height to prevent CLS
 *
 * Usage:
 *   <OptimizedImage src="/img/hero.webp" alt="Hero" width={1920} height={1080} priority />
 *   <OptimizedImage src="/img/case.jpg" alt="Case study thumbnail" />
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  sizes,
  style,
  onLoad,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer: start loading when image enters viewport (+200px margin)
  useEffect(() => {
    if (priority) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px' },
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        ...style,
      }}
    >
      {/* Blur placeholder skeleton */}
      {!loaded && (
        <div aria-hidden="true" className="absolute inset-0 bg-slate-800/60 animate-pulse" />
      )}

      {inView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          {...(priority ? { fetchpriority: 'high' as 'high' | 'low' | 'auto' } : {})}
          onLoad={handleLoad}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
};

export default OptimizedImage;
