import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MDXProvider } from '@mdx-js/react';
import { Calendar, Clock, ChevronRight, PenLine } from 'lucide-react';
import { motion } from 'motion/react';

// P46 C5: MDX content'in ilk satırı `# Başlık` formatında olduğu için her blog
// post sayfasında 2 H1 vardı (BlogPostPage + MDX). SEO best practice 1 H1/page.
// Bu mapping MDX h1 → h2 demote eder; semantic h1 sayısı 1'e iner.
// eslint-disable-next-line jsx-a11y/heading-has-content -- MDX runtime supplies children at render time
const MdxH2 = (props: React.ComponentPropsWithoutRef<'h2'>) => <h2 {...props} />;
const MDX_COMPONENTS = { h1: MdxH2 };

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { VoicePlayer } from '../components/ui/VoicePlayer';
import { ScrollProgressBar } from '../components/ui/ScrollProgressBar';
import { StickyTableOfContents } from '../components/ui/StickyTableOfContents';
import { JsonLd } from '../components/seo/JsonLd';
import { AuthorBio } from '../components/blog/AuthorBio';
import { AudioOverview } from '../components/blog/AudioOverview';
import { RelatedArticles } from '../components/blog/RelatedArticles';
import { ShareButtons } from '../components/blog/ShareButtons';
import { getBlogPosts } from '../lib/data';
import { BlogPost } from '../schemas/blog';
import { buildArticleSchema, buildBreadcrumbSchema } from '../lib/structured-data';
import { useTranslation } from '@/lib/i18n';
import { buildCanonical } from '@/i18n/canonical';
import { relatedItems, seriesSiblings } from '@/lib/perspektifler';
import { CATEGORY_BY_LABEL } from '@/data/taxonomy';
import { NewsletterSidebar } from '../components/blog/NewsletterSidebar';
import PublishedPostPage from '../components/blog/PublishedPostPage';

const blogPosts = getBlogPosts();

const FORMAT_LABEL: Record<string, string> = {
  makale: 'Makale',
  'vaka-analizi': 'Vaka Analizi',
  rapor: 'Rapor',
  'founder-letter': 'Founder Letter',
};

/** Inline Founder Letter CTA, portal-mounted after the 2nd content H2
 *  (istek.md v2 §PHASE 4). Anchors to the full capsule at the article foot. */
const FounderInlineCta: React.FC = () => (
  <aside
    data-testid="founder-inline-cta"
    className="not-prose my-8 rounded-xl border border-secondary/30 bg-secondary/5 p-5 flex items-start gap-4"
  >
    <span className="shrink-0 w-9 h-9 rounded-lg bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary">
      <PenLine size={16} aria-hidden="true" />
    </span>
    <span>
      <span className="block text-sm font-bold text-white mb-1">Founder Letter</span>
      <span className="block text-xs text-slate-400 leading-relaxed mb-2">
        Emre Can Yalçın'ın strateji, M&A ve liderlik üzerine haftalık notları — reklam yok, sadece
        içgörü.
      </span>
      <a href="#founder-letter" className="text-xs font-bold text-secondary hover:underline">
        Abone ol →
      </a>
    </span>
  </aside>
);

