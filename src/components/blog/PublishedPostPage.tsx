import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock } from 'lucide-react';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ScrollProgressBar } from '../ui/ScrollProgressBar';
import { JsonLd } from '../seo/JsonLd';
import { ShareButtons } from './ShareButtons';
import { NewsletterSidebar } from './NewsletterSidebar';
import { apiClient } from '../../lib/api';
import { buildArticleSchema, buildBreadcrumbSchema } from '../../lib/structured-data';
import { buildCanonical } from '@/i18n/canonical';
import { useTranslation } from '@/lib/i18n';

// Markdown renderer stays in the lazy `markdown` chunk — static-MDX visitors
// never pay for it.
const MarkdownArticle = React.lazy(() => import('./MarkdownArticle'));

/** Shape served by GET /api/v1/insights/posts/:slug (PUBLISHED only). */
interface PublishedPost {
  slug: string;
  titleTr: string;
  excerptTr: string;
  bodyTrMdx: string;
  coverImageUrl: string;
  coverImageAlt: string;
  ogImageUrl: string | null;
  metaTitleTr: string | null;
  metaDescTr: string | null;
  publishedAt: string;
  readingTimeMin: number;
  author?: { displayName: string; slug: string; avatarUrl: string | null };
}

const NotFound: React.FC = () => (
  <div className="min-h-screen bg-neutral flex items-center justify-center text-white">
    <div className="text-center">
      <h1 className="text-3xl font-serif mb-4">Makele Bulunamadı</h1>
      <Link to="/perspektifler" className="text-blue-400 hover:text-blue-300">
        Blog'a Dön
      </Link>
    </div>
  </div>
);

/**
 * DB-backed article page: renders posts that exist only in the admin
 * pipeline (NotebookLM research → editorial approval → PUBLISHED). Mounted
 * by BlogPostPage when the slug is not in the static MDX index — the static
 * path stays untouched and always wins on slug collisions.
 */
const PublishedPostPage: React.FC<{ slug: string }> = ({ slug }) => {
  const { language } = useTranslation();
  const {
    data: post,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['public-post', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/insights/posts/${slug}`);
      return (res as { data: { data: PublishedPost } }).data.data;
    },
    retry: false,
    staleTime: 5 * 60_000,
  });

  if (isPending) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center text-slate-400">
        Yükleniyor…
      </div>
    );
  }
  if (isError || !post) return <NotFound />;

  const title = post.metaTitleTr ?? post.titleTr;
  const description = post.metaDescTr ?? post.excerptTr;
  const canonical = buildCanonical(`/perspektifler/${post.slug}`, language);
  const image = post.ogImageUrl ?? post.coverImageUrl;
  const authorName = post.author?.displayName ?? 'eCyPro';

  return (
    <div className="min-h-screen bg-neutral text-slate-300 font-sans">
      <ScrollProgressBar />
      <Helmet>
        <title>{`${title} | eCyPro Perspektifler`}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`${title} | eCyPro Perspektifler`} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="article:published_time" content={post.publishedAt} />
        <meta property="article:author" content={authorName} />
      </Helmet>
      <JsonLd
        data={buildArticleSchema({
          url: `https://www.ecypro.com/perspektifler/${post.slug}`,
          title: post.titleTr,
          description,
          image,
          publishedAt: new Date(post.publishedAt).toISOString(),
          author: authorName,
        })}
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Anasayfa', url: 'https://www.ecypro.com/' },
          { name: 'Perspektifler', url: 'https://www.ecypro.com/perspektifler' },
          { name: post.titleTr, url: `https://www.ecypro.com/perspektifler/${post.slug}` },
        ])}
      />

      <Navbar />

      <div className="pt-32 pb-24 relative">
        <div className="container mx-auto px-4 max-w-4xl">
          <article data-testid="published-article">
            <header data-testid="article-hero" className="mb-12 text-center">
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400 mb-6">
                <span className="border border-white/15 bg-white/5 text-slate-300 px-3 py-1 rounded-full uppercase tracking-wider text-xs font-bold">
                  Araştırma
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />{' '}
                  {new Date(post.publishedAt).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> {post.readingTimeMin} dk okuma
                </span>
                <span className="text-slate-500">·</span>
                <span>{authorName}</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-serif text-white leading-tight mb-8">
                {post.titleTr}
              </h1>

              <div className="relative h-100 w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <img
                  src={post.coverImageUrl}
                  alt={post.coverImageAlt}
                  width={1200}
                  height={630}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#050810] via-transparent to-transparent opacity-60" />
              </div>
            </header>

            <div
              data-testid="article-body"
              className="prose prose-lg prose-invert mx-auto prose-headings:font-serif prose-headings:text-white prose-a:text-blue-400 prose-img:rounded-xl prose-img:border prose-img:border-white/10 prose-blockquote:border-l-blue-500 prose-blockquote:bg-white/5 prose-blockquote:p-4 prose-blockquote:rounded-r-lg"
            >
              <Suspense fallback={<div className="text-center py-20">Yükleniyor…</div>}>
                <MarkdownArticle markdown={post.bodyTrMdx} />
              </Suspense>
            </div>

            <div className="mt-16 pt-8 border-t border-white/10 space-y-8">
              <ShareButtons
                url={`https://www.ecypro.com/perspektifler/${post.slug}`}
                title={post.titleTr}
              />
              <div id="founder-letter" className="max-w-2xl">
                <NewsletterSidebar />
              </div>
            </div>
          </article>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PublishedPostPage;
