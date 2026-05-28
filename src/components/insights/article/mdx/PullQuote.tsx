import React from 'react';
import { cn } from '@/lib/utils';

interface PullQuoteProps {
  children: React.ReactNode;
  author?: string;
  className?: string;
}

export function PullQuote({ children, author, className }: PullQuoteProps) {
  return (
    <blockquote
      className={cn('my-fib-7 border-l-4 border-amber-600 pl-fib-6 py-fib-3', className)}
      data-testid="pullquote"
    >
      <p className="text-xl italic font-light text-slate-700 leading-relaxed">{children}</p>
      {author && (
        <footer className="mt-fib-3 text-sm font-medium text-amber-700 not-italic">
          — {author}
        </footer>
      )}
    </blockquote>
  );
}
