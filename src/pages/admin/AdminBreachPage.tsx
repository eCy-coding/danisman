/**
 * M6 — KVKK m.12/5 Veri İhlali Yönetimi page.
 *
 * Route: /admin/breach
 * Backend: /api/admin/breach
 *
 * Sayfa yapısı:
 *   - Başlık: "Veri İhlali Yönetimi"
 *   - BreachReportButton → modal + BreachDetailForm
 *   - İhlal listesi: her satırda BreachCountdownTimer
 *   - KurulFormDraftGenerator (seçili ihlal için)
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { BreachReportButton } from '../../components/admin/breach/BreachReportButton';
import { BreachDetailForm } from '../../components/admin/breach/BreachDetailForm';
import { BreachCountdownTimer } from '../../components/admin/breach/BreachCountdownTimer';
import { KurulFormDraftGenerator } from '../../components/admin/breach/KurulFormDraftGenerator';
import type { NewBreachData } from '../../components/admin/breach/BreachDetailForm';
import { adminFetch } from '../../lib/admin-fetch';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BreachIncidentItem {
  id: string;
  detectedAt: string;
  detectionSource: string;
  description: string;
  affectedDataCategories: string[];
  affectedSubjectsCount: number;
  notificationDeadline: string;
  reportedToKurul: boolean;
  reportedAt?: string;
  kurulFormDraft?: string;
  status: 'DETECTED' | 'INVESTIGATING' | 'REPORTED' | 'RESOLVED';
}

interface BreachListResponse {
  status: string;
  incidents: BreachIncidentItem[];
}

const STATUS_LABELS: Record<BreachIncidentItem['status'], string> = {
  DETECTED: 'Tespit Edildi',
  INVESTIGATING: 'İnceleniyor',
  REPORTED: 'Bildirildi',
  RESOLVED: 'Çözüldü',
};

const STATUS_COLORS: Record<BreachIncidentItem['status'], string> = {
  DETECTED: 'bg-red-900/40 text-red-300 border-red-700/40',
  INVESTIGATING: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
  REPORTED: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
  RESOLVED: 'bg-green-900/40 text-green-300 border-green-700/40',
};

// ─── Main page ────────────────────────────────────────────────────────────────

export function AdminBreachPage() {
  const qc = useQueryClient();
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── Data fetching ────────────────────────────────────────────────────────────
  const { data, isLoading, error } = useQuery<BreachListResponse>({
    queryKey: ['breach-list'],
    queryFn: async () => {
      const res = await adminFetch('/api/admin/breach');
      if (!res.ok) throw new Error('Failed to load breach incidents');
      return res.json() as Promise<BreachListResponse>;
    },
  });

  // ── Create mutation ──────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (payload: NewBreachData) => {
      const res = await adminFetch('/api/admin/breach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create breach incident');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['breach-list'] });
      setShowNewForm(false);
    },
  });

  // ── Report-to-Kurul mutation ──────────────────────────────────────────────────
  const reportToKurulMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await adminFetch(`/api/admin/breach/${id}/report-to-kurul`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Kurul bildirimi başarısız oldu.');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['breach-list'] });
    },
  });

  const _selectedIncident = data?.incidents.find((i) => i.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-fib-7 p-fib-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-golden-lg font-semibold text-white">Veri İhlali Yönetimi</h1>
          <p className="text-sm text-gray-400 mt-1">
            KVKK m.12/5 kapsamında 72 saatlik Kurul bildirim yükümlülüğü
          </p>
        </div>
        <BreachReportButton onClick={() => setShowNewForm(true)} />
      </div>

      {/* Loading / error states */}
      {isLoading && <p className="text-gray-400 text-sm">İhlal kayıtları yükleniyor…</p>}
      {error && <p className="text-red-400 text-sm">Veri yüklenemedi. Lütfen sayfayı yenileyin.</p>}

      {/* Incidents list */}
      {data && data.incidents.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-fib-7 text-center text-gray-400 text-sm">
          Kayıtlı veri ihlali bulunmuyor.
        </div>
      )}

      {data && data.incidents.length > 0 && (
        <div className="flex flex-col gap-fib-4">
          {data.incidents.map((incident) => (
            <div
              key={incident.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedId(selectedId === incident.id ? null : incident.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ')
                  setSelectedId(selectedId === incident.id ? null : incident.id);
              }}
              className={cn(
                'rounded-xl border p-fib-5 cursor-pointer transition-colors',
                selectedId === incident.id
                  ? 'border-blue-500/60 bg-blue-900/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/8',
              )}
            >
              <div className="flex items-start justify-between gap-fib-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{incident.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Tespit: {new Date(incident.detectedAt).toLocaleString('tr-TR')} —{' '}
                    {incident.detectionSource}
                  </p>
                </div>
                <div className="flex items-center gap-fib-4 shrink-0">
                  <span
                    className={cn(
                      'rounded px-fib-3 py-0.5 text-xs border',
                      STATUS_COLORS[incident.status],
                    )}
                  >
                    {STATUS_LABELS[incident.status]}
                  </span>
                  <BreachCountdownTimer
                    notificationDeadline={incident.notificationDeadline}
                    reportedToKurul={incident.reportedToKurul}
                  />
                </div>
              </div>

              {/* Expanded detail: Kurul draft generator */}
              {selectedId === incident.id && (
                <div
                  role="presentation"
                  className="mt-fib-5 pt-fib-5 border-t border-white/10"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <KurulFormDraftGenerator
                    incident={incident}
                    onReportToKurul={() => reportToKurulMutation.mutate(incident.id)}
                    loading={reportToKurulMutation.isPending}
                  />
                  {reportToKurulMutation.isError && (
                    <p className="text-red-400 text-xs mt-fib-3">
                      Kurul bildirimi kaydedilemedi. Lütfen tekrar deneyin.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New incident modal */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-fib-6">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowNewForm(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-lg bg-[#1E1F20] rounded-xl border border-white/10 p-fib-7 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-fib-6">
              <div>
                <h2 className="text-base font-semibold text-white">Yeni İhlal Bildir</h2>
                <p className="text-xs text-red-400 mt-0.5">
                  KVKK m.12/5 — 72 saat içinde Kurul&apos;a bildirim zorunludur
                </p>
              </div>
              <button
                onClick={() => setShowNewForm(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Kapat"
              >
                <X size={20} />
              </button>
            </div>
            <BreachDetailForm
              onSubmit={(d) => createMutation.mutate(d)}
              loading={createMutation.isPending}
            />
            {createMutation.isError && (
              <p className="text-red-400 text-xs mt-fib-3">
                İhlal kaydedilemedi. Lütfen tekrar deneyin.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
