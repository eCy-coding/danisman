/**
 * AdminVERBISPage — M5 VERBİS Bildirim Takibi admin page.
 *
 * Route: /admin/verbis
 * Backend: GET /api/admin/verbis/status, PATCH /api/admin/verbis/status,
 *           GET /api/admin/verbis/annual-review
 *
 * Sayfa yapısı:
 *   - Başlık: "VERBİS Bildirim Takibi"
 *   - VERBISStatusCard
 *   - VERBISAnnualReview (only when REGISTERED)
 *   - VERBISExportButton
 *   - "Kayıt Durumunu Güncelle" form
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { VERBISStatusCard } from '../../components/admin/verbis/VERBISStatusCard';
import { VERBISAnnualReview } from '../../components/admin/verbis/VERBISAnnualReview';
import { VERBISExportButton } from '../../components/admin/verbis/VERBISExportButton';
import { cn } from '../../lib/utils';

interface VERBISStatusResponse {
  status: string;
  data: {
    verbisStatus: 'PENDING' | 'REGISTERED';
    sicilNo: string | null;
    registeredAt: string | null;
    lastUpdatedAt: string | null;
  };
}

interface VERBISAnnualReviewResponse {
  status: string;
  data: {
    nextReviewDue: string | null;
    overdue: boolean;
    message?: string;
  };
}

export const AdminVERBISPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState<'PENDING' | 'REGISTERED'>('PENDING');
  const [newSicilNo, setNewSicilNo] = useState('');
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  const {
    data: statusData,
    isLoading: statusLoading,
    isError: statusError,
  } = useQuery<VERBISStatusResponse>({
    queryKey: ['verbis-status'],
    queryFn: () =>
      apiClient.get('/admin/verbis/status').then((r) => r.data as VERBISStatusResponse),
  });

  const { data: reviewData, isLoading: reviewLoading } = useQuery<VERBISAnnualReviewResponse>({
    queryKey: ['verbis-annual-review'],
    queryFn: () =>
      apiClient
        .get('/admin/verbis/annual-review')
        .then((r) => r.data as VERBISAnnualReviewResponse),
    enabled: statusData?.data?.verbisStatus === 'REGISTERED',
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { status: 'PENDING' | 'REGISTERED'; sicilNo?: string }) =>
      apiClient.patch('/admin/verbis/status', payload).then((r) => r.data),
    onSuccess: () => {
      setUpdateMessage('VERBİS durumu başarıyla güncellendi.');
      void queryClient.invalidateQueries({ queryKey: ['verbis-status'] });
      void queryClient.invalidateQueries({ queryKey: ['verbis-annual-review'] });
    },
    onError: () => {
      setUpdateMessage('Güncelleme başarısız. Lütfen tekrar deneyin.');
    },
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateMessage(null);
    updateMutation.mutate({
      status: newStatus,
      ...(newSicilNo.trim() ? { sicilNo: newSicilNo.trim() } : {}),
    });
  };

  const verbisStatus = statusData?.data?.verbisStatus ?? 'PENDING';
  const sicilNo = statusData?.data?.sicilNo ?? undefined;
  const registeredAt = statusData?.data?.registeredAt ?? undefined;

  return (
    <div className="flex flex-col gap-fib-7 p-fib-6">
      {/* Page header */}
      <div className="flex items-center gap-fib-4">
        <Shield className="h-6 w-6 text-blue-400" aria-hidden="true" />
        <h1 className="text-golden-lg font-bold text-white">VERBİS Bildirim Takibi</h1>
      </div>

      {statusLoading && <p className="text-sm text-gray-400">VERBİS durumu yükleniyor…</p>}

      {statusError && (
        <div className="rounded-lg border border-red-700/40 bg-red-900/20 p-fib-4">
          <p className="text-sm text-red-300">VERBİS durumu alınamadı.</p>
        </div>
      )}

      {!statusLoading && !statusError && (
        <>
          {/* Current status card */}
          <VERBISStatusCard status={verbisStatus} sicilNo={sicilNo} registeredAt={registeredAt} />

          {/* Annual review — only when registered and data is available */}
          {verbisStatus === 'REGISTERED' && !reviewLoading && reviewData?.data?.nextReviewDue && (
            <VERBISAnnualReview
              nextReviewDue={reviewData.data.nextReviewDue}
              overdue={reviewData.data.overdue}
            />
          )}

          {/* Export button */}
          <div className="flex flex-col gap-fib-3">
            <h2 className="text-base font-semibold text-gray-200">ROPA Dışa Aktarma</h2>
            <VERBISExportButton disabled={verbisStatus !== 'REGISTERED'} />
          </div>

          {/* Update form */}
          <div className="flex flex-col gap-fib-4 rounded-lg border border-gray-700/40 bg-gray-800/30 p-fib-6">
            <h2 className="text-base font-semibold text-gray-200">Kayıt Durumunu Güncelle</h2>
            <form onSubmit={handleUpdate} className="flex flex-col gap-fib-4">
              {/* Status select */}
              <div className="flex flex-col gap-fib-2">
                <label htmlFor="verbis-status-select" className="text-sm text-gray-400">
                  VERBİS Durumu
                </label>
                <select
                  id="verbis-status-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as 'PENDING' | 'REGISTERED')}
                  className="rounded border border-gray-600/50 bg-gray-900 px-fib-3 py-fib-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="PENDING">Kayıt Bekleniyor (PENDING)</option>
                  <option value="REGISTERED">Kayıtlı (REGISTERED)</option>
                </select>
              </div>

              {/* Sicil No — shown when REGISTERED selected */}
              {newStatus === 'REGISTERED' && (
                <div className="flex flex-col gap-fib-2">
                  <label htmlFor="verbis-sicil-no" className="text-sm text-gray-400">
                    Sicil No (opsiyonel)
                  </label>
                  <input
                    id="verbis-sicil-no"
                    type="text"
                    value={newSicilNo}
                    onChange={(e) => setNewSicilNo(e.target.value)}
                    placeholder="Örn: TR-2024-12345"
                    className="rounded border border-gray-600/50 bg-gray-900 px-fib-3 py-fib-2 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={updateMutation.isPending}
                className={cn(
                  'inline-flex w-fit items-center rounded border px-fib-5 py-fib-3 text-sm font-medium transition-colors',
                  updateMutation.isPending
                    ? 'cursor-not-allowed border-gray-600/40 bg-gray-800/40 text-gray-500'
                    : 'border-blue-600/50 bg-blue-900/20 text-blue-200 hover:bg-blue-800/30',
                )}
              >
                {updateMutation.isPending ? 'Güncelleniyor…' : 'Kayıt Durumunu Güncelle'}
              </button>

              {updateMessage && (
                <p
                  className={cn(
                    'text-sm',
                    updateMessage.includes('başarıyla') ? 'text-green-400' : 'text-red-400',
                  )}
                >
                  {updateMessage}
                </p>
              )}
            </form>
          </div>
        </>
      )}
    </div>
  );
};
