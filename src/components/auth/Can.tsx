/**
 * P36-T10: <Can> — Declarative Role-Based UI Gating Component
 *
 * Renders `children` only if the current user has the required permission.
 * Optionally renders `fallback` when permission is denied.
 *
 * Usage:
 *   <Can action="blog:publish">
 *     <button type="button">Publish Post</button>
 *   </Can>
 *
 *   <Can action="user:role:change" fallback={<span>No access</span>}>
 *     <RoleDropdown />
 *   </Can>
 *
 *   <Can action="user:role:change" invert>
 *     {/* Renders only when user CANNOT change roles *\/}
 *     <DisabledBadge />
 *   </Can>
 *
 * Note: This is a UI convenience layer only.
 * Backend must independently enforce permissions on every API call.
 */

import React from 'react';
import { useCan } from '../../hooks/useCan';

interface CanProps {
  /** Permission string to check, e.g. "booking:delete" */
  action: string;
  /** Content to render when permission is granted */
  children: React.ReactNode;
  /** Optional content to render when permission is denied */
  fallback?: React.ReactNode;
  /** If true, logic is inverted (render when user does NOT have permission) */
  invert?: boolean;
}

export const Can: React.FC<CanProps> = ({ action, children, fallback = null, invert = false }) => {
  const can = useCan();
  const hasPermission = can(action);
  const shouldRender = invert ? !hasPermission : hasPermission;

  return shouldRender ? <>{children}</> : <>{fallback}</>;
};

export default Can;
