/**
 * P23 BE Track 2 / Aşama 1 — `/api/stream` SSE endpoint.
 *
 * Usage from the browser:
 *
 *   const src = new EventSource(`/api/stream?topic=blog:comments,job:done`, {
 *     withCredentials: true,
 *   });
 *   src.addEventListener('job:done', (ev) => { ... });
 *
 * Auth model:
 *   - Bearer token in `Authorization` (preferred — the existing
 *     `authenticate` middleware honours it, sets `req.user`).
 *   - Anonymous connections are permitted for explicitly public topics
 *     (status page tick, public KPIs) listed in `PUBLIC_TOPICS`.
 *   - Unauthenticated request to a non-public topic → 401.
 *
 * Output headers:
 *   Content-Type: text/event-stream
 *   Cache-Control: no-cache, no-transform   (matches the SSE RFC; prevents
 *                                            proxies from chunk-buffering)
 *   Connection: keep-alive
 *   X-Accel-Buffering: no                   (nginx/Render edge — disable buffer)
 */

import { Router, type Request, type Response } from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { getSseManager } from '../lib/realtime/sse-manager';
import { logger } from '../config/logger';

const router = Router();

/**
 * Topics that may be subscribed to without authentication. Keep this list
 * conservative — anything containing user-scoped data MUST stay private.
 */
const PUBLIC_TOPICS = new Set<string>(['status:tick']);

/** Maximum topics a single connection may subscribe to in one request. */
const MAX_TOPICS_PER_CONNECTION = 8;

function parseTopics(raw: unknown): string[] {
  if (typeof raw !== 'string' || raw.length === 0) return [];
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter((t) => /^[a-z0-9:_-]{1,64}$/i.test(t))
    .slice(0, MAX_TOPICS_PER_CONNECTION);
}

/**
 * Wraps `authenticate` so the request can fall through to anonymous mode
 * when (a) no Authorization header is present AND (b) all requested topics
 * are public. Returns the resolved `userId | null`.
 */
async function resolveIdentity(
  req: Request,
  res: Response,
  topics: string[],
): Promise<string | null | 'rejected'> {
  const allPublic = topics.length > 0 && topics.every((t) => PUBLIC_TOPICS.has(t));
  if (allPublic) {
    // Anonymous OK. If the caller still sent a token, honour it best-effort
    // but don't 401 on bad token.
    return null;
  }
  return new Promise((resolve) => {
    authenticate(req as AuthRequest, res, () => {
      const u = (req as AuthRequest).user;
      resolve(u?.id ?? null);
    });
  }).then((id) => (typeof id === 'string' ? id : 'rejected'));
}

router.get('/stream', async (req, res) => {
  const topics = parseTopics(req.query.topic);
  if (topics.length === 0) {
    res.status(400).json({ status: 'error', message: 'topic query param required' });
    return;
  }

  const identity = await resolveIdentity(req, res, topics);
  if (identity === 'rejected') {
    // `authenticate` already wrote the 401 envelope.
    return;
  }
  const userId = identity;

  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const manager = getSseManager();

  const decision = manager.canAccept(userId, ip);
  if (!decision.ok) {
    const status = decision.reason === 'process_total_limit' ? 503 : 429;
    logger.warn('[sse] connection rejected', { reason: decision.reason, userId, ip });
    res.status(status).json({ status: 'error', reason: decision.reason });
    return;
  }

  // RFC-compliant SSE headers. `no-transform` prevents intermediaries
  // from gzip-rewriting the stream, which would interfere with framing.
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  // Flush headers immediately so EventSource transitions to OPEN.
  if (typeof (res as { flushHeaders?: () => void }).flushHeaders === 'function') {
    (res as unknown as { flushHeaders: () => void }).flushHeaders();
  }

  const client = manager.add({
    userId,
    ip,
    topics: new Set(topics),
    res,
  });

  // Initial "hello" frame so the client can confirm subscription without
  // waiting for the first real event.
  res.write(`event: subscribed\ndata: ${JSON.stringify({ id: client.id, topics })}\n\n`);

  req.on('close', () => manager.remove(client.id));
  req.on('error', () => manager.remove(client.id));
});

/**
 * Internal HTTP fan-out — admin only. Lets ops push a system-wide notice
 * without authoring a worker. Body: { topic, type?, data }.
 *
 * Mounted under `/admin/stream` (registered in routes/index.ts).
 */
router.post('/stream/publish', authenticate, async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user || user.role !== 'ADMIN') {
    res.status(403).json({ status: 'error', message: 'admin only' });
    return;
  }
  const body = (req.body ?? {}) as { topic?: unknown; type?: unknown; data?: unknown };
  if (typeof body.topic !== 'string' || !/^[a-z0-9:_-]{1,64}$/i.test(body.topic)) {
    res.status(400).json({ status: 'error', message: 'invalid topic' });
    return;
  }
  const event = {
    type: typeof body.type === 'string' ? body.type : undefined,
    data: body.data ?? null,
  };
  const fanout = getSseManager().publish(body.topic, event);
  res.json({ status: 'ok', topic: body.topic, fanout });
});

router.get('/stream/_stats', authenticate, (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user || user.role !== 'ADMIN') {
    res.status(403).json({ status: 'error', message: 'admin only' });
    return;
  }
  res.json({ status: 'ok', ...getSseManager().stats() });
});

export default router;
