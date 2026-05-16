/**
 * P15/P17 — ResponsiveImage component.
 *
 * `<picture>` wrapper with AVIF + WebP fallback, optional srcset, native lazy
 * loading, art-direction support (P17), and CLS-friendly defaults
 * (width/height required at usage).
 *
 * Basic kullanım:
 *   <ResponsiveImage
 *     src="/hero/keystone.jpg"             // fallback (jpg/png)
 *     webp="/hero/keystone.webp"           // tercih
 *     avif="/hero/keystone.avif"           // en üst tercih
 *     alt="Strategic transformation"
 *     width={1280}
 *     height={720}
 *     sizes="(min-width: 1024px) 720px, 100vw"
 *     srcSetWidths={[320, 640, 960, 1280]}
 *   />
 *
 * P17 art-direction kullanımı (mobile-specific crop):
 *   <ResponsiveImage
 *     src="/hero/keystone-desktop.jpg"
 *     webp="/hero/keystone-desktop.webp"
 *     avif="/hero/keystone-desktop.avif"
 *     mobileSrc="/hero/keystone-mobile.jpg"
 *     mobileWebp="/hero/keystone-mobile.webp"
 *     mobileAvif="/hero/keystone-mobile.avif"
 *     mobileMedia="(max-width: 768px)"
 *     width={1280}
 *     height={720}
 *     alt="Strategic transformation"
 *   />
 *   → mobile (<=768px): keystone-mobile.{avif|webp|jpg} indir
 *   → desktop:          keystone-desktop.{avif|webp|jpg} indir
 *   Tarayıcı `<source media="...">` eşleşmesine göre tek ağ isteği yapar.
 *
 * Performans:
 *   - native lazy (loading="lazy" default; above-fold için override "eager")
 *   - decoding="async" — main thread'i bloklamaz
 *   - width + height attribute zorunlu (CLS=0)
 */

import React from 'react';
import { useSaveData } from '../../hooks/useSaveData';

export interface ResponsiveImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'srcSet'> {
  /** Required: pixel width — CLS prevention. */
  width: number;
  /** Required: pixel height — CLS prevention. */
  height: number;
  /** Alt text — required for a11y (boş string sadece decorative için). */
  alt: string;
  /** Optional WebP source. Browser auto-picks if supported. */
  webp?: string;
  /** Optional AVIF source. Highest priority if supported. */
  avif?: string;
  /** Generate srcset based on naming convention (`{base}-{w}.{ext}`). */
  srcSetWidths?: readonly number[];
  /** Responsive sizes attribute. */
  sizes?: string;
  /** Loading strategy. Default: "lazy". Above-fold için "eager". */
  loading?: 'lazy' | 'eager';
  /** Async decoding. Default: "async". */
  decoding?: 'async' | 'sync' | 'auto';
  /** fetchPriority — above-fold hero için "high". */
  fetchPriority?: 'high' | 'low' | 'auto';
  /**
   * P17 — Art direction: mobile-specific image source. When provided, an
   * additional `<source media="...">` is emitted BEFORE the desktop ones
   * so the browser picks the mobile crop on narrow viewports without
   * paying for the larger desktop file. Pair with `mobileWebp` / `mobileAvif`
   * for format negotiation, and `mobileSrcSetWidths` for DPR variants.
   */
  mobileSrc?: string;
  /** Mobile-specific WebP source (paired with `mobileSrc`). */
  mobileWebp?: string;
  /** Mobile-specific AVIF source (paired with `mobileSrc`). */
  mobileAvif?: string;
  /** Media query for the mobile sources. Default: `(max-width: 768px)`. */
  mobileMedia?: string;
  /** Optional srcset widths for the mobile source set. */
  mobileSrcSetWidths?: readonly number[];
  /** Optional `sizes` override applied only to the mobile `<source>` blocks. */
  mobileSizes?: string;
  /**
   * P21 — Save-Data düşük-bant variant. Eğer sağlanırsa ve kullanıcı
   * `navigator.connection.saveData === true` ise standart `src` yerine bu
   * kullanılır (örn. q60 JPEG).
   */
  lowBandwidthSrc?: string;
  /** Save-Data variantı için WebP. */
  lowBandwidthWebp?: string;
  /** Save-Data variantı için AVIF. */
  lowBandwidthAvif?: string;
  /**
   * Save-Data aktifken bu komponenti **tamamen** atla — başka bir öğeyle
   * ikame edilebilir. `null` döner.
   */
  skipOnSaveData?: boolean;
}

/**
 * Replace last segment of file basename with `-{width}` suffix before extension.
 * e.g. "/hero/keystone.webp" + 640 → "/hero/keystone-640.webp"
 */
