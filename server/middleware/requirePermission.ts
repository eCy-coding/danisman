import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { CompliancePermission } from '../../src/constants/ropa-template';

// Permission → minimum role mapping.
// All compliance permissions require ADMIN in v1. Extend when role granularity grows.
const PERMISSION_ROLES: Record<CompliancePermission, string[]> = {
  'dsar.manage': ['ADMIN'],
  'consent.read': ['ADMIN'],
  'ropa.edit': ['ADMIN'],
  'breach.report': ['ADMIN'],
};

export const requirePermission = (permission: CompliancePermission) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }
    const allowed = PERMISSION_ROLES[permission] ?? [];
    if (!allowed.includes(req.user.role)) {
      res.status(403).json({ status: 'error', message: `Permission required: ${permission}` });
      return;
    }
    next();
  };
};
