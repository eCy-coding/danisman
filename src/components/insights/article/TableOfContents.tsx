import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

interface TableOfContentsProps {
  headings: TocHeading[];
  className?: string;
}

export function TableOfContents({ headings, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? '');
  const [collapsed, setCollapsed] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '0px 0px -60% 0px', threshold: 0.1 },
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav
      className={cn(
        'sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto',
        'w-56 shrink-0',
        className,
      )}
      aria-label="İçindekiler"
      data-testid="toc-container"
    >
      <div className="flex items-center justify-between mb-fib-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          İçindekiler
        </h2>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-slate-400 hover:text-slate-600 transition-colors lg:hidden"
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'İçindekileri genişlet' : 'İçindekileri daralt'}
          data-testid="toc-collapse-button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn('transition-transform', collapsed ? '' : 'rotate-180')}
            aria-hidden="true"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      </div>

      {!collapsed && (
        <ol className="space-y-1">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={cn(
                  'block py-1 text-sm transition-all',
                  h.level === 3 ? 'pl-fib-5' : 'pl-0',
                  activeId === h.id
                    ? 'border-l-2 border-amber-600 pl-fib-4 font-medium text-amber-700'
                    : 'text-slate-500 hover:text-slate-800',
                )}
                aria-current={activeId === h.id ? 'location' : undefined}
                data-testid={`toc-item-${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}
