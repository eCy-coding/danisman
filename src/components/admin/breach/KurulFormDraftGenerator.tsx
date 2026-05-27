import React from 'react';
import { cn } from '../../../lib/utils';

interface BreachIncidentItem {
  id: string;
  detectedAt: string;
  detectionSource: string;
  description: string;
  affectedDataCategories: string[];
  affectedSubjectsCount: number;
  notificationDeadline: string;
  reportedToKurul: boolean;
  reportedAt?: string;
  kurulFormDraft?: string;
  status: 'DETECTED' | 'INVESTIGATING' | 'REPORTED' | 'RESOLVED';
}

interface KurulFormDraftGeneratorProps {
  incident: BreachIncidentItem;
  onReportToKurul: () => void;
  loading: boolean;
}

export function KurulFormDraftGenerator({
  incident,
  onReportToKurul,
  loading,
}: KurulFormDraftGeneratorProps) {
  return (
    <div className="flex flex-col gap-fib-5">
      {/* Draft text area */}
      {incident.kurulFormDraft ? (
        <div>
          <label htmlFor="kurul-draft" className="block text-sm font-medium text-gray-300 mb-1">
            Kurul Bildirim Taslağı
          </label>
          <textarea
            id="kurul-draft"
            readOnly
            value={incident.kurulFormDraft}
            rows={14}
            className={cn(
              'w-full rounded-lg border border-white/10 bg-white/5 px-fib-4 py-fib-3',
              'text-xs text-gray-300 font-mono resize-y',
              'focus:outline-none focus:ring-1 focus:ring-blue-500/60',
            )}
            aria-label="Kurul Bildirim Taslağı"
          />
          <p className="text-xs text-gray-500 mt-1">
            Bu taslak Kurul&apos;un resmi formunun yerini tutmaz.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 bg-white/5 p-fib-5 text-sm text-gray-400">
          Taslak henüz oluşturulmadı. Kurul&apos;a bildirildikten sonra otomatik üretilir.
        </div>
      )}

      {/* Reported status or action button */}
      {incident.reportedToKurul ? (
        <div
          className={cn(
            'inline-flex items-center gap-fib-3 rounded-lg px-fib-5 py-fib-3',
            'bg-green-900/30 border border-green-700/40 text-green-300 text-sm font-medium',
          )}
        >
          ✓ Kurul&apos;a Bildirildi
          {incident.reportedAt && (
            <span className="text-xs text-green-400/70 tabular-nums">
              {new Date(incident.reportedAt).toLocaleString('tr-TR')}
            </span>
          )}
        </div>
      ) : (
        <button
          onClick={onReportToKurul}
          disabled={loading}
          className={cn(
            'inline-flex items-center justify-center gap-fib-2 rounded-lg px-fib-5 py-fib-3',
            'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-sm font-semibold',
            'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          {loading ? 'Bildiriliyor…' : "Kurul'a Bildir"}
        </button>
      )}
    </div>
  );
}
