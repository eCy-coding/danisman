/**
 * P57.9 — Admin security (API keys + IP whitelist + login history).
 *
 * - API keys: Prisma ApiKey model var; bu route şimdilik liste + revoke.
 *   Generate stub (gerçek issuance auth.ts üzerinden).
 * - IP whitelist: Redis set `admin:ip-whitelist`.
 * - Login history: AuditLog query (action like 'AUTH_LOGIN%').
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/db';
import { redis } from '../config/redis';
import { logger } from '../config/logger';
import { hashIp } from '../lib/crypto/hashIp';
import { adminMutationLimiter, ADMIN_MUTATION_LIMITS } from '../middleware/rate-limit-tier';

const router = Router();
const adminOnly = [authenticate, requireRole('ADMIN')] as const;
const IP_KEY = 'admin:ip-whitelist';

// Security hardening — per-route ceilings tighter than the global admin
// tier (1000/15min); see rate-limit-tier.ts for the full rationale per
// bucket. Both IP-whitelist mutations share one bucket (add + remove are
// symmetric abuse vectors — flooding either wrecks the same invariant).
const apiKeyRevokeLimiter = adminMutationLimiter(
  'admin:api-key-revoke',
  ADMIN_MUTATION_LIMITS.API_KEY_REVOKE,
);
const ipWhitelistWriteLimiter = adminMutationLimiter(
  'admin:ip-whitelist-write',
  ADMIN_MUTATION_LIMITS.IP_WHITELIST_WRITE,
);

// KVKK m.12 data-security accountability — API-key revocation and admin
// IP-whitelist changes directly gate who can reach personal data. Every
// mutation must leave an AuditLog row. Fire-and-forget: an audit-write
// hiccup must never turn an already-successful mutation into a 500.
function writeAudit(req: AuthRequest, action: string, targetType: string, targetId: string): void {
  try {
    prisma.auditLog
      .create({
        data: {
          adminId: req.user?.id ?? 'system',
          actorRole: req.user?.role ?? 'ANONYMOUS',
          actorIpHash: hashIp(req.ip),
          action,
          targetType,
          targetId,
        },
      })
      .catch((err: unknown) => {
        logger.error('[admin-security] audit write failed', { action, targetId, err });
      });
  } catch (syncErr: unknown) {
    logger.error('[admin-security] audit write threw synchronously', {
      action,
      err: syncErr,
    });
  }
}

router.get('/api-keys', ...adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        name: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
    res.json({ status: 'ok', data: { items: keys, total: keys.length } });
  } catch (err) {
    next(err);
  }
});

router.delete(
  '/api-keys/:id',
  ...adminOnly,
  apiKeyRevokeLimiter,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      if (!id) return res.status(400).json({ status: 'error', message: 'id required' });
      await prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
      writeAudit(req, 'API_KEY_REVOKED', 'ApiKey', id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/ip-whitelist',
  ...adminOnly,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const ips = await redis.smembers(IP_KEY);
      res.json({ status: 'ok', data: { items: ips } });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/ip-whitelist',
  ...adminOnly,
  ipWhitelistWriteLimiter,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const ip = String((req.body as { ip?: string }).ip ?? '').trim();
      if (!ip || !/^[0-9a-fA-F.:/]+$/.test(ip))
        return res.status(400).json({ status: 'error', message: 'invalid ip' });
      await redis.sadd(IP_KEY, ip);
      writeAudit(req, 'IP_WHITELIST_ADDED', 'IpWhitelist', ip);
      res.status(201).json({ status: 'ok', data: { ip } });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/ip-whitelist/:ip',
  ...adminOnly,
  ipWhitelistWriteLimiter,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const ip = req.params.ip;
      if (!ip) return res.status(400).json({ status: 'error', message: 'ip required' });
      await redis.srem(IP_KEY, ip);
      writeAudit(req, 'IP_WHITELIST_REMOVED', 'IpWhitelist', ip);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/login-history',
  ...adminOnly,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const events = await prisma.auditLog
        .findMany({
          where: { action: { startsWith: 'AUTH_' } },
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            action: true,
            adminId: true,
            ip: true,
            userAgent: true,
            createdAt: true,
          },
        })
        .catch(() => []);
      res.json({ status: 'ok', data: { items: events } });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
