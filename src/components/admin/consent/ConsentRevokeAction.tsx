/**
 * M3 — KVKK Rıza Defteri: ConsentRevokeAction
 *
 * READ-ONLY display component showing revocation status.
 * Consent records are immutable — no write actions here.
 */

import React from 'react';
import { ShieldCheck, ShieldOff } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface ConsentRevokeActionProps {
  email: string;
  unsubscribedAt?: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export const ConsentRevokeAction: React.FC<ConsentRevokeActionProps> = ({
  email,
  unsubscribedAt,
}) => {
  const isRevoked = Boolean(unsubscribedAt);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-fib-3 px-fib-4 py-fib-2 rounded-lg border text-sm font-medium',
        isRevoked
          ? 'bg-red-500/10 border-red-500/25 text-red-400'
          : 'bg-green-500/10 border-green-500/25 text-green-400',
      )}
      title={email}
    >
      {isRevoked ? (
        <>
          <ShieldOff className="w-fib-4 h-fib-4 shrink-0" aria-hidden="true" />
          <span>
            Rıza Geri Alındı
            {unsubscribedAt && (
              <span className="ml-fib-2 text-xs opacity-80">{formatDate(unsubscribedAt)}</span>
            )}
          </span>
        </>
      ) : (
        <>
          <ShieldCheck className="w-fib-4 h-fib-4 shrink-0" aria-hidden="true" />
          <span>Rıza Aktif</span>
        </>
      )}
    </div>
  );
};
