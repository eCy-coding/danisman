/**
 * P36-T10: useCan — React hook for role-based permission checks
 *
 * Reads the current user's role from AuthContext/localStorage
 * and returns a memoized `can(permission)` checker.
 *
 * Usage:
 *   const can = useCan();
 *   if (can('blog:publish')) { ... }
 *   if (can('user:role:change')) { ... }
 *
 * Returns a stable function reference (useCallback) — safe in dependency arrays.
 */

import { useCallback } from 'react';
import { can as checkPermission, type UserRole } from '../lib/rbac';

function readRoleFromStorage(): UserRole | null {
  try {
    const raw = localStorage.getItem('ecypro_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { role?: string };
    return (parsed.role as UserRole) ?? null;
  } catch {
    return null;
  }
}

export function useCan() {
  const role = readRoleFromStorage();

  const canCheck = useCallback(
    (permission: string): boolean => checkPermission(role, permission),
    [role],
  );

  return canCheck;
}

export function useRole(): UserRole | null {
  return readRoleFromStorage();
}
