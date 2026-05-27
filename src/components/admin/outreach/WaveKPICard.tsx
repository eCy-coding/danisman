import React from 'react';
import { cn } from '../../../lib/utils';

interface WaveKPICardProps {
  label: string;
  value: number;
  color?: string;
}

export function WaveKPICard({ label, value, color }: WaveKPICardProps) {
  return (
    <div
      data-testid="wave-kpi-card"
      className="flex flex-col items-center gap-fib-2 rounded-md bg-[#2A2B2C] p-fib-5"
    >
      <span className={cn('text-2xl font-bold tabular-nums', color ?? 'text-[#E5E7EB]')}>
        {(value * 100).toFixed(1)}%
      </span>
      <span className="text-xs text-[#9CA3AF]">{label}</span>
    </div>
  );
}
