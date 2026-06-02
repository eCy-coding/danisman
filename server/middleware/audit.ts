/**
 * Sprint 11 P44-T03 — Audit middleware.
 *
 * Fire-and-forget: writes an AuditLog row after the route handler resolves.
 * Fail-soft: a DB write failure logs an error but does NOT fail the request.
 *
 * KVKK m.4: IP stored as SHA-256 hash via hashIp(), never raw.
 * KVKK m.10/12: all admin mutations recorded with actor, role, result.
 */
import { Response, NextFunction } from 'express';
import { AuditResult } from '@prisma/client';
import { prisma } from '../config/db';
import { logger } from '../config/logger';
import { hashIp } from '../lib/crypto/hashIp';
import { AuthRequest } from './auth';

export interface AuditOptions {
  action: string;
  resourceType?: string;
  resourceId?: string;
}

/**
 * Express middleware factory. Wraps res.json to capture the status code
 * after the handler runs, then writes an AuditLog row asynchronously.
 *
 * Usage:
 *   router.post('/leads', authenticate, requireRole('ADMIN'),
 *     auditMiddleware({ action: 'leads.create' }), handler)
 */
export function auditMiddleware(opts: AuditOptions) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const originalJson = res.json.bind(res);

    res.json = function (body?: unknown): Response {
      // Determine result from HTTP status code
      let result: AuditResult = AuditResult.SUCCESS;
      if (res.statusCode === 401 || res.statusCode === 403) {
        result = AuditResult.DENIED;
      } else if (res.statusCode >= 500) {
        result = AuditResult.ERROR;
      }

      // Fire-and-forget — do not await
      writeAuditLog({
        actorId: req.user?.id ?? null,
        actorRole: req.user?.role ?? 'ANONYMOUS',
        ipHash: hashIp(req.ip),
        action: opts.action,
        resourceType: opts.resourceType,
        resourceId: opts.resourceId ?? req.params?.id ?? null,
        result,
        metadata: body && typeof body === 'object' ? sanitizeMeta(body) : undefined,
      }).catch((err: unknown) => {
        logger.error('[audit] write failed', { action: opts.action, err });
      });

      return originalJson(body);
    };

    next();
  };
}

interface AuditPayload {
  actorId: string | null;
  actorRole: string;
  ipHash: string | null;
  action: string;
  resourceType?: string;
  resourceId?: string | null;
  result: AuditResult;
  metadata?: unknown;
}

async function writeAuditLog(p: AuditPayload): Promise<void> {
  await prisma.auditLog.create({
    data: {
      adminId: p.actorId ?? 'system',
      actorRole: p.actorRole,
      actorIpHash: p.ipHash,
      action: p.action,
      targetType: p.resourceType,
      targetId: p.resourceId,
      result: p.result,
      newValue: p.metadata as never,
    },
  });
}

/** Strip PII keys from response body before storing in audit metadata. */
function sanitizeMeta(obj: object): object {
  const REDACTED = new Set([
    'email',
    'password',
    'token',
    'secret',
    'ip',
    'phone',
    'address',
    'name',
    'firstName',
    'lastName',
    'tcNo',
    'tckn',
  ]);
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !REDACTED.has(k) && !k.toLowerCase().includes('email')),
  );
}
