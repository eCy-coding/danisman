import React from 'react';
import type { DealRow } from '../../../types/deal';
import { DEAL_STAGE_LABELS } from '../../../types/deal';

interface DealDetailDrawerProps {
  deal: DealRow | null;
  onClose: () => void;
}

export function DealDetailDrawer({ deal, onClose }: DealDetailDrawerProps) {
  if (!deal) return null;

  return (
    <div
      data-testid="deal-detail-drawer"
      role="dialog"
      aria-modal="true"
      aria-label={`Süreç Detayı: ${deal.name}`}
      className="fixed inset-y-0 right-0 w-96 bg-zinc-900 border-l border-zinc-800 shadow-2xl z-50 flex flex-col"
    >
      <div className="flex items-center justify-between p-fib-5 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-100 truncate pr-fib-4">{deal.name}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="text-zinc-400 hover:text-zinc-100 text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-fib-5 space-y-fib-5">
        <section>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-fib-3">Aşama</h3>
          <p className="text-sm text-zinc-300">{DEAL_STAGE_LABELS[deal.stage]}</p>
        </section>

        {deal.transactionValueUsd !== undefined && (
          <section>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-fib-3">İşlem Değeri</h3>
            <p className="text-sm text-zinc-300">
              ${deal.transactionValueUsd.toLocaleString('en-US')} USD
            </p>
          </section>
        )}

        <section>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-fib-3">
            Başarı Ücreti Oranı
          </h3>
          <p className="text-sm text-zinc-300">%{(deal.successFeePct * 100).toFixed(1)}</p>
        </section>

        {deal.stage === 'CLOSED_LOST' && (
          <section>
            <h3 className="text-xs font-semibold text-red-400 uppercase mb-fib-3">
              Kaybedilme Sebebi
            </h3>
            <p className="text-sm text-zinc-300">{deal.closedLostReason ?? '—'}</p>
          </section>
        )}
      </div>
    </div>
  );
}
