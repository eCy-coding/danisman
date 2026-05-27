/**
 * VERBISAnnualReview — shows annual review countdown for VERBİS registration.
 *
 * overdue:        red warning "Yıllık revize süresi geçti"
 * within 30 days: yellow warning "Revize yaklaşıyor"
 * OK:             green "Revize güncel"
 */

import React from 'react';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface VERBISAnnualReviewProps {
  nextReviewDue: string;
  overdue: boolean;
}

function getDaysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export const VERBISAnnualReview: React.FC<VERBISAnnualReviewProps> = ({
  nextReviewDue,
  overdue,
}) => {
  const daysUntil = getDaysUntil(nextReviewDue);
  const isWarning = !overdue && daysUntil <= 30;
  const _isOk = !overdue && !isWarning;

  const formattedDate = new Date(nextReviewDue).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className={cn(
        'flex flex-col gap-fib-4 rounded-lg border p-fib-6',
        overdue
          ? 'border-red-700/40 bg-red-900/20'
          : isWarning
            ? 'border-yellow-700/40 bg-yellow-900/20'
            : 'border-green-700/40 bg-green-900/20',
      )}
    >
      {/* Section title */}
      <div className="flex items-center gap-fib-3">
        {overdue ? (
          <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
        ) : isWarning ? (
          <Clock className="h-5 w-5 text-yellow-400" aria-hidden="true" />
        ) : (
          <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
        )}
        <span
          className={cn(
            'font-semibold text-golden-base',
            overdue ? 'text-red-300' : isWarning ? 'text-yellow-300' : 'text-green-300',
          )}
        >
          Yıllık Revize
        </span>
      </div>

      {/* Status message */}
      <div className="flex flex-col gap-fib-2">
        <p
          className={cn(
            'text-sm font-medium',
            overdue ? 'text-red-300' : isWarning ? 'text-yellow-300' : 'text-green-300',
          )}
        >
          {overdue
            ? 'Yıllık revize süresi geçti'
            : isWarning
              ? 'Revize yaklaşıyor'
              : 'Revize güncel'}
        </p>

        <p className="text-sm text-gray-400">
          {overdue
            ? `Sonraki revize tarihi ${formattedDate} geçmişti. Lütfen VERBİS kaydınızı güncelleyin.`
            : isWarning
              ? `Sonraki revize tarihi: ${formattedDate} (${daysUntil} gün kaldı)`
              : `Sonraki revize tarihi: ${formattedDate} (${daysUntil} gün kaldı)`}
        </p>
      </div>
    </div>
  );
};
