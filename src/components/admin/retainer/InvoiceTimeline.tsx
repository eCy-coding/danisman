import React from 'react';
import { cn } from '../../../lib/utils';
import type { MilestoneStatus } from '../../../types/revenue';

interface Milestone {
  name: string;
  pct: number;
  status: MilestoneStatus;
}

interface InvoiceTimelineProps {
  milestones: Milestone[];
}

const STATUS_COLORS: Record<MilestoneStatus, string> = {
  PAID: 'bg-green-500 text-white',
  INVOICED: 'bg-blue-500 text-white',
  PENDING: 'bg-[#4B5563] text-[#9CA3AF]',
  DELAYED: 'bg-red-500 text-white',
};

const STATUS_DOT: Record<MilestoneStatus, string> = {
  PAID: 'bg-green-500',
  INVOICED: 'bg-blue-500',
  PENDING: 'bg-[#4B5563]',
  DELAYED: 'bg-red-500',
};

export function InvoiceTimeline({ milestones }: InvoiceTimelineProps) {
  return (
    <div data-testid="invoice-timeline" className="flex items-center gap-fib-3">
      {milestones.map((m, idx) => (
        <React.Fragment key={m.name}>
          <div className="flex flex-col items-center gap-fib-2">
            <div
              className={cn(
                'flex h-fib-7 w-fib-7 items-center justify-center rounded-full text-xs font-bold',
                STATUS_DOT[m.status],
              )}
            >
              {m.pct}%
            </div>
            <span className={cn('rounded px-fib-2 py-fib-1 text-xs', STATUS_COLORS[m.status])}>
              {m.name}
            </span>
          </div>
          {idx < milestones.length - 1 && <div className="h-px flex-1 bg-[#374151]" />}
        </React.Fragment>
      ))}
    </div>
  );
}
