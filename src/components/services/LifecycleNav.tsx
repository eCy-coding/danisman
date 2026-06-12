/**
 * SVC P7 — lifecycle position indicator + prev/next workflow navigation.
 *
 * Renders "İş akışında adım N/M" with the department chip and links to the
 * neighbouring steps of the taxonomy-v2 lifecycle. Pillar pages (umbrella
 * targets, not workflow members) render nothing.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getLifecyclePosition } from '@/data/service-taxonomy';
import { SERVICES } from '@/data/services';

const titleOf = (slug: string): string =>
  SERVICES.find((s) => s.link.endsWith(`/${slug}`))?.title ?? slug;

interface LifecycleNavProps {
  slug: string;
  className?: string;
}

export const LifecycleNav: React.FC<LifecycleNavProps> = ({ slug, className = '' }) => {
  const pos = getLifecyclePosition(slug);
  if (!pos) return null;

  const prevSlug = pos.step > 1 ? pos.department.lifecycle[pos.step - 2] : undefined;
  const nextSlug = pos.step < pos.total ? pos.department.lifecycle[pos.step] : undefined;

  return (
    <div
      data-testid="lifecycle-nav"
      className={`flex flex-wrap items-center gap-3 text-xs ${className}`}
    >
      <span
        data-testid="lifecycle-position"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 font-bold tracking-wide text-slate-300 tabular-nums"
      >
        <span className="text-secondary">{pos.department.label.tr}</span>
        <span aria-hidden="true" className="text-slate-600">
          ·
        </span>
        {`İş akışında adım ${pos.step}/${pos.total}`}
      </span>

      {prevSlug && (
        <Link
          to={`/services/${prevSlug}`}
          data-testid="lifecycle-prev"
          className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-slate-400 hover:text-white hover:border-white/25 transition-colors duration-150"
        >
          <ArrowLeft
            size={12}
            className="group-hover:-translate-x-0.5 transition-transform duration-150"
            aria-hidden="true"
          />
          <span className="max-w-44 truncate">{titleOf(prevSlug)}</span>
        </Link>
      )}
      {nextSlug && (
        <Link
          to={`/services/${nextSlug}`}
          data-testid="lifecycle-next"
          className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-slate-400 hover:text-white hover:border-white/25 transition-colors duration-150"
        >
          <span className="max-w-44 truncate">{titleOf(nextSlug)}</span>
          <ArrowRight
            size={12}
            className="group-hover:translate-x-0.5 transition-transform duration-150"
            aria-hidden="true"
          />
        </Link>
      )}
    </div>
  );
};
