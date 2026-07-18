/**
 * Admin DSAR (Veri Sahibi Başvurusu) Routes
 *
 * KVKK m.11 + GDPR Art.15-22 compliance endpoint.
 * 30-day SLA (extendable once +30d per KVKK m.13).
 * Every mutating action creates an immutable DSARAuditEntry.
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';
import { prisma } from '../config/db';
import { logger } from '../config/logger';
import { hashIp } from '../lib/crypto/hashIp';

const router = Router();

/**
 * Mirror each DSAR mutation into the central AuditLog: the KVKK
 * audit-readiness report (admin-retention.ts) only reads AuditLog rows with
 * a 'DSAR_' action prefix, so without this row DSAR activity is invisible
 * to the regulator-facing report. DSARAuditEntry stays the detailed
 * per-request history; this is the accountability index entry.
 *
 * Fire-and-forget by convention (see auditMiddleware): a failed audit write
 * must never fail the DSAR mutation. `details` must stay PII-free — no
 * requester email/name (KVKK m.4; audit-readiness payload leaves the DB).
 */
function writeCentralAudit(
  req: AuthRequest,
  entry: { action: `DSAR_${string}`; targetId: string; details?: Prisma.InputJsonValue },
): void {
  prisma.auditLog
    .create({
      data: {
        adminId: req.user?.id ?? 'system',
        actorRole: req.user?.role ?? 'ANONYMOUS',
        actorIpHash: hashIp(req.ip),
        action: entry.action,
        targetType: 'DSARRequest',
        targetId: entry.targetId,
        newValue: entry.details,
      },
    })
    .catch((err: unknown) => {
      logger.error('[admin-dsar] central audit write failed', { action: entry.action, err });
    });
}

// ─── Validation schemas ─────────────────────────────────────────────────────

const DSARTypeValues = [
  'ACCESS',
  'RECTIFICATION',
  'ERASURE',
  'RESTRICTION',
  'PORTABILITY',
  'OBJECTION',
  'AUTOMATED_DECISION',
] as const;

const DSARStatusValues = ['RECEIVED', 'UNDER_REVIEW', 'RESPONDED', 'CLOSED', 'REJECTED'] as const;

const createDSARSchema = z.object({
  requesterEmail: z.string().email(),
  requesterName: z.string().min(1).max(200),
  requestType: z.enum(DSARTypeValues),
  description: z.string().max(5000).optional(),
});

const updateDSARSchema = z.object({
  status: z.enum(DSARStatusValues).optional(),
  assignedTo: z.string().optional(),
  extendSLA: z.boolean().optional(),
});

const respondDSARSchema = z.object({
  responseText: z.string().min(1).max(10000),
});

// ─── POST /api/admin/dsar — create new DSAR request ─────────────────────────

router.post(
  '/',
  authenticate,
  requirePermission('dsar.manage'),
  async (req: AuthRequest, res: Response) => {
    const parsed = createDSARSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ status: 'error', issues: parsed.error.issues });
      return;
    }

    const { requesterEmail, requesterName, requestType, description } = parsed.data;
    const receivedAt = new Date();
    const slaDeadline = new Date(receivedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

    try {
      const dsar = await prisma.dSARRequest.create({
        data: {
          requesterEmail,
          requesterName,
          requestType,
          description,
          receivedAt,
          slaDeadline,
          status: 'RECEIVED',
        },
      });

      await prisma.dSARAuditEntry.create({
        data: {
          dsarId: dsar.id,
          actorId: req.user?.id ?? 'system',
          action: 'CREATED',
          details: {
            requesterEmail,
            requesterName,
            requestType,
            slaDeadline: slaDeadline.toISOString(),
          },
        },
      });

      writeCentralAudit(req, {
        action: 'DSAR_CREATED',
        targetId: dsar.id,
        details: { requestType, slaDeadline: slaDeadline.toISOString() },
      });

      logger.info(`[admin-dsar] Created DSAR ${dsar.id} for ${requesterEmail}`);
      res.status(201).json({ status: 'ok', dsar });
    } catch (err) {
      logger.error('[admin-dsar] create error', err);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },
);

// ─── GET /api/admin/dsar — list requests ────────────────────────────────────

