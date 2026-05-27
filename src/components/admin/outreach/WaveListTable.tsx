import React from 'react';
import { cn } from '../../../lib/utils';
import type { WaveRow, WaveStatus } from '../../../types/revenue';

interface WaveListTableProps {
  waves: WaveRow[];
  onSelect: (id: string) => void;
}

const STATUS_BADGE: Record<WaveStatus, string> = {
  DRAFT: 'bg-[#374151] text-[#9CA3AF]',
  SCHEDULED: 'bg-blue-500/20 text-blue-400',
  LIVE: 'bg-green-500/20 text-green-400',
  COMPLETED: 'bg-amber-500/20 text-amber-400',
};

const STATUS_LABEL: Record<WaveStatus, string> = {
  DRAFT: 'Taslak',
  SCHEDULED: 'Planlandı',
  LIVE: 'Canlı',
  COMPLETED: 'Tamamlandı',
};

export function WaveListTable({ waves, onSelect }: WaveListTableProps) {
  return (
    <div
      data-testid="wave-list-table"
      className="overflow-hidden rounded-md border border-[#374151]"
    >
      <table className="w-full text-sm text-[#E5E7EB]">
        <thead>
          <tr className="border-b border-[#374151] bg-[#2A2B2C]">
            <th className="px-fib-5 py-fib-3 text-left font-medium text-[#9CA3AF]">Dalga</th>
            <th className="px-fib-5 py-fib-3 text-center font-medium text-[#9CA3AF]">Durum</th>
            <th className="px-fib-5 py-fib-3 text-right font-medium text-[#9CA3AF]">Aday Sayısı</th>
            <th className="px-fib-5 py-fib-3 text-right font-medium text-[#9CA3AF]">Hedef Gelir</th>
          </tr>
        </thead>
        <tbody>
          {waves.map((w) => (
            <tr
              key={w.id}
              className="cursor-pointer border-b border-[#374151] bg-[#1E1F20] transition-colors hover:bg-[#2A2B2C]"
              onClick={() => onSelect(w.id)}
            >
              <td className="px-fib-5 py-fib-3 font-medium">{w.name}</td>
              <td className="px-fib-5 py-fib-3 text-center">
                <span
                  className={cn(
                    'rounded px-fib-3 py-fib-1 text-xs font-medium',
                    STATUS_BADGE[w.status],
                  )}
                >
                  {STATUS_LABEL[w.status]}
                </span>
              </td>
              <td className="px-fib-5 py-fib-3 text-right">{w.prospects.length}</td>
              <td className="px-fib-5 py-fib-3 text-right">
                {w.targetRevenueUsd !== undefined ? `$${w.targetRevenueUsd.toLocaleString()}` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
