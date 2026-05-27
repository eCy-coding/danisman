import React from 'react';
import { cn } from '../../../lib/utils';

interface DSARCountdownBadgeProps {
  deadlineAt: string | Date;
  extended: boolean;
}

export function DSARCountdownBadge({ deadlineAt, extended }: DSARCountdownBadgeProps) {
  const deadline = deadlineAt instanceof Date ? deadlineAt : new Date(deadlineAt);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  let colorClass: string;
  let label: string;

  if (diffMs <= 0) {
    colorClass = 'text-gray-500 line-through';
    label = 'SLA Aşıldı';
  } else if (diffDays <= 1) {
    colorClass = 'text-red-400';
    label = `${Math.ceil(diffDays * 24)}s kaldı`;
  } else if (diffDays <= 7) {
    colorClass = 'text-yellow-400';
    label = `${Math.ceil(diffDays)} gün kaldı`;
  } else {
    colorClass = 'text-green-400';
    label = `${Math.ceil(diffDays)} gün kaldı`;
  }

  return (
    <span className="inline-flex items-center gap-fib-2">
      <span className={cn('text-sm font-medium tabular-nums', colorClass)}>{label}</span>
      {extended && (
        <span className="text-xs rounded px-fib-2 py-0.5 bg-yellow-900/40 text-yellow-300 border border-yellow-700/50">
          Uzatılmış
        </span>
      )}
    </span>
  );
}
