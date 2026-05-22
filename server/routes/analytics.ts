import { Router } from 'express';
import {
  trackPageView,
  trackInteraction,
  submitContact,
  getDashboardSummary,
} from '../controllers/analyticsController';
import { authenticate, requireRole } from '../middleware/auth';
import { contactLimiter } from '../middleware/rateLimiter';
import { clientErrorEndpoint, getRecentErrors, getErrorStats } from '../middleware/sentry';

const router = Router();

// Public tracking endpoints (no auth required — fire-and-forget from client)
router.post('/pageview', trackPageView);
router.post('/interaction', trackInteraction);
router.post('/contact', contactLimiter, submitContact);

// Client error reporting (public — used by frontend Sentry stub)
router.post('/error', clientErrorEndpoint());

// Dashboard summary — admin/consultant only
router.get('/dashboard', authenticate, requireRole('ADMIN'), getDashboardSummary);

// Error monitoring — admin only
router.get('/errors', authenticate, requireRole('ADMIN'), getRecentErrors());
router.get('/errors/stats', authenticate, requireRole('ADMIN'), getErrorStats());

export default router;