function buildSrcSet(src: string, widths: readonly number[]): string {
  const m = src.match(/^(.*)\.([a-z0-9]+)(\?.*)?$/i);
  if (!m) return '';
  const [, base, ext, query = ''] = m;
  return widths
    .map((w) => `${base}-${w}.${ext}${query} ${w}w`)
    .join(', ');
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  webp,
  avif,
  alt,
  width,
  height,
  srcSetWidths,
  sizes,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  className,
  style,
  mobileSrc,
  mobileWebp,
  mobileAvif,
  mobileMedia = '(max-width: 768px)',
  mobileSrcSetWidths,
  mobileSizes,
  lowBandwidthSrc,
  lowBandwidthWebp,
  lowBandwidthAvif,
  skipOnSaveData,
  ...rest
}) => {
  const saveData = useSaveData();

  // P21 — Save-Data short-circuit: kullanıcı tamamen atlamak istiyorsa null
  // döner ve render'dan tasarruf eder. CLS riski: width/height bilinen tek
  // bir placeholder div ile dengelenmeli; bu davranış call-site sorumluluğu.
  if (saveData && skipOnSaveData) {
    return null;
  }

  // Save-Data aktifse düşük-bant variant'a swap; yoksa orijinali kullan.
  const effSrc = saveData && lowBandwidthSrc ? lowBandwidthSrc : src;
  const effWebp = saveData && lowBandwidthWebp ? lowBandwidthWebp : webp;
  const effAvif = saveData && lowBandwidthAvif ? lowBandwidthAvif : avif;

  const fallbackSrcSet = srcSetWidths && effSrc ? buildSrcSet(effSrc, srcSetWidths) : undefined;
  const webpSrcSet = srcSetWidths && effWebp ? buildSrcSet(effWebp, srcSetWidths) : undefined;
  const avifSrcSet = srcSetWidths && effAvif ? buildSrcSet(effAvif, srcSetWidths) : undefined;

  // P17 — Mobile srcset (only computed when caller provides widths).
  const mobileFallbackSrcSet =
    mobileSrcSetWidths && mobileSrc ? buildSrcSet(mobileSrc, mobileSrcSetWidths) : undefined;
  const mobileWebpSrcSet =
    mobileSrcSetWidths && mobileWebp ? buildSrcSet(mobileWebp, mobileSrcSetWidths) : undefined;
  const mobileAvifSrcSet =
    mobileSrcSetWidths && mobileAvif ? buildSrcSet(mobileAvif, mobileSrcSetWidths) : undefined;

  // Mobile sources `sizes` falls back to the main `sizes` when not overridden,
  // so the caller can opt into a separate value only when art-direction
  // implies a different layout (e.g. `100vw` on mobile vs `720px` on desktop).
  const effectiveMobileSizes = mobileSizes ?? sizes;

  // P15 — fetchPriority is camelCase in DOM (React 19) but lowercase in HTML.
  // React 19 renders `fetchpriority` correctly; pass as `fetchPriority`.
  const imgExtra: React.ImgHTMLAttributes<HTMLImageElement> = {};
  if (fetchPriority) {
    (imgExtra as Record<string, unknown>).fetchPriority = fetchPriority;
  }

  return (
    <picture>
      {/* P17 — Art-direction sources MUST appear before format-only sources.
          Browsers pick the FIRST matching `<source>`, so a mobile AVIF
          declaration here wins over a desktop AVIF declaration below
          when the viewport matches `mobileMedia`. */}
      {mobileAvif && (
        <source
          media={mobileMedia}
          srcSet={mobileAvifSrcSet ?? mobileAvif}
          type="image/avif"
          sizes={effectiveMobileSizes}
        />
      )}
      {mobileWebp && (
        <source
          media={mobileMedia}
          srcSet={mobileWebpSrcSet ?? mobileWebp}
          type="image/webp"
          sizes={effectiveMobileSizes}
        />
      )}
      {mobileSrc && (
        <source
          media={mobileMedia}
          srcSet={mobileFallbackSrcSet ?? mobileSrc}
          sizes={effectiveMobileSizes}
        />
      )}
      {effAvif && <source srcSet={avifSrcSet ?? effAvif} type="image/avif" sizes={sizes} />}
      {effWebp && <source srcSet={webpSrcSet ?? effWebp} type="image/webp" sizes={sizes} />}
      <img
        src={effSrc}
        srcSet={fallbackSrcSet}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        sizes={sizes}
        className={className}
        style={style}
        {...imgExtra}
        {...rest}
      />
    </picture>
  );
};

export default ResponsiveImage;
