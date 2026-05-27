/**
 * M4: useViewAs hook — convenience wrapper around ViewAsContext.
 *
 * Exposes start/end/active role state for View-As simulation mode.
 * Also provides useCanWithViewAs which overrides mutation checks in View-As mode.
 *
 * Why a hook on top of context: follows the pattern of useCan in this codebase,
 * and lets consumers grab just what they need without the full context object.
 */

import { useCallback } from 'react';
import { useViewAs as useViewAsContext } from '../lib/view-as-context';
import { can as checkPermission } from '../lib/rbac';
import type { UserRole } from '../lib/rbac';

export { useViewAs } from '../lib/view-as-context';

// Mutation actions — blocked while in View-As mode to prevent accidental changes
const MUTATION_ACTIONS = [
  'create',
  'edit',
  'delete',
  'publish',
  'activate',
  'role:change',
  'role:promote',
  'manage',
  'export',
];

function isMutationPermission(permission: string): boolean {
  return MUTATION_ACTIONS.some((action) => permission.endsWith(`:${action}`));
}

/**
 * View-As aware permission check.
 * In View-As mode: mutation permissions always return false (read-only simulation).
 * Non-mutation permissions still reflect the simulated role's permissions.
 */
export function useCanWithViewAs(role: UserRole | null | undefined) {
  const { isViewAsMode } = useViewAsContext();

  const canCheck = useCallback(
    (permission: string): boolean => {
      // Block all mutation-type permissions in View-As mode
      if (isViewAsMode && isMutationPermission(permission)) return false;
      return checkPermission(role, permission);
    },
    [role, isViewAsMode],
  );

  return canCheck;
}
