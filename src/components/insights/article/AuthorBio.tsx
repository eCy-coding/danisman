import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { InsightAuthor } from '@/types/insights';

interface GuestAuthor {
  displayName: string;
  bioTr: string;
  avatarUrl: string;
  linkedinUrl?: string;
  slug?: string;
}

interface AuthorBioProps {
  author: InsightAuthor;
  guestAuthors?: GuestAuthor[];
  className?: string;
}

function AuthorCard({
  author,
  isGuest = false,
}: {
  author: InsightAuthor | GuestAuthor;
  isGuest?: boolean;
}) {
  const slug = 'slug' in author ? author.slug : undefined;
  const linkedinUrl = 'linkedinUrl' in author ? author.linkedinUrl : undefined;
  const isFounder = 'isFounder' in author ? author.isFounder : false;

  return (
    <div
      className={cn(
        'flex gap-fib-5 rounded-xl border border-slate-200 bg-white p-fib-6',
        isGuest && 'border-dashed',
      )}
      data-testid={isGuest ? 'guest-author-bio' : 'author-bio'}
    >
      <img
        src={author.avatarUrl}
        alt={author.displayName}
        loading="lazy"
        className="h-16 w-16 rounded-full object-cover ring-2 ring-amber-100 shrink-0"
        data-testid="author-avatar"
      />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-fib-3 mb-1">
          <h3 className="font-bold text-slate-900 text-base" data-testid="author-bio-name">
            {author.displayName}
          </h3>
          {isFounder && (
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
              Kurucu
            </span>
          )}
          {isGuest && (
            <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
              Konuk Yazar
            </span>
          )}
        </div>
        <p
          className="text-sm text-slate-600 leading-relaxed mb-fib-4"
          data-testid="author-bio-text"
        >
          {author.bioTr}
        </p>
        <div className="flex flex-wrap items-center gap-fib-4">
          {linkedinUrl && (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-fib-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              aria-label={`${author.displayName} LinkedIn profili`}
              data-testid="author-linkedin"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </a>
          )}
          {slug && !isGuest && (
            <Link
              to={`/insights/author/${slug}`}
              className="inline-flex items-center gap-fib-2 text-sm text-amber-600 hover:text-amber-800 font-medium transition-colors"
              data-testid="author-other-articles-link"
            >
              Diğer yazılar
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function AuthorBio({ author, guestAuthors, className }: AuthorBioProps) {
  return (
    <section
      className={cn('space-y-fib-4', className)}
      aria-label="Yazar bilgisi"
      data-testid="author-bio-section"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-fib-4">
        Yazar Hakkında
      </h2>
      <AuthorCard author={author} />
      {guestAuthors?.map((ga, i) => (
        <AuthorCard key={i} author={ga} isGuest />
      ))}
    </section>
  );
}
