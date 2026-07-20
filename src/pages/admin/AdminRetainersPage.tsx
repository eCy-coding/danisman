import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { CurrencyToggle } from '../../components/admin/retainer/CurrencyToggle';
import { RetainerListTable } from '../../components/admin/retainer/RetainerListTable';
import { RetainerDetailDrawer } from '../../components/admin/retainer/RetainerDetailDrawer';
import { AdminQueryState } from '../../components/admin/ui';
import type { Currency, RetainerRow, RetainerStatus } from '../../types/revenue';
import type { DealType, DealStage } from '../../types/deal';

// Raw Prisma shapes as returned by GET /admin/retainers + GET /admin/deals.
// Decimal fields are serialized as strings over JSON — converted in the
// mapping below rather than trusted as numbers.
interface RetainerApiRow {
  id: string;
  dealId: string;
  currency: Currency;
  monthlyAmount: string;
  status: RetainerStatus;
}
interface DealApiRow {
  id: string;
  name: string;
  type: DealType;
  stage: DealStage;
}
interface RetainersListResponse {
  data: RetainerApiRow[];
}
interface DealsListResponse {
  data: DealApiRow[];
}

export function AdminRetainersPage() {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const retainersQuery = useQuery<RetainersListResponse>({
    queryKey: ['admin-retainers'],
    queryFn: () => apiClient.get<RetainersListResponse>('/admin/retainers').then((r) => r.data),
  });

  // Retainer rows only carry a dealId — the deal name is looked up from the
  // real /admin/deals list rather than invented, so a retainer with no
  // resolvable deal shows its id instead of a fabricated company name.
  const dealsQuery = useQuery<DealsListResponse>({
    queryKey: ['admin-deals-lookup'],
    queryFn: () => apiClient.get<DealsListResponse>('/admin/deals').then((r) => r.data),
  });

  const dealNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of dealsQuery.data?.data ?? []) map.set(d.id, d.name);
    return map;
  }, [dealsQuery.data]);

  const retainers: RetainerRow[] = useMemo(
    () =>
      (retainersQuery.data?.data ?? []).map((r) => ({
        id: r.id,
        dealName: dealNameById.get(r.dealId) ?? `Anlaşma ${r.dealId.slice(0, 8)}`,
        currency: r.currency,
        monthlyAmount: Number(r.monthlyAmount),
        status: r.status,
      })),
    [retainersQuery.data, dealNameById],
  );

  const isLoading = retainersQuery.isLoading || dealsQuery.isLoading;
  const isError = retainersQuery.isError || dealsQuery.isError;
  const error = retainersQuery.error ?? dealsQuery.error;
  const retry = () => {
    void retainersQuery.refetch();
    void dealsQuery.refetch();
  };

  return (
    <div data-testid="admin-retainers-page" className="flex flex-col gap-fib-6 p-fib-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#E5E7EB]">Aylık Anlaşmalar</h1>
        <CurrencyToggle value={currency} onChange={setCurrency} />
      </div>

      {/* Table */}
      <AdminQueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        isEmpty={retainers.length === 0}
        onRetry={retry}
        emptyTitle="Henüz aylık anlaşma yok"
        emptyDescription="Yeni bir retainer anlaşması oluşturulduğunda burada listelenecek."
      >
        <RetainerListTable retainers={retainers} onSelectRetainer={setSelectedId} />
      </AdminQueryState>

      {/* Drawer */}
      <RetainerDetailDrawer retainerId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
