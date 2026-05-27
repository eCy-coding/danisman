import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../config/db';
import { UserRole } from '@prisma/client';
import { hasPermission, isViewAsMode, PermissionStore } from '../lib/rbac-service';

// Build a PermissionStore backed by Prisma RolePermission table
function makePrismaStore(): PermissionStore {
  return {
    getRolePermissions: async (role: UserRole) => {
      const rows = await prisma.rolePermission.findMany({
        where: { role },
        include: { permission: true },
      });
      return rows.map((r) => ({ key: r.permission.key, granted: r.granted }));
    },
  };
}

const store = makePrismaStore();

export function requirePermission(permissionKey: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    // View-As mode: use effective (simulated) role
    const viewingAsRole = (req as unknown as Record<string, unknown>).viewingAsRole as
      | string
      | undefined;
    const effectiveRole = viewingAsRole ?? req.user.role;

    // Mutations are forbidden in View-As mode
    const isMutation = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method);
    if (isViewAsMode(viewingAsRole) && isMutation) {
      res.status(403).json({
        status: 'error',
        message: "Bu eylem 'Rol Olarak Görüntüle' modunda engellenmiştir.",
        code: 'VIEW_AS_MUTATION_BLOCKED',
      });
      return;
    }

    const granted = await hasPermission(store, effectiveRole, permissionKey);
    if (!granted) {
      res.status(403).json({
        status: 'error',
        message: `'${permissionKey}' yetkisi gereklidir.`,
        code: 'PERMISSION_DENIED',
      });
      return;
    }

    next();
  };
}

// Middleware that extracts viewingAsRole from X-View-As-Role header (server-side enforcement)
export function extractViewAsRole(req: AuthRequest, _res: Response, next: NextFunction): void {
  const headerRole = req.headers['x-view-as-role'];
  if (typeof headerRole === 'string' && headerRole.length > 0) {
    (req as unknown as Record<string, unknown>).viewingAsRole = headerRole;
  }
  next();
}
