/**
 * M3 — KVKK Rıza Defteri: ReConsentCampaign
 *
 * Shows count of subscribers requiring 12-month re-consent and
 * provides a trigger button for the re-consent campaign.
 * If dueCount === 0, shows "Tüm rızalar güncel" confirmation.
 */

import React from 'react';
import { RefreshCw, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface ReConsentCampaignProps {
  dueCount: number;
  onTriggerCampaign: () => void;
  loading: boolean;
}

export const ReConsentCampaign: React.FC<ReConsentCampaignProps> = ({
  dueCount,
  onTriggerCampaign,
  loading,
}) => {
  if (dueCount === 0) {
    return (
      <div className="flex items-center gap-fib-4 p-fib-5 rounded-xl bg-green-500/10 border border-green-500/25">
        <CheckCircle2 className="w-fib-6 h-fib-6 text-green-400 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-green-400">Tüm rızalar güncel</p>
          <p className="text-xs text-zinc-400 mt-fib-1">
            Yeniden onay gerektiren abone bulunmuyor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-fib-4 p-fib-5 rounded-xl bg-yellow-500/10 border border-yellow-500/25">
      <div className="flex items-center gap-fib-4">
        <RefreshCw className="w-fib-6 h-fib-6 text-yellow-400 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-yellow-400">
            {dueCount} abone yeniden onay gerektiriyor
          </p>
          <p className="text-xs text-zinc-400 mt-fib-1">
            12 ay geçen, aktif abonelere yeniden rıza e-postası gönderilecek.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onTriggerCampaign}
        disabled={loading}
        className={cn(
          'flex items-center justify-center gap-fib-3 px-fib-5 py-fib-3 rounded-lg',
          'text-sm font-semibold transition-all',
          'bg-yellow-500 text-zinc-900 hover:bg-yellow-400 active:scale-95',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        )}
      >
        {loading ? (
          <Loader2 className="w-fib-4 h-fib-4 animate-spin" aria-hidden="true" />
        ) : (
          <RefreshCw className="w-fib-4 h-fib-4" aria-hidden="true" />
        )}
        Yeniden Rıza Kampanyası Başlat
      </button>
    </div>
  );
};
