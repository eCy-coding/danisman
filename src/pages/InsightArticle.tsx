import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useInsightArticle } from '@/hooks/useInsightArticle';
import { ReadingProgressBar } from '@/components/insights/article/ReadingProgressBar';
import { ArticleHero } from '@/components/insights/article/ArticleHero';
import { ShareRail } from '@/components/insights/article/ShareRail';
import { TableOfContents } from '@/components/insights/article/TableOfContents';
import { AuthorBio } from '@/components/insights/article/AuthorBio';
import { SeriesNavigator } from '@/components/insights/article/SeriesNavigator';
import { RelatedArticles } from '@/components/insights/article/RelatedArticles';
import { InlineCTABlocks } from '@/components/insights/article/InlineCTABlocks';
import { CommentsSection } from '@/components/insights/article/CommentsSection';
import { EndOfArticleRecommendations } from '@/components/insights/article/EndOfArticleRecommendations';
import type { TocHeading } from '@/components/insights/article/TableOfContents';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function extractHeadings(mdxBody: string): TocHeading[] {
  const regex = /^(#{2,3})\s+(.+)$/gm;
  const headings: TocHeading[] = [];
  let m = regex.exec(mdxBody);
  while (m !== null) {
    const hashes = m[1];
    const title = m[2];
    if (hashes && title) {
      const level = (hashes.length === 2 ? 2 : 3) as 2 | 3;
      headings.push({ id: slugify(title.trim()), text: title.trim(), level });
    }
    m = regex.exec(mdxBody);
  }
  return headings;
}

function lineToHtml(line: string): string {
  const h3m = /^### (.+)$/.exec(line);
  if (h3m && h3m[1]) {
    const t = h3m[1].trim();
    return (
      '<h3 id="' +
      slugify(t) +
      '" class="text-xl font-bold text-slate-800 mt-8 mb-4">' +
      t +
      '</h3>'
    );
  }
  const h2m = /^## (.+)$/.exec(line);
  if (h2m && h2m[1]) {
    const t = h2m[1].trim();
    return (
      '<h2 id="' +
      slugify(t) +
      '" class="text-2xl font-bold text-slate-900 mt-10 mb-5">' +
      t +
      '</h2>'
    );
  }
  if (/^- (.+)$/.test(line)) {
    const lim = /^- (.+)$/.exec(line);
    return '<li class="ml-4 list-disc">' + (lim ? lim[1] : '') + '</li>';
  }
  if (/^\d+\. (.+)$/.test(line)) {
    const olm = /^\d+\. (.+)$/.exec(line);
    return '<li class="ml-4 list-decimal">' + (olm ? olm[1] : '') + '</li>';
  }
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('<')) return line;
  if (/^<[A-Z]/.test(trimmed)) return '';
  const body = trimmed
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
  return '<p class="text-slate-700 leading-relaxed my-4">' + body + '</p>';
}

function simpleMdxToHtml(mdx: string): string {
  return mdx.split('\n').map(lineToHtml).join('\n').trim();
}

interface ArticleBodyProps {
  mdxBody: string;
}

function ArticleBody({ mdxBody }: ArticleBodyProps) {
  const html = useMemo(() => simpleMdxToHtml(mdxBody), [mdxBody]);
  return (
    <div
      className="article-body prose prose-lg max-w-none prose-headings:font-bold prose-a:text-amber-600"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function ArticleSkeleton() {
  return (
    <div className="animate-pulse" data-testid="article-skeleton">
      <div className="h-[480px] bg-slate-200 mb-8" />
      <div className="mx-auto max-w-4xl px-6 space-y-4">
        <div className="h-8 bg-slate-200 rounded w-3/4" />
        <div className="h-6 bg-slate-200 rounded w-full" />
        <div className="h-6 bg-slate-200 rounded w-5/6" />
        <div className="h-4 bg-slate-200 rounded w-1/4 mt-8" />
      </div>
    </div>
  );
}

export function InsightArticle() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = useInsightArticle(slug ?? '');

  const headings = useMemo(
    () => (post?.bodyTrMdx ? extractHeadings(post.bodyTrMdx) : []),
    [post?.bodyTrMdx],
  );

  if (isLoading) {
    return <ArticleSkeleton />;
  }

  if (error || !post) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        data-testid="article-not-found"
      >
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-800">Yazi bulunamadi</h1>
          <p className="text-slate-600">Bu yazi mevcut degil veya kaldirilmis olabilir.</p>
          <Link
            to="/insights"
            className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-800 font-medium"
          >
            Perspektif'e don
          </Link>
        </div>
      </div>
    );
  }

  const canonicalUrl = post.canonicalUrl ?? 'https://ecypro.com/insights/' + post.slug;
  const pageTitle = post.metaTitleTr ?? post.titleTr + ' | eCyPro Perspektif';
  const pageDesc = post.metaDescTr ?? post.excerptTr;
  const publishedAt = post.publishedAt ?? '';

  const schemaOrg = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.titleTr,
    description: post.excerptTr,
    image: post.ogImageUrl ?? post.coverImageUrl,
    datePublished: publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author.displayName,
      url: post.author.linkedinUrl ?? '',
    },
    publisher: {
      '@type': 'Organization',
      name: 'eCyPro Premium Consulting',
      url: 'https://ecypro.com',
    },
    mainEntityOfPage: canonicalUrl,
  });

  return (
    <div className="bg-white min-h-screen" data-testid="insight-article-page">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:image" content={post.ogImageUrl ?? post.coverImageUrl} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={publishedAt} />
        <meta property="article:author" content={post.author.displayName} />
        {post.noindex && <meta name="robots" content="noindex" />}
        <script type="application/ld+json">{schemaOrg}</script>
      </Helmet>

      <ReadingProgressBar />

      <ArticleHero post={post} />

      <ShareRail postId={post.id} postTitle={post.titleTr} readingTimeMin={post.readingTimeMin} />

      <div className="mx-auto max-w-7xl px-fib-6 py-fib-7">
        <div className="flex gap-fib-8">
          <div className="flex-1 min-w-0 max-w-4xl">
            {post.bodyTrMdx && <ArticleBody mdxBody={post.bodyTrMdx} />}

            <div className="mt-fib-8 space-y-fib-8">
              <InlineCTABlocks type="discovery" />

              {post.series && post.seriesOrder != null && (
                <SeriesNavigator
                  series={post.series}
                  currentOrder={post.seriesOrder}
                  totalParts={post.series.totalParts}
                />
              )}

              <AuthorBio author={post.author} />

              {post.manualRelated && post.manualRelated.length > 0 && (
                <RelatedArticles manual={post.manualRelated} algorithmic={[]} />
              )}

              <CommentsSection postId={post.id} commentCount={post.commentCount} />

              {post.manualRelated && post.manualRelated.length > 0 && (
                <EndOfArticleRecommendations
                  fromAuthor={post.manualRelated.slice(0, 3)}
                  trending={post.manualRelated.slice(0, 6)}
                />
              )}
            </div>
          </div>

          <aside className="hidden xl:block w-56 shrink-0">
            <TableOfContents headings={headings} />
          </aside>
        </div>
      </div>
    </div>
  );
}
