/**
 * P44-T07 Round-4 — Admin Succession Planning API (read-only stub).
 *
 * Lights up the previously orphan `AdminSuccessionPage.tsx`. The frontend
 * calls `/api/admin/succession-roadmaps` (not `/admin/succession/roadmaps`)
 * so we mount this router directly under `/admin` and expose the
 * `/succession-roadmaps` path explicitly here to match.
 *
 * Endpoints (mounted at `/api/admin`):
 *   GET /succession-roadmaps   — list roadmaps with their milestones and
 *                                KPIs, ordered by client estimatedYear.
 *
 * Auth: JWT + ADMIN role.
 */
import { Router, type Response } from 'express';
import { prisma } from '../config/db';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth';
import { logger } from '../config/logger';

const router = Router();
const adminOnly = [authenticate, requireRole('ADMIN')] as const;

router.get('/succession-roadmaps', ...adminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    const roadmaps = await prisma.successionRoadmap.findMany({
      orderBy: [
        // Nulls last → roadmaps with a target year first; planning still TBD
        // surface at the bottom so they don't crowd the actionable items.
        { estimatedYear: { sort: 'asc', nulls: 'last' } },
      ],
      include: {
        client: { select: { id: true, name: true } },
        milestones: { orderBy: { expectedDate: 'asc' } },
        kpis: { orderBy: { metric: 'asc' } },
      },
    });
    res.json({ status: 'ok', data: roadmaps });
  } catch (err) {
    logger.error('[admin-succession] roadmaps error', { err });
    res.status(500).json({ status: 'error', message: 'Failed to load succession roadmaps' });
  }
});

export default router;
