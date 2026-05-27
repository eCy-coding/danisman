/**
 * M3: PermissionGroupCollapse — collapsible section for a resource group
 * (e.g. "blog", "users", "deals") inside the permission matrix table.
 *
 * Renders as <tbody> rows so the table structure stays valid.
 * The group header row uses a <th scope="rowgroup"> for a11y.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { PermissionToggleCell } from './PermissionToggleCell';
import type { UserRole } from '../../../lib/rbac';

interface Permission {
  id: string;
  key: string;
  resource: string;
  action: string;
  description: string;
}

interface PermissionGroupCollapseProps {
  resource: string;
  permissions: Permission[];
  roles: UserRole[];
  matrix: Record<UserRole, Record<string, boolean>>;
  onToggle: (role: UserRole, permissionKey: string, newGranted: boolean) => void;
  defaultOpen?: boolean;
}

export const PermissionGroupCollapse: React.FC<PermissionGroupCollapseProps> = ({
  resource,
  permissions,
  roles,
  matrix,
  onToggle,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleGroup = () => setIsOpen((prev) => !prev);

  return (
    <tbody>
      {/* Group header row */}
      <tr className="bg-white/5">
        <th scope="rowgroup" colSpan={roles.length + 1} className="py-2 px-4 text-left">
          <button
            type="button"
            onClick={toggleGroup}
            aria-expanded={isOpen}
            className={cn(
              'flex items-center gap-2 text-xs font-bold uppercase tracking-widest',
              'text-slate-300 hover:text-white transition-colors',
            )}
          >
            {isOpen ? (
              <ChevronDown size={14} aria-hidden="true" />
            ) : (
              <ChevronRight size={14} aria-hidden="true" />
            )}
            {resource}
            <span className="text-slate-600 font-normal normal-case tracking-normal">
              ({permissions.length})
            </span>
          </button>
        </th>
      </tr>

      {/* Permission rows — hidden when collapsed */}
      {isOpen &&
        permissions.map((perm) => (
          <tr key={perm.id} className="border-t border-white/5 hover:bg-white/3 transition-colors">
            {/* Permission label */}
            <td className="py-3 px-4">
              <div>
                <span className="text-xs font-mono text-slate-300">{perm.key}</span>
                {perm.description && (
                  <p className="text-[11px] text-slate-500 mt-0.5">{perm.description}</p>
                )}
              </div>
            </td>

            {/* One cell per role */}
            {roles.map((role) => (
              <PermissionToggleCell
                key={role}
                role={role}
                permissionKey={perm.key}
                granted={matrix[role]?.[perm.key] ?? false}
                permissionDescription={perm.description}
                onToggle={onToggle}
              />
            ))}
          </tr>
        ))}
    </tbody>
  );
};
