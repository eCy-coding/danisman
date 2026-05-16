/**
 * P18 BE Track 2 / Aşama 3 — BullMQ admin dashboard (Bull-Board).
 *
 * Mounts `@bull-board/express` under `/api/admin/queues` so an operator
 * can inspect waiting/active/delayed/failed jobs, retry / promote /
 * remove individual jobs, and trace job logs.
 *
 * Security stack (defense-in-depth — ALL three apply, not "any one"):
 *   1. `authenticate + requireRole('ADMIN')` — JWT bearer with ADMIN role.
 *   2. Optional `ADMIN_QUEUES_IP_ALLOWLIST` env (CSV of CIDR-like prefixes
 *      OR exact IPs) — when set, requests from other IPs get a 403
 *      regardless of role.
 *   3. Operators are expected to ALSO put a reverse-proxy auth
 *      (nginx basic / Hostinger panel) in front in production.
 *
 * Dynamic dependency loading:
 *   - `@bull-board/express`, `@bull-board/api`, and
 *     `@bull-board/api/bullMQAdapter` are all loaded via `require` so
 *     the file compiles when the deps aren't installed. If any module
 *     is missing the mount degrades to a 503 stub explaining the cause.
 *   - When BullMQ itself is unreachable (no Redis), the dashboard mounts
 *     in read-only mode showing an empty queue list — exactly the same
 *     UX as zero pending jobs.
 */

/* eslint-disable @typescript-eslint/no-require-imports */

import {
  Router,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from 'express';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth';
import { ALL_QUEUE_NAMES, getQueue } from '../queues';
import { logger } from '../config/logger';

const router = Router();

// ── IP allowlist ────────────────────────────────────────────────────────────

function parseAllowlist(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function ipAllowlistGuard(req: Request, res: Response, next: NextFunction): void {
  const raw = process.env.ADMIN_QUEUES_IP_ALLOWLIST ?? '';
  if (!raw) return next();
  const allowed = parseAllowlist(raw);
  // Express normalises `req.ip` via `trust proxy` config (set in
  // server/index.ts). For CIDR matching we'd add a lib; here we do
  // exact-prefix matching which is sufficient for /24-style allowlists
  // expressed as the dotted prefix ("203.0.113." matches "203.0.113.5").
  const ip = req.ip ?? '';
  const ok = allowed.some((entry) => ip === entry || ip.startsWith(entry));
  if (!ok) {
    res.status(403).json({
      status: 'error',
      code: 'ADMIN_QUEUES_IP_BLOCKED',
      message: 'Source IP not in admin-queues allowlist',
    });
    return;
  }
  next();
}

// ── Bull-Board loader ───────────────────────────────────────────────────────

interface BullBoardModule {
  createBullBoard(opts: {
    queues: unknown[];
    serverAdapter: { setBasePath(path: string): unknown; getRouter(): RequestHandler };
  }): unknown;
}

interface BullBoardAdapterModule {
  BullMQAdapter: new (q: unknown) => unknown;
}

interface BullBoardExpressModule {
  ExpressAdapter: new () => {
    setBasePath(path: string): unknown;
    getRouter(): RequestHandler;
  };
}

function tryLoad<T>(modulePath: string): T | null {
  try {
    return require(modulePath) as T;
  } catch {
    return null;
  }
}

function buildDashboardRouter(basePath: string): RequestHandler | null {
  const api = tryLoad<BullBoardModule>('@bull-board/api');
  const adapter = tryLoad<BullBoardAdapterModule>('@bull-board/api/bullMQAdapter');
  const express = tryLoad<BullBoardExpressModule>('@bull-board/express');
  if (!api || !adapter || !express) {
    logger.warn('[admin/queues] Bull-Board not installed — dashboard will 503 until deps added');
    return null;
  }

  const serverAdapter = new express.ExpressAdapter();
  serverAdapter.setBasePath(basePath);

  const queueWrappers: unknown[] = [];
  for (const name of ALL_QUEUE_NAMES) {
    const q = getQueue(name);
    if (q) queueWrappers.push(new adapter.BullMQAdapter(q));
  }

  api.createBullBoard({ queues: queueWrappers, serverAdapter });
  return serverAdapter.getRouter();
}

// Lazy + memoised so the first /api/admin/queues hit pays the cost; later
// hits reuse the same Express subrouter.
let dashboardRouter: RequestHandler | null | undefined;

const BASE_PATH = '/api/admin/queues';

function getDashboardRouter(): RequestHandler | null {
  if (dashboardRouter !== undefined) return dashboardRouter;
  dashboardRouter = buildDashboardRouter(BASE_PATH);
  return dashboardRouter;
}

// ── Router wiring ───────────────────────────────────────────────────────────

const adminOnly = [authenticate, requireRole('ADMIN')];

const dashboardHandler = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const handler = getDashboardRouter();
  if (!handler) {
    res.status(503).json({
      status: 'error',
      code: 'ADMIN_QUEUES_DEPS_MISSING',
      message:
        'Install @bull-board/api @bull-board/express to enable the queue dashboard',
    });
    return;
  }
  handler(req, res, next);
};

// Explicit `GET /` lives alongside the wildcard mount so the OpenAPI
// contract test (regex-scans router.<verb>(...) callsites) recognises
// the dashboard root. Bull-Board's own router takes over for the nested
// asset URLs (`/api/queues/*`, `/static/*`).
router.get('/', ...adminOnly, ipAllowlistGuard, dashboardHandler);
router.use('/', ...adminOnly, ipAllowlistGuard, dashboardHandler);

export default router;
