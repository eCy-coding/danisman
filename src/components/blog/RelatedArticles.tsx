import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import type { BlogPost } from '../../schemas/blog';

interface RelatedArticlesProps {
  posts: BlogPost[];
}

export function RelatedArticles({ posts }: RelatedArticlesProps) {
  if (!posts.length) return null;

  return (
    <section data-testid="related-articles" className="mt-16">
      <h2 className="text-xl font-bold text-white mb-6">İlgili İçgörüler</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.slice(0, 3).map((post) => (
          <Link
            key={post.slug}
            to={`/perspektifler/${post.slug}`}
            className="group block rounded-xl bg-white/5 border border-white/10 p-5 hover:border-amber-500/30 transition-colors"
          >
            {post.coverImage && (
              <img
                src={post.coverImage}
                alt={post.title}
                width={400}
                height={225}
                loading="lazy"
                className="w-full h-32 object-cover rounded-lg mb-4"
              />
            )}
            <h3 className="text-sm font-semibold text-white leading-snug mb-2 group-hover:text-amber-400 transition-colors">
              {post.title}
            </h3>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              {post.readingTime}
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 mt-2 transition-colors" />
          </Link>
        ))}
      </div>
    </section>
  );
}
