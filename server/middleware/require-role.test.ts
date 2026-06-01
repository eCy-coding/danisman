/**
 * Sprint 9 P44-T03 — requireRole middleware unit tests.
 *
 * Co-located vitest. Covers the contract documented in `auth.ts`:
 * single-role + multi-role signature, ADMIN super-role bypass, 401
 * defensive path, 403 mismatch path.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Response, NextFunction } from 'express';

import { requireRole, type AuthRequest } from './auth';

function makeRes(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function makeReq(role?: string): AuthRequest {
  return {
    user: role ? { id: 'u-1', role } : undefined,
  } as AuthRequest;
}

describe('requireRole', () => {
  let next: NextFunction;
  let res: Response;

  beforeEach(() => {
    next = vi.fn();
    res = makeRes();
  });

  it('passes through when req.user.role matches the single role', () => {
    const handler = requireRole('CONSULTANT');
    handler(makeReq('CONSULTANT'), res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('passes through when req.user.role is in the roles array', () => {
    const handler = requireRole(['CONSULTANT', 'PREMIUM']);
    handler(makeReq('PREMIUM'), res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('grants ADMIN bypass even when ADMIN is not in the explicit list', () => {
    const handler = requireRole(['CONSULTANT']);
    handler(makeReq('ADMIN'), res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when req.user is absent (defensive — pre-authenticate)', () => {
    const handler = requireRole('CONSULTANT');
    handler(makeReq(undefined), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error', message: 'Authentication required' }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when req.user.role is not in the allowed set', () => {
    const handler = requireRole('CONSULTANT');
    handler(makeReq('CLIENT'), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error', message: 'Insufficient permissions' }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when none of the allowed roles match', () => {
    const handler = requireRole(['CONSULTANT', 'PREMIUM']);
    handler(makeReq('USER'), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('treats an empty roles array as deny-all (except ADMIN bypass)', () => {
    const handler = requireRole([]);
    handler(makeReq('CONSULTANT'), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    // ADMIN still bypasses
    const adminRes = makeRes();
    const adminNext = vi.fn();
    handler(makeReq('ADMIN'), adminRes, adminNext);
    expect(adminNext).toHaveBeenCalledTimes(1);
  });
});
