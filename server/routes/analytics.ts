import express, { Router } from 'express';
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

// navigator.sendBeacon(url, string) ships Content-Type: text/plain — the global
// express.json() only parses application/json, so beacon bodies (monitor.ts Web
// Vitals batches) arrived unparsed → req.body undefined → Zod 400 on every flush.
// Parsing text/plain as JSON here keeps the beacon a CORS simple request; a Blob
// application/json beacon would require a preflight sendBeacon cannot perform.
// Scoped to the public tracking POSTs only so authenticated routes in this
// router never silently accept text/plain bodies.
const beaconJson = express.json({ type: 'text/plain', limit: '100kb' });

// Public tracking endpoints (no auth required — fire-and-forget from client)
router.post('/pageview', beaconJson, trackPageView);
router.post('/interaction', beaconJson, trackInteraction);
router.post('/contact', contactLimiter, submitContact);

// Client error reporting (public — used by frontend Sentry stub)
router.post('/error', clientErrorEndpoint());

// Dashboard summary — admin/consultant only
router.get('/dashboard', authenticate, requireRole('ADMIN'), getDashboardSummary);

// Error monitoring — admin only
router.get('/errors', authenticate, requireRole('ADMIN'), getRecentErrors());
router.get('/errors/stats', authenticate, requireRole('ADMIN'), getErrorStats());

export default router;
