import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { InsightPost } from '@/types/insights';
import { DOMAIN_COLORS, DOMAIN_LABELS, ARTICLE_TYPE_LABELS } from '@/types/insights';

interface ArticleHeroProps {
  post: InsightPost;
}

function formatDateTR(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function ArticleHero({ post }: ArticleHeroProps) {
  const domainColors = DOMAIN_COLORS[post.primaryDomain];
  const domainLabel = DOMAIN_LABELS[post.primaryDomain].tr;
  const typeLabel = ARTICLE_TYPE_LABELS[post.type].tr;

  return (
    <div className="w-full" data-testid="article-hero">
      <div className="relative w-full max-h-[480px] overflow-hidden bg-slate-200">
        <img
          src={post.coverImageUrl}
          alt={post.coverImageAlt}
          className="w-full max-h-[480px] object-cover"
          data-testid="hero-cover-image"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="mx-auto max-w-4xl px-fib-6 py-fib-7">
        <nav
          aria-label="Sayfa içi konum"
          className="mb-fib-6 flex flex-wrap items-center gap-x-fib-3 gap-y-fib-2 text-sm text-slate-500"
          data-testid="article-breadcrumb"
        >
          <Link to="/" className="hover:text-amber-600 transition-colors">
            Anasayfa
          </Link>
          <span aria-hidden="true">›</span>
          <Link to="/insights" className="hover:text-amber-600 transition-colors">
            Perspektif
          </Link>
          <span aria-hidden="true">›</span>
          <Link
            to={`/insights?domain=${post.primaryDomain}`}
            className="hover:text-amber-600 transition-colors"
            data-testid="breadcrumb-domain"
          >
            {domainLabel}
          </Link>
          <span aria-hidden="true">›</span>
          <span className="text-slate-700 font-medium" data-testid="breadcrumb-subdomain">
            {post.subDomain}
          </span>
        </nav>

        <div className="flex flex-wrap items-center gap-fib-3 mb-fib-5">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-fib-4 py-1 text-xs font-semibold',
              domainColors.text,
            )}
            style={{ backgroundColor: domainColors.bg }}
            data-testid="domain-badge"
          >
            {domainLabel}
          </span>

          <span className="inline-flex items-center rounded-full bg-slate-100 px-fib-4 py-1 text-xs font-medium text-slate-600">
            {typeLabel}
          </span>

          {post.language !== 'BOTH' && (
            <span
              className="inline-flex items-center rounded-full border border-slate-300 px-fib-4 py-1 text-xs font-medium text-slate-500"
              data-testid="language-badge"
            >
              {post.language === 'TR_ONLY' ? '🇹🇷 Türkçe' : '🇬🇧 English'}
            </span>
          )}
        </div>

        <h1
          className="font-bold text-slate-900 leading-tight mb-fib-5"
          style={{
            fontSize: 'clamp(2rem, 5vw, 4rem)',
          }}
          data-testid="article-title"
        >
          {post.titleTr}
        </h1>

        {post.excerptTr && (
          <p
            className="text-xl text-slate-600 leading-relaxed mb-fib-6 line-clamp-3"
            data-testid="article-excerpt"
          >
            {post.excerptTr}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-fib-5 border-t border-slate-200 pt-fib-5">
          <div className="flex items-center gap-fib-4" data-testid="author-bar">
            <img
              src={post.author.avatarUrl}
              alt={post.author.displayName}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-amber-200"
            />
            <div>
              <p className="font-semibold text-slate-800 text-sm" data-testid="author-name">
                {post.author.displayName}
              </p>
              {post.author.isFounder && <p className="text-xs text-amber-600">Kurucu, eCyPro</p>}
            </div>
            {post.author.linkedinUrl && (
              <a
                href={post.author.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-slate-400 hover:text-blue-600 transition-colors"
                aria-label="LinkedIn profili"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            )}
          </div>

          <div
            className="flex flex-wrap items-center gap-fib-5 text-sm text-slate-500"
            data-testid="article-meta"
          >
            {post.publishedAt && (
              <time
                dateTime={post.publishedAt}
                className="flex items-center gap-fib-2"
                data-testid="published-date"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
                {formatDateTR(post.publishedAt)}
              </time>
            )}

            <span className="flex items-center gap-fib-2" data-testid="reading-time">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {post.readingTimeMin} dk okuma
            </span>

            <span className="flex items-center gap-fib-2" data-testid="view-count">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {post.viewCount.toLocaleString('tr-TR')} görüntülenme
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
