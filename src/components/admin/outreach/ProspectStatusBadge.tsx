import React from 'react';
import { cn } from '../../../lib/utils';
import type { ProspectStatus } from '../../../types/revenue';

interface ProspectStatusBadgeProps {
  status: ProspectStatus;
}

const STATUS_STYLES: Record<ProspectStatus, string> = {
  SENT: 'bg-[#374151] text-[#9CA3AF]',
  OPENED: 'bg-blue-500/20 text-blue-400',
  REPLIED: 'bg-green-500/20 text-green-400',
  MEETING: 'bg-amber-500/20 text-amber-400',
  DISQUALIFIED: 'bg-red-500/20 text-red-400',
};

const STATUS_LABELS: Record<ProspectStatus, string> = {
  SENT: 'Gönderildi',
  OPENED: 'Açıldı',
  REPLIED: 'Yanıt Aldı',
  MEETING: 'Görüşme',
  DISQUALIFIED: 'Elendi',
};

export function ProspectStatusBadge({ status }: ProspectStatusBadgeProps) {
  return (
    <span
      data-testid="prospect-status-badge"
      className={cn(
        'inline-flex items-center rounded px-fib-3 py-fib-1 text-xs font-medium',
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
