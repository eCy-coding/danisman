import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MDXProvider } from '@mdx-js/react';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
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

const blogPosts = getBlogPosts();

const BlogPostPage: React.FC = () => {
  const { language } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const [Content, setContent] = useState<React.ComponentType | null>(null);
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

  if (!post) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-3xl font-serif mb-4">Makele Bulunamadı</h1>
          <Link to="/perspektifler" className="text-blue-400 hover:text-blue-300">
            Blog'a Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral text-slate-300 font-sans">
      <ScrollProgressBar />
      <Helmet>
        <title>{post.title} | eCyPro Blog</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={buildCanonical(`/blog/${post.slug}`, language)} />
        <meta property="og:title" content={`${post.title} | eCyPro Blog`} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={buildCanonical(`/blog/${post.slug}`, language)} />
        <meta property="og:image" content={post.coverImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${post.title} | eCyPro Blog`} />
        <meta name="twitter:description" content={post.excerpt} />
        <meta name="twitter:image" content={post.coverImage} />
        <meta property="article:published_time" content={post.date} />
        <meta property="article:author" content={post.author} />
      </Helmet>

      <JsonLd
        data={buildArticleSchema({
          url: `https://ecypro.com/blog/${post.slug}`,
          title: post.title,
          description: post.excerpt,
          image: post.coverImage,
          publishedAt: new Date(post.date).toISOString(),
          author: post.author,
          category: post.tags?.[0],
        })}
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Anasayfa', url: 'https://ecypro.com/' },
          { name: 'Blog', url: 'https://ecypro.com/blog' },
          { name: post.title, url: `https://ecypro.com/blog/${post.slug}` },
        ])}
      />

      <Navbar />

      <div className="pt-32 pb-24 relative">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex gap-12 relative items-start">
            {/* Main article column */}
            <div className="flex-1 min-w-0 max-w-4xl">
              <Link
                to="/perspektifler"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Tüm Yazılar
              </Link>

              <motion.article
                ref={articleRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                data-testid="blog-article"
              >
                {/* Header */}
                <header data-testid="article-hero" className="mb-12 text-center">
                  <div className="flex items-center justify-center gap-4 text-sm text-slate-400 mb-6">
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full uppercase tracking-wider text-xs font-bold">
                      {post.tags[0]}
                    </span>
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
                      canonicalUrl={`https://ecypro.com/blog/${post.slug}`}
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

                <div className="mt-16 pt-8 border-t border-white/10 space-y-8">
                  <div className="flex justify-between items-center">
                    <ShareButtons url={`https://ecypro.com/blog/${post.slug}`} title={post.title} />
                  </div>
                  <AuthorBio author={post.author} />
                  <RelatedArticles
                    posts={(blogPosts as BlogPost[]).filter(
                      (p) =>
                        p.slug !== post.slug &&
                        (p.tags.some((t) => post.tags.includes(t)) || p.category === post.category),
                    )}
                  />
                </div>
              </motion.article>
              {post && <VoicePlayer content={`${post.title}. ${post.excerpt}`} />}
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
