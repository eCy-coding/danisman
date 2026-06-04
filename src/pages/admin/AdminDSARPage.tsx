/**
 * M2 — KVKK Veri Sahibi Başvuruları (DSAR) admin page.
 *
 * Route: /admin/dsar
 * Backend: /api/admin/dsar
 *
 * Sayfa yapısı:
 *   - Başlık: "Veri Sahibi Başvuruları (DSAR)"
 *   - Toolbar: filtre + "Yeni Başvuru" button
 *   - DSARRequestList tablosu
 *   - DSARDetailDrawer (seçili kayıt)
 *   - DSARRequestForm modal (yeni başvuru)
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DSARRequestList, type DSARListItem } from '../../components/admin/dsar/DSARRequestList';
import { DSARDetailDrawer } from '../../components/admin/dsar/DSARDetailDrawer';
import { DSARRequestForm } from '../../components/admin/dsar/DSARRequestForm';
import { adminFetch } from '../../lib/admin-fetch';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DSARListResponse {
  status: string;
  dsarRequests: DSARListItem[];
}

type DSARStatus = 'ALL' | 'RECEIVED' | 'UNDER_REVIEW' | 'RESPONDED' | 'CLOSED' | 'REJECTED';

const STATUS_FILTER_OPTIONS: { value: DSARStatus; label: string }[] = [
  { value: 'ALL', label: 'Tümü' },
  { value: 'RECEIVED', label: 'Alındı' },
  { value: 'UNDER_REVIEW', label: 'İnceleniyor' },
  { value: 'RESPONDED', label: 'Yanıtlandı' },
  { value: 'CLOSED', label: 'Kapatıldı' },
  { value: 'REJECTED', label: 'Reddedildi' },
];

interface CreateDSARPayload {
  requesterEmail: string;
  requesterName: string;
  requestType: string;
  description?: string;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AdminDSARPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DSARStatus>('ALL');

  // ── Data fetching ────────────────────────────────────────────────────────────
  const queryParams = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
  const { data, isLoading, error } = useQuery<DSARListResponse>({
    queryKey: ['dsar-list', statusFilter],
    queryFn: async () => {
      const res = await adminFetch(`/api/admin/dsar${queryParams}`);
      if (!res.ok) throw new Error('Failed to load DSAR list');
      return res.json() as Promise<DSARListResponse>;
    },
  });

  // ── Create mutation ──────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (payload: CreateDSARPayload) => {
      const res = await adminFetch('/api/admin/dsar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create DSAR');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dsar-list'] });
      setShowNewForm(false);
    },
  });

  return (
    <div className="flex flex-col gap-fib-7 p-fib-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-golden-lg font-semibold text-white">
            Veri Sahibi Başvuruları (DSAR)
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            KVKK m.11 kapsamında alınan İlgili Kişi başvuruları — 30 günlük SLA takibi
          </p>
        </div>

        <button
          onClick={() => setShowNewForm(true)}
          className={cn(
            'inline-flex items-center gap-fib-2 rounded-lg px-fib-5 py-fib-3',
            'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-medium',
            'transition-colors',
          )}
        >
          <Plus size={16} />
          Yeni Başvuru
        </button>
      </div>

      {/* Status filter toolbar */}
      <div className="flex items-center gap-fib-3 flex-wrap">
        {STATUS_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={cn(
              'rounded-full px-fib-4 py-1.5 text-xs font-medium border transition-colors',
              statusFilter === opt.value
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading && <p className="text-gray-400 text-sm">Başvurular yükleniyor…</p>}

      {error && <p className="text-red-400 text-sm">Veri yüklenemedi. Lütfen sayfayı yenileyin.</p>}

      {data && (
        <DSARRequestList requests={data.dsarRequests} onSelect={(id) => setSelectedId(id)} />
      )}

      {/* Detail drawer */}
      <DSARDetailDrawer dsarId={selectedId} onClose={() => setSelectedId(null)} />

      {/* New request modal */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-fib-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowNewForm(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-lg bg-[#1E1F20] rounded-xl border border-white/10 p-fib-7">
            <div className="flex items-center justify-between mb-fib-6">
              <h2 className="text-base font-semibold text-white">Yeni Başvuru Gir</h2>
              <button
                onClick={() => setShowNewForm(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Kapat"
              >
                <X size={20} />
              </button>
            </div>

            <DSARRequestForm
              onSubmit={(data) => createMutation.mutate(data)}
              loading={createMutation.isPending}
            />

            {createMutation.isError && (
              <p className="text-red-400 text-xs mt-fib-3">
                Başvuru kaydedilemedi. Lütfen tekrar deneyin.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
