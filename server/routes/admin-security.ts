/**
 * P57.9 — Admin security (API keys + IP whitelist + login history).
 *
 * - API keys: Prisma ApiKey model var; bu route şimdilik liste + revoke.
 *   Generate stub (gerçek issuance auth.ts üzerinden).
 * - IP whitelist: Redis set `admin:ip-whitelist`.
 * - Login history: AuditLog query (action like 'AUTH_LOGIN%').
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '../config/db';
import { redis } from '../config/redis';

const router = Router();
const adminOnly = [authenticate, requireRole('ADMIN')] as const;
const IP_KEY = 'admin:ip-whitelist';

router.get('/api-keys', ...adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, name: true, scopes: true, lastUsedAt: true, expiresAt: true, revokedAt: true, createdAt: true },
    });
    res.json({ status: 'ok', data: { items: keys, total: keys.length } });
  } catch (err) {
    next(err);
  }
});

router.delete('/api-keys/:id', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ status: 'error', message: 'id required' });
    await prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.get('/ip-whitelist', ...adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const ips = await redis.smembers(IP_KEY);
    res.json({ status: 'ok', data: { items: ips } });
  } catch (err) {
    next(err);
  }
});

router.post('/ip-whitelist', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = String((req.body as { ip?: string }).ip ?? '').trim();
    if (!ip || !/^[0-9a-fA-F.:/]+$/.test(ip)) return res.status(400).json({ status: 'error', message: 'invalid ip' });
    await redis.sadd(IP_KEY, ip);
    res.status(201).json({ status: 'ok', data: { ip } });
  } catch (err) {
    next(err);
  }
});

router.delete('/ip-whitelist/:ip', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = req.params.ip;
    if (!ip) return res.status(400).json({ status: 'error', message: 'ip required' });
    await redis.srem(IP_KEY, ip);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.get('/login-history', ...adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await prisma.auditLog.findMany({
      where: { action: { startsWith: 'AUTH_' } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, action: true, adminId: true, ip: true, userAgent: true, createdAt: true },
    }).catch(() => []);
    res.json({ status: 'ok', data: { items: events } });
  } catch (err) {
    next(err);
  }
});

export default router;
