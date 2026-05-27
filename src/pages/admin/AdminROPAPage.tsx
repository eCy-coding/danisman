/**
 * AdminROPAPage — M4 KVKK İşleme Envanteri (ROPA) admin page.
 *
 * Route: /admin/ropa
 * Backend: GET /api/admin/ropa, POST /api/admin/ropa/seed,
 *           PATCH /api/admin/ropa/:processId/approve
 *
 * Sayfa yapısı:
 *   - Başlık: "İşleme Envanteri (ROPA)"
 *   - "Şablonları Yükle" butonu (POST /seed)
 *   - 8 ROPAProcessCard grid
 *   - ROPAEditor detail panel (on card selection)
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Database, Upload, AlertCircle } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { ROPAProcessCard } from '../../components/admin/ropa/ROPAProcessCard';
import { ROPAEditor } from '../../components/admin/ropa/ROPAEditor';
import { cn } from '../../lib/utils';
import type { ROPAProcessItem } from '../../components/admin/ropa/ROPAProcessCard';

const API_BASE = '/admin/ropa';

interface ROPAListResponse {
  status: string;
  data: ROPAProcessItem[];
}

export const AdminROPAPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<ROPAListResponse>({
    queryKey: ['ropa-list'],
    queryFn: () => apiClient.get(API_BASE).then((r) => r.data as ROPAListResponse),
  });

  const processes = data?.data ?? [];

  const seedMutation = useMutation({
    mutationFn: () => apiClient.post(`${API_BASE}/seed`).then((r) => r.data),
    onSuccess: (result: { data?: { seeded?: number } }) => {
      const count = result?.data?.seeded ?? 0;
      setSeedMessage(`${count} şablon başarıyla yüklendi.`);
      void queryClient.invalidateQueries({ queryKey: ['ropa-list'] });
    },
    onError: () => {
      setSeedMessage('Şablonlar yüklenemedi. Lütfen tekrar deneyin.');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (pid: string) => apiClient.patch(`${API_BASE}/${pid}/approve`).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ropa-list'] });
    },
  });

  const handleSeed = () => {
    setSeedMessage(null);
    seedMutation.mutate();
  };

  const handleApprove = (processId: string) => {
    approveMutation.mutate(processId);
  };

  return (
    <div className="flex flex-col gap-fib-6 p-fib-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-fib-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-zinc-800">
            <Database className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">İşleme Envanteri (ROPA)</h1>
            <p className="text-sm text-zinc-400">
              KVKK m.10 kapsamında veri işleme faaliyetleri kaydı
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSeed}
          disabled={seedMutation.isPending}
          className={cn(
            'flex items-center gap-fib-2 rounded-xl border border-blue-600/50',
            'bg-blue-900/30 px-fib-5 py-fib-3 text-sm font-medium text-blue-300',
            'transition-colors hover:border-blue-500/70 hover:bg-blue-900/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          <Upload className="h-4 w-4" />
          {seedMutation.isPending ? 'Yükleniyor…' : 'Şablonları Yükle'}
        </button>
      </div>

      {/* Seed feedback */}
      {seedMessage && (
        <div
          className={cn(
            'rounded-xl border px-fib-4 py-fib-3 text-sm',
            seedMessage.includes('başarıyla')
              ? 'border-green-700/40 bg-green-900/20 text-green-300'
              : 'border-red-700/40 bg-red-900/20 text-red-300',
          )}
        >
          {seedMessage}
        </div>
      )}

      {/* Summary badges */}
      {processes.length > 0 && (
        <div className="flex flex-wrap gap-fib-3">
          <span className="rounded-full border border-white/10 bg-zinc-800 px-fib-3 py-fib-1 text-xs text-zinc-400">
            {processes.length} işlem
          </span>
          <span className="rounded-full border border-green-700/40 bg-green-900/20 px-fib-3 py-fib-1 text-xs text-green-300">
            {processes.filter((p) => p.dpoApproved).length} DPO onaylı
          </span>
          <span className="rounded-full border border-yellow-700/40 bg-yellow-900/20 px-fib-3 py-fib-1 text-xs text-yellow-300">
            {processes.filter((p) => !p.dpoApproved).length} onay bekliyor
          </span>
        </div>
      )}

      {/* States */}
      {isLoading && <div className="py-fib-8 text-center text-zinc-400">Yükleniyor…</div>}

      {isError && (
        <div className="flex items-center justify-center gap-fib-2 py-fib-8 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>İşleme envanteri yüklenemedi.</span>
          <button onClick={() => void refetch()} className="ml-fib-2 underline hover:no-underline">
            Tekrar dene
          </button>
        </div>
      )}

      {!isLoading && !isError && processes.length === 0 && (
        <div className="flex flex-col items-center gap-fib-4 py-fib-8 text-zinc-400">
          <Database className="h-8 w-8 opacity-40" />
          <p>Henüz işlem kaydı yok.</p>
          <p className="text-sm">
            Başlamak için{' '}
            <button onClick={handleSeed} className="text-blue-400 underline hover:no-underline">
              şablonları yükleyin
            </button>
            .
          </p>
        </div>
      )}

      {/* Process grid */}
      {processes.length > 0 && (
        <div className="grid grid-cols-1 gap-fib-5 lg:grid-cols-2">
          {processes.map((proc) => (
            <div
              key={proc.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedProcessId(proc.processId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedProcessId(proc.processId);
              }}
              className="cursor-pointer"
            >
              <ROPAProcessCard process={proc} onApprove={handleApprove} />
            </div>
          ))}
        </div>
      )}

      {/* Detail editor overlay */}
      {selectedProcessId && (
        <ROPAEditor processId={selectedProcessId} onClose={() => setSelectedProcessId(null)} />
      )}
    </div>
  );
};
