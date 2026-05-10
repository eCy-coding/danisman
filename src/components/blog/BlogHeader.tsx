/**
 * BlogHeader — MDX blog post reusable header component
 * Used in blog MDX files: import { BlogHeader } from '../../components/blog/BlogHeader'
 */

import React from 'react';
import { Clock, Calendar, Tag } from 'lucide-react';

interface BlogHeaderProps {
  title?: string;
  date?: string;
  readTime?: string;
  category?: string;
  author?: string;
}

export const BlogHeader: React.FC<BlogHeaderProps> = ({
  title,
  date,
  readTime,
  category,
  author,
}) => {
  if (!title && !date && !readTime && !category) return null;

  return (
    <header className="mb-8 pb-6 border-b border-white/10">
      {category && (
        <div className="flex items-center gap-2 mb-3">
          <Tag size={13} className="text-secondary" />
          <span className="text-xs font-semibold text-secondary uppercase tracking-widest">
            {category}
          </span>
        </div>
      )}

      {title && (
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white leading-tight mb-4">
          {title}
        </h1>
      )}

      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
        {author && <span className="text-slate-400 font-medium">{author}</span>}
        {date && (
          <span className="flex items-center gap-1.5">
            <Calendar size={12} />
            {new Date(date).toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        )}
        {readTime && (
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            {readTime} okuma
          </span>
        )}
      </div>
    </header>
  );
};

export default BlogHeader;
