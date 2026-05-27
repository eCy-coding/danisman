/**
 * M3: RoleHeader — column header cell for a role in the permission matrix.
 *
 * Rendered inside <thead><tr> as <th scope="col">.
 * Badge style varies by privilege level for quick visual scanning.
 */

import React from 'react';
import { cn } from '../../../lib/utils';
import type { UserRole } from '../../../lib/rbac';

interface RoleHeaderProps {
  role: UserRole;
}

const ROLE_STYLE: Record<UserRole, string> = {
  USER: 'text-slate-300 border-slate-600',
  CLIENT: 'text-blue-300 border-blue-600',
  CONSULTANT: 'text-amber-300 border-amber-600',
  ADMIN: 'text-purple-300 border-purple-600',
  PREMIUM: 'text-yellow-300 border-yellow-500',
};

export const RoleHeader: React.FC<RoleHeaderProps> = ({ role }) => {
  return (
    <th
      scope="col"
      className={cn(
        'py-3 px-4 text-center font-semibold text-xs uppercase tracking-widest border-b',
        ROLE_STYLE[role],
      )}
    >
      {role}
    </th>
  );
};
