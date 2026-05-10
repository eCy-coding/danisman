/**
 * MediaPicture — WebP/AVIF Destekli <picture> Bileşeni
 * istek5.txt Phase 3: Media-Watcher — WebP/AVIF Pipeline Entegrasyonu
 *
 * watch-media.ts tarafından üretilen .webp ve .avif dosyalarını
 * <picture> srcset ile sunar. Tarayıcı desteklediği formatı seçer:
 *   AVIF > WebP > orijinal (PNG/JPG)
 *
 * Özellikler:
 * - `sizes` attr ile responsive image boyutları
 * - Lazy loading + blur-up placeholder
 * - LCP candidate: priority=true → fetchpriority="high"
 * - CLS koruması: explicit width/height
 * - media-manifest.json varlığı opsiyonel — yoksa fallback
 * - A11y: alt required
 *
 * Kullanım:
 *   <MediaPicture
 *     src="/images/hero.jpg"
 *     alt="EcyPro Hero"
 *     width={1920} height={1080}
 *     priority
 *   />
 *   → tarayıcı: /images/hero.avif (AVIF) | /images/hero.webp (WebP) | /images/hero.jpg
 */

import React, { useState, useRef, useEffect } from 'react';

interface MediaPictureProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  style?: React.CSSProperties;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
}

function deriveVariant(src: string, ext: 'webp' | 'avif'): string {
  const dot = src.lastIndexOf('.');
  return dot !== -1 ? `${src.slice(0, dot)}.${ext}` : `${src}.${ext}`;
}

function isOptimizable(src: string): boolean {
  return /\.(png|jpe?g)$/i.test(src);
}

export const MediaPicture: React.FC<MediaPictureProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  sizes = '100vw',
  style,
  objectFit = 'cover',
  onLoad,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority || inView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px 0px' },
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [priority, inView]);

  const handleLoad = (): void => {
    setLoaded(true);
    onLoad?.();
  };

  const canOptimize = isOptimizable(src);
  const avifSrc = canOptimize ? deriveVariant(src, 'avif') : null;
  const webpSrc = canOptimize ? deriveVariant(src, 'webp') : null;

  return (
    <div
      ref={containerRef}
      data-testid="media-picture"
      className={`relative overflow-hidden ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        ...style,
      }}
    >
      {/* Blur skeleton */}
      {!loaded && (
        <div className="absolute inset-0 bg-slate-800/60 animate-pulse" aria-hidden="true" />
      )}

      {inView && (
        <picture>
          {/* AVIF — best compression */}
          {avifSrc && <source srcSet={avifSrc} type="image/avif" sizes={sizes} />}
          {/* WebP — broad support */}
          {webpSrc && <source srcSet={webpSrc} type="image/webp" sizes={sizes} />}
          {/* Fallback original */}
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            sizes={canOptimize ? sizes : undefined}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            {...(priority ? { fetchpriority: 'high' as 'high' | 'low' | 'auto' } : {})}
            onLoad={handleLoad}
            style={{ objectFit }}
            className={`w-full h-full transition-opacity duration-300 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </picture>
      )}
    </div>
  );
};

export default MediaPicture;
