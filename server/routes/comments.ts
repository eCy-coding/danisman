// Register: app.use('/api/v1', commentsRouter)
// Public: POST /api/v1/insights/posts/:postId/comments
//         GET  /api/v1/insights/posts/:postId/comments

import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { prisma } from '../config/db';
import { logger } from '../config/logger';
import { rateLimitComments } from '../middleware/rateLimitComments';
import { createCommentSchema } from '../schemas/comments.zod';
import { isSpam } from '../services/spamFilter';
import { CommentStatus } from '@prisma/client';

const router = Router();

const COMMENTS_PAGE_SIZE = 20;

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

// ─── POST — submit comment ────────────────────────────────────────────────────

router.post(
  '/insights/posts/:postId/comments',
  rateLimitComments,
  async (req: Request, res: Response): Promise<void> => {
    const postId = req.params.postId as string;

    const parsed = createCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: 'error',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { authorName, authorEmail, bodyMd, parentId } = parsed.data;

    const post = await prisma.blogPost.findUnique({
      where: { id: postId, status: 'PUBLISHED' },
      select: { id: true },
    });
    if (!post) {
      res.status(404).json({ status: 'error', message: 'Makale bulunamadı' });
      return;
    }

    // Validate parentId if provided (max 1 level deep = parent must be top-level)
    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { parentId: true },
      });
      if (!parent) {
        res.status(400).json({ status: 'error', message: 'Yanıtlanan yorum bulunamadı' });
        return;
      }
      if (parent.parentId) {
        res
          .status(400)
          .json({ status: 'error', message: 'Yanıt derinliği en fazla 2 seviye olabilir' });
        return;
      }
    }

    const rawIp = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const ipHash = hashIp(rawIp);
    const spamDetected = isSpam(bodyMd);
    const status: CommentStatus = spamDetected ? 'SPAM' : 'PENDING';

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorName,
        authorEmail,
        bodyMd,
        parentId: parentId ?? null,
        ipHash,
        status,
      },
      select: { id: true, status: true, createdAt: true },
    });

    if (status === 'PENDING') {
      await prisma.blogPost.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      });
    }

    logger.info('[comments] New comment submitted', { postId, status, spam: spamDetected });

    res.status(201).json({ status: 'ok', data: comment });
  },
);

// ─── GET — list approved comments ────────────────────────────────────────────

router.get(
  '/insights/posts/:postId/comments',
  async (req: Request, res: Response): Promise<void> => {
    const { postId } = req.params;
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(50, parseInt(String(req.query.limit ?? String(COMMENTS_PAGE_SIZE)), 10));
    const offset = (page - 1) * limit;

    const [total, comments] = await Promise.all([
      prisma.comment.count({ where: { postId, status: 'APPROVED', parentId: null } }),
      prisma.comment.findMany({
        where: { postId, status: 'APPROVED', parentId: null },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          authorName: true,
          bodyMd: true,
          createdAt: true,
          replies: {
            where: { status: 'APPROVED' },
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              authorName: true,
              bodyMd: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    res.json({ status: 'ok', data: { comments, total, page, limit } });
  },
);

export default router;
