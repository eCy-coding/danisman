import React from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  Clock,
  ArrowRight,
  Newspaper,
  ClipboardList,
  BarChart3,
  PenLine,
} from 'lucide-react';
import { BlogCategory, BLOG_CATEGORY_META } from '../../types/blog';
import { Link } from 'react-router-dom';

interface CardPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  coverImage?: string;
  category?: string;
  readingTime: string;
  format?: string;
  /** Card-wide link target; defaults to the Perspektifler article URL. */
  href?: string;
}

interface BlogCardProps {
  post: CardPost;
  index: number;
}

interface MetaItemProps {
  icon: React.ElementType;
  text: string;
  className?: string;
}

const FORMAT_META: Record<string, { icon: React.ElementType; label: string }> = {
  makale: { icon: Newspaper, label: 'Makale' },
  'vaka-analizi': { icon: ClipboardList, label: 'Vaka Analizi' },
  rapor: { icon: BarChart3, label: 'Rapor' },
  'founder-letter': { icon: PenLine, label: 'Founder Letter' },
};

const MetaItem = ({ icon: Icon, text, className }: MetaItemProps) => (
  <span className="flex items-center gap-1.5">
    <Icon className={`w-3.5 h-3.5 ${className}`} aria-hidden="true" />
    {text}
  </span>
);

const BlogCard: React.FC<BlogCardProps> = ({ post, index }) => {
  const href = post.href ?? `/perspektifler/${post.slug}`;
  const format = post.format ? FORMAT_META[post.format] : undefined;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 11) * 0.06, duration: 0.5 }}
      data-testid="article-card"
      className="group relative flex flex-col h-full focus-within:ring-2 focus-within:ring-secondary rounded-2xl"
    >
      <div className="absolute -inset-0.5 bg-linear-to-r from-blue-600 to-yellow-500 rounded-2xl opacity-20 group-hover:opacity-100 blur transition duration-500"></div>
      <div className="relative flex-1 flex flex-col h-full bg-[#0a0f1c] rounded-xl border border-white/5 overflow-hidden">
        {/* Image Container — 16:9, lazy */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={post.coverImage}
            alt=""
            width={800}
            height={450}
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#0a0f1c] to-transparent opacity-80" />

          <div className="absolute top-4 left-4 flex gap-2 flex-wrap max-w-[85%]">
            {post.category && (
              <span
                className={`border text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${BLOG_CATEGORY_META[post.category as BlogCategory]?.bg ?? 'bg-white/10'} ${BLOG_CATEGORY_META[post.category as BlogCategory]?.border ?? 'border-white/20'} ${BLOG_CATEGORY_META[post.category as BlogCategory]?.color ?? 'text-white/90'}`}
              >
                {post.category}
              </span>
            )}
            {format && (
              <span className="flex items-center gap-1 border border-white/15 bg-black/40 text-white/80 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                <format.icon className="w-3 h-3" aria-hidden="true" />
                {format.label}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex items-center gap-4 text-xs text-slate-400 mb-4 font-medium">
            <MetaItem
              icon={Calendar}
              text={new Date(post.date).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              className="text-blue-400"
            />
            <MetaItem icon={Clock} text={post.readingTime} className="text-yellow-500" />
          </div>

          <h3 className="text-xl font-serif text-white mb-3 leading-snug group-hover:text-blue-400 transition-colors line-clamp-2">
            {/* Whole card is the link target (scan-first card spec). */}
            <Link
              to={href}
              className="outline-none after:absolute after:inset-0 after:content-['']"
            >
              {post.title}
            </Link>
          </h3>

          <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
            {post.excerpt}
          </p>

          <span className="inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:text-yellow-400 transition-colors mt-auto">
            Devamını Oku
            <ArrowRight
              className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </motion.article>
  );
};

export default BlogCard;
