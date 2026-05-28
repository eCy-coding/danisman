import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Clock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InsightPostCard } from '@/types/insights';
import { DOMAIN_LABELS, DOMAIN_COLORS, ARTICLE_TYPE_LABELS } from '@/types/insights';

interface FeaturedGridProps {
  posts: InsightPostCard[];
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));
}

function FeaturedPostCard({ post, large = false }: { post: InsightPostCard; large?: boolean }) {
  const color = DOMAIN_COLORS[post.primaryDomain];

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden group"
      data-testid="featured-post-card"
    >
      <Link to={`/insights/${post.slug}`} className="block relative overflow-hidden">
        <div
          className={cn('bg-slate-100 overflow-hidden', large ? 'aspect-[16/9]' : 'aspect-[16/10]')}
        >
          <img
            src={post.coverImageUrl}
            alt={post.coverImageAlt}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      </Link>

      <div className={cn('flex flex-col', large ? 'p-6' : 'p-4')}>
        <div className="flex flex-wrap gap-2 mb-3">
          <span
            className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full', color.text)}
            style={{ backgroundColor: color.bg }}
          >
            {DOMAIN_LABELS[post.primaryDomain].tr}
          </span>
          <span className="text-xs text-slate-500 px-2.5 py-0.5 rounded-full bg-slate-100">
            {ARTICLE_TYPE_LABELS[post.type].tr}
          </span>
        </div>

        <Link to={`/insights/${post.slug}`}>
          <h3
            className={cn(
              'font-bold text-slate-900 leading-snug hover:text-amber-700 transition-colors mb-2 line-clamp-2',
              large ? 'text-xl' : 'text-base',
            )}
          >
            {post.titleTr}
          </h3>
        </Link>

        {large && post.excerptTr && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-4">{post.excerptTr}</p>
        )}

        <div className="flex items-center gap-3 mt-auto">
          <img
            src={post.author.avatarUrl}
            alt={post.author.displayName}
            loading="lazy"
            className="w-7 h-7 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-700 truncate">{post.author.displayName}</p>
            {post.publishedAt && (
              <time className="text-xs text-slate-500" dateTime={post.publishedAt}>
                {formatDate(post.publishedAt)}
              </time>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 flex-shrink-0">
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

export function FeaturedGrid({ posts }: FeaturedGridProps) {
  const [first, second, third] = posts;

  if (!first) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 py-10" data-testid="featured-grid">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Öne Çıkanlar</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {first && (
          <div className="md:col-span-2">
            <FeaturedPostCard post={first} large />
          </div>
        )}

        {(second || third) && (
          <div className="flex flex-col gap-5">
            {second && <FeaturedPostCard post={second} />}
            {third && <FeaturedPostCard post={third} />}
          </div>
        )}
      </div>
    </section>
  );
}
