import React, { useState } from 'react';
import { DealKanbanBoard } from '../../components/admin/deals/DealKanbanBoard';
import { DealDetailDrawer } from '../../components/admin/deals/DealDetailDrawer';
import type { DealRow, DealStage } from '../../types/deal';

const MOCK_DEALS: DealRow[] = [];

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<DealRow[]>(MOCK_DEALS);
  const [selectedDeal, setSelectedDeal] = useState<DealRow | null>(null);

  function handleStageChange(dealId: string, newStage: DealStage) {
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)));
  }

  return (
    <div data-testid="admin-deals-page" className="flex flex-col h-full">
      <div className="flex items-center justify-between p-fib-5 border-b border-zinc-800">
        <h1 className="text-golden-lg font-semibold text-zinc-100">M&A Süreçleri</h1>
      </div>

      <div className="flex-1 overflow-hidden p-fib-5">
        <DealKanbanBoard deals={deals} onStageChange={handleStageChange} />
      </div>

      <DealDetailDrawer deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
    </div>
  );
}
