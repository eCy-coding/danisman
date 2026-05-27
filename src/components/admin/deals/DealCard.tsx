import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../../lib/utils';
import type { DealRow, DealStage } from '../../../types/deal';
import { DEAL_STAGE_LABELS } from '../../../types/deal';
import { SuccessFeeCalculator } from './SuccessFeeCalculator';

interface DealCardProps {
  deal: DealRow;
  onStageChange: (dealId: string, newStage: DealStage) => void;
}

export function DealCard({ deal, onStageChange }: DealCardProps) {
  const [showFee, setShowFee] = useState(false);
  const [announce, setAnnounce] = useState('');

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: { deal },
  });

  const style = transform ? { transform: CSS.Transform.toString(transform) } : undefined;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Advance to next stage on Enter (keyboard a11y alternative to drag)
      const stages: DealStage[] = [
        'DISCOVERY',
        'DD',
        'NEGOTIATION',
        'SPA_SIGNING',
        'CLOSING',
        'CLOSED_WON',
        'CLOSED_LOST',
      ];
      const idx = stages.indexOf(deal.stage);
      const nextStage = stages[idx + 1];
      if (idx < stages.length - 1 && nextStage !== undefined) {
        setAnnounce(
          `${deal.name} süreci ${DEAL_STAGE_LABELS[deal.stage]}'den ${DEAL_STAGE_LABELS[nextStage]}'ya taşındı`,
        );
        onStageChange(deal.id, nextStage);
      }
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`deal-card-${deal.id}`}
      aria-label={`${deal.name} — ${DEAL_STAGE_LABELS[deal.stage]}`}
      onKeyDown={handleKeyDown}
      className={cn(
        'bg-zinc-800 border border-zinc-700 rounded-lg p-fib-4 cursor-grab select-none',
        'hover:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500',
        isDragging && 'opacity-50 ring-2 ring-amber-500',
      )}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
    >
      <p className="text-sm font-medium text-zinc-100 leading-snug mb-fib-3">{deal.name}</p>

      {deal.transactionValueUsd !== undefined && (
        <button
          type="button"
          onClick={() => setShowFee((v) => !v)}
          className="text-xs text-amber-400 hover:text-amber-300 mb-fib-2"
          aria-expanded={showFee}
        >
          ${(deal.transactionValueUsd / 1_000_000).toFixed(0)}M • Başarı Ücreti ▾
        </button>
      )}

      {showFee && deal.transactionValueUsd !== undefined && (
        <SuccessFeeCalculator
          transactionValue={deal.transactionValueUsd}
          feePct={deal.successFeePct}
          className="mt-fib-2"
        />
      )}

      <span role="status" aria-live="polite" className="sr-only">
        {announce}
      </span>

      {deal.stage === 'CLOSED_LOST' && (
        <div data-testid="closed-lost-reason" className="mt-fib-2 text-xs text-red-400">
          {deal.closedLostReason ? `Sebep: ${deal.closedLostReason}` : 'Sebep girilmedi ⚠'}
        </div>
      )}
    </div>
  );
}
