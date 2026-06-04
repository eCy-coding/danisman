/**
 * P44-T07 Round-4 — Admin ESG/ESRS API (read-only stubs).
 *
 * The `AdminESGPage.tsx` was previously orphaned: full UI + Prisma models
 * (ESGDatapoint, ESGAssessment) existed but no backend route, so the page
 * 404'd on data fetch and silently rendered an empty pillar matrix. This
 * file lights up the read paths so the page actually shows the seeded ESRS
 * datapoint catalogue once it's been populated.
 *
 * Endpoints (mounted at `/api/admin/esg`):
 *   GET /datapoints   — list ESRS datapoint catalogue, ordered by pillar→code
 *   GET /assessments  — list ESG assessments per client
 *
 * Auth: JWT + ADMIN role. No write paths exposed yet — seeding the catalogue
 * is a separate admin tool / migration.
 */
import { Router, type Response } from 'express';
import { prisma } from '../config/db';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth';
import { logger } from '../config/logger';

const router = Router();
const adminOnly = [authenticate, requireRole('ADMIN')] as const;

router.get('/datapoints', ...adminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    const datapoints = await prisma.eSGDatapoint.findMany({
      orderBy: [{ pillar: 'asc' }, { esrsCode: 'asc' }],
    });
    res.json({ status: 'ok', data: datapoints });
  } catch (err) {
    logger.error('[admin-esg] datapoints error', { err });
    res.status(500).json({ status: 'error', message: 'Failed to load ESG datapoints' });
  }
});

router.get('/assessments', ...adminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    const assessments = await prisma.eSGAssessment.findMany({
      orderBy: { startedAt: 'desc' },
      include: { client: { select: { id: true, name: true } } },
    });
    res.json({ status: 'ok', data: assessments });
  } catch (err) {
    logger.error('[admin-esg] assessments error', { err });
    res.status(500).json({ status: 'error', message: 'Failed to load ESG assessments' });
  }
});

export default router;
