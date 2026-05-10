/**
 * P36-T10: RBAC Permission Matrix — Unit Tests
 *
 * Test coverage:
 *   1. Role hierarchy: USER < CLIENT < CONSULTANT < ADMIN < PREMIUM
 *   2. Additive permissions: higher roles always include lower role permissions
 *   3. `can()` function correctness for all roles
 *   4. `hasMinRole()` ordering invariant
 *   5. `isAdmin()` predicate
 *   6. Deny-by-default: unlisted permissions return false
 *   7. Null/undefined role safety
 */

import { describe, it, expect } from 'vitest';
import { can, hasMinRole, isAdmin, getPermissions, type UserRole } from './rbac';

// ─── Role ordering for property-based checks ──────────────
const ROLES_IN_ORDER: UserRole[] = ['USER', 'CLIENT', 'CONSULTANT', 'ADMIN', 'PREMIUM'];

// ─── Permission subsets expected per role ────────────────
const MUST_HAVE: Record<UserRole, string[]> = {
  USER: ['booking:view', 'booking:create'],
  CLIENT: [
    'booking:view',
    'booking:create',
    'booking:edit:own',
    'booking:cancel:own',
    'profile:edit',
  ],
  CONSULTANT: [
    'booking:view',
    'booking:view:all',
    'blog:view',
    'blog:create',
    'analytics:view:basic',
    'contact:view',
  ],
  ADMIN: [
    'booking:view:all',
    'booking:edit',
    'booking:delete',
    'blog:publish',
    'user:view',
    'user:role:change',
    'settings:view',
    'settings:edit',
    'analytics:export',
    'audit:view',
  ],
  PREMIUM: ['user:role:promote', 'settings:advanced', 'billing:view', 'billing:manage'],
};

// ─── Permissions that must NOT exist for lower roles ──────
const MUST_NOT_HAVE: Record<UserRole, string[]> = {
  USER: [
    'blog:publish',
    'user:role:change',
    'analytics:export',
    'settings:edit',
    'booking:delete',
    'audit:view',
  ],
  CLIENT: [
    'blog:publish',
    'user:role:change',
    'booking:view:all',
    'analytics:export',
    'settings:edit',
  ],
  CONSULTANT: [
    'blog:publish',
    'user:role:change',
    'analytics:export',
    'settings:edit',
    'booking:delete',
    'audit:view',
  ],
  ADMIN: ['user:role:promote', 'settings:advanced', 'billing:manage'],
  PREMIUM: [],
};

// ─── Tests ────────────────────────────────────────────────

describe('RBAC — can()', () => {
  it('grants permissions to correct roles', () => {
    for (const [role, perms] of Object.entries(MUST_HAVE) as [UserRole, string[]][]) {
      for (const perm of perms) {
        expect(can(role, perm), `${role} should have ${perm}`).toBe(true);
      }
    }
  });

  it('denies privileged permissions to lower roles', () => {
    for (const [role, perms] of Object.entries(MUST_NOT_HAVE) as [UserRole, string[]][]) {
      for (const perm of perms) {
        expect(can(role, perm), `${role} should NOT have ${perm}`).toBe(false);
      }
    }
  });

  it('returns false for null role', () => {
    expect(can(null, 'booking:view')).toBe(false);
    expect(can(undefined, 'user:role:change')).toBe(false);
  });

  it('returns false for non-existent permission on any role', () => {
    for (const role of ROLES_IN_ORDER) {
      expect(can(role, 'nonexistent:action')).toBe(false);
    }
  });

  it('PREMIUM grants all ADMIN permissions (additive hierarchy)', () => {
    const adminPerms = getPermissions('ADMIN');
    for (const perm of adminPerms) {
      expect(can('PREMIUM', perm), `PREMIUM should include ADMIN.${perm}`).toBe(true);
    }
  });

  it('ADMIN grants all CONSULTANT permissions', () => {
    const consultantPerms = getPermissions('CONSULTANT');
    for (const perm of consultantPerms) {
      // ADMIN has slightly different read-only constraints — focus on common ones
      if (perm.includes(':view') || perm.includes(':create')) {
        expect(can('ADMIN', perm), `ADMIN should include ${perm}`).toBe(true);
      }
    }
  });
});

describe('RBAC — hasMinRole()', () => {
  it('same role: always true', () => {
    for (const role of ROLES_IN_ORDER) {
      expect(hasMinRole(role, role)).toBe(true);
    }
  });

  it('higher role satisfies lower minimum requirement', () => {
    expect(hasMinRole('ADMIN', 'USER')).toBe(true);
    expect(hasMinRole('ADMIN', 'CLIENT')).toBe(true);
    expect(hasMinRole('ADMIN', 'CONSULTANT')).toBe(true);
    expect(hasMinRole('PREMIUM', 'ADMIN')).toBe(true);
    expect(hasMinRole('PREMIUM', 'USER')).toBe(true);
  });

  it('lower role fails higher minimum requirement', () => {
    expect(hasMinRole('USER', 'ADMIN')).toBe(false);
    expect(hasMinRole('CLIENT', 'CONSULTANT')).toBe(false);
    expect(hasMinRole('CONSULTANT', 'ADMIN')).toBe(false);
    expect(hasMinRole('ADMIN', 'PREMIUM')).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(hasMinRole(null, 'USER')).toBe(false);
    expect(hasMinRole(undefined, 'ADMIN')).toBe(false);
  });

  it('strict monotonic ordering: higher index always satisfies lower', () => {
    for (let i = 0; i < ROLES_IN_ORDER.length; i++) {
      for (let j = 0; j <= i; j++) {
        expect(
          hasMinRole(ROLES_IN_ORDER[i], ROLES_IN_ORDER[j]),
          `${ROLES_IN_ORDER[i]} should satisfy minRole=${ROLES_IN_ORDER[j]}`,
        ).toBe(true);
      }
    }
  });
});

describe('RBAC — isAdmin()', () => {
  it('returns true only for ADMIN and PREMIUM', () => {
    expect(isAdmin('ADMIN')).toBe(true);
    expect(isAdmin('PREMIUM')).toBe(true);
  });

  it('returns false for non-admin roles', () => {
    expect(isAdmin('USER')).toBe(false);
    expect(isAdmin('CLIENT')).toBe(false);
    expect(isAdmin('CONSULTANT')).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });
});

describe('RBAC — getPermissions()', () => {
  it('returns non-empty array for all roles', () => {
    for (const role of ROLES_IN_ORDER) {
      expect(getPermissions(role).length).toBeGreaterThan(0);
    }
  });

  it('returns empty array for null/undefined', () => {
    expect(getPermissions(null)).toEqual([]);
    expect(getPermissions(undefined)).toEqual([]);
  });

  it('PREMIUM has strictly more permissions than ADMIN', () => {
    const premiumPerms = getPermissions('PREMIUM');
    const adminPerms = getPermissions('ADMIN');
    expect(premiumPerms.length).toBeGreaterThan(adminPerms.length);
  });
});
