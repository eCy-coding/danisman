/**
 * M6 — KVKK m.12/5 Kişisel Veri İhlali Bildirimi endpoints.
 *
 * Routes mounted at `/api/admin/breach`:
 *   POST /                    — yeni ihlal bildir; notificationDeadline = detectedAt + 72h
 *   GET /                     — ihlal listesi (detectedAt desc)
 *   GET /:id                  — tekil ihlal kaydı
 *   PATCH /:id/status         — BreachStatus güncelle
 *   POST /:id/report-to-kurul — Kurul'a bildir; kurulFormDraft üret
 *
 * Auth: JWT + ADMIN role required on all routes.
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';
import { prisma } from '../config/db';
import { logger } from '../config/logger';
import { hashIp } from '../lib/crypto/hashIp';
import { adminMutationLimiter, ADMIN_MUTATION_LIMITS } from '../middleware/rate-limit-tier';

const router = Router();
const adminOnly = [authenticate, requirePermission('breach.report')] as const;

// Security hardening — rare, regulator-facing action; shared bucket across
// "create" and "report to Kurul" since both are the same class of action.
// See rate-limit-tier.ts for rationale.
const breachReportLimiter = adminMutationLimiter(
  'admin:breach-report',
  ADMIN_MUTATION_LIMITS.BREACH_REPORT,
);

// KVKK m.12/5 accountability — every breach-record mutation must leave an
// AuditLog row (Kurul-facing regulators expect a trail for exactly this
// record type). Fire-and-forget: an audit-write hiccup must never turn an
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
          targetType: 'BreachIncident',
          targetId,
          newValue: data as never,
        },
      })
      .catch((err: unknown) => {
        logger.error('[admin-breach] audit write failed', { action, targetId, err });
      });
  } catch (syncErr: unknown) {
    logger.error('[admin-breach] audit write threw synchronously', {
      action,
      err: syncErr,
    });
  }
}

// ─── Validation schemas ──────────────────────────────────────────────────────

const BreachStatusValues = ['DETECTED', 'INVESTIGATING', 'REPORTED', 'RESOLVED'] as const;

const DetectionSourceValues = ['SIEM', 'MANUAL', 'AUDIT', 'THIRD_PARTY'] as const;

const createBreachSchema = z.object({
  detectedAt: z.string().datetime(),
  detectionSource: z.enum(DetectionSourceValues),
  description: z.string().min(1).max(5000),
  affectedDataCategories: z.array(z.string()).min(1),
  affectedSubjectsCount: z.number().int().min(0),
});

const updateStatusSchema = z.object({
  status: z.enum(BreachStatusValues),
});

// ─── Kurul form draft generator ──────────────────────────────────────────────

interface BreachIncidentForDraft {
  detectedAt: Date;
  description: string;
  affectedDataCategories: string[];
  affectedSubjectsCount: number;
  notificationDeadline: Date;
  detectionSource: string;
}

function generateKurulDraft(incident: BreachIncidentForDraft): string {
  return `KİŞİSEL VERİ İHLAL BİLDİRİMİ

Veri Sorumlusu: eCyPro Premium Consulting
Bildirim Tarihi: ${new Date().toISOString()}

─────────────────────────────────────────
İhlal Tespit Tarihi: ${incident.detectedAt.toISOString()}
İhlalin Niteliği: ${incident.description}
Etkilenen Veri Kategorileri: ${incident.affectedDataCategories.join(', ')}
Etkilenen Kişi Sayısı: ${incident.affectedSubjectsCount}
72 Saat Süre: ${incident.notificationDeadline.toISOString()}
Tespit Kaynağı: ${incident.detectionSource}
─────────────────────────────────────────

Kişisel Verileri Koruma Kurulu'na
KVKK Madde 12/5 kapsamında yapılan bildirimdir.

Bu form Kişisel Verileri Koruma Kurumu'nun resmi bildirim
formunun yerini tutmaz. Kurul'un güncel formu kullanılmalıdır.`;
}

// ─── POST /api/admin/breach ──────────────────────────────────────────────────

router.post('/', ...adminOnly, breachReportLimiter, async (req: AuthRequest, res: Response) => {
  const parsed = createBreachSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ status: 'error', issues: parsed.error.issues });
    return;
  }

  const {
    detectedAt,
    detectionSource,
    description,
    affectedDataCategories,
    affectedSubjectsCount,
  } = parsed.data;

  const detectedAtDate = new Date(detectedAt);
  // KVKK m.12/5 — 72 saat zorunlu bildirim süresi
  const notificationDeadline = new Date(detectedAtDate.getTime() + 72 * 60 * 60 * 1000);

  try {
    const incident = await prisma.breachIncident.create({
      data: {
        detectedAt: detectedAtDate,
        detectionSource,
        description,
        affectedDataCategories,
        affectedSubjectsCount,
        notificationDeadline,
      },
    });

    logger.info('breach_incident_created', { id: incident.id, actor: req.user?.id });
    writeAudit(req, 'BREACH_REPORTED', incident.id, {
      detectionSource,
      affectedSubjectsCount,
      notificationDeadline: notificationDeadline.toISOString(),
    });
    res.status(201).json({ status: 'ok', incident });
  } catch (err) {
    logger.error('breach_incident_create_error', { err });
    res.status(500).json({ status: 'error', message: 'İhlal kaydı oluşturulamadı.' });
  }
});

// ─── GET /api/admin/breach ───────────────────────────────────────────────────

router.get('/', ...adminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    const incidents = await prisma.breachIncident.findMany({
      orderBy: { detectedAt: 'desc' },
    });
    res.json({ status: 'ok', incidents });
  } catch (err) {
    logger.error('breach_incident_list_error', { err });
    res.status(500).json({ status: 'error', message: 'Liste alınamadı.' });
  }
});

// ─── GET /api/admin/breach/:id ───────────────────────────────────────────────

router.get('/:id', ...adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const incident = await prisma.breachIncident.findUnique({
      where: { id: req.params['id'] },
    });
    if (!incident) {
      res.status(404).json({ status: 'error', message: 'İhlal kaydı bulunamadı.' });
      return;
    }
    res.json({ status: 'ok', incident });
  } catch (err) {
    logger.error('breach_incident_get_error', { err });
    res.status(500).json({ status: 'error', message: 'Kayıt alınamadı.' });
  }
});

// ─── PATCH /api/admin/breach/:id/status ─────────────────────────────────────

router.patch('/:id/status', ...adminOnly, async (req: AuthRequest, res: Response) => {
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ status: 'error', issues: parsed.error.issues });
    return;
  }

  try {
    const incident = await prisma.breachIncident.update({
      where: { id: req.params['id'] },
      data: { status: parsed.data.status },
    });
    logger.info('breach_status_updated', {
      id: incident.id,
      status: incident.status,
      actor: req.user?.id,
    });
    writeAudit(req, 'BREACH_STATUS_UPDATED', incident.id, { status: incident.status });
    res.json({ status: 'ok', incident });
  } catch (err) {
    logger.error('breach_status_update_error', { err });
    res.status(500).json({ status: 'error', message: 'Durum güncellenemedi.' });
  }
});

// ─── POST /api/admin/breach/:id/report-to-kurul ─────────────────────────────

router.post(
  '/:id/report-to-kurul',
  ...adminOnly,
  breachReportLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      const existing = await prisma.breachIncident.findUnique({
        where: { id: req.params['id'] },
      });

      if (!existing) {
        res.status(404).json({ status: 'error', message: 'İhlal kaydı bulunamadı.' });
        return;
      }

      if (existing.reportedToKurul) {
        res.status(409).json({ status: 'error', message: "Bu ihlal zaten Kurul'a bildirildi." });
        return;
      }

      const kurulFormDraft = generateKurulDraft(existing);

      const incident = await prisma.breachIncident.update({
        where: { id: req.params['id'] },
        data: {
          reportedToKurul: true,
          reportedAt: new Date(),
          kurulFormDraft,
          status: 'REPORTED',
        },
      });

      logger.info('breach_reported_to_kurul', { id: incident.id, actor: req.user?.id });
      writeAudit(req, 'BREACH_REPORTED_TO_KURUL', incident.id, {
        reportedAt: incident.reportedAt,
      });
      res.json({ status: 'ok', incident });
    } catch (err) {
      logger.error('breach_report_to_kurul_error', { err });
      res.status(500).json({ status: 'error', message: 'Kurul bildirimi kaydedilemedi.' });
    }
  },
);

export default router;
