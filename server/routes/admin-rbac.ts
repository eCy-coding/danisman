import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission, extractViewAsRole } from '../middleware/require-permission';
import { validateRbacChange, invalidatePermissionCache } from '../lib/rbac-service';
import { prisma } from '../config/db';
import { UserRole } from '@prisma/client';
import { logger } from '../config/logger';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// All RBAC routes require auth + View-As role extraction
router.use(authenticate, extractViewAsRole);

// ─── List all permissions ───────────────────────────────────────────────────

router.get(
  '/permissions',
  requirePermission('rbac.read'),
  async (_req: AuthRequest, res: Response) => {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
    res.json({ status: 'ok', data: permissions });
  },
);

// ─── Get permission matrix (role × permission grid) ─────────────────────────

router.get('/matrix', requirePermission('rbac.read'), async (_req: AuthRequest, res: Response) => {
  const permissions = await prisma.permission.findMany({
    orderBy: [{ resource: 'asc' }, { action: 'asc' }],
  });

  const managedRoles = [
    UserRole.ADMIN,
    UserRole.EDITOR,
    UserRole.VIEWER,
    UserRole.BLOG_AUTHOR,
    UserRole.CONSULTANT,
  ];

  const matrix: Record<string, Record<string, boolean>> = {};
  for (const role of managedRoles) {
    const granted = await prisma.rolePermission.findMany({
      where: { role, granted: true },
      select: { permissionId: true },
    });
    const grantedIds = new Set(granted.map((g) => g.permissionId));
    matrix[role] = {};
    for (const perm of permissions) {
      matrix[role][perm.key] = grantedIds.has(perm.id);
    }
  }

  res.json({ status: 'ok', data: { permissions, matrix } });
});

// ─── Toggle permission for a role ────────────────────────────────────────────

router.patch(
  '/matrix',
  requirePermission('rbac.write'),
  async (req: AuthRequest, res: Response) => {
    const { role, permissionKey, granted, reason } = req.body as {
      role: UserRole;
      permissionKey: string;
      granted: boolean;
      reason?: string;
    };

    if (!role || typeof permissionKey !== 'string' || typeof granted !== 'boolean') {
      res
        .status(400)
        .json({ status: 'error', message: 'role, permissionKey, granted gereklidir.' });
      return;
    }

    const actorId = req.user!.id;
    const actorRole = req.user!.role;

    const validation = validateRbacChange({
      actorId,
      actorRole,
      targetRole: role,
      permissionKey,
      granted,
    });
    if (!validation.valid) {
      res.status(403).json({ status: 'error', message: validation.reason });
      return;
    }

    const permission = await prisma.permission.findUnique({ where: { key: permissionKey } });
    if (!permission) {
      res.status(404).json({ status: 'error', message: `'${permissionKey}' izni bulunamadı.` });
      return;
    }

    const previousRow = await prisma.rolePermission.findUnique({
      where: { role_permissionId: { role, permissionId: permission.id } },
    });
    const previousValue = previousRow?.granted ?? false;

    await prisma.rolePermission.upsert({
      where: { role_permissionId: { role, permissionId: permission.id } },
      create: { role, permissionId: permission.id, granted, grantedBy: actorId },
      update: { granted, grantedBy: actorId, grantedAt: new Date() },
    });

    await prisma.roleChangeAudit.create({
      data: {
        actorId,
        targetRole: role,
        targetPermissionKey: permissionKey,
        previousValue,
        newValue: granted,
        reason: reason ?? null,
      },
    });

    // Invalidate in-memory permission cache so next request picks up the change
    invalidatePermissionCache();

    logger.info(`[RBAC] permission changed`, { actorId, role, permissionKey, granted });
    res.json({ status: 'ok', data: { role, permissionKey, granted } });
  },
);

// ─── Start View-As session ───────────────────────────────────────────────────

const VIEW_AS_ALLOWED_ROLES: UserRole[] = [
  UserRole.EDITOR,
  UserRole.VIEWER,
  UserRole.BLOG_AUTHOR,
  UserRole.CONSULTANT,
];

router.post('/view-as', requirePermission('rbac.read'), async (req: AuthRequest, res: Response) => {
  const { viewingAsRole } = req.body as { viewingAsRole: UserRole };

  if (!viewingAsRole || !VIEW_AS_ALLOWED_ROLES.includes(viewingAsRole)) {
    res.status(400).json({ status: 'error', message: 'Geçerli bir rol seçiniz.' });
    return;
  }

  const actorId = req.user!.id;

  const session = await prisma.viewAsSession.create({
    data: { actorId, viewingAsRole },
  });

  logger.info('[RBAC] View-As session started', { actorId, viewingAsRole });
  res.json({ status: 'ok', data: { sessionId: session.id, viewingAsRole } });
});

// ─── End View-As session ────────────────────────────────────────────────────

router.delete(
  '/view-as/:id',
  requirePermission('rbac.read'),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const actorId = req.user!.id;

    const session = await prisma.viewAsSession.findUnique({ where: { id } });
    if (!session || session.actorId !== actorId) {
      res.status(404).json({ status: 'error', message: 'Oturum bulunamadı.' });
      return;
    }

    await prisma.viewAsSession.update({
      where: { id },
      data: { endedAt: new Date() },
    });

    logger.info('[RBAC] View-As session ended', { actorId, sessionId: id });
    res.json({ status: 'ok' });
  },
);

// ─── Get RBAC change audit log ───────────────────────────────────────────────

router.get('/audit', requirePermission('rbac.read'), async (req: AuthRequest, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const entries = await prisma.roleChangeAudit.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  res.json({ status: 'ok', data: entries });
});

export default router;
