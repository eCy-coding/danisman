import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface RelatedServiceProps {
  slug: string;
  title: string;
  className?: string;
}

export function RelatedService({ slug, title, className }: RelatedServiceProps) {
  return (
    <Link
      to={`/services/${slug}`}
      className={cn(
        'my-fib-5 flex items-center justify-between gap-fib-4',
        'rounded-lg border border-amber-200 bg-amber-50 px-fib-5 py-fib-4',
        'text-sm transition-all hover:border-amber-400 hover:bg-amber-100 hover:shadow-sm',
        className,
      )}
      data-testid={`related-service-${slug}`}
    >
      <div>
        <span className="block text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">
          İlgili hizmet
        </span>
        <span className="font-medium text-slate-800">{title}</span>
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-amber-500 shrink-0"
        aria-hidden="true"
      >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </Link>
  );
}
