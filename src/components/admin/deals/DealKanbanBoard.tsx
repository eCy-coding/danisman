import React from 'react';
import { DndContext, DragEndEvent, useDroppable } from '@dnd-kit/core';
import { cn } from '../../../lib/utils';
import type { DealRow, DealStage } from '../../../types/deal';
import { DEAL_STAGES, DEAL_STAGE_LABELS } from '../../../types/deal';
import { DealCard } from './DealCard';

interface KanbanColumnProps {
  stage: DealStage;
  deals: DealRow[];
  onStageChange: (dealId: string, newStage: DealStage) => void;
}

function KanbanColumn({ stage, deals, onStageChange }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      data-testid={`kanban-col-${stage}`}
      className={cn(
        'flex flex-col min-w-[220px] rounded-lg bg-zinc-900 border border-zinc-800 p-fib-4',
        isOver && 'border-amber-500 bg-zinc-800',
      )}
    >
      <div className="flex items-center justify-between mb-fib-4">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
          {DEAL_STAGE_LABELS[stage]}
        </h2>
        <span className="text-xs text-zinc-600 bg-zinc-800 rounded px-fib-2">{deals.length}</span>
      </div>
      <div className="flex flex-col gap-fib-3">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onStageChange={onStageChange} />
        ))}
      </div>
    </div>
  );
}

interface DealKanbanBoardProps {
  deals: DealRow[];
  onStageChange: (dealId: string, newStage: DealStage) => void;
}

export function DealKanbanBoard({ deals, onStageChange }: DealKanbanBoardProps) {
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const newStage = over.id as DealStage;
    const dealId = active.id as string;
    const deal = deals.find((d) => d.id === dealId);
    if (deal && deal.stage !== newStage) {
      onStageChange(dealId, newStage);
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div
        data-testid="deal-kanban-board"
        className="flex gap-fib-5 overflow-x-auto pb-fib-5"
        role="region"
        aria-label="M&A Süreç Panosu"
      >
        {DEAL_STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            deals={deals.filter((d) => d.stage === stage)}
            onStageChange={onStageChange}
          />
        ))}
      </div>
    </DndContext>
  );
}
