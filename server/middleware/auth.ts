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

/**
 * Signature-only access-token check (no blacklist round-trip). Built for the
 * rate-limit layer, which runs BEFORE `authenticate` and only needs a
 * trustworthy tier/identity hint — never authorization. A revoked-but-valid
 * token momentarily earning the larger budget is harmless: the route's
 * `authenticate` still rejects it.
 */
export function verifyAccessToken(token: string): { id: string; role: string } | null {
  try {
    return jwt.verify(token, _JWT_SECRET) as { id: string; role: string };
  } catch {
    return null;
  }
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  // P44-T07: SSE/EventSource fallback — the W3C EventSource spec does NOT allow
  // setting custom request headers, so `Authorization: Bearer …` is impossible
  // for streaming endpoints (e.g. /api/sse/dashboard, /api/admin/analytics-stream).
  // The frontend appends `?token=<jwt>` to the SSE URL; we honour that here.
  // Production caveat: tokens-in-query are logged in access logs + referers.
  // Mitigation already in place: tokens are short-lived (~15 min) and bound to
  // user session, and we never log full URLs in our structured logger.
  // For non-SSE endpoints, browsers continue to use the Authorization header
  // (apiClient axios interceptor), so this fallback is dormant in normal use.
  let token: string | undefined;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (typeof req.query.token === 'string' && req.query.token.length > 0) {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({ status: 'error', message: 'Authentication required' });
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

/**
 * Sprint 9 P44-T03 — RBAC middleware (Architect CONVERGENT spec).
 *
 * Frontend RoleGuard already covers 5-role authorization (USER, CLIENT,
 * CONSULTANT, ADMIN, PREMIUM). This middleware is the server-side mirror.
 *
 * Signature accepts either a single role string OR a readonly array of
 * roles so call sites can do either:
 *   router.get('/x', authenticate, requireRole('ADMIN'), handler)
 *   router.get('/y', authenticate, requireRole(['ADMIN', 'CONSULTANT']), handler)
 *
 * ADMIN remains an implicit super-role (god-mode bypass) so admin-only
 * call sites stay short. Pass `requireRole(['ADMIN'])` if you need an
 * explicit ADMIN-only gate without the bypass semantics.
 *
 * Returns 401 when authenticate() did not populate req.user (defensive)
 * and 403 (Forbidden) when the role is mismatched.
 */
export const requireRole = (role: string | readonly string[]) => {
  const allowedRoles: readonly string[] = typeof role === 'string' ? [role] : role;
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ status: 'error', message: 'Insufficient permissions' });
      return;
    }
    next();
  };
};
