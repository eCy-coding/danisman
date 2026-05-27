/**
 * RbacAuditDiffDrawer — M5
 *
 * Displays previous → new permission diff for a single RBAC audit entry.
 *   false → true  = "Verildi ✓"  (green)
 *   true  → false = "Kaldırıldı ✗" (red)
 */

import React from 'react';
import { Check, X, ArrowRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { RbacAuditEntry } from './RbacAuditFilter';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RbacAuditDiffDrawerProps {
  entry: RbacAuditEntry;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function BoolBadge({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400">
      <Check size={12} className="text-green-400" />
      <span className="text-green-400">true</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
      <X size={12} />
      false
    </span>
  );
}

function DiffLabel({ previousValue, newValue }: { previousValue: boolean; newValue: boolean }) {
  const granted = !previousValue && newValue;
  const revoked = previousValue && !newValue;

  if (granted) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold',
          'bg-green-500/15 border border-green-500/30 text-green-400',
        )}
      >
        <Check size={10} />
        Verildi
      </span>
    );
  }

  if (revoked) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold',
          'bg-red-500/15 border border-red-500/30 text-red-400',
        )}
      >
        <X size={10} />
        Kaldırıldı
      </span>
    );
  }

  // Unexpected: same value change (shouldn't normally occur)
  return <span className="text-[11px] text-slate-500 italic">Değişim yok</span>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const RbacAuditDiffDrawer: React.FC<RbacAuditDiffDrawerProps> = ({ entry }) => {
  const { targetRole, targetPermissionKey, previousValue, newValue, reason, createdAt, actorId } =
    entry;

  return (
    <div className={cn('rounded-xl border border-white/8 bg-white/2 p-4 space-y-3', 'text-sm')}>
      {/* Role + Permission */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/25 text-purple-300">
          {targetRole}
        </span>
        <ArrowRight size={12} className="text-slate-600 shrink-0" />
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
          {targetPermissionKey}
        </span>
      </div>

      {/* Diff row */}
      <div className="flex items-center gap-3">
        <BoolBadge value={previousValue} />
        <ArrowRight size={12} className="text-slate-600 shrink-0" />
        <BoolBadge value={newValue} />
        <div className="ml-auto">
          <DiffLabel previousValue={previousValue} newValue={newValue} />
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono border-t border-white/5 pt-2 mt-1">
        <span title="Aktör (KVKK maskelendi)">aktör: {actorId.slice(0, 4)}****</span>
        {reason && (
          <span className="text-slate-400">
            <span className="text-slate-600">sebep: </span>
            {reason}
          </span>
        )}
        <span className="ml-auto">
          {new Date(createdAt).toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
};
