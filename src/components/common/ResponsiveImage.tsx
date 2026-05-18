/**
 * P54.C3 — ResponsiveImage component.
 *
 * Modern srcset + <picture> kullanımı; AVIF → WebP → JPEG fallback zinciri.
 * `loading="lazy"` + `decoding="async"` default. Width/height ile CLS önlenir.
 *
 * Usage:
 *   <ResponsiveImage
 *     src="/images/founder-portrait.jpg"
 *     alt="Emre Can Yalçın"
 *     width={480}
 *     height={640}
 *     sizes="(max-width: 768px) 100vw, 480px"
 *   />
 *
 * Beklenen path naming (build sırasında üretildi varsayılır):
 *   /images/foo.jpg          → orijinal
 *   /images/foo.webp         → WebP versiyonu (aynı klasör)
 *   /images/foo.avif         → AVIF versiyonu (aynı klasör)
 *   /images/foo@2x.jpg vs.   → opsiyonel hi-DPI (srcSet)
 *
 * Eğer `formats` props verilmezse, tüm formatları auto-deriv eder.
 * Eksik dosya varsa browser <source> üzerinden atlar; JPEG fallback'e düşer.
 */

import React from 'react';

export interface ResponsiveImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'sync' | 'async' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
  /** Hangi modern formatları üreteceğinizi seçebilirsiniz. */
  formats?: Array<'avif' | 'webp'>;
  /** Opsiyonel hi-DPI (`@2x`) varyantı varsa srcSet'e eklenir. */
  retina?: boolean;
}

function deriveFormat(src: string, ext: 'avif' | 'webp'): string {
  return src.replace(/\.(jpe?g|png)$/i, `.${ext}`);
}

function deriveRetina(src: string): string {
  return src.replace(/(\.[^.]+)$/, '@2x$1');
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  width,
  height,
  sizes,
  className,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  formats = ['avif', 'webp'],
  retina = false,
}) => {
  const buildSrcSet = (path: string): string => {
    if (!retina) return path;
    return `${path} 1x, ${deriveRetina(path)} 2x`;
  };

  return (
    <picture>
      {formats.includes('avif') && (
        <source
          type="image/avif"
          srcSet={buildSrcSet(deriveFormat(src, 'avif'))}
          sizes={sizes}
        />
      )}
      {formats.includes('webp') && (
        <source
          type="image/webp"
          srcSet={buildSrcSet(deriveFormat(src, 'webp'))}
          sizes={sizes}
        />
      )}
      <img
        src={src}
        srcSet={retina ? buildSrcSet(src) : undefined}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        className={className}
      />
    </picture>
  );
};

export default ResponsiveImage;
