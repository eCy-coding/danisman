/**
 * P34-T10: Lead Scoring Routes
 *
 * POST /api/leads/score    → compute score for given interactions + email
 * GET  /api/leads/:id/score → recompute score for a specific contact by DB interactions
 *
 * Used by:
 *   - Admin contacts page to display tier badge (A/B/C)
 *   - Webhook handlers to auto-tag incoming contacts
 *   - Scheduled job (weekly rescore) — see scripts/rescore-leads.ts
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authenticate, requireRole } from '../middleware/auth';
import { HttpError } from '../middleware/error';
import {
  computeLeadScore,
  classifyLead,
  BEHAVIORAL_WEIGHTS,
  type InteractionRecord,
} from '../lib/lead-scoring';

const router = Router();

// ─── POST /api/leads/score — compute from payload ─────────

router.post(
  '/score',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, interactions, lastActivityAt } = req.body as {
        email: string;
        interactions: InteractionRecord[];
        lastActivityAt?: string;
      };

      if (!email || typeof email !== 'string') {
        throw new HttpError(400, 'INVALID_EMAIL', 'email is required');
      }
      if (!Array.isArray(interactions)) {
        throw new HttpError(400, 'INVALID_INTERACTIONS', 'interactions must be an array');
      }

      // Validate each interaction type
      const unknownTypes = interactions.filter((i) => !(i.type in BEHAVIORAL_WEIGHTS));
      if (unknownTypes.length > 0) {
        // Non-fatal: unknown types score 0, just warn
      }

      const lastAt = lastActivityAt ? new Date(lastActivityAt) : undefined;
      const result = computeLeadScore(interactions, email, lastAt);

      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/leads/:contactId/score — recompute from DB ──

router.get(
  '/:contactId/score',
  authenticate,
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { contactId } = req.params;

      const contact = await prisma.contactSubmission.findUnique({
        where: { id: contactId },
        select: { id: true, email: true, createdAt: true },
      });
      if (!contact) throw new HttpError(404, 'CONTACT_NOT_FOUND', 'Contact not found');

      // Fetch all analytics events associated with this email
      const analyticsRows = await (
        prisma as unknown as {
          analytics: {
            groupBy: (
              args: object,
            ) => Promise<{ interactionType: string; _count: { id: number } }[]>;
          };
        }
      ).analytics
        .groupBy({
          by: ['interactionType'],
          where: {},
          _count: { id: true },
        })
        .catch(() => [] as { interactionType: string; _count: { id: number } }[]);

      const interactions: InteractionRecord[] = analyticsRows.map((r) => ({
        type: r.interactionType,
        count: r._count.id,
      }));

      const result = computeLeadScore(interactions, contact.email, contact.createdAt);
      const { tier, label, color } = classifyLead(result.totalScore);

      res.json({
        status: 'success',
        data: {
          contactId: contact.id,
          email: contact.email,
          score: result,
          classification: { tier, label, color },
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/leads/weights — expose scoring weights (admin) ─

router.get('/weights', authenticate, requireRole('ADMIN'), (_req: Request, res: Response): void => {
  res.json({ status: 'success', data: BEHAVIORAL_WEIGHTS });
});

export default router;
