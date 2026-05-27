/**
 * AdminRetentionPage — Belge Saklama ve İmha Yönetimi.
 *
 * Features:
 *   - RetentionPolicyTable: mevcut politikaları listeler
 *   - "Politikaları Yükle" — RETENTION_POLICIES_SEED'den POST /seed
 *   - "İmha Uygula" — POST /:resourceType/enforce; sertifika gösterir
 *   - Denetim Hazırlığı bölümü: KVKK-relevant AuditLog girişleri
 *
 * Auth: ADMIN only (ProtectedRoute handles this at router level).
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Database, RefreshCw, CheckCircle, AlertTriangle, ClipboardList } from 'lucide-react';
import {
  RetentionPolicyTable,
  RetentionPolicyItem,
} from '../../components/admin/retention/RetentionPolicyTable';
import { ImhaSertifikasiGenerator } from '../../components/admin/retention/ImhaSertifikasiGenerator';

interface SertifikaInfo {
  sertifikaId: string;
  resourceType: string;
  enforcedAt: string;
  legalBasis: string;
}

interface AuditEntry {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
  adminId: string;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export const AdminRetentionPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [lastSertifika, setLastSertifika] = useState<SertifikaInfo | null>(null);

  // Fetch policies
  const {
    data: policiesData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin', 'retention'],
    queryFn: () =>
      apiFetch<{ status: string; data: RetentionPolicyItem[] }>('/api/admin/retention'),
  });

  // Fetch audit readiness
  const { data: auditData } = useQuery({
    queryKey: ['admin', 'retention', 'audit-readiness'],
    queryFn: () =>
      apiFetch<{ status: string; count: number; data: AuditEntry[] }>(
        '/api/admin/retention/audit-readiness',
      ),
  });

  // Seed mutation
  const seedMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ status: string; seeded: number }>('/api/admin/retention/seed', {
        method: 'POST',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'retention'] });
    },
  });

  // Enforce mutation
  const enforceMutation = useMutation({
    mutationFn: (resourceType: string) =>
      apiFetch<{
        status: string;
        sertifika: SertifikaInfo;
      }>(`/api/admin/retention/${encodeURIComponent(resourceType)}/enforce`, { method: 'POST' }),
    onSuccess: (data) => {
      setLastSertifika(data.sertifika);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'retention'] });
    },
  });

  const policies = policiesData?.data ?? [];
  const auditEntries = auditData?.data ?? [];

  return (
    <div className="p-fib-7 space-y-fib-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-fib-4">
          <Database className="w-6 h-6 text-[#60A5FA]" />
          <div>
            <h1 className="text-golden-xl font-bold text-[#F9FAFB]">
              Belge Saklama ve İmha Yönetimi
            </h1>
            <p className="text-golden-sm text-[#9CA3AF] mt-fib-2">
              KVKK m.7 — veri saklama süresi takibi ve imha kaydı
            </p>
          </div>
        </div>

        <button
          onClick={() => seedMutation.mutate()}
          disabled={seedMutation.isPending}
          className="inline-flex items-center gap-fib-3 px-fib-6 py-fib-4 rounded bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-95 text-white text-sm font-medium transition-all disabled:opacity-50"
        >
          {seedMutation.isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Politikaları Yükle
        </button>
      </div>

      {/* Seed feedback */}
      {seedMutation.isSuccess && (
        <div className="flex items-center gap-fib-3 p-fib-4 rounded bg-[#022C22] border border-[#065F46] text-[#34D399] text-sm">
          <CheckCircle className="w-4 h-4" />
          {seedMutation.data.seeded} politika yüklendi.
        </div>
      )}
      {seedMutation.isError && (
        <div className="flex items-center gap-fib-3 p-fib-4 rounded bg-[#450A0A] border border-[#7F1D1D] text-[#FCA5A5] text-sm">
          <AlertTriangle className="w-4 h-4" />
          Politika yükleme başarısız.
        </div>
      )}

      {/* Enforce feedback */}
      {enforceMutation.isError && (
        <div className="flex items-center gap-fib-3 p-fib-4 rounded bg-[#450A0A] border border-[#7F1D1D] text-[#FCA5A5] text-sm">
          <AlertTriangle className="w-4 h-4" />
          İmha uygulaması başarısız.
        </div>
      )}

      {/* Policy table */}
      {isLoading && (
        <div className="flex items-center gap-fib-4 text-[#6B7280] p-fib-6">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Yükleniyor…
        </div>
      )}
      {isError && <div className="text-[#FCA5A5] p-fib-5">Politikalar yüklenemedi.</div>}
      {!isLoading && !isError && (
        <RetentionPolicyTable
          policies={policies}
          onEnforce={(resourceType) => enforceMutation.mutate(resourceType)}
        />
      )}

      {/* Sertifika görüntüleyici */}
      {lastSertifika && (
        <ImhaSertifikasiGenerator
          sertifikaId={lastSertifika.sertifikaId}
          resourceType={lastSertifika.resourceType}
          enforcedAt={lastSertifika.enforcedAt}
          legalBasis={lastSertifika.legalBasis}
        />
      )}

      {/* Denetim Hazırlığı bölümü */}
      <section>
        <div className="flex items-center gap-fib-4 mb-fib-5">
          <ClipboardList className="w-5 h-5 text-[#A78BFA]" />
          <h2 className="text-golden-lg font-semibold text-[#F9FAFB]">Denetim Hazırlığı</h2>
          {auditData && (
            <span className="ml-fib-3 text-xs bg-[#2E1065] text-[#A78BFA] px-fib-4 py-fib-2 rounded">
              {auditData.count} kayıt (son 2 yıl)
            </span>
          )}
        </div>

        {auditEntries.length === 0 ? (
          <p className="text-[#6B7280] text-sm p-fib-5">KVKK denetim kaydı bulunamadı.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#2A2B2C]">
            <table className="w-full text-golden-sm">
              <thead>
                <tr className="border-b border-[#2A2B2C] bg-[#1A1B1C]">
                  <th className="text-left p-fib-5 text-[#9CA3AF] font-medium">Aksiyon</th>
                  <th className="text-left p-fib-5 text-[#9CA3AF] font-medium">Hedef</th>
                  <th className="text-left p-fib-5 text-[#9CA3AF] font-medium">Admin ID</th>
                  <th className="text-left p-fib-5 text-[#9CA3AF] font-medium">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {auditEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-[#2A2B2C] bg-[#1E1F20] hover:bg-[#232425] transition-colors"
                  >
                    <td className="p-fib-5">
                      <span className="font-mono text-xs bg-[#1E1B4B] text-[#A78BFA] px-fib-3 py-fib-2 rounded">
                        {entry.action}
                      </span>
                    </td>
                    <td className="p-fib-5 text-[#9CA3AF] text-xs">
                      {entry.targetType ?? '—'}{' '}
                      {entry.targetId ? `#${entry.targetId.slice(0, 8)}` : ''}
                    </td>
                    <td className="p-fib-5 font-mono text-xs text-[#6B7280]">
                      {entry.adminId.slice(0, 12)}…
                    </td>
                    <td className="p-fib-5 text-[#9CA3AF] text-xs">
                      {new Date(entry.createdAt).toLocaleString('tr-TR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
