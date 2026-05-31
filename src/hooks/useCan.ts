/**
 * P36-T10 / P0-3: useCan — React hook for role-based permission checks
 *
 * Reads role from Zustand store (NOT localStorage) so client-side
 * localStorage tampering cannot elevate permissions.
 *
 * Usage:
 *   const can = useCan();
 *   if (can('blog:publish')) { ... }
 *   if (can('user:role:change')) { ... }
 */

import { useCallback } from 'react';
import { can as checkPermission, type UserRole } from '../lib/rbac';
import { useAppStore } from '../stores/useAppStore';

export function useCan() {
  const role = useAppStore((s) => s.user?.role as UserRole | undefined) ?? null;

  const canCheck = useCallback(
    (permission: string): boolean => checkPermission(role, permission),
    [role],
  );

  return canCheck;
}

export function useRole(): UserRole | null {
  return useAppStore((s) => s.user?.role as UserRole | undefined) ?? null;
}
