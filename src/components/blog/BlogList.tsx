import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import BlogCard from './BlogCard';
import { getBlogPosts } from '../../lib/data';
import { BlogPost, BlogCategory, BLOG_CATEGORIES } from '../../types/blog';

const blogPosts = getBlogPosts() as BlogPost[];

/**
 * Phase 20 B3: Blog list with URL-driven category + tag filters.
 * Query params:
 *   ?cat=<BlogCategory>   single primary category filter
 *   ?tag=<string>         single tag filter (case-insensitive)
 *
 * Filters compose (AND).
 */
const BlogList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCat = searchParams.get('cat') as BlogCategory | null;
  const activeTag = searchParams.get('tag');

  // Aggregate available categories & tags from the live post set.
  const { categories, tags } = useMemo(() => {
    const cats = new Set<BlogCategory>();
    const tagSet = new Set<string>();
    for (const p of blogPosts) {
      if (p.category) cats.add(p.category);
      for (const t of p.tags) tagSet.add(t);
    }
    return {
      categories: BLOG_CATEGORIES.filter((c) => cats.has(c)),
      tags: Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'tr')),
    };
  }, []);

  const filtered = useMemo(() => {
    return blogPosts.filter((p) => {
      if (activeCat && p.category !== activeCat) return false;
      if (activeTag && !p.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [activeCat, activeTag]);

  const setParam = (key: 'cat' | 'tag', value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === null || next.get(key) === value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  const clearAll = () => setSearchParams({}, { replace: true });
  const hasFilter = Boolean(activeCat || activeTag);

  return (
    <div>
      {/* Filter bar */}
      <nav aria-label="Blog filtreleri" className="mb-10">
        {categories.length > 0 && (
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Kategori</p>
            <ul className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const active = activeCat === cat;
                return (
                  <li key={cat}>
                    <button
                      type="button"
                      onClick={() => setParam('cat', cat)}
                      aria-pressed={active}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        active
                          ? 'border-blue-400 bg-blue-500/20 text-blue-100'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30'
                      }`}
                    >
                      {cat}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {tags.length > 0 && (
          <div className="mb-2">
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Etiketler</p>
            <ul className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const active = activeTag?.toLowerCase() === tag.toLowerCase();
                return (
                  <li key={tag}>
                    <button
                      type="button"
                      onClick={() => setParam('tag', tag)}
                      aria-pressed={active}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        active
                          ? 'border-yellow-400 bg-yellow-500/20 text-yellow-100'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      #{tag}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {hasFilter && (
          <button
            type="button"
            onClick={clearAll}
            className="mt-3 text-xs text-slate-400 underline hover:text-white"
          >
            Filtreleri temizle
          </button>
        )}
      </nav>

      {/* Result grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="list">
          {filtered.map((post, index) => (
            <div role="listitem" key={post.slug}>
              <BlogCard post={post} index={index} />
            </div>
          ))}
        </div>
      ) : (
        <p role="status" className="text-center text-slate-400 py-16">
          Bu filtreyle eşleşen yazı bulunamadı.
        </p>
      )}
    </div>
  );
};

export default BlogList;
