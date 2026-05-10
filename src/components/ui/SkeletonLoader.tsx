/**
 * SkeletonLoader — Generic Skeleton Screen Bileşeni
 * istek5.txt Phase 2: UI/UX — Perceived Performance (Critical)
 *
 * SectionShell'in `null` fallback'ini değiştirir → kullanıcı boş ekran görmez.
 *
 * Varyantlar:
 *  - SectionSkeleton: tam bölüm iskeleti (başlık + kartlar)
 *  - CardSkeleton: tek kart iskeleti
 *  - TextSkeleton: metin satırları iskeleti
 *  - HeroSkeleton: hero bölümü iskeleti
 *  - TableRowSkeleton: tablo satırı iskeleti
 *
 * Özellikler:
 * - CSS `animate-pulse` (Tailwind) — hafif, GPU hızlandırmalı
 * - aria-hidden + role="status" ile A11y uyumlu
 * - reduced-motion: animasyon kapalı → statik gri
 */

import React from 'react';

interface SkeletonProps {
  className?: string;
}

const base = 'bg-white/5 rounded-lg animate-pulse';

export const Skeleton: React.FC<SkeletonProps & { 'aria-hidden'?: boolean }> = ({
  className = '',
  ...rest
}) => <div className={`${base} ${className}`} aria-hidden={rest['aria-hidden'] ?? true} />;

/** Kart iskeleti */
export const CardSkeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div
    className={`rounded-2xl border border-white/8 p-6 space-y-4 ${className}`}
    aria-hidden="true"
  >
    <div className="flex items-center gap-3">
      <div className={`${base} w-10 h-10 rounded-xl`} />
      <div className="flex-1 space-y-2">
        <div className={`${base} h-4 w-3/4`} />
        <div className={`${base} h-3 w-1/2`} />
      </div>
    </div>
    <div className={`${base} h-3 w-full`} />
    <div className={`${base} h-3 w-5/6`} />
    <div className={`${base} h-3 w-4/6`} />
    <div className={`${base} h-9 w-28 rounded-xl mt-2`} />
  </div>
);

/** Metin satırları iskeleti */
export const TextSkeleton: React.FC<{ lines?: number; className?: string }> = ({
  lines = 4,
  className = '',
}) => (
  <div className={`space-y-2 ${className}`} aria-hidden="true">
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`${base} h-3`}
        style={{ width: i === lines - 1 ? '60%' : `${85 + Math.floor(Math.random() * 15)}%` }}
      />
    ))}
  </div>
);

/** Hero bölümü iskeleti */
export const HeroSkeleton: React.FC = () => (
  <div className="py-20 px-4 sm:px-6 max-w-6xl mx-auto" aria-hidden="true">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="space-y-5">
        <div className={`${base} h-4 w-24 rounded-full`} />
        <div className="space-y-3">
          <div className={`${base} h-12 w-5/6`} />
          <div className={`${base} h-12 w-4/6`} />
          <div className={`${base} h-12 w-3/6`} />
        </div>
        <div className={`${base} h-4 w-full`} />
        <div className={`${base} h-4 w-5/6`} />
        <div className="flex gap-4 pt-2">
          <div className={`${base} h-12 w-40 rounded-xl`} />
          <div className={`${base} h-12 w-32 rounded-xl`} />
        </div>
      </div>
      <div className={`${base} rounded-2xl aspect-square hidden lg:block`} />
    </div>
  </div>
);

/** Tam bölüm iskeleti — SectionShell fallback */
export const SectionSkeleton: React.FC<{ cards?: number; title?: boolean }> = ({
  cards = 3,
  title = true,
}) => (
  <section
    className="py-16 sm:py-20 px-4 sm:px-6"
    aria-hidden="true"
    data-testid="section-skeleton"
    role="status"
    aria-label="İçerik yükleniyor"
  >
    <div className="max-w-6xl mx-auto space-y-10">
      {title && (
        <div className="text-center space-y-3">
          <div className={`${base} h-3 w-16 mx-auto rounded-full`} />
          <div className={`${base} h-8 w-64 mx-auto`} />
          <div className={`${base} h-4 w-80 mx-auto`} />
        </div>
      )}
      <div
        className={`grid gap-6 ${
          cards === 1
            ? 'grid-cols-1 max-w-xl mx-auto'
            : cards === 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {Array.from({ length: cards }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  </section>
);

/** Tablo satırı iskeleti */
export const TableRowSkeleton: React.FC<{ cols?: number; rows?: number }> = ({
  cols = 4,
  rows = 5,
}) => (
  <div className="w-full space-y-2" aria-hidden="true">
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-4 px-4 py-3 border border-white/5 rounded-xl">
        {Array.from({ length: cols }).map((_, c) => (
          <div
            key={c}
            className={`${base} h-4 flex-1`}
            style={{ maxWidth: c === 0 ? '40px' : undefined }}
          />
        ))}
      </div>
    ))}
  </div>
);

/** Testimonial kartı iskeleti */
export const TestimonialSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-white/8 p-6 space-y-4" aria-hidden="true">
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <div key={i} className={`${base} w-4 h-4 rounded-sm`} />
      ))}
    </div>
    <TextSkeleton lines={3} />
    <div className="flex items-center gap-3 pt-2">
      <div className={`${base} w-10 h-10 rounded-full`} />
      <div className="space-y-1.5">
        <div className={`${base} h-3 w-24`} />
        <div className={`${base} h-2.5 w-16`} />
      </div>
    </div>
  </div>
);
