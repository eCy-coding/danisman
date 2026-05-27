import React from 'react';
import { cn } from '../../../lib/utils';
import type { RetainerRow, RetainerStatus } from '../../../types/revenue';

interface RetainerListTableProps {
  retainers: RetainerRow[];
  onSelectRetainer?: (id: string) => void;
}

const STATUS_BADGE: Record<RetainerStatus, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400',
  PAUSED: 'bg-amber-500/20 text-amber-400',
  TERMINATED: 'bg-red-500/20 text-red-400',
};

const STATUS_LABEL: Record<RetainerStatus, string> = {
  ACTIVE: 'Aktif',
  PAUSED: 'Durduruldu',
  TERMINATED: 'Sonlandırıldı',
};

export function RetainerListTable({ retainers, onSelectRetainer }: RetainerListTableProps) {
  return (
    <div
      data-testid="retainer-list-table"
      className="overflow-hidden rounded-md border border-[#374151]"
    >
      <table className="w-full text-sm text-[#E5E7EB]">
        <thead>
          <tr className="border-b border-[#374151] bg-[#2A2B2C]">
            <th className="px-fib-5 py-fib-3 text-left font-medium text-[#9CA3AF]">Anlaşma</th>
            <th className="px-fib-5 py-fib-3 text-right font-medium text-[#9CA3AF]">Aylık Tutar</th>
            <th className="px-fib-5 py-fib-3 text-center font-medium text-[#9CA3AF]">Durum</th>
            <th className="px-fib-5 py-fib-3 text-center font-medium text-[#9CA3AF]">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {retainers.map((r) => (
            <tr
              key={r.id}
              className="border-b border-[#374151] bg-[#1E1F20] transition-colors hover:bg-[#2A2B2C]"
            >
              <td className="px-fib-5 py-fib-3">
                <button
                  type="button"
                  className="text-left font-medium hover:text-[#3B82F6]"
                  onClick={() => onSelectRetainer?.(r.id)}
                >
                  {r.dealName}
                </button>
              </td>
              <td className="px-fib-5 py-fib-3 text-right">
                {r.monthlyAmount.toLocaleString()} {r.currency}
              </td>
              <td className="px-fib-5 py-fib-3">
                <div className="flex flex-col items-center gap-fib-1">
                  <span
                    className={cn(
                      'rounded px-fib-3 py-fib-1 text-xs font-medium',
                      STATUS_BADGE[r.status],
                    )}
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                  {r.daysOverdue !== undefined && r.daysOverdue > 0 && (
                    <span className="rounded bg-red-500/20 px-fib-2 py-fib-1 text-xs font-medium text-red-400">
                      {r.daysOverdue} gün gecikme
                    </span>
                  )}
                </div>
              </td>
              <td className="px-fib-5 py-fib-3 text-center">
                <button
                  type="button"
                  disabled={r.status === 'PAUSED'}
                  className={cn(
                    'rounded px-fib-4 py-fib-2 text-xs font-medium transition-colors',
                    r.status === 'PAUSED'
                      ? 'cursor-not-allowed bg-[#374151] text-[#6B7280] opacity-50'
                      : 'bg-[#3B82F6] text-white hover:bg-[#2563EB]',
                  )}
                >
                  Yeni Fatura
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
