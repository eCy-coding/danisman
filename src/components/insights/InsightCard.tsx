import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Eye, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InsightPostCard } from '@/types/insights';
import { DOMAIN_LABELS, DOMAIN_COLORS, ARTICLE_TYPE_LABELS } from '@/types/insights';

interface InsightCardProps {
  post: InsightPostCard;
  variant?: 'default' | 'featured' | 'compact';
  className?: string;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

export function InsightCard({ post, variant = 'default', className }: InsightCardProps) {
  const domainColor = DOMAIN_COLORS[post.primaryDomain];
  const domainLabel = DOMAIN_LABELS[post.primaryDomain].tr;
  const typeLabel = ARTICLE_TYPE_LABELS[post.type].tr;

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'bg-white rounded-xl border border-slate-200 overflow-hidden group',
        variant === 'compact' && 'flex gap-3 items-start p-3',
        variant === 'featured' && 'shadow-md',
        className,
      )}
      data-testid="insight-card"
    >
      {variant !== 'compact' && (
        <Link to={`/insights/${post.slug}`} className="block relative overflow-hidden">
          <div className="aspect-[16/9] bg-slate-100">
            <img
              src={post.coverImageUrl}
              alt={post.coverImageAlt}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        </Link>
      )}

      <div className={cn('p-5', variant === 'compact' && 'p-0 flex-1')}>
        <div className="flex flex-wrap gap-2 mb-3">
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              domainColor.text,
            )}
            style={{ backgroundColor: domainColor.bg }}
            data-testid="domain-badge"
          >
            {domainLabel}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            {typeLabel}
          </span>
        </div>

        <Link to={`/insights/${post.slug}`}>
          <h3
            className={cn(
              'font-semibold text-slate-900 line-clamp-2 hover:text-amber-700 transition-colors',
              variant === 'featured' ? 'text-xl mb-3' : 'text-base mb-2',
              variant === 'compact' && 'text-sm',
            )}
            data-testid="card-title"
          >
            {post.titleTr}
          </h3>
        </Link>

        {variant !== 'compact' && post.excerptTr && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-4">{post.excerptTr}</p>
        )}

        <div className="flex items-center gap-3 mt-auto">
          <img
            src={post.author.avatarUrl}
            alt={post.author.displayName}
            className="w-7 h-7 rounded-full object-cover flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-700 truncate">{post.author.displayName}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {post.publishedAt && (
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 flex-shrink-0">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readingTimeMin} dk
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {post.viewCount.toLocaleString('tr-TR')}
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
