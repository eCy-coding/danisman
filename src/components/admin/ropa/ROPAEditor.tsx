/**
 * ROPAEditor — ROPA process detail/edit panel.
 *
 * Shows all fields for a process. Retention period and retentionPeriodDays
 * are READ-ONLY (code-locked per KVKK m.12). Editable: dpoApproved (approve
 * button), status change, transfer notes.
 */

import React, { useState } from 'react';
import { X, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api';
import { ROPALegalBasisDropdown } from './ROPALegalBasisDropdown';
import { ROPADataCategoryPicker } from './ROPADataCategoryPicker';
import { cn } from '../../../lib/utils';
import type { ROPAProcessItem } from './ROPAProcessCard';

interface ROPAEditorProps {
  processId: string | null;
  onClose: () => void;
}

const ROPAStatusValues = ['ACTIVE', 'UNDER_REVIEW', 'DEPRECATED'] as const;

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Aktif',
  UNDER_REVIEW: 'İncelemede',
  DEPRECATED: 'Kullanım Dışı',
};

interface ProcessResponse {
  status: string;
  data: ROPAProcessItem;
}

export function ROPAEditor({ processId, onClose }: ROPAEditorProps) {
  const queryClient = useQueryClient();
  const [statusDraft, setStatusDraft] = useState<string>('');

  const { data, isLoading, isError } = useQuery<ProcessResponse>({
    queryKey: ['ropa-process', processId],
    queryFn: () => apiClient.get(`/admin/ropa/${processId}`).then((r) => r.data as ProcessResponse),
    enabled: !!processId,
  });

  const process = data?.data;

  const approveMutation = useMutation({
    mutationFn: (pid: string) => apiClient.patch(`/admin/ropa/${pid}/approve`).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ropa-process', processId] });
      void queryClient.invalidateQueries({ queryKey: ['ropa-list'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ pid, status }: { pid: string; status: string }) =>
      apiClient.patch(`/admin/ropa/${pid}/status`, { status }).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ropa-process', processId] });
      void queryClient.invalidateQueries({ queryKey: ['ropa-list'] });
    },
  });

  const handleApprove = () => {
    if (processId) approveMutation.mutate(processId);
  };

  const handleStatusChange = () => {
    if (processId && statusDraft) {
      statusMutation.mutate({ pid: processId, status: statusDraft });
    }
  };

  if (!processId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-fib-5 backdrop-blur-sm">
      <div
        className={cn(
          'relative flex h-full max-h-[90vh] w-full max-w-2xl flex-col',
          'rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-fib-5">
          <div>
            <h2 className="font-semibold text-zinc-100">İşleme Detayı</h2>
            {process && (
              <p className="mt-fib-1 font-mono text-xs text-zinc-400">{process.processId}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-fib-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-fib-5">
          {isLoading && (
            <div className="flex items-center justify-center py-fib-8 text-zinc-400">
              Yükleniyor…
            </div>
          )}
          {isError && (
            <div className="flex items-center gap-fib-2 text-red-400">
              <AlertCircle className="h-4 w-4" />
              İşlem yüklenemedi.
            </div>
          )}
          {process && (
            <div className="flex flex-col gap-fib-6">
              {/* Name & purpose */}
              <div className="flex flex-col gap-fib-2">
                <p className="text-xs text-zinc-500">İşlem Adı</p>
                <p className="text-lg font-semibold text-zinc-100">{process.name}</p>
                <p className="text-sm text-zinc-400">{process.purpose}</p>
              </div>

              {/* Legal basis (read display + info) */}
              <ROPALegalBasisDropdown
                value={process.legalBasis}
                onChange={() => {
                  /* read-only display — changes go through DPO review */
                }}
                disabled
              />

              {/* Data categories (read-only display) */}
              <ROPADataCategoryPicker
                value={process.dataCategories}
                onChange={() => {
                  /* read-only display */
                }}
                disabled
              />

              {/* Retention period — code-locked */}
              <div className="rounded-xl border border-amber-700/30 bg-amber-900/10 p-fib-4">
                <div className="mb-fib-2 flex items-center gap-fib-2">
                  <Lock className="h-4 w-4 text-amber-400" />
                  <p className="text-xs font-medium text-amber-400">
                    Saklama Süresi — KVKK m.12 Kilitli
                  </p>
                </div>
                <p className="font-mono text-sm text-zinc-200">{process.retentionPeriod}</p>
                <p className="mt-fib-1 text-xs text-zinc-500">{process.retentionLegalSource}</p>
                <p className="mt-fib-2 text-xs text-amber-500/80">
                  KVKK m.12 — Yasal zorunluluk gereği değiştirilemez
                </p>
                {/* retentionPeriodDays shown informational, no input */}
                <p className="mt-fib-1 text-xs text-zinc-500">{process.retentionPeriodDays} gün</p>
              </div>

              {/* Transfer */}
              <div className="flex flex-col gap-fib-2">
                <p className="text-xs text-zinc-500">Transfer Lokasyonu</p>
                <p className="text-sm text-zinc-200">{process.transferLocation}</p>
                {process.transferMechanism && (
                  <p className="text-xs text-zinc-400">Mekanizma: {process.transferMechanism}</p>
                )}
              </div>

              {/* Status change */}
              <div className="flex flex-col gap-fib-3">
                <p className="text-xs text-zinc-500">Durum Güncelle</p>
                <div className="flex items-center gap-fib-3">
                  <select
                    value={statusDraft || process.status}
                    onChange={(e) => setStatusDraft(e.target.value)}
                    className={cn(
                      'flex-1 rounded-lg border border-white/10 bg-zinc-900 px-fib-4 py-fib-2',
                      'text-sm text-zinc-100 outline-none focus:border-blue-500/60',
                    )}
                  >
                    {ROPAStatusValues.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleStatusChange}
                    disabled={
                      !statusDraft || statusDraft === process.status || statusMutation.isPending
                    }
                    className={cn(
                      'rounded-lg border border-white/10 bg-zinc-800 px-fib-4 py-fib-2',
                      'text-sm font-medium text-zinc-300 transition-colors',
                      'hover:border-white/20 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40',
                    )}
                  >
                    Kaydet
                  </button>
                </div>
              </div>

              {/* DPO approve */}
              <div className="flex flex-col gap-fib-3 border-t border-white/5 pt-fib-4">
                <p className="text-xs text-zinc-500">DPO Onayı</p>
                {process.dpoApproved ? (
                  <span className="flex items-center gap-fib-2 text-sm text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    Bu işlem DPO tarafından onaylandı.
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={approveMutation.isPending}
                    className={cn(
                      'self-start rounded-lg border border-blue-600/50 bg-blue-900/30 px-fib-5 py-fib-3',
                      'text-sm font-medium text-blue-300 transition-colors',
                      'hover:border-blue-500/70 hover:bg-blue-900/50 disabled:cursor-not-allowed disabled:opacity-40',
                    )}
                  >
                    {approveMutation.isPending ? 'Onaylanıyor…' : 'DPO Olarak Onayla'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
