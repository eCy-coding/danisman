/**
 * SVC P7 — sticky in-page section navigation for service detail pages.
 *
 * Horizontal anchor pill bar; the active section highlights via a single
 * IntersectionObserver (no scroll-handler thrash — INP budget).
 */
import React, { useEffect, useState } from 'react';

export interface DetailSection {
  id: string;
  label: string;
}

interface DetailSectionNavProps {
  sections: DetailSection[];
  className?: string;
}

export const DetailSectionNav: React.FC<DetailSectionNavProps> = ({ sections, className = '' }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const targets = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!targets.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [sections]);

  if (!sections.length) return null;

  return (
    <nav
      data-testid="detail-section-nav"
      aria-label="Sayfa içi bölümler"
      className={`sticky top-20 z-30 -mx-6 px-6 md:mx-0 md:px-0 ${className}`}
    >
      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3 bg-neutral/95 border-b border-white/5">
        {sections.map((s) => {
          const isActive = activeId === s.id;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-current={isActive ? 'true' : undefined}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-colors duration-150 ${
                isActive
                  ? 'text-neutral bg-secondary border-secondary'
                  : 'text-slate-400 bg-white/5 border-white/10 hover:text-white hover:bg-white/10'
              }`}
            >
              {s.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
};
