import React, { useState } from 'react';
import { WaveListTable } from '../../components/admin/outreach/WaveListTable';
import { WaveDetailView } from '../../components/admin/outreach/WaveDetailView';
import { useOutreachWaves } from '../../hooks/useOutreachWaves';
import type { WaveRow } from '../../types/revenue';

/**
 * P44-T07 — Outreach waves admin page.
 *
 * Data path: `/api/v1/admin/outreach` via `useOutreachWaves`. The previous
 * MOCK_WAVES placeholder was removed once the backend route was wired in
 * `server/routes/index.ts` (see P44-T07 comment there). If the request fails
 * we render an inline error banner instead of silently masking it with mock
 * data — KVKK launch discipline says no false-green admin views.
 */
export function AdminOutreachPage() {
  const { data: waves, isLoading, isError, error, refetch } = useOutreachWaves();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const safeWaves: WaveRow[] = waves ?? [];
  const selectedWave = selectedId ? (safeWaves.find((w) => w.id === selectedId) ?? null) : null;

  return (
    <div data-testid="admin-outreach-page" className="flex flex-col gap-fib-6 p-fib-7">
      {/* Header */}
      <h1 className="text-xl font-semibold text-[#E5E7EB]">Dalgalar</h1>

      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-md border border-[#374151] bg-[#1E1F20] p-fib-6 text-sm text-[#9CA3AF]"
        >
          Dalgalar yükleniyor…
        </div>
      )}

      {isError && (
        <div
          role="alert"
          className="rounded-md border border-[#7F1D1D] bg-[#1E1F20] p-fib-6 text-sm text-[#FCA5A5]"
        >
          <div className="mb-fib-3 font-semibold">Dalga listesi yüklenemedi.</div>
          <div className="mb-fib-4 text-[#F87171]">
            {error instanceof Error ? error.message : 'Bilinmeyen hata'}
          </div>
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="rounded border border-[#374151] px-fib-5 py-fib-3 text-[#E5E7EB] hover:bg-[#374151]"
          >
            Tekrar dene
          </button>
        </div>
      )}

      {!isLoading && !isError && safeWaves.length === 0 && (
        <div className="rounded-md border border-[#374151] bg-[#1E1F20] p-fib-6 text-sm text-[#9CA3AF]">
          Henüz dalga oluşturulmamış.
        </div>
      )}

      {!isLoading && !isError && safeWaves.length > 0 && (
        <div className="flex flex-col gap-fib-6 lg:flex-row">
          {/* Dalga listesi */}
          <div className="flex-1">
            <WaveListTable waves={safeWaves} onSelect={setSelectedId} />
          </div>

          {/* Detail view */}
          {selectedWave && (
            <div className="flex-1 rounded-md border border-[#374151] bg-[#1E1F20] p-fib-6">
              <h2 className="mb-fib-5 text-base font-semibold text-[#E5E7EB]">
                {selectedWave.name}
              </h2>
              <WaveDetailView wave={selectedWave} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
