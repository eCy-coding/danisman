import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { isBlacklisted } from '../lib/jwt-blacklist';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET env var is required in production');
  }
  // Dev/test fallback — logged so it's visible
  console.warn('[auth] WARNING: JWT_SECRET not set — using insecure dev fallback');
}
const _JWT_SECRET = JWT_SECRET ?? 'dev-only-insecure-fallback-do-not-use-in-prod';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    jti?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ status: 'error', message: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ status: 'error', message: 'Invalid token format' });
    return;
  }

  try {
    const decoded = jwt.verify(token, _JWT_SECRET) as { id: string; role: string; jti?: string };

    // P35-T01: Blacklist check — revoked tokens rejected even before expiry
    if (decoded.jti) {
      const revoked = await isBlacklisted(decoded.jti);
      if (revoked) {
        res.status(401).json({ status: 'error', message: 'Token has been revoked' });
        return;
      }
    }

    req.user = { id: decoded.id, role: decoded.role, jti: decoded.jti };
    next();
  } catch (_err) {
    res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
    return;
  }
};

export const requireRole = (role: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }
    if (req.user.role !== role && req.user.role !== 'ADMIN') {
      res.status(403).json({ status: 'error', message: 'Insufficient permissions' });
      return;
    }
    next();
  };
};