router.get(
  '/',
  authenticate,
  requirePermission('dsar.manage'),
  async (req: AuthRequest, res: Response) => {
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (status && DSARStatusValues.includes(status as (typeof DSARStatusValues)[number])) {
      where.status = status;
    }

    try {
      const dsarRequests = await prisma.dSARRequest.findMany({
        where,
        orderBy: { slaDeadline: 'asc' },
        skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
        take: parseInt(limit, 10),
        include: { auditLog: { orderBy: { createdAt: 'desc' }, take: 1 } },
      });

      res.json({ status: 'ok', dsarRequests });
    } catch (err) {
      logger.error('[admin-dsar] list error', err);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },
);

// ─── PATCH /api/admin/dsar/:id — status change / assignTo / extend SLA ──────

router.patch(
  '/:id',
  authenticate,
  requirePermission('dsar.manage'),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const parsed = updateDSARSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ status: 'error', issues: parsed.error.issues });
      return;
    }

    const { status, assignedTo, extendSLA } = parsed.data;

    try {
      const existing = await prisma.dSARRequest.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ status: 'error', message: 'DSAR request not found' });
        return;
      }

      // SLA extend guard — max once per KVKK m.13
      if (extendSLA) {
        if (existing.extendedOnce) {
          res.status(409).json({
            status: 'error',
            message: 'SLA extension already used (max once per KVKK m.13)',
          });
          return;
        }
      }

      const updateData: Record<string, unknown> = {};
      const auditDetails: Record<string, unknown> = {};

      if (status) {
        updateData.status = status;
        auditDetails.statusChange = { from: existing.status, to: status };
      }

      if (assignedTo !== undefined) {
        updateData.assignedTo = assignedTo;
        auditDetails.assignedTo = { from: existing.assignedTo, to: assignedTo };
      }

      if (extendSLA) {
        const newDeadline = new Date(existing.slaDeadline.getTime() + 30 * 24 * 60 * 60 * 1000);
        updateData.slaDeadline = newDeadline;
        updateData.extendedOnce = true;
        auditDetails.slaExtended = {
          from: existing.slaDeadline.toISOString(),
          to: newDeadline.toISOString(),
        };
      }

      const updated = await prisma.dSARRequest.update({
        where: { id },
        data: updateData,
      });

      const dsarAction = extendSLA ? 'SLA_EXTENDED' : status ? 'STATUS_CHANGED' : 'ASSIGNED';

      await prisma.dSARAuditEntry.create({
        data: {
          dsarId: id!,
          actorId: req.user?.id ?? 'system',
          action: dsarAction,
          details: auditDetails as Prisma.InputJsonValue,
        },
      });

      writeCentralAudit(req, {
        action: `DSAR_${dsarAction}`,
        targetId: id!,
        details: auditDetails as Prisma.InputJsonValue,
      });

      logger.info(`[admin-dsar] Updated DSAR ${id}`, auditDetails);
      res.json({ status: 'ok', dsar: updated });
    } catch (err) {
      logger.error('[admin-dsar] update error', err);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },
);

// ─── POST /api/admin/dsar/:id/respond — send response ───────────────────────

router.post(
  '/:id/respond',
  authenticate,
  requirePermission('dsar.manage'),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const parsed = respondDSARSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ status: 'error', issues: parsed.error.issues });
      return;
    }

    const { responseText } = parsed.data;

    try {
      const existing = await prisma.dSARRequest.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ status: 'error', message: 'DSAR request not found' });
        return;
      }

      const respondedAt = new Date();
      const updated = await prisma.dSARRequest.update({
        where: { id },
        data: {
          responseText,
          respondedAt,
          status: 'RESPONDED',
        },
      });

      await prisma.dSARAuditEntry.create({
        data: {
          dsarId: id!,
          actorId: req.user?.id ?? 'system',
          action: 'RESPONDED',
          details: {
            respondedAt: respondedAt.toISOString(),
            responseLength: responseText.length,
          } as Prisma.InputJsonValue,
        },
      });

      writeCentralAudit(req, {
        action: 'DSAR_RESPONDED',
        targetId: id!,
        details: {
          respondedAt: respondedAt.toISOString(),
          responseLength: responseText.length,
        },
      });

      logger.info(`[admin-dsar] Responded to DSAR ${id}`);
      res.json({ status: 'ok', dsar: updated });
    } catch (err) {
      logger.error('[admin-dsar] respond error', err);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },
);

export default router;
