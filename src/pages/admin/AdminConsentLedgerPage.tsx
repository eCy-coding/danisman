/**
 * M3 — KVKK Rıza Defteri (Consent Ledger) admin page.
 *
 * Route: /admin/consent
 * Backend: GET /api/admin/consent, /stats, /reconsent-due
 *
 * Sayfa yapısı:
 *   - Başlık: "Rıza Defteri"
 *   - Stats kartları: toplam / aktif / iptal / yeniden rıza bekleyen
 *   - ReConsentCampaign bileşeni
 *   - Arama + filtre + sayfalandırmalı tablo
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ShieldCheck, Users, XCircle, RefreshCw } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { ConsentRevokeAction } from '../../components/admin/consent/ConsentRevokeAction';
import { ReConsentCampaign } from '../../components/admin/consent/ReConsentCampaign';
import { cn } from '../../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConsentRecord {
  id: string;
  email: string;
  consent: boolean;
  source?: string | null;
  subscribedAt: string;
  unsubscribedAt?: string | null;
}

interface ConsentListResponse {
  status: string;
  data: {
    items: ConsentRecord[];
    total: number;
    limit: number;
    offset: number;
  };
}

interface ConsentStatsResponse {
  status: string;
  data: {
    total: number;
    active: number;
    unsubscribed: number;
    reconsentDue: number;
  };
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
  colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, colorClass }) => (
  <div className={cn('flex items-center gap-fib-5 p-fib-5 rounded-xl border', colorClass)}>
    <div className="shrink-0">{icon}</div>
    <div>
      <p className="text-2xl font-bold text-zinc-100">{value ?? '—'}</p>
      <p className="text-xs text-zinc-400 mt-fib-1">{label}</p>
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;
const API_BASE = '/api/admin/consent';

export const AdminConsentLedgerPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [consentFilter, setConsentFilter] = useState<'all' | 'true' | 'false'>('all');
  const [offset, setOffset] = useState(0);
  const [campaignLoading, setCampaignLoading] = useState(false);

  // Stats query
  const { data: statsData } = useQuery<ConsentStatsResponse>({
    queryKey: ['admin-consent-stats'],
    queryFn: () => apiClient.get<ConsentStatsResponse>(`${API_BASE}/stats`).then((r) => r.data),
    staleTime: 60_000,
  });

  const stats = statsData?.data;

  // Consent list query
  const filterParam = consentFilter !== 'all' ? `&consent=${consentFilter}` : '';
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';

  const { data: listData, isLoading: listLoading } = useQuery<ConsentListResponse>({
    queryKey: ['admin-consent-list', search, consentFilter, offset],
    queryFn: () =>
      apiClient
        .get<ConsentListResponse>(
          `${API_BASE}?limit=${PAGE_SIZE}&offset=${offset}${filterParam}${searchParam}`,
        )
        .then((r) => r.data),
    staleTime: 30_000,
  });

  const items = listData?.data.items ?? [];
  const total = listData?.data.total ?? 0;

  // Re-consent campaign trigger (stub — actual campaign send is handled by campaigns route)
  const handleTriggerCampaign = () => {
    setCampaignLoading(true);
    // Campaign trigger endpoint to be wired in a follow-up sprint
    setTimeout(() => setCampaignLoading(false), 2000);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setOffset(0);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setConsentFilter(e.target.value as 'all' | 'true' | 'false');
    setOffset(0);
  };

  return (
    <div className="flex flex-col gap-fib-7 p-fib-7">
      {/* Header */}
      <div className="flex items-center gap-fib-4">
        <ShieldCheck className="w-fib-7 h-fib-7 text-indigo-400" aria-hidden="true" />
        <div>
          <h1 className="text-golden-xl font-bold text-zinc-100">Rıza Defteri</h1>
          <p className="text-sm text-zinc-400">KVKK — İlgili Kişi Rıza Kayıtları</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-fib-5 lg:grid-cols-4">
        <StatCard
          label="Toplam Kayıt"
          value={stats?.total}
          icon={<Users className="w-fib-6 h-fib-6 text-indigo-400" />}
          colorClass="bg-indigo-500/10 border-indigo-500/25"
        />
        <StatCard
          label="Aktif Rıza"
          value={stats?.active}
          icon={<ShieldCheck className="w-fib-6 h-fib-6 text-green-400" />}
          colorClass="bg-green-500/10 border-green-500/25"
        />
        <StatCard
          label="Rıza İptal"
          value={stats?.unsubscribed}
          icon={<XCircle className="w-fib-6 h-fib-6 text-red-400" />}
          colorClass="bg-red-500/10 border-red-500/25"
        />
        <StatCard
          label="Yeniden Onay Bekleyen"
          value={stats?.reconsentDue}
          icon={<RefreshCw className="w-fib-6 h-fib-6 text-yellow-400" />}
          colorClass="bg-yellow-500/10 border-yellow-500/25"
        />
      </div>

      {/* Re-consent campaign */}
      <ReConsentCampaign
        dueCount={stats?.reconsentDue ?? 0}
        onTriggerCampaign={handleTriggerCampaign}
        loading={campaignLoading}
      />

      {/* Filters */}
      <div className="flex flex-col gap-fib-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-fib-3 top-1/2 -translate-y-1/2 w-fib-4 h-fib-4 text-zinc-500"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="E-posta ile ara..."
            value={search}
            onChange={handleSearch}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-fib-8 pr-fib-4 py-fib-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={consentFilter}
          onChange={handleFilterChange}
          aria-label="Rıza durumuna göre filtrele"
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-fib-4 py-fib-3 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">Tümü</option>
          <option value="true">Onaylı Rıza</option>
          <option value="false">Rızasız</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm text-zinc-300">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="text-left px-fib-5 py-fib-4 font-medium text-zinc-400">
                İlgili Kişi (E-posta)
              </th>
              <th className="text-left px-fib-5 py-fib-4 font-medium text-zinc-400">Kaynak</th>
              <th className="text-left px-fib-5 py-fib-4 font-medium text-zinc-400">
                Abonelik Tarihi
              </th>
              <th className="text-left px-fib-5 py-fib-4 font-medium text-zinc-400">Rıza Durumu</th>
            </tr>
          </thead>
          <tbody>
            {listLoading && (
              <tr>
                <td colSpan={4} className="px-fib-5 py-fib-8 text-center text-zinc-500">
                  Yükleniyor…
                </td>
              </tr>
            )}
            {!listLoading && items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-fib-5 py-fib-8 text-center text-zinc-500">
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
            {items.map((record) => (
              <tr
                key={record.id}
                className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors"
              >
                <td className="px-fib-5 py-fib-4 font-mono text-xs text-zinc-200">
                  {record.email}
                </td>
                <td className="px-fib-5 py-fib-4 text-zinc-400">{record.source ?? '—'}</td>
                <td className="px-fib-5 py-fib-4 text-zinc-400">
                  {new Date(record.subscribedAt).toLocaleDateString('tr-TR')}
                </td>
                <td className="px-fib-5 py-fib-4">
                  <ConsentRevokeAction
                    email={record.email}
                    unsubscribedAt={record.unsubscribedAt ?? undefined}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <span>
            {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} / {total} kayıt
          </span>
          <div className="flex items-center gap-fib-3">
            <button
              type="button"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              className="px-fib-4 py-fib-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Önceki
            </button>
            <span>
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => setOffset(offset + PAGE_SIZE)}
              className="px-fib-4 py-fib-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
