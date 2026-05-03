import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-dev-only-change-in-prod';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
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
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    req.user = decoded;
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
