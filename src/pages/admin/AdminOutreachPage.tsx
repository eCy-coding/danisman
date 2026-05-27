import React, { useState } from 'react';
import { WaveListTable } from '../../components/admin/outreach/WaveListTable';
import { WaveDetailView } from '../../components/admin/outreach/WaveDetailView';
import type { WaveRow } from '../../types/revenue';

// Placeholder data — replace with API hook when backend endpoint is ready
const MOCK_WAVES: WaveRow[] = [
  {
    id: 'w1',
    name: 'Q1 2026 Dalga',
    status: 'COMPLETED',
    prospects: [
      { id: 'p1', companyName: 'Alpha A.Ş.', status: 'MEETING' },
      { id: 'p2', companyName: 'Beta Ltd.', status: 'REPLIED' },
      { id: 'p3', companyName: 'Gamma Inc.', status: 'DISQUALIFIED' },
    ],
    targetRevenueUsd: 30000,
    realizedRevenueUsd: 18000,
  },
  {
    id: 'w2',
    name: 'Q2 2026 Dalga',
    status: 'LIVE',
    prospects: [
      { id: 'p4', companyName: 'Delta Corp.', status: 'OPENED' },
      { id: 'p5', companyName: 'Epsilon A.Ş.', status: 'SENT' },
    ],
    targetRevenueUsd: 40000,
    realizedRevenueUsd: 0,
  },
];

export function AdminOutreachPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedWave = selectedId ? (MOCK_WAVES.find((w) => w.id === selectedId) ?? null) : null;

  return (
    <div data-testid="admin-outreach-page" className="flex flex-col gap-fib-6 p-fib-7">
      {/* Header */}
      <h1 className="text-xl font-semibold text-[#E5E7EB]">Dalgalar</h1>

      <div className="flex flex-col gap-fib-6 lg:flex-row">
        {/* Dalga listesi */}
        <div className="flex-1">
          <WaveListTable waves={MOCK_WAVES} onSelect={setSelectedId} />
        </div>

        {/* Detail view */}
        {selectedWave && (
          <div className="flex-1 rounded-md border border-[#374151] bg-[#1E1F20] p-fib-6">
            <h2 className="mb-fib-5 text-base font-semibold text-[#E5E7EB]">{selectedWave.name}</h2>
            <WaveDetailView wave={selectedWave} />
          </div>
        )}
      </div>
    </div>
  );
}
