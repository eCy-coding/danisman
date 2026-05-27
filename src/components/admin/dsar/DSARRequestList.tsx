import React from 'react';
import { cn } from '../../../lib/utils';
import { DSARCountdownBadge } from './DSARCountdownBadge';

export interface DSARListItem {
  id: string;
  requesterEmail: string;
  requesterName: string;
  requestType: string;
  receivedAt: string;
  slaDeadline: string;
  extendedOnce: boolean;
  status: string;
  assignedTo?: string;
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  ACCESS: 'Erişim',
  RECTIFICATION: 'Düzeltme',
  ERASURE: 'Silme',
  RESTRICTION: 'Kısıtlama',
  PORTABILITY: 'Taşınabilirlik',
  OBJECTION: 'İtiraz',
  AUTOMATED_DECISION: 'Otomatik Karar',
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  RECEIVED: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
  UNDER_REVIEW: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50',
  RESPONDED: 'bg-green-900/50 text-green-300 border-green-700/50',
  CLOSED: 'bg-gray-800 text-gray-400 border-gray-600/50',
  REJECTED: 'bg-red-900/50 text-red-300 border-red-700/50',
};

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Alındı',
  UNDER_REVIEW: 'İnceleniyor',
  RESPONDED: 'Yanıtlandı',
  CLOSED: 'Kapatıldı',
  REJECTED: 'Reddedildi',
};

interface DSARRequestListProps {
  requests: DSARListItem[];
  onSelect: (id: string) => void;
}

export function DSARRequestList({ requests, onSelect }: DSARRequestListProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            <th className="p-fib-4 text-left font-medium text-gray-300">Başvuru Sahibi</th>
            <th className="p-fib-4 text-left font-medium text-gray-300">Tür</th>
            <th className="p-fib-4 text-left font-medium text-gray-300">Alındı</th>
            <th className="p-fib-4 text-left font-medium text-gray-300">SLA</th>
            <th className="p-fib-4 text-left font-medium text-gray-300">Durum</th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 && (
            <tr>
              <td colSpan={5} className="p-fib-6 text-center text-gray-500">
                Başvuru bulunamadı.
              </td>
            </tr>
          )}
          {requests.map((req) => (
            <tr
              key={req.id}
              onClick={() => onSelect(req.id)}
              className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
            >
              <td className="p-fib-4">
                <div className="font-medium text-white">{req.requesterName}</div>
                <div className="text-gray-400 text-xs">{req.requesterEmail}</div>
              </td>
              <td className="p-fib-4 text-gray-200">
                {REQUEST_TYPE_LABELS[req.requestType] ?? req.requestType}
              </td>
              <td className="p-fib-4 text-gray-300">
                {new Date(req.receivedAt).toLocaleDateString('tr-TR')}
              </td>
              <td className="p-fib-4">
                <DSARCountdownBadge deadlineAt={req.slaDeadline} extended={req.extendedOnce} />
              </td>
              <td className="p-fib-4">
                <span
                  className={cn(
                    'inline-flex items-center rounded px-fib-2 py-0.5 text-xs border',
                    STATUS_BADGE_STYLES[req.status] ?? 'bg-gray-800 text-gray-400 border-gray-600',
                  )}
                >
                  {STATUS_LABELS[req.status] ?? req.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
