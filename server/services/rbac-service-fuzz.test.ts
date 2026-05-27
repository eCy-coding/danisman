/**
 * Phase 4.5 — RBAC Property-Based Fuzz: 6 adversarial property tests.
 * Each test runs many iterations to surface edge cases unreachable by example-based tests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UserRole } from '@prisma/client';
import {
  hasPermission,
  validateRbacChange,
  isViewAsMode,
  invalidatePermissionCache,
  PermissionStore,
} from '../lib/rbac-service';
import { PERMISSION_DEFS, RBAC_MANAGED_ROLES } from '../lib/rbac-permissions';

const ALL_ROLES = Object.values(UserRole);
const ALL_KEYS = PERMISSION_DEFS.map((p) => p.key);

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeStore(granted: Record<string, string[]>): PermissionStore {
  return {
    getRolePermissions: async (role: UserRole) =>
      (granted[role] ?? []).map((key) => ({ key, granted: true })),
  };
}

beforeEach(() => {
  invalidatePermissionCache();
});

describe('Fuzz 4.2 — RBAC property-based tests', () => {
  // Fuzz 1: Random Role × Permission 1000x — matrix consistency
  it('[F-1] 1000 random role×permission checks — ADMIN always true', async () => {
    const store = makeStore({});
    for (let i = 0; i < 1000; i++) {
      const result = await hasPermission(store, UserRole.ADMIN, randomItem(ALL_KEYS));
      expect(result).toBe(true);
      invalidatePermissionCache();
    }
  });

  // Fuzz 2: Self-demote 50×50 — 0 success
  it('[F-2] 50×50 self-demotion attempts — all rejected', () => {
    const adminOnlyKeys = ['rbac.read', 'rbac.write'];
    let successes = 0;
    for (let i = 0; i < 50; i++) {
      const actorRole = randomItem(ALL_ROLES);
      for (let j = 0; j < 50; j++) {
        const permKey = randomItem(adminOnlyKeys);
        const result = validateRbacChange({
          actorId: `user-${i}`,
          actorRole,
          targetRole: UserRole.ADMIN,
          permissionKey: permKey,
          granted: false,
        });
        if (result.valid) successes++;
      }
    }
    // Only ADMIN can change RBAC, but even ADMIN cannot revoke rbac.* from ADMIN role
    // So successes == 0 for rbac.read/rbac.write on ADMIN target
    expect(successes).toBe(0);
  });

  // Fuzz 3: View-As + mutation 100x → all blocked (isViewAsMode)
  it('[F-3] 100x View-As mutation attempt — isViewAsMode returns true for non-empty role', () => {
    let unblocked = 0;
    for (let i = 0; i < 100; i++) {
      const viewingRole = randomItem(
        RBAC_MANAGED_ROLES.filter((r) => r !== UserRole.ADMIN) as string[],
      );
      const blocked = isViewAsMode(viewingRole);
      if (!blocked) unblocked++;
    }
    expect(unblocked).toBe(0);
  });

  // Fuzz 4: Permission key wildcard — server only matches exact key
  it('[F-4] Wildcard key "*.read" never matches any exact permission', async () => {
    const store = makeStore({ EDITOR: ['*.read', '*.write', '*'] });
    invalidatePermissionCache();
    // None of the real permission keys should match wildcard-granted
    for (const key of ALL_KEYS) {
      const result = await hasPermission(store, UserRole.EDITOR, key);
      // '*.read' in DB should NOT grant blog.read — no glob matching
      // Falls back to default matrix for EDITOR
      // EDITOR default: blog.read, blog.create, blog.delete, deals.read, retainers.read, outreach.read, consent.read, dsar.read, ropa.read
      const editorDefaults = [
        'blog.read',
        'blog.create',
        'blog.delete',
        'deals.read',
        'retainers.read',
        'outreach.read',
        'consent.read',
        'dsar.read',
        'ropa.read',
      ];
      // result must equal what the default matrix says (no wildcard inflation)
      expect(result).toBe(editorDefaults.includes(key));
      invalidatePermissionCache();
    }
  });

  // Fuzz 5: Non-ADMIN actors trying to change any role×permission → all rejected
  it('[F-5] Non-ADMIN actors cannot change any permission (50 random actors)', () => {
    const nonAdminRoles = ALL_ROLES.filter((r) => r !== UserRole.ADMIN);
    let successes = 0;
    for (let i = 0; i < 50; i++) {
      const actorRole = randomItem(nonAdminRoles);
      const targetRole = randomItem(RBAC_MANAGED_ROLES as unknown as UserRole[]);
      const permKey = randomItem(ALL_KEYS);
      const granted = Math.random() > 0.5;
      const result = validateRbacChange({
        actorId: `actor-${i}`,
        actorRole,
        targetRole,
        permissionKey: permKey,
        granted,
      });
      if (result.valid) successes++;
    }
    expect(successes).toBe(0);
  });

  // Fuzz 6: ADMIN granting non-rbac permissions to any managed role — always valid
  it('[F-6] ADMIN granting non-rbac permissions to managed roles — always valid', () => {
    const nonRbacKeys = ALL_KEYS.filter((k) => k !== 'rbac.read' && k !== 'rbac.write');
    for (let i = 0; i < 100; i++) {
      const targetRole = randomItem(RBAC_MANAGED_ROLES as unknown as UserRole[]);
      const permKey = randomItem(nonRbacKeys);
      const granted = Math.random() > 0.5;
      const result = validateRbacChange({
        actorId: 'admin-1',
        actorRole: UserRole.ADMIN,
        targetRole,
        permissionKey: permKey,
        granted,
      });
      expect(result.valid).toBe(true);
    }
  });
});
