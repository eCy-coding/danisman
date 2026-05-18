/**
 * P61.C — Vercel revalidate webhook (admin → public site cache invalidate).
 *
 * Frontend Vite SPA olduğu için klasik Next.js ISR yok. Bunun yerine:
 *   1) Admin write işlemi sonrası SSE event yayınlanır → admin UI anlık güncellenir.
 *   2) Public site SWR/react-query cache invalidate için bir broadcast endpoint
 *      tutulur — admin paneli `POST /api/admin/revalidate` ile path listesi
 *      yayınlar; bu admin SSE channel'ına `revalidate` event'i olarak düşer
 *      (ileride public bir SSE eklenirse o channel'a da).
 *
 * Auth: JWT + ADMIN.
 * Body: `{ paths: string[] }`
 * Yanıt: 204.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { adminEventBus } from '../lib/event-bus';
import { logger } from '../config/logger';

const router = Router();
const schema = z.object({
  paths: z.array(z.string().min(1).max(200)).min(1).max(50),
  reason: z.string().max(200).optional(),
});

router.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req.body);
      adminEventBus.publish('audit.action', {
        action: 'revalidate',
        paths: data.paths,
        reason: data.reason ?? null,
      });
      logger.info('[admin-revalidate] broadcast', { paths: data.paths });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

export default router;
