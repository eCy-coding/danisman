/**
 * M4: ViewAsLauncher — dropdown to select a role and enter View-As simulation.
 *
 * Allows admin to simulate another role's permissions without logging in as that user.
 * Sends POST /api/admin/rbac/view-as and updates ViewAsContext.
 *
 * A11y: native <select> + <button> — fully keyboard accessible.
 */

import React, { useState } from 'react';
import { Eye, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useViewAs } from '../../../lib/view-as-context';
import type { UserRole } from '../../../lib/rbac';

const SELECTABLE_ROLES: UserRole[] = ['USER', 'CLIENT', 'CONSULTANT', 'ADMIN'];

export const ViewAsLauncher: React.FC = () => {
  const { startViewAs, isViewAsMode } = useViewAs();
  const [selectedRole, setSelectedRole] = useState<UserRole>('CONSULTANT');
  const [isPending, setIsPending] = useState(false);

  const handleStart = async () => {
    if (isViewAsMode) return;
    setIsPending(true);
    try {
      await startViewAs(selectedRole);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="view-as-role-select" className="text-xs text-slate-400 whitespace-nowrap">
        Rol Olarak Görüntüle:
      </label>

      <select
        id="view-as-role-select"
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value as UserRole)}
        disabled={isViewAsMode || isPending}
        className={cn(
          'bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300',
          'px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary',
          'disabled:opacity-40 disabled:cursor-not-allowed',
        )}
        aria-label="Simüle edilecek rolü seçin"
      >
        {SELECTABLE_ROLES.map((role) => (
          <option key={role} value={role} className="bg-neutral text-slate-200">
            {role}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={handleStart}
        disabled={isViewAsMode || isPending}
        className={cn(
          'flex items-center gap-2 text-xs font-medium',
          'px-4 py-2 rounded-lg border transition-colors',
          'bg-amber-500/10 border-amber-500/30 text-amber-300',
          'hover:bg-amber-500/20 hover:border-amber-500/50',
          'focus:outline-none focus:ring-2 focus:ring-amber-400',
          'disabled:opacity-40 disabled:cursor-not-allowed',
        )}
        aria-label={`${selectedRole} rolünde görüntülemeyi başlat`}
      >
        {isPending ? (
          <Loader2 size={13} className="animate-spin" aria-hidden="true" />
        ) : (
          <Eye size={13} aria-hidden="true" />
        )}
        Başlat
      </button>
    </div>
  );
};
