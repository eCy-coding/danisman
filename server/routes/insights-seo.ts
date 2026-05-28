// Wave-3A: Insights SEO sitemap management endpoints.
// Stub implementation — Wave-1 DB integration adds real post counts + regen logic.
import { Router, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/v1/insights-seo/sitemap-status — check sitemap freshness
router.get('/sitemap-status', (async (_req, res) => {
  res.json({
    lastGenerated: new Date().toISOString(),
    status: 'ok',
    chunks: 1,
    totalUrls: 7, // static insights routes count
  });
}) as RequestHandler);

// POST /api/v1/insights-seo/regenerate-sitemap — trigger nightly regen (admin only)
// When Wave-1 is ready, replace stub with actual DB query + sitemap script execution.
router.post(
  '/regenerate-sitemap',
  authenticate as RequestHandler,
  (async (_req, res) => {
    res.json({ status: 'triggered', message: 'Sitemap regeneration queued (stub)' });
  }) as RequestHandler,
);

export default router;
