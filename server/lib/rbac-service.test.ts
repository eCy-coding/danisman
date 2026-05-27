import { describe, it, expect, beforeEach } from 'vitest';
import { UserRole } from '@prisma/client';
import {
  hasPermission,
  validateRbacChange,
  isViewAsMode,
  invalidatePermissionCache,
  PermissionStore,
} from './rbac-service';

// Minimal in-memory store for testing
function makeStore(
  matrix: Record<string, Array<{ key: string; granted: boolean }>>,
): PermissionStore {
  return {
    getRolePermissions: async (role: UserRole) => matrix[role] ?? [],
  };
}

beforeEach(() => {
  invalidatePermissionCache();
});

describe('hasPermission', () => {
  it('ADMIN always has any permission', async () => {
    const store = makeStore({});
    expect(await hasPermission(store, 'ADMIN', 'rbac.write')).toBe(true);
    expect(await hasPermission(store, 'ADMIN', 'blog.delete')).toBe(true);
  });

  it('returns DB-granted value when present', async () => {
    const store = makeStore({
      EDITOR: [{ key: 'users.delete', granted: true }],
    });
    expect(await hasPermission(store, 'EDITOR', 'users.delete')).toBe(true);
  });

  it('returns DB-denied value when explicitly false', async () => {
    const store = makeStore({
      EDITOR: [{ key: 'blog.delete', granted: false }],
    });
    expect(await hasPermission(store, 'EDITOR', 'blog.delete')).toBe(false);
  });

  it('falls back to default matrix when DB missing entry', async () => {
    const store = makeStore({ EDITOR: [] });
    // blog.read is in EDITOR default matrix
    expect(await hasPermission(store, 'EDITOR', 'blog.read')).toBe(true);
    // users.delete is NOT in EDITOR default matrix
    expect(await hasPermission(store, 'EDITOR', 'users.delete')).toBe(false);
  });

  it('VIEWER has read permissions via default matrix', async () => {
    const store = makeStore({ VIEWER: [] });
    expect(await hasPermission(store, 'VIEWER', 'blog.read')).toBe(true);
    expect(await hasPermission(store, 'VIEWER', 'blog.delete')).toBe(false);
  });

  it('BLOG_AUTHOR cannot delete blog via default matrix', async () => {
    const store = makeStore({ BLOG_AUTHOR: [] });
    expect(await hasPermission(store, 'BLOG_AUTHOR', 'blog.create')).toBe(true);
    expect(await hasPermission(store, 'BLOG_AUTHOR', 'blog.delete')).toBe(false);
  });
});

describe('validateRbacChange — self-demotion guard', () => {
  it('rejects non-ADMIN actor', () => {
    const result = validateRbacChange({
      actorId: 'u1',
      actorRole: 'EDITOR',
      targetRole: UserRole.VIEWER,
      permissionKey: 'blog.read',
      granted: false,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/ADMIN/);
  });

  it('rejects ADMIN revoking rbac.write from ADMIN role', () => {
    const result = validateRbacChange({
      actorId: 'admin1',
      actorRole: 'ADMIN',
      targetRole: UserRole.ADMIN,
      permissionKey: 'rbac.write',
      granted: false,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/kaldıramaz/);
  });

  it('rejects ADMIN revoking rbac.read from ADMIN role', () => {
    const result = validateRbacChange({
      actorId: 'admin1',
      actorRole: 'ADMIN',
      targetRole: UserRole.ADMIN,
      permissionKey: 'rbac.read',
      granted: false,
    });
    expect(result.valid).toBe(false);
  });

  it('allows ADMIN granting permission to EDITOR', () => {
    const result = validateRbacChange({
      actorId: 'admin1',
      actorRole: 'ADMIN',
      targetRole: UserRole.EDITOR,
      permissionKey: 'users.delete',
      granted: true,
    });
    expect(result.valid).toBe(true);
  });

  it('allows ADMIN revoking non-rbac permission from ADMIN role', () => {
    const result = validateRbacChange({
      actorId: 'admin1',
      actorRole: 'ADMIN',
      targetRole: UserRole.ADMIN,
      permissionKey: 'blog.delete',
      granted: false,
    });
    expect(result.valid).toBe(true);
  });
});

describe('isViewAsMode', () => {
  it('returns true when viewingAsRole is set', () => {
    expect(isViewAsMode('EDITOR')).toBe(true);
    expect(isViewAsMode('VIEWER')).toBe(true);
  });

  it('returns false when viewingAsRole is undefined or empty', () => {
    expect(isViewAsMode(undefined)).toBe(false);
    expect(isViewAsMode('')).toBe(false);
  });
});
