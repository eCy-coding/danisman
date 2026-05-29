import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { BlogCategory, BLOG_CATEGORY_META } from '../../types/blog';
import type { BlogPost } from '../../schemas/blog';
import { Link } from 'react-router-dom';

interface BlogCardProps {
  post: BlogPost;
  index: number;
}

interface MetaItemProps {
  icon: React.ElementType;
  text: string;
  className?: string;
}

const MetaItem = ({ icon: Icon, text, className }: MetaItemProps) => (
  <span className="flex items-center gap-1.5">
    <Icon className={`w-3.5 h-3.5 ${className}`} />
    {text}
  </span>
);

const BlogCard: React.FC<BlogCardProps> = ({ post, index }) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      data-testid="article-card"
      className="group relative flex flex-col h-full"
    >
      <div className="absolute -inset-0.5 bg-linear-to-r from-blue-600 to-yellow-500 rounded-2xl opacity-20 group-hover:opacity-100 blur transition duration-500"></div>
      <div className="relative flex-1 flex flex-col h-full bg-[#0a0f1c] rounded-xl border border-white/5 overflow-hidden">
        {/* Image Container */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={post.coverImage}
            alt={post.title}
            width={800}
            height={600}
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#0a0f1c] to-transparent opacity-80" />

          <div className="absolute top-4 left-4 flex gap-2 flex-wrap max-w-[75%]">
            {post.category && (
              <span
                className={`border text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${BLOG_CATEGORY_META[post.category as BlogCategory]?.bg ?? 'bg-white/10'} ${BLOG_CATEGORY_META[post.category as BlogCategory]?.border ?? 'border-white/20'} ${BLOG_CATEGORY_META[post.category as BlogCategory]?.color ?? 'text-white/90'}`}
              >
                {post.category}
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

          <h3 className="text-xl font-serif text-white mb-3 leading-snug group-hover:text-blue-400 transition-colors">
            {post.title}
          </h3>

          <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
            {post.excerpt}
          </p>

          <Link
            to={`/blog/${post.slug}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:text-yellow-400 transition-colors mt-auto"
          >
            Devamını Oku
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
};

export default BlogCard;
