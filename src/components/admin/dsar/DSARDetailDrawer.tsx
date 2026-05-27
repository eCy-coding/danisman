import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../../lib/utils';
import { DSARCountdownBadge } from './DSARCountdownBadge';
import { DSARResponseEditor } from './DSARResponseEditor';

interface DSARAuditEntry {
  id: string;
  actorId: string;
  action: string;
  details: Record<string, unknown>;
  createdAt: string;
}

interface DSARDetail {
  id: string;
  requesterEmail: string;
  requesterName: string;
  requestType: string;
  description?: string;
  receivedAt: string;
  slaDeadline: string;
  extendedOnce: boolean;
  status: string;
  assignedTo?: string;
  respondedAt?: string;
  responseText?: string;
  auditLog: DSARAuditEntry[];
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  RECEIVED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['RESPONDED', 'REJECTED'],
  RESPONDED: ['CLOSED'],
  CLOSED: [],
  REJECTED: [],
};

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Alındı',
  UNDER_REVIEW: 'İnceleniyor',
  RESPONDED: 'Yanıtlandı',
  CLOSED: 'Kapatıldı',
  REJECTED: 'Reddedildi',
};

const REQUEST_TYPE_LABELS: Record<string, string> = {
  ACCESS: 'Erişim',
  RECTIFICATION: 'Düzeltme',
  ERASURE: 'Silme',
  RESTRICTION: 'Kısıtlama',
  PORTABILITY: 'Taşınabilirlik',
  OBJECTION: 'İtiraz',
  AUTOMATED_DECISION: 'Otomatik Karar',
};

interface DSARDetailDrawerProps {
  dsarId: string | null;
  onClose: () => void;
}

export function DSARDetailDrawer({ dsarId, onClose }: DSARDetailDrawerProps) {
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery<{ status: string; dsar: DSARDetail }>({
    queryKey: ['dsar-detail', dsarId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/dsar?id=${dsarId}`);
      if (!res.ok) throw new Error('Failed to load DSAR');
      return res.json() as Promise<{ status: string; dsar: DSARDetail }>;
    },
    enabled: !!dsarId,
  });

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`/api/admin/dsar/${dsarId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Status update failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dsar-list'] }),
  });

  const respondMutation = useMutation({
    mutationFn: async (responseText: string) => {
      const res = await fetch(`/api/admin/dsar/${dsarId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseText }),
      });
      if (!res.ok) throw new Error('Respond failed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dsar-list'] });
      qc.invalidateQueries({ queryKey: ['dsar-detail', dsarId] });
    },
  });

  if (!dsarId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative z-10 w-full max-w-2xl bg-[#1E1F20] border-l border-white/10 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-fib-6 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Başvuru Detayı</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-fib-2 rounded"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-fib-6 p-fib-6">
          {isLoading && <p className="text-gray-400 text-sm">Yükleniyor…</p>}

          {error && <p className="text-red-400 text-sm">Veri yüklenemedi.</p>}

          {data?.dsar &&
            (() => {
              const dsar = data.dsar;
              const transitions = STATUS_TRANSITIONS[dsar.status] ?? [];

              return (
                <>
                  {/* Requester info */}
                  <section className="flex flex-col gap-fib-3">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">
                      İlgili Kişi
                    </h3>
                    <div className="flex flex-col gap-1">
                      <p className="text-white font-medium">{dsar.requesterName}</p>
                      <p className="text-gray-400 text-sm">{dsar.requesterEmail}</p>
                    </div>
                  </section>

                  {/* Request type + description */}
                  <section className="flex flex-col gap-fib-3">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">
                      Başvuru
                    </h3>
                    <p className="text-gray-200 font-medium">
                      {REQUEST_TYPE_LABELS[dsar.requestType] ?? dsar.requestType}
                    </p>
                    {dsar.description && (
                      <p className="text-gray-400 text-sm">{dsar.description}</p>
                    )}
                  </section>

                  {/* SLA */}
                  <section className="flex flex-col gap-fib-3">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">
                      SLA Durumu
                    </h3>
                    <DSARCountdownBadge
                      deadlineAt={dsar.slaDeadline}
                      extended={dsar.extendedOnce}
                    />
                  </section>

                  {/* Status transitions */}
                  {transitions.length > 0 && (
                    <section className="flex flex-col gap-fib-3">
                      <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">
                        Durum Değiştir
                      </h3>
                      <div className="flex flex-wrap gap-fib-3">
                        {transitions.map((s) => (
                          <button
                            key={s}
                            onClick={() => statusMutation.mutate(s)}
                            disabled={statusMutation.isPending}
                            className={cn(
                              'rounded px-fib-4 py-fib-2 text-xs font-medium border transition-colors',
                              'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10',
                              'disabled:opacity-50',
                            )}
                          >
                            {STATUS_LABELS[s] ?? s}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Response editor (only for UNDER_REVIEW) */}
                  {dsar.status === 'UNDER_REVIEW' && (
                    <section className="flex flex-col gap-fib-3">
                      <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">
                        Yanıt Gönder
                      </h3>
                      <DSARResponseEditor
                        dsarId={dsar.id}
                        onSubmit={(text) => respondMutation.mutate(text)}
                        loading={respondMutation.isPending}
                      />
                    </section>
                  )}

                  {/* Audit log timeline */}
                  <section className="flex flex-col gap-fib-3">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">
                      Denetim Günlüğü
                    </h3>
                    <ol className="flex flex-col gap-fib-3">
                      {(dsar.auditLog ?? []).map((entry) => (
                        <li key={entry.id} className="flex gap-fib-3 text-sm">
                          <span className="text-gray-600 tabular-nums whitespace-nowrap">
                            {new Date(entry.createdAt).toLocaleString('tr-TR')}
                          </span>
                          <span className="text-gray-300 font-medium">{entry.action}</span>
                          <span className="text-gray-500">{entry.actorId}</span>
                        </li>
                      ))}
                      {(dsar.auditLog ?? []).length === 0 && (
                        <li className="text-gray-600 text-sm">Kayıt yok.</li>
                      )}
                    </ol>
                  </section>
                </>
              );
            })()}
        </div>
      </div>
    </div>
  );
}
