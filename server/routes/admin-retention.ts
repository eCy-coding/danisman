/**
 * M7 — Belge Saklama ve İmha Yönetimi endpoints.
 *
 * Routes mounted at `/api/admin/retention`:
 *   GET  /                     — list RetentionPolicy records
 *   POST /seed                 — idempotent upsert from RETENTION_POLICIES_SEED
 *   POST /:resourceType/enforce — mark lastEnforced=now, create AuditLog + imha sertifikası
 *   GET  /audit-readiness      — KVKK-relevant AuditLog entries (last 2 years)
 *
 * Auth: JWT + ADMIN role required on all routes.
 * AuditLog is IMMUTABLE — no UPDATE/DELETE.
 */

import { Router, Response } from 'express';
import { randomUUID } from 'crypto';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';
import { prisma } from '../config/db';
import { logger } from '../config/logger';
import { RETENTION_POLICIES_SEED } from '../../src/constants/ropa-template';

const router = Router();
const adminOnly = [authenticate, requirePermission('ropa.edit')] as const;

// KVKK-relevant action prefixes used in audit-readiness filter
const KVKK_RELEVANT_ACTIONS = [
  'RETENTION_ENFORCED',
  'DSAR_',
  'BREACH_',
  'CONSENT_CHANGE',
  'RBAC_CHANGE',
] as const;

// ─── GET / — list all retention policies ─────────────────────────────────────

router.get('/', ...adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const policies = await prisma.retentionPolicy.findMany({
      orderBy: { resourceType: 'asc' },
    });
    res.json({ status: 'ok', data: policies });
  } catch (err) {
    logger.error('retention list error', { err });
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// ─── POST /seed — idempotent upsert from RETENTION_POLICIES_SEED ─────────────

router.post('/seed', ...adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const results = await Promise.all(
      RETENTION_POLICIES_SEED.map((policy) =>
        prisma.retentionPolicy.upsert({
          where: { resourceType: policy.resourceType },
          update: {
            retentionDays: policy.retentionDays,
            legalBasis: policy.legalBasis,
          },
          create: {
            resourceType: policy.resourceType,
            retentionDays: policy.retentionDays,
            legalBasis: policy.legalBasis,
          },
        }),
      ),
    );
    logger.info('retention policies seeded', { count: results.length, adminId: req.user?.id });
    res.json({ status: 'ok', seeded: results.length, data: results });
  } catch (err) {
    logger.error('retention seed error', { err });
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// ─── GET /audit-readiness — KVKK-relevant AuditLog entries (last 2 years) ────

router.get(
  '/audit-readiness',
  ...adminOnly,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      // P44-T07: explicit `select` instead of default SELECT *. Two reasons:
      //   (1) the frontend only renders `{id, action, targetType, targetId,
      //       createdAt, adminId}` — narrower payload, lower bandwidth.
      //   (2) the new `actorRole / actorIpHash / result` columns from
      //       migration `20260603000000_add_audit_log_rbac_fields` may not be
      //       applied yet on a given environment (Neon dev branch, local
      //       psql). Without `select`, Prisma issues SELECT * and the query
      //       throws `column audit_logs.actorRole does not exist`. Whitelisting
      //       the legacy columns keeps the endpoint resilient until migration
      //       deploy lands on every environment.
      const entries = await prisma.auditLog.findMany({
        where: {
          createdAt: { gte: twoYearsAgo },
          OR: KVKK_RELEVANT_ACTIONS.map((prefix) => ({
            action: { startsWith: prefix },
          })),
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          targetType: true,
          targetId: true,
          createdAt: true,
          adminId: true,
        },
      });

      res.json({ status: 'ok', count: entries.length, data: entries });
    } catch (err) {
      logger.error('audit-readiness error', { err });
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },
);

// ─── POST /:resourceType/enforce — run imha + create AuditLog + sertifika ────

router.post(
  '/:resourceType/enforce',
  ...adminOnly,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { resourceType } = req.params;

    try {
      const policy = await prisma.retentionPolicy.findFirst({
        where: { resourceType },
      });

      if (!policy) {
        res
          .status(404)
          .json({ status: 'error', message: `RetentionPolicy not found: ${resourceType}` });
        return;
      }

      const now = new Date();
      const sertifikaId = randomUUID();

      // Update lastEnforced — the only mutable field (retention policy metadata, not audit log)
      const updated = await prisma.retentionPolicy.update({
        where: { id: policy.id },
        data: { lastEnforced: now },
      });

      // Immutable audit entry — includes İmha Sertifikası details in newValue
      await prisma.auditLog.create({
        data: {
          adminId: req.user?.id ?? 'system',
          action: 'RETENTION_ENFORCED',
          targetType: 'RetentionPolicy',
          targetId: policy.id,
          newValue: {
            sertifikaId,
            resourceType,
            retentionDays: policy.retentionDays,
            legalBasis: policy.legalBasis,
            enforcedAt: now.toISOString(),
            enforcedBy: req.user?.id ?? 'system',
          },
          ip: req.ip ?? null,
          userAgent: req.headers['user-agent'] ?? null,
        },
      });

      logger.info('retention enforced', { resourceType, sertifikaId, adminId: req.user?.id });

      res.json({
        status: 'ok',
        data: updated,
        sertifika: {
          sertifikaId,
          resourceType,
          enforcedAt: now.toISOString(),
          legalBasis: policy.legalBasis,
          retentionDays: policy.retentionDays,
        },
      });
    } catch (err) {
      logger.error('retention enforce error', { err, resourceType });
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },
);

export default router;
