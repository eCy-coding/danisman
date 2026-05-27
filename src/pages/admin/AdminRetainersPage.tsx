import React, { useState } from 'react';
import { CurrencyToggle } from '../../components/admin/retainer/CurrencyToggle';
import { RetainerListTable } from '../../components/admin/retainer/RetainerListTable';
import { RetainerDetailDrawer } from '../../components/admin/retainer/RetainerDetailDrawer';
import type { Currency, RetainerRow } from '../../types/revenue';

// Placeholder data — replace with API hook when backend endpoint is ready
const MOCK_RETAINERS: RetainerRow[] = [
  { id: 'r1', dealName: 'Örnek A.Ş.', currency: 'USD', monthlyAmount: 4500, status: 'ACTIVE' },
  { id: 'r2', dealName: 'Demo Ltd.', currency: 'TRY', monthlyAmount: 85000, status: 'PAUSED' },
  {
    id: 'r3',
    dealName: 'Test Corp.',
    currency: 'EUR',
    monthlyAmount: 3200,
    status: 'ACTIVE',
    daysOverdue: 7,
  },
];

export function AdminRetainersPage() {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div data-testid="admin-retainers-page" className="flex flex-col gap-fib-6 p-fib-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#E5E7EB]">Aylık Anlaşmalar</h1>
        <CurrencyToggle value={currency} onChange={setCurrency} />
      </div>

      {/* Table */}
      <RetainerListTable retainers={MOCK_RETAINERS} onSelectRetainer={setSelectedId} />

      {/* Drawer */}
      <RetainerDetailDrawer retainerId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
