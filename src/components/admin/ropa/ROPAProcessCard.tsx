/**
 * ROPAProcessCard — single ROPA process display card.
 *
 * retentionPeriod is code-locked (KVKK m.12) and shown read-only with a lock
 * indicator. Admins may approve the process via the onApprove callback.
 */

import React from 'react';
import { Lock, CheckCircle, Clock, AlertTriangle, Archive, RefreshCw } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface ROPAProcessItem {
  id: string;
  processId: string;
  name: string;
  purpose: string;
  legalBasis: string;
  dataCategories: string[];
  retentionPeriod: string;
  retentionPeriodDays: number;
  retentionLegalSource: string;
  transferLocation: string;
  transferMechanism: string | null;
  dpoApproved: boolean;
  lastReviewedAt: string;
  nextReviewDue: string;
  status: 'ACTIVE' | 'DEPRECATED' | 'UNDER_REVIEW';
}

interface ROPAProcessCardProps {
  process: ROPAProcessItem;
  onApprove: (processId: string) => void;
  readOnly?: boolean;
}

const STATUS_CONFIG: Record<
  ROPAProcessItem['status'],
  { label: string; className: string; icon: React.ReactNode }
> = {
  ACTIVE: {
    label: 'Aktif',
    className: 'bg-green-900/40 text-green-300 border-green-700/40',
    icon: <CheckCircle className="h-3 w-3" />,
  },
  UNDER_REVIEW: {
    label: 'İncelemede',
    className: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
    icon: <RefreshCw className="h-3 w-3" />,
  },
  DEPRECATED: {
    label: 'Kullanım Dışı',
    className: 'bg-gray-800 text-gray-400 border-gray-600/40',
    icon: <Archive className="h-3 w-3" />,
  },
};

function getDaysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function ReviewCountdown({ nextReviewDue }: { nextReviewDue: string }) {
  const days = getDaysUntil(nextReviewDue);
  const overdue = days < 0;
  const soon = days >= 0 && days <= 30;

  return (
    <span
      className={cn(
        'flex items-center gap-fib-1 text-xs',
        overdue ? 'text-red-400' : soon ? 'text-yellow-400' : 'text-zinc-400',
      )}
    >
      {overdue ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      {overdue ? `${Math.abs(days)} gün gecikmiş` : days === 0 ? 'Bugün' : `${days} gün sonra`}
    </span>
  );
}

export function ROPAProcessCard({ process, onApprove, readOnly = false }: ROPAProcessCardProps) {
  const statusCfg = STATUS_CONFIG[process.status];

  return (
    <div
      className={cn(
        'flex flex-col gap-fib-4 rounded-xl border border-white/10 bg-zinc-900 p-fib-5',
        'transition-shadow hover:shadow-lg hover:shadow-black/20',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-fib-3">
        <div className="flex items-center gap-fib-3">
          <span className="rounded-md border border-white/10 bg-zinc-800 px-fib-3 py-fib-1 font-mono text-xs text-zinc-300">
            {process.processId}
          </span>
          <h3 className="font-semibold text-zinc-100">{process.name}</h3>
        </div>
        <span
          className={cn(
            'flex items-center gap-fib-1 rounded-full border px-fib-3 py-fib-1 text-xs font-medium',
            statusCfg.className,
          )}
        >
          {statusCfg.icon}
          {statusCfg.label}
        </span>
      </div>

      {/* Purpose */}
      <p className="text-sm text-zinc-400">{process.purpose}</p>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-fib-3 text-sm">
        <div>
          <p className="text-xs text-zinc-500">Hukuki Dayanak</p>
          <p className="text-zinc-200">{process.legalBasis}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Transfer</p>
          <p className="text-zinc-200">{process.transferLocation}</p>
        </div>

        {/* Retention period — code-locked, read-only */}
        <div className="col-span-2">
          <p className="mb-fib-1 flex items-center gap-fib-2 text-xs text-zinc-500">
            <span>Saklama Süresi</span>
            <span
              className="flex items-center gap-fib-1 rounded border border-amber-700/40 bg-amber-900/20 px-fib-2 py-0.5 text-xs text-amber-400"
              title="KVKK m.12 — Yasal zorunluluk gereği değiştirilemez"
              data-testid="retention-lock-badge"
            >
              <Lock className="h-3 w-3" />
              <span>Kilitli</span>
            </span>
          </p>
          <p className="font-medium text-zinc-200" data-testid="retention-period-value">
            {process.retentionPeriod}
          </p>
          <p className="text-xs text-zinc-500">{process.retentionLegalSource}</p>
        </div>
      </div>

      {/* Categories */}
      {process.dataCategories.length > 0 && (
        <div className="flex flex-wrap gap-fib-2">
          {process.dataCategories.map((cat) => (
            <span
              key={cat}
              className="rounded border border-white/10 bg-zinc-800 px-fib-2 py-0.5 text-xs text-zinc-400"
            >
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/5 pt-fib-3">
        <div className="flex items-center gap-fib-4">
          {/* DPO approved badge */}
          <span
            className={cn(
              'flex items-center gap-fib-1 rounded-full border px-fib-3 py-fib-1 text-xs',
              process.dpoApproved
                ? 'border-green-700/40 bg-green-900/30 text-green-300'
                : 'border-zinc-600/40 bg-zinc-800 text-zinc-500',
            )}
          >
            <CheckCircle className="h-3 w-3" />
            {process.dpoApproved ? 'DPO Onaylı' : 'Onay Bekliyor'}
          </span>
          <ReviewCountdown nextReviewDue={process.nextReviewDue} />
        </div>

        {!readOnly && !process.dpoApproved && (
          <button
            type="button"
            onClick={() => onApprove(process.processId)}
            className={cn(
              'rounded-lg border border-blue-600/50 bg-blue-900/30 px-fib-4 py-fib-2',
              'text-xs font-medium text-blue-300 transition-colors',
              'hover:border-blue-500/70 hover:bg-blue-900/50 hover:text-blue-200',
            )}
          >
            DPO Onayla
          </button>
        )}
      </div>
    </div>
  );
}
