/**
 * M7 — Bağımsızlık Beyanı (Independence Check) endpoints.
 *
 * Routes mounted at `/api/admin/independence`:
 *   POST /    — create IndependenceCheck; auto-detects Big4 conflicts
 *   GET  /    — list all checks
 *   GET  /:id — single check
 *
 * Big4 firms screened: PwC, Deloitte, EY, KPMG
 * Auth: JWT + ADMIN role required on all routes.
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';
import { prisma } from '../config/db';
import { logger } from '../config/logger';
import { hashIp } from '../lib/crypto/hashIp';

const router = Router();
const adminOnly = [authenticate, requirePermission('dsar.manage')] as const;

// KVKK m.16 accountability — bağımsızlık beyanları are a Kurul-facing
// record. Fire-and-forget: an audit-write hiccup must never turn an
// already-successful mutation into a 500 for the operator.
function writeAudit(
  req: AuthRequest,
  action: string,
  targetId: string,
  data?: Record<string, unknown>,
): void {
  try {
    prisma.auditLog
      .create({
        data: {
          adminId: req.user?.id ?? 'system',
          actorRole: req.user?.role ?? 'ANONYMOUS',
          actorIpHash: hashIp(req.ip),
          action,
          targetType: 'IndependenceCheck',
          targetId,
          newValue: data as never,
        },
      })
      .catch((err: unknown) => {
        logger.error('[admin-independence] audit write failed', { action, targetId, err });
      });
  } catch (syncErr: unknown) {
    logger.error('[admin-independence] audit write threw synchronously', {
      action,
      err: syncErr,
    });
  }
}

// ─── Big4 conflict detection ──────────────────────────────────────────────────

type Big4Firm = 'PwC' | 'Deloitte' | 'EY' | 'KPMG';

const BIG4_PATTERNS: Array<{ firm: Big4Firm; patterns: RegExp[] }> = [
  {
    firm: 'PwC',
    patterns: [/pwc/i, /pricewaterhousecoopers/i, /price\s*waterhouse/i],
  },
  {
    firm: 'Deloitte',
    patterns: [/deloitte/i],
  },
  {
    firm: 'EY',
    patterns: [/\bey\b/i, /ernst\s*&?\s*young/i, /ernst and young/i],
  },
  {
    firm: 'KPMG',
    patterns: [/kpmg/i],
  },
];

function detectBig4Conflicts(clientName: string): Big4Firm[] {
  const conflicts: Big4Firm[] = [];
  for (const { firm, patterns } of BIG4_PATTERNS) {
    if (patterns.some((re) => re.test(clientName))) {
      conflicts.push(firm);
    }
  }
  return conflicts;
}

// ─── Validation schema ────────────────────────────────────────────────────────

const createCheckSchema = z.object({
  clientId: z.string().min(1),
  clientName: z.string().min(1),
  pureAdvisoryConfirmed: z.boolean(),
  signatoryUserId: z.string().min(1),
  declarationDocUrl: z.string().url().optional(),
});

// ─── POST / — create IndependenceCheck ───────────────────────────────────────

router.post('/', ...adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = createCheckSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ status: 'error', errors: parsed.error.flatten() });
    return;
  }

  const { clientId, clientName, pureAdvisoryConfirmed, signatoryUserId, declarationDocUrl } =
    parsed.data;

  try {
    const auditFirmConflicts = detectBig4Conflicts(clientName);

    const checkedAt = new Date();
    const validUntil = new Date(checkedAt);
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    const check = await prisma.independenceCheck.create({
      data: {
        clientId,
        checkedAt,
        auditFirmConflicts,
        pureAdvisoryConfirmed,
        signatoryUserId,
        declarationDocUrl,
        validUntil,
      },
    });

    if (auditFirmConflicts.length > 0) {
      logger.warn('independence check: Big4 conflict detected', {
        clientId,
        clientName,
        auditFirmConflicts,
        checkId: check.id,
      });
    } else {
      logger.info('independence check created', { clientId, checkId: check.id });
    }

    writeAudit(req, 'INDEPENDENCE_CHECK_CREATED', check.id, {
      clientId,
      auditFirmConflicts,
      pureAdvisoryConfirmed,
    });
    res.status(201).json({ status: 'ok', data: check });
  } catch (err) {
    logger.error('independence check create error', { err });
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// ─── GET / — list all checks ──────────────────────────────────────────────────

router.get('/', ...adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const checks = await prisma.independenceCheck.findMany({
      orderBy: { checkedAt: 'desc' },
    });
    res.json({ status: 'ok', data: checks });
  } catch (err) {
    logger.error('independence list error', { err });
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// ─── GET /:id — single check ──────────────────────────────────────────────────

router.get('/:id', ...adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const check = await prisma.independenceCheck.findUnique({ where: { id } });
    if (!check) {
      res.status(404).json({ status: 'error', message: 'IndependenceCheck not found' });
      return;
    }
    res.json({ status: 'ok', data: check });
  } catch (err) {
    logger.error('independence get error', { err, id });
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

export default router;
