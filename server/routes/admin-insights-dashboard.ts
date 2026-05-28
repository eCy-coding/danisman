// Register: app.use('/api/v1/admin', adminInsightsDashboardRouter)
// GET /api/v1/admin/insights/dashboard/stats  (EDITOR | ADMIN)

import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/require-permission';
import { redis } from '../config/redis';
import { CACHE_TTL } from '../../src/lib/insights/cacheKeys';
import { logger } from '../config/logger';

const router = Router();
const STATS_CACHE_KEY = 'insights:admin:dashboard:stats';

router.use(authenticate);

router.get(
  '/insights/dashboard/stats',
  requirePermission('insights.dashboard.read'),
  async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const cached = await redis.get(STATS_CACHE_KEY);
      if (cached) {
        res.json({ status: 'ok', data: JSON.parse(cached), fromCache: true });
        return;
      }
    } catch {
      // Redis unavailable — proceed to DB
    }

    const scheduledFrom = new Date();
    const scheduledTo = new Date();
    scheduledTo.setDate(scheduledTo.getDate() + 30);

    const [
      pipelineCounts,
      topPosts,
      recentPosts,
      tagGaps,
      seoIssues,
      commentQueue,
      publishCalendar,
    ] = await Promise.all([
      // Pipeline counts by status
      prisma.blogPost.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),

      // Top 50 by viewCount
      prisma.blogPost.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { viewCount: 'desc' },
        take: 50,
        select: {
          id: true,
          slug: true,
          titleTr: true,
          viewCount: true,
          avgScrollDepth: true,
          commentCount: true,
        },
      }),

      // Recent 10
      prisma.blogPost.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          slug: true,
          titleTr: true,
          status: true,
          publishedAt: true,
          updatedAt: true,
        },
      }),

      // Tags with < 5 articles
      prisma.tag
        .findMany({
          select: {
            id: true,
            slug: true,
            labelTr: true,
            axis: true,
            _count: { select: { posts: true } },
          },
        })
        .then((tags) => tags.filter((t) => t._count.posts < 5)),

      // SEO issues — missing meta title or desc
      prisma.blogPost
        .findMany({
          where: {
            status: 'PUBLISHED',
            OR: [
              { metaTitleTr: null },
              { metaDescTr: null },
              { metaTitleTr: '' },
              { metaDescTr: '' },
            ],
          },
          select: { id: true, slug: true, titleTr: true, metaTitleTr: true, metaDescTr: true },
          take: 100,
        })
        .then((posts) =>
          posts.map((p) => ({
            id: p.id,
            slug: p.slug,
            titleTr: p.titleTr,
            issue: !p.metaTitleTr
              ? 'Meta başlık eksik'
              : !p.metaDescTr
                ? 'Meta açıklama eksik'
                : 'SEO sorunu',
          })),
        ),

      // Pending comments
      prisma.comment.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          authorName: true,
          bodyMd: true,
          createdAt: true,
          post: { select: { slug: true, titleTr: true } },
        },
      }),

      // Scheduled posts next 30 days
      prisma.blogPost.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: { gte: scheduledFrom, lte: scheduledTo },
        },
        orderBy: { scheduledAt: 'asc' },
        select: { id: true, slug: true, titleTr: true, scheduledAt: true },
      }),
    ]);

    // Build pipeline map
    const statuses = [
      'DRAFT',
      'IN_REVIEW',
      'COPY_EDIT',
      'SEO_REVIEW',
      'LEGAL_REVIEW',
      'SCHEDULED',
      'PUBLISHED',
      'ARCHIVED',
    ] as const;
    const pipeline: Record<string, number> = {};
    for (const s of statuses) {
      pipeline[s] = pipelineCounts.find((c) => c.status === s)?._count._all ?? 0;
    }

    const stats = {
      pipeline,
      topPosts,
      recentPosts,
      tagGaps: tagGaps.map((t) => ({
        slug: t.slug,
        labelTr: t.labelTr,
        axis: t.axis,
        postCount: t._count.posts,
      })),
      seoIssues,
      commentQueue,
      publishCalendar,
    };

    try {
      await redis.set(STATS_CACHE_KEY, JSON.stringify(stats), 'EX', CACHE_TTL.DASHBOARD);
    } catch {
      logger.warn('[admin-insights-dashboard] Redis cache write failed');
    }

    res.json({ status: 'ok', data: stats });
  },
);

export default router;
