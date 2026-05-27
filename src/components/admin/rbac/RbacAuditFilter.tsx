/**
 * RbacAuditFilter — M5 Audit Log RBAC filter bar
 *
 * Renders RBAC_CHANGE | VIEW_AS_STARTED | VIEW_AS_ENDED filter buttons.
 * When RBAC_CHANGE is active and entries are provided, shows CSV export.
 *
 * KVKK: actorId masked to first 4 chars + "****" in CSV output.
 */

import React from 'react';
import { Download } from 'lucide-react';
import { cn } from '../../../lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RbacAuditEntry {
  id: string;
  actorId: string;
  targetRole: string;
  targetPermissionKey: string;
  previousValue: boolean;
  newValue: boolean;
  reason: string | null;
  createdAt: string;
}

export interface RbacAuditFilterProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  /** Provided when RBAC_CHANGE is active — enables CSV export */
  entries?: RbacAuditEntry[];
}

// ─── Filter config ────────────────────────────────────────────────────────────

const RBAC_FILTERS = [
  {
    key: 'RBAC_CHANGE',
    label: 'RBAC Değişikliği',
    bg: 'bg-purple-500/15 border-purple-500/30',
    text: 'text-purple-400',
  },
  {
    key: 'VIEW_AS_STARTED',
    label: 'Görünüm Başladı',
    bg: 'bg-sky-500/15 border-sky-500/30',
    text: 'text-sky-400',
  },
  {
    key: 'VIEW_AS_ENDED',
    label: 'Görünüm Bitti',
    bg: 'bg-slate-500/15 border-slate-500/30',
    text: 'text-slate-300',
  },
] as const;

// ─── CSV helpers ──────────────────────────────────────────────────────────────

/** KVKK: mask actorId — first 4 chars + "****" */
function maskActorId(actorId: string): string {
  return `${actorId.slice(0, 4)}****`;
}

function exportCsv(entries: RbacAuditEntry[]): void {
  const header =
    'id,actorId,targetRole,targetPermissionKey,previousValue,newValue,reason,createdAt';
  const rows = entries.map((e) =>
    [
      e.id,
      maskActorId(e.actorId),
      e.targetRole,
      e.targetPermissionKey,
      String(e.previousValue),
      String(e.newValue),
      e.reason ?? '',
      e.createdAt,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  );

  const csv = [header, ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `rbac-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();

  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

export const RbacAuditFilter: React.FC<RbacAuditFilterProps> = ({
  activeFilter,
  onFilterChange,
  entries,
}) => {
  const isRbacActive = activeFilter === 'RBAC_CHANGE';
  const hasEntries = (entries ?? []).length > 0;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex flex-wrap gap-2">
        {RBAC_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => onFilterChange(f.key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
              activeFilter === f.key
                ? `${f.bg} ${f.text}`
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* CSV export — only when RBAC_CHANGE filter active */}
      {isRbacActive && (
        <button
          type="button"
          disabled={!hasEntries}
          onClick={() => exportCsv(entries ?? [])}
          className={cn(
            'ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
            'transition-colors border',
            hasEntries
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
              : 'bg-white/3 border-white/10 text-slate-600 cursor-not-allowed',
          )}
        >
          <Download size={12} />
          CSV İndir
        </button>
      )}
    </div>
  );
};
