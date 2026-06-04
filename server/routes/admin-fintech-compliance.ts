/**
 * P44-T07 Round-4 — Admin Fintech Compliance API (read-only stub).
 *
 * Lights up the previously orphan `AdminFintechCompliancePage.tsx`. Prisma
 * model `FintechComplianceItem` already covers Regulator + status + risk
 * score + due dates, so the page can render the matrix as soon as items
 * exist in the DB.
 *
 * Endpoints (mounted at `/api/admin/fintech`):
 *   GET /compliance   — list compliance items, joined with client for the
 *                       roll-up view. Ordered by due date ascending so the
 *                       most-overdue items surface first.
 *
 * Auth: JWT + ADMIN role.
 */
import { Router, type Response } from 'express';
import { prisma } from '../config/db';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth';
import { logger } from '../config/logger';

const router = Router();
const adminOnly = [authenticate, requireRole('ADMIN')] as const;

router.get('/compliance', ...adminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    const items = await prisma.fintechComplianceItem.findMany({
      orderBy: [
        // Nulls last → items with explicit due dates first, undated last.
        { dueDate: { sort: 'asc', nulls: 'last' } },
        { riskScore: 'desc' },
      ],
      include: { client: { select: { id: true, name: true } } },
    });
    res.json({ status: 'ok', data: items });
  } catch (err) {
    logger.error('[admin-fintech] compliance error', { err });
    res.status(500).json({ status: 'error', message: 'Failed to load fintech compliance' });
  }
});

export default router;
