/**
 * P55.B2 — Admin campaigns page.
 *
 * Route: /admin/newsletter/campaigns
 * Backend: GET/POST /api/admin/newsletter/campaigns + POST :id/send + GET /metrics
 *
 * Sayfa yapısı:
 *   - Metrics strip: queue depth + DLQ + sent/failed counters
 *   - "New campaign" formu: subject + body + audienceFilter
 *   - Campaign listesi (newest first), her satırda "Send" butonu
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Mail, Activity, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../lib/api';

interface Campaign {
  id: string;
  subject: string;
  body: string;
  audienceFilter: { source?: string; consentOnly: boolean };
  templateKey: string;
  createdAt: number;
  queuedAt: number | null;
  sentCount: number;
  failedCount: number;
  status: 'draft' | 'queued' | 'sent' | 'failed';
}

interface ListResponse {
  status: string;
  data: { items: Campaign[]; total: number; limit: number; offset: number };
}

interface MetricsResponse {
  status: string;
  data: {
    queue: number;
    dlq: number;
    counters: { sent: number; failed: number; dlq: number; enqueued: number };
  };
}

export const AdminCampaignsPage: React.FC = () => {
  const qc = useQueryClient();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [source, setSource] = useState('');
  const [consentOnly, setConsentOnly] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listQuery = useQuery<ListResponse>({
    queryKey: ['admin-campaigns'],
    queryFn: () => apiClient.get('/admin/newsletter/campaigns').then((r) => r.data as ListResponse),
    refetchInterval: 15_000,
  });

  const metricsQuery = useQuery<MetricsResponse>({
    queryKey: ['admin-campaigns-metrics'],
    queryFn: () =>
      apiClient.get('/admin/newsletter/campaigns/metrics').then((r) => r.data as MetricsResponse),
    refetchInterval: 10_000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      subject: string;
      body: string;
      audienceFilter: { source?: string; consentOnly: boolean };
    }) => apiClient.post('/admin/newsletter/campaigns', payload),
    onSuccess: () => {
      setSubject('');
      setBody('');
      setSource('');
      setError(null);
      qc.invalidateQueries({ queryKey: ['admin-campaigns'] });
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    },
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/newsletter/campaigns/${id}/send`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-campaigns'] });
      qc.invalidateQueries({ queryKey: ['admin-campaigns-metrics'] });
    },
  });

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.length < 3 || body.length < 10) {
      setError('Konu en az 3, gövde en az 10 karakter olmalı.');
      return;
    }
    createMutation.mutate({
      subject,
      body,
      audienceFilter: { source: source || undefined, consentOnly },
    });
  };

  const metrics = metricsQuery.data?.data;
  const campaigns = listQuery.data?.data?.items ?? [];

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Newsletter Kampanyaları</h1>
        <p className="text-sm text-slate-400 mt-1">
          Kampanya oluştur, drip queue durumunu izle, gönderimi tetikle.
        </p>
      </header>

      {/* Metrics strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Queue depth"
          value={metrics?.queue ?? 0}
          icon={<Activity size={16} />}
        />
        <MetricCard
          label="DLQ depth"
          value={metrics?.dlq ?? 0}
          icon={<AlertTriangle size={16} />}
          danger={Boolean(metrics?.dlq && metrics.dlq > 0)}
        />
        <MetricCard
          label="Gönderildi (proc)"
          value={metrics?.counters.sent ?? 0}
          icon={<Send size={16} />}
        />
        <MetricCard
          label="Başarısız (proc)"
          value={metrics?.counters.failed ?? 0}
          icon={<Mail size={16} />}
        />
      </section>

      {/* Create form */}
      <section className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Yeni Kampanya</h2>
        <form onSubmit={onCreate} className="space-y-3">
          <label className="block">
            <span className="text-sm text-slate-300">Konu</span>
            <input
              type="text"
              className="mt-1 w-full bg-neutral border border-white/15 rounded-lg px-3 py-2 text-white"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={150}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-300">Gövde (Markdown / HTML)</span>
            <textarea
              className="mt-1 w-full bg-neutral border border-white/15 rounded-lg px-3 py-2 text-white min-h-[140px]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={50_000}
              required
            />
          </label>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-slate-300">Kaynak filtresi (opsiyonel)</span>
              <input
                type="text"
                className="mt-1 w-full bg-neutral border border-white/15 rounded-lg px-3 py-2 text-white"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="footer, exit-intent, blog-cta…"
              />
            </label>
            <label className="flex items-center gap-2 mt-6 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={consentOnly}
                onChange={(e) => setConsentOnly(e.target.checked)}
              />
              Sadece onaylı aboneler (consent=true)
            </label>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 rounded-lg bg-secondary text-neutral font-semibold hover:bg-secondary/90 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Kaydediliyor…' : 'Kampanya Oluştur'}
          </button>
        </form>
      </section>

      {/* Campaign list */}
      <section className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Kampanyalar</h2>
        {listQuery.isLoading && <p className="text-slate-400">Yükleniyor…</p>}
        {listQuery.isError && <p className="text-red-400">Liste yüklenemedi.</p>}
        {campaigns.length === 0 && !listQuery.isLoading && (
          <p className="text-slate-400">Henüz kampanya yok.</p>
        )}
        <ul className="divide-y divide-white/5">
          {campaigns.map((c) => (
            <li key={c.id} className="py-3 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-white font-semibold truncate">{c.subject}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(c.createdAt).toLocaleString('tr-TR')} ·{' '}
                  <span className="uppercase">{c.status}</span>
                  {c.sentCount > 0 && ` · ${c.sentCount} alıcı`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => sendMutation.mutate(c.id)}
                disabled={c.status !== 'draft' || sendMutation.isPending}
                className="px-3 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/15 disabled:opacity-40"
              >
                {c.status === 'draft' ? 'Gönder' : c.status}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

const MetricCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  danger?: boolean;
}> = ({ label, value, icon, danger }) => (
  <div
    className={`rounded-xl border p-4 ${
      danger ? 'border-red-500/40 bg-red-500/5' : 'border-white/10 bg-white/[0.02]'
    }`}
  >
    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-slate-400">
      {icon}
      <span>{label}</span>
    </div>
    <div className="text-3xl font-serif font-bold text-white mt-1">{value}</div>
  </div>
);

export default AdminCampaignsPage;
