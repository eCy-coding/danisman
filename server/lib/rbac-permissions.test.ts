import { describe, it, expect } from 'vitest';
import {
  PERMISSION_DEFS,
  DEFAULT_MATRIX,
  RBAC_MANAGED_ROLES,
  READ_ONLY_KEYS,
  isAdminPermission,
} from './rbac-permissions';
import { UserRole } from '@prisma/client';

describe('PERMISSION_DEFS — seed data integrity', () => {
  it('contains at least 35 permission definitions', () => {
    expect(PERMISSION_DEFS.length).toBeGreaterThanOrEqual(35);
  });

  it('every key is unique', () => {
    const keys = PERMISSION_DEFS.map((p) => p.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it('key format matches resource.action', () => {
    for (const p of PERMISSION_DEFS) {
      expect(p.key).toBe(`${p.resource}.${p.action}`);
    }
  });

  it('all permissions are marked isSystem', () => {
    expect(PERMISSION_DEFS.every((p) => p.isSystem)).toBe(true);
  });

  it('includes rbac.read and rbac.write', () => {
    const keys = PERMISSION_DEFS.map((p) => p.key);
    expect(keys).toContain('rbac.read');
    expect(keys).toContain('rbac.write');
  });
});

describe('DEFAULT_MATRIX — role permission defaults', () => {
  it('ADMIN has all permissions', () => {
    const allKeys = PERMISSION_DEFS.map((p) => p.key);
    const adminPerms = DEFAULT_MATRIX[UserRole.ADMIN];
    for (const key of allKeys) {
      expect(adminPerms).toContain(key);
    }
  });

  it('VIEWER has only read permissions', () => {
    const viewerPerms = DEFAULT_MATRIX[UserRole.VIEWER];
    for (const key of viewerPerms) {
      expect(key.endsWith('.read')).toBe(true);
    }
  });

  it('BLOG_AUTHOR has blog.read and blog.create but not blog.delete', () => {
    const perms = DEFAULT_MATRIX[UserRole.BLOG_AUTHOR];
    expect(perms).toContain('blog.read');
    expect(perms).toContain('blog.create');
    expect(perms).not.toContain('blog.delete');
  });

  it('EDITOR has blog permissions + various read access', () => {
    const perms = DEFAULT_MATRIX[UserRole.EDITOR];
    expect(perms).toContain('blog.read');
    expect(perms).toContain('blog.create');
    expect(perms).toContain('blog.delete');
    expect(perms).toContain('deals.read');
  });

  it('CONSULTANT has deals.read and deals.write but not rbac.write', () => {
    const perms = DEFAULT_MATRIX[UserRole.CONSULTANT];
    expect(perms).toContain('deals.read');
    expect(perms).toContain('deals.write');
    expect(perms).not.toContain('rbac.write');
  });

  it('5 managed roles defined in DEFAULT_MATRIX', () => {
    for (const role of RBAC_MANAGED_ROLES) {
      expect(DEFAULT_MATRIX[role]).toBeDefined();
    }
  });
});

describe('READ_ONLY_KEYS', () => {
  it('all keys end with .read', () => {
    for (const key of READ_ONLY_KEYS) {
      expect(key.endsWith('.read')).toBe(true);
    }
  });

  it('matches VIEWER default matrix', () => {
    const viewerPerms = DEFAULT_MATRIX[UserRole.VIEWER];
    expect(viewerPerms.sort()).toEqual(READ_ONLY_KEYS.sort());
  });
});

describe('isAdminPermission', () => {
  it('rbac.read and rbac.write are admin-only', () => {
    expect(isAdminPermission('rbac.read')).toBe(true);
    expect(isAdminPermission('rbac.write')).toBe(true);
  });

  it('other permissions are not admin-only', () => {
    expect(isAdminPermission('blog.create')).toBe(false);
    expect(isAdminPermission('users.read')).toBe(false);
  });
});
