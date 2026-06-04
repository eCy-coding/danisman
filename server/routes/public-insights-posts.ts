/**
 * R12-P6 — Public Insights post-fetch endpoint.
 *
 * The admin pipeline writes BlogPosts to Neon (DRAFT → … → PUBLISHED). The
 * public side previously read from a hard-coded mock (`insights-article-mock`).
 * This router exposes a slug-keyed GET so the public InsightArticle page can
 * render real published content — completing the "create → publish → see-on-
 * site" loop entirely inside the eCyPro app.
 *
 * Surface:
 *   GET /api/v1/insights/posts/:slug      → single article (PUBLISHED only)
 *   GET /api/v1/insights/posts            → recent published list (limit 20)
 *
 * KVKK note: this is anonymous read traffic. No PII is logged beyond IP, and
 * IPs are already hashed elsewhere via Sentry/PostHog stripping middleware.
 */

import { Router, type Request, type Response } from 'express';
import { prisma } from '../config/db';
import { logger } from '../config/logger';

export const publicInsightsPostsRouter = Router();

// GET /api/v1/insights/posts — recent PUBLISHED list (homepage feed fallback)
publicInsightsPostsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const limit = Math.min(Number.parseInt((req.query.limit as string) ?? '20', 10) || 20, 50);
  const posts = await prisma.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    include: { author: { select: { displayName: true, slug: true, avatarUrl: true } } },
  });
  res.json({ data: posts, meta: { count: posts.length } });
});

// GET /api/v1/insights/posts/:slug — single PUBLISHED article
publicInsightsPostsRouter.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params;
  const post = await prisma.blogPost.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: {
      author: { select: { displayName: true, slug: true, avatarUrl: true, bioTr: true } },
      tags: true,
    },
  });
  if (!post) {
    res.status(404).json({ error: 'Yazı bulunamadı', slug });
    return;
  }

  // Fire-and-forget view counter. Don't block the response on this write.
  prisma.blogPost
    .update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } })
    .catch((err) =>
      logger.warn('view counter increment failed', {
        postId: post.id,
        err: err instanceof Error ? err.message : String(err),
      }),
    );

  res.json({ data: post });
});
