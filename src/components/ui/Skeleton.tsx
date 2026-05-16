/**
 * P23/T2 — Generic Skeleton primitive + variant components.
 *
 * SkeletonLoader.tsx (mevcut) section-level kompozit iskeleti sağlar; bu modül
 * **atomik** primitive (`<Skeleton variant="text|circle|rect">`) verir ve
 * data-fetching component'larında CLS = 0 kalmasını garanti eder.
 *
 * Tasarım kuralları:
 *   • `aria-busy="true"` + `role="status"` — ekran okuyucu "yükleniyor" duyurur
 *   • `prefers-reduced-motion` — shimmer kapanır, sadece arka plan kalır
 *   • Width/Height zorunlu (CLS = 0 disiplini) — ya prop ya class ile
 *   • Shimmer GPU layer'da: `transform: translateX(...)` keyframe (paint-cheap)
 *   • `clsx + tailwind-merge` (cn) — class collision güvenli
 *   • Magic number yok — boyut/spacing class'ları Fibonacci/φ'den
 *
 * Variant'lar:
 *   text   → satır (`rounded-md`)
 *   circle → avatar (`rounded-full`)
 *   rect   → kart/medya (`rounded-xl`)
 */

import React from 'react';
import { cn } from '../../lib/utils';

export type SkeletonVariant = 'text' | 'circle' | 'rect';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  /** CSS değeri ('40px', '100%', 24). */
  width?: string | number;
  /** CSS değeri ('40px', 24). */
  height?: string | number;
  /** Shimmer animasyonunu kapat (prefers-reduced-motion otomatik). */
  noShimmer?: boolean;
}

const VARIANT_CLASSES: Record<SkeletonVariant, string> = {
  text: 'rounded-md',
  circle: 'rounded-full',
  rect: 'rounded-xl',
};

const toCss = (v: string | number | undefined): string | undefined =>
  typeof v === 'number' ? `${v}px` : v;

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rect',
  width,
  height,
  className,
  noShimmer,
  style,
  ...rest
}) => {
  const cssWidth = toCss(width);
  const cssHeight = toCss(height);
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn(
        'ecy-skeleton bg-white/5',
        !noShimmer && 'ecy-skeleton-shimmer motion-reduce:ecy-skeleton-no-shimmer',
        VARIANT_CLASSES[variant],
        className,
      )}
      style={{
        width: cssWidth,
        height: cssHeight,
        ...style,
      }}
      {...rest}
    />
  );
};

// ── Domain-specific variants ──────────────────────────────────────────────────

/** BlogCard layout'una boyutsal eş — CLS = 0. */
export const BlogCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <article
    role="status"
    aria-busy="true"
    aria-label="Blog yazısı yükleniyor"
    className={cn(
      'rounded-2xl border border-white/8 overflow-hidden bg-[#1E1F20]',
      className,
    )}
  >
    {/* Cover image — 16:9, BlogCard ile 1:1 eşleşir */}
    <Skeleton variant="rect" width="100%" height={216} className="rounded-none" />
    <div className="p-fib-6 space-y-fib-5">
      {/* Meta row: kategori + tarih */}
      <div className="flex items-center gap-fib-4">
        <Skeleton variant="text" width={68} height={14} />
        <Skeleton variant="text" width={96} height={14} />
      </div>
      {/* Başlık 2 satır */}
      <div className="space-y-2">
        <Skeleton variant="text" width="90%" height={22} />
        <Skeleton variant="text" width="70%" height={22} />
      </div>
      {/* Özet 2 satır */}
      <div className="space-y-2">
        <Skeleton variant="text" width="100%" height={14} />
        <Skeleton variant="text" width="85%" height={14} />
      </div>
      {/* Yazar satırı */}
      <div className="flex items-center gap-fib-4 pt-2">
        <Skeleton variant="circle" width={32} height={32} />
        <Skeleton variant="text" width={110} height={14} />
      </div>
    </div>
  </article>
);

/** ServiceCard layout'u — ikon + başlık + 3 satır + CTA. */
export const ServiceCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Hizmet kartı yükleniyor"
    className={cn(
      'rounded-2xl border border-white/8 p-fib-6 space-y-fib-5 bg-[#1E1F20]',
      className,
    )}
  >
    <Skeleton variant="rect" width={48} height={48} className="rounded-xl" />
    <Skeleton variant="text" width="65%" height={24} />
    <div className="space-y-2">
      <Skeleton variant="text" width="100%" height={14} />
      <Skeleton variant="text" width="92%" height={14} />
      <Skeleton variant="text" width="78%" height={14} />
    </div>
    <Skeleton variant="rect" width={112} height={36} className="rounded-xl" />
  </div>
);

/** PricingCard — premium + standard, sabit yükseklik. */
export const PricingCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Fiyat kartı yükleniyor"
    className={cn(
      'rounded-2xl border border-white/10 p-fib-7 space-y-fib-6 bg-[#1E1F20]',
      className,
    )}
  >
    <Skeleton variant="text" width="40%" height={16} />
    <Skeleton variant="text" width="55%" height={42} />
    <Skeleton variant="text" width="80%" height={14} />
    <div className="space-y-fib-4 pt-fib-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-fib-4">
          <Skeleton variant="circle" width={16} height={16} />
          <Skeleton variant="text" width={`${60 + ((i * 7) % 25)}%`} height={14} />
        </div>
      ))}
    </div>
    <Skeleton variant="rect" width="100%" height={44} className="rounded-xl" />
  </div>
);

/**
 * Tablo satırı — admin listeleri.
 * `<tr>` üzerine role="status" eslint kuralına takılır (interactive olmayan
 * native role). aria-busy yine korunur; status duyurusu için üst tablo
 * `role="status"` taşıyabilir.
 */
export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <tr aria-busy="true" aria-label="Satır yükleniyor">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-fib-5 py-fib-4">
        <Skeleton variant="text" width={i === 0 ? 28 : '85%'} height={14} />
      </td>
    ))}
  </tr>
);

export default Skeleton;
