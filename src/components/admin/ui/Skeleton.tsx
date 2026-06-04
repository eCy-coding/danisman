/**
 * R8-P3 — Canonical Skeleton primitives.
 *
 * Three building blocks: <SkeletonBlock /> (single placeholder bar),
 * <SkeletonRow /> (table-row composition: avatar + 2 text columns + meta),
 * <SkeletonList /> (N rows). Drop-in replacement for "Yükleniyor…" text
 * across admin list pages — reduces CLS by reserving layout immediately.
 *
 * Tailwind animate-pulse drives the shimmer (no JS animation cost). Width
 * variants randomized lightly per row so the visual doesn't look like a
 * monolithic block.
 */
import React from 'react';

interface SkeletonBlockProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

const ROUNDED: Record<NonNullable<SkeletonBlockProps['rounded']>, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({
  className = '',
  width = 'w-full',
  height = 'h-4',
  rounded = 'md',
}) => (
  <div
    className={`bg-white/10 animate-pulse ${width} ${height} ${ROUNDED[rounded]} ${className}`}
    aria-hidden="true"
  />
);

export const SkeletonRow: React.FC<{ withAvatar?: boolean }> = ({ withAvatar = true }) => (
  <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
    {withAvatar && <SkeletonBlock width="w-9" height="h-9" rounded="full" />}
    <div className="flex-1 space-y-2">
      <SkeletonBlock width="w-2/5" height="h-3" />
      <SkeletonBlock width="w-3/5" height="h-2.5" />
    </div>
    <SkeletonBlock width="w-16" height="h-3" />
  </div>
);

export const SkeletonList: React.FC<{ count?: number; withAvatar?: boolean }> = ({
  count = 8,
  withAvatar = true,
}) => (
  <div role="status" aria-live="polite" aria-label="Yükleniyor">
    <span className="sr-only">İçerik yükleniyor…</span>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonRow key={i} withAvatar={withAvatar} />
    ))}
  </div>
);

export default SkeletonList;
