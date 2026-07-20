import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '../../lib/api';
import { DealKanbanBoard } from '../../components/admin/deals/DealKanbanBoard';
import { DealDetailDrawer } from '../../components/admin/deals/DealDetailDrawer';
import { AdminQueryState, getErrorMessage } from '../../components/admin/ui';
import type { DealRow, DealStage } from '../../types/deal';

// Raw Prisma Deal shape from GET /admin/deals — Decimal fields serialize as
// strings and nullable columns as `null` (not `undefined`) over JSON;
// both are normalized in the mapping below.
interface DealApiRow {
  id: string;
  name: string;
  type: DealRow['type'];
  stage: DealStage;
  transactionValueUsd?: string | null;
  successFeePct: string;
  successFeeUsd?: string | null;
  expectedCloseDate?: string | null;
  ownerId: string;
  closedLostReason?: string | null;
}
interface DealsListResponse {
  data: DealApiRow[];
}

export default function AdminDealsPage() {
  const qc = useQueryClient();
  const [selectedDeal, setSelectedDeal] = useState<DealRow | null>(null);
  const [deals, setDeals] = useState<DealRow[]>([]);

  const dealsQuery = useQuery<DealsListResponse>({
    queryKey: ['admin-deals'],
    queryFn: () => apiClient.get<DealsListResponse>('/admin/deals').then((r) => r.data),
  });

  // Kanban drag-drop needs local, immediately-mutable state (optimistic
  // reorder while the PATCH is in flight) — synced from the query result
  // whenever a fresh fetch lands.
  useEffect(() => {
    const rows = dealsQuery.data?.data;
    if (!rows) return;
    setDeals(
      rows.map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        stage: d.stage,
        transactionValueUsd:
          d.transactionValueUsd != null ? Number(d.transactionValueUsd) : undefined,
        successFeePct: Number(d.successFeePct),
        successFeeUsd: d.successFeeUsd != null ? Number(d.successFeeUsd) : undefined,
        expectedCloseDate: d.expectedCloseDate ?? undefined,
        ownerId: d.ownerId,
        closedLostReason: d.closedLostReason ?? undefined,
      })),
    );
  }, [dealsQuery.data]);

  const stageChange = useMutation({
    mutationFn: ({ dealId, stage }: { dealId: string; stage: DealStage }) =>
      apiClient.patch(`/admin/deals/${dealId}/stage`, { stage }),
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Aşama güncellenemedi'));
      void qc.invalidateQueries({ queryKey: ['admin-deals'] });
    },
  });

  function handleStageChange(dealId: string, newStage: DealStage) {
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)));
    stageChange.mutate({ dealId, stage: newStage });
  }

  return (
    <div data-testid="admin-deals-page" className="flex flex-col h-full">
      <div className="flex items-center justify-between p-fib-5 border-b border-zinc-800">
        <h1 className="text-golden-lg font-semibold text-zinc-100">M&A Süreçleri</h1>
      </div>

      <div className="flex-1 overflow-hidden p-fib-5">
        <AdminQueryState
          isLoading={dealsQuery.isLoading}
          isError={dealsQuery.isError}
          error={dealsQuery.error}
          isEmpty={deals.length === 0}
          onRetry={() => void dealsQuery.refetch()}
          emptyTitle="Henüz M&A süreci yok"
          emptyDescription="Yeni bir süreç açıldığında panoda görünecek."
        >
          <DealKanbanBoard deals={deals} onStageChange={handleStageChange} />
        </AdminQueryState>
      </div>

      <DealDetailDrawer deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
    </div>
  );
}