const BlogPostPage: React.FC = () => {
  const { language } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const [Content, setContent] = useState<React.ComponentType | null>(null);
  const [ctaHost, setCtaHost] = useState<HTMLElement | null>(null);
  const articleRef = useRef<HTMLElement>(null);

  const post = (blogPosts as BlogPost[]).find((p) => p.slug === slug);

  useEffect(() => {
    if (slug) {
      // Dynamic import of MDX file
      import(`../content/blog/${slug}.mdx`)
        .then((module) => {
          setContent(() => module.default);
        })
        .catch(() => {
          // MDX file may not exist for generated/legacy blog posts — graceful fallback
          setContent(null);
        });
    }
  }, [slug]);

  // Founder CTA after the 2nd content H2. The MDX title is demoted to the
  // first h2 (P46 C5), so the 2nd *content* heading is h2[2] when present.
  useEffect(() => {
    if (!Content || !articleRef.current) return;
    const h2s = articleRef.current.querySelectorAll('[data-testid="article-body"] h2');
    const target = h2s[2] ?? h2s[1];
    if (!target) return;
    const host = document.createElement('div');
    target.insertAdjacentElement('afterend', host);
    setCtaHost(host);
    return () => {
      host.remove();
      setCtaHost(null);
    };
  }, [Content, slug]);

  // Not in the static MDX index → try the published-posts API (NotebookLM
  // pipeline content lives only in the DB). Static slugs always win; the DB
  // page owns its own loading/404 states so there is no 404 flash here.
  if (!post) {
    return <PublishedPostPage slug={slug ?? ''} />;
  }

  const categoryDef = post.category ? CATEGORY_BY_LABEL[post.category] : undefined;
  const related = relatedItems(post.slug);
  const siblings = post.seriesId ? seriesSiblings(post.seriesId) : [];
  const seriesIndex = siblings.findIndex((s) => s.slug === post.slug);
  const prevInSeries = seriesIndex > 0 ? siblings[seriesIndex - 1] : undefined;
  const nextInSeries =
    seriesIndex >= 0 && seriesIndex < siblings.length - 1 ? siblings[seriesIndex + 1] : undefined;

  return (
    <div className="min-h-screen bg-neutral text-slate-300 font-sans">
      <ScrollProgressBar />
      <Helmet>
        <title>{post.title} | eCyPro Perspektifler</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={buildCanonical(`/perspektifler/${post.slug}`, language)} />
        <meta property="og:title" content={`${post.title} | eCyPro Perspektifler`} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={buildCanonical(`/perspektifler/${post.slug}`, language)} />
        <meta property="og:image" content={post.coverImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${post.title} | eCyPro Perspektifler`} />
        <meta name="twitter:description" content={post.excerpt} />
        <meta name="twitter:image" content={post.coverImage} />
        <meta property="article:published_time" content={post.date} />
        <meta property="article:author" content={post.author} />
      </Helmet>

      <JsonLd
        data={buildArticleSchema({
          url: `https://www.ecypro.com/perspektifler/${post.slug}`,
          title: post.title,
          description: post.excerpt,
          image: post.coverImage,
          publishedAt: new Date(post.date).toISOString(),
          author: post.author,
          category: post.category,
        })}
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Anasayfa', url: 'https://www.ecypro.com/' },
          { name: 'Perspektifler', url: 'https://www.ecypro.com/perspektifler' },
          ...(categoryDef
            ? [
                {
                  name: categoryDef.label,
                  url: `https://www.ecypro.com/perspektifler/kategori/${categoryDef.slug}`,
                },
              ]
            : []),
          { name: post.title, url: `https://www.ecypro.com/perspektifler/${post.slug}` },
        ])}
      />

      <Navbar />

      <div className="pt-32 pb-24 relative">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex gap-12 relative items-start">
            {/* Main article column */}
            <div className="flex-1 min-w-0 max-w-4xl">
              {/* Visible breadcrumb Hub → Category → Article (istek.md v2 §PHASE 4) */}
              <nav aria-label="breadcrumb" data-testid="article-breadcrumb" className="mb-8">
                <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  <li>
                    <Link to="/perspektifler" className="hover:text-white transition-colors">
                      Perspektifler
                    </Link>
                  </li>
                  {categoryDef && (
                    <li className="flex items-center gap-1.5">
                      <ChevronRight size={12} aria-hidden="true" />
                      <Link
                        to={`/perspektifler/kategori/${categoryDef.slug}`}
                        className="hover:text-white transition-colors"
                      >
                        {categoryDef.label}
                      </Link>
                    </li>
                  )}
                  <li className="flex items-center gap-1.5 min-w-0">
                    <ChevronRight size={12} aria-hidden="true" />
                    <span className="text-slate-300 truncate max-w-64" aria-current="page">
                      {post.title}
                    </span>
                  </li>
                </ol>
              </nav>

              <motion.article
                ref={articleRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                data-testid="blog-article"
              >
                {/* Header */}
                <header data-testid="article-hero" className="mb-12 text-center">
                  <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400 mb-6">
                    {post.category && (
                      <Link
                        to={
                          categoryDef
                            ? `/perspektifler/kategori/${categoryDef.slug}`
                            : '/perspektifler'
                        }
                        className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full uppercase tracking-wider text-xs font-bold hover:bg-blue-500/20 transition-colors"
                      >
                        {post.category}
                      </Link>
                    )}
                    {post.format && (
                      <span className="border border-white/15 bg-white/5 text-slate-300 px-3 py-1 rounded-full uppercase tracking-wider text-xs font-bold">
                        {FORMAT_LABEL[post.format] ?? post.format}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />{' '}
                      {new Date(post.date).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> {post.readingTime}
                    </span>
                    <span className="text-slate-500">·</span>
                    <span>{post.author}</span>
                  </div>

                  <h1 className="text-3xl md:text-5xl font-serif text-white leading-tight mb-8">
                    {post.title}
                  </h1>

                  <div className="relative h-100 w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      width={1600}
                      height={900}
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-[#050810] via-transparent to-transparent opacity-60" />
                  </div>
                </header>

                {/* Sprint 4 — NotebookLM Audio Overview (frontmatter-driven).
                    Renders only when post.audioUrl is set; brand-aligned native
                    audio + JSON-LD AudioObject. JsonLd schema for the article
                    itself already lives elsewhere; AudioObject is rendered
                    inline by the component when canonicalUrl is supplied. */}
                {post.audioUrl && (
                  <div className="max-w-3xl mx-auto mt-8 mb-12">
                    <AudioOverview
                      audioUrl={post.audioUrl}
                      title={post.title}
                      durationSec={post.audioDurationSec}
                      description={post.audioDescription}
                      publishedAt={post.date}
                      canonicalUrl={`https://www.ecypro.com/perspektifler/${post.slug}`}
                    />
                  </div>
                )}

                {/* MDX Content — P46 C5: MDXProvider components mapping ile MDX'in
                    ilk H1'i (markdown # Title) H2'ye demote ediliyor. Önce 2 H1
                    vardı (BlogPostPage h1 + MDX h1 = SEO ihlali); şimdi 1 H1. */}
                <div
                  data-testid="article-body"
                  className="prose prose-lg prose-invert mx-auto prose-headings:font-serif prose-headings:text-white prose-a:text-blue-400 prose-img:rounded-xl prose-img:border prose-img:border-white/10 prose-blockquote:border-l-blue-500 prose-blockquote:bg-white/5 prose-blockquote:p-4 prose-blockquote:rounded-r-lg"
                >
                  {Content ? (
                    <MDXProvider components={MDX_COMPONENTS}>
                      <Content />
                    </MDXProvider>
                  ) : (
                    <div className="text-center py-20">Yükleniyor...</div>
                  )}
                </div>

                {/* Series prev/next (rendered only when series_id is set) */}
                {(prevInSeries || nextInSeries) && (
                  <nav
                    aria-label="Seri navigasyonu"
                    className="mt-12 grid grid-cols-2 gap-4 text-sm"
                  >
                    {prevInSeries ? (
                      <Link
                        to={prevInSeries.href}
                        className="rounded-xl border border-white/10 bg-white/5 p-4 hover:border-white/25 transition-colors"
                      >
                        <span className="block text-xs text-slate-500 mb-1">← Önceki bölüm</span>
                        <span className="text-slate-200">{prevInSeries.title}</span>
                      </Link>
                    ) : (
                      <span />
                    )}
                    {nextInSeries && (
                      <Link
                        to={nextInSeries.href}
                        className="rounded-xl border border-white/10 bg-white/5 p-4 text-right hover:border-white/25 transition-colors"
                      >
                        <span className="block text-xs text-slate-500 mb-1">Sonraki bölüm →</span>
                        <span className="text-slate-200">{nextInSeries.title}</span>
                      </Link>
                    )}
                  </nav>
                )}

                <div className="mt-16 pt-8 border-t border-white/10 space-y-8">
                  <div className="flex justify-between items-center">
                    <ShareButtons
                      url={`https://www.ecypro.com/perspektifler/${post.slug}`}
                      title={post.title}
                    />
                  </div>
                  <AuthorBio author={post.author} />
                  <div id="founder-letter" className="max-w-2xl">
                    <NewsletterSidebar />
                  </div>
                  <RelatedArticles
                    posts={related.map((r) => ({
                      slug: r.slug,
                      title: r.title,
                      excerpt: r.excerpt,
                      date: r.date,
                      author: r.author,
                      coverImage: r.coverImage ?? '/images/blog-default.jpg',
                      category: r.category,
                      tags: r.tags,
                      readingTime: r.readingTime,
                    }))}
                  />
                </div>
              </motion.article>
              {post && <VoicePlayer content={`${post.title}. ${post.excerpt}`} />}
              {ctaHost && createPortal(<FounderInlineCta />, ctaHost)}
            </div>

            {/* Sticky TOC — desktop only */}
            <StickyTableOfContents contentRef={articleRef} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BlogPostPage;
