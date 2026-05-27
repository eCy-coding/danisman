/**
 * M3: PermissionToggleCell — individual checkbox cell in the permission matrix.
 *
 * Optimistic update: flips local state immediately, then fires PATCH mutation.
 * Rollback happens on mutation error via TanStack Query's onError callback.
 *
 * A11y:
 *   - Native <input type="checkbox"> for full keyboard + screen-reader support
 *   - aria-label describes the exact permission + role being toggled
 *   - Tab + Space work out of the box with a real checkbox element
 */

import React from 'react';
import { cn } from '../../../lib/utils';
import type { UserRole } from '../../../lib/rbac';

interface PermissionToggleCellProps {
  role: UserRole;
  permissionKey: string;
  granted: boolean;
  permissionDescription: string;
  onToggle: (role: UserRole, permissionKey: string, newGranted: boolean) => void;
  disabled?: boolean;
}

export const PermissionToggleCell: React.FC<PermissionToggleCellProps> = ({
  role,
  permissionKey,
  granted,
  permissionDescription,
  onToggle,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onToggle(role, permissionKey, e.target.checked);
  };

  return (
    <td className="py-3 px-4 text-center">
      <label className="inline-flex items-center justify-center cursor-pointer">
        <input
          type="checkbox"
          checked={granted}
          onChange={handleChange}
          disabled={disabled}
          aria-label={`${role}: ${permissionDescription} (${permissionKey})`}
          className={cn(
            'w-4 h-4 rounded border cursor-pointer transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-neutral',
            granted
              ? 'bg-green-500 border-green-500 text-white accent-green-500'
              : 'bg-transparent border-gray-400 accent-gray-400',
            disabled && 'opacity-40 cursor-not-allowed',
          )}
        />
        <span className="sr-only">
          {granted ? 'İzin verildi' : 'İzin verilmedi'} — {role}: {permissionKey}
        </span>
      </label>
    </td>
  );
};
