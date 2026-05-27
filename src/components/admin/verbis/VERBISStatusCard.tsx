/**
 * VERBISStatusCard — shows current VERBİS registration status.
 *
 * PENDING: amber card with "Kayıt Bekleniyor" + external link to verbis.kvkk.gov.tr
 * REGISTERED: green card with "Kayıtlı" + sicil no + registration date
 */

import React from 'react';
import { ExternalLink, CheckCircle, Clock } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface VERBISStatusCardProps {
  status: 'PENDING' | 'REGISTERED';
  sicilNo?: string;
  registeredAt?: string;
}

export const VERBISStatusCard: React.FC<VERBISStatusCardProps> = ({
  status,
  sicilNo,
  registeredAt,
}) => {
  const isPending = status === 'PENDING';

  return (
    <div
      className={cn(
        'flex flex-col gap-fib-4 rounded-lg border p-fib-6',
        isPending ? 'border-yellow-700/40 bg-yellow-900/20' : 'border-green-700/40 bg-green-900/20',
      )}
    >
      {/* Status header */}
      <div className="flex items-center gap-fib-3">
        {isPending ? (
          <Clock className="h-5 w-5 text-yellow-400" aria-hidden="true" />
        ) : (
          <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
        )}
        <span
          className={cn(
            'font-semibold text-golden-base',
            isPending ? 'text-yellow-300' : 'text-green-300',
          )}
        >
          {isPending ? '⏳ Kayıt Bekleniyor' : '✓ Kayıtlı'}
        </span>
      </div>

      {/* Body */}
      {isPending ? (
        <div className="flex flex-col gap-fib-3">
          <p className="text-sm text-gray-400">
            eCyPro, VERBİS (Veri Sorumluları Sicil Bilgi Sistemi) kaydı henüz tamamlanmamış. Kayıt
            olmak için KVKK portalını ziyaret edin.
          </p>
          <a
            href="https://verbis.kvkk.gov.tr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-fib-2 rounded border border-yellow-600/50 bg-yellow-800/30 px-fib-4 py-fib-2 text-sm font-medium text-yellow-200 transition-colors hover:bg-yellow-700/40"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Başvuru Yap
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-fib-2">
          {sicilNo && (
            <div className="flex items-center gap-fib-2 text-sm">
              <span className="text-gray-400">Sicil No:</span>
              <span className="font-mono font-medium text-green-200">{sicilNo}</span>
            </div>
          )}
          {registeredAt && (
            <div className="flex items-center gap-fib-2 text-sm">
              <span className="text-gray-400">Kayıt Tarihi:</span>
              <span className="text-gray-200">
                {new Date(registeredAt).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
