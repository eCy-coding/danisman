/**
 * P57.2 — Admin Overview (operator-first dashboard).
 *
 * Mevcut `AdminDashboard` SSE + sofistike widget'lar; bu sayfa OPERATÖR için
 * sade KPI + grafik + hızlı eylem paneli. Türkçe primary.
 *
 * Auto-refresh: 60s (react-query staleTime).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import {
  Users,
  Mail,
  Flame,
  CalendarCheck,
  Percent,
  Gauge,
  ArrowRight,
  PlusCircle,
  Send,
  FileText,
  Settings,
  Activity,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { StatCard, Breadcrumb, EmptyState } from '../../components/admin/ui';

interface KpiResponse {
  status: string;
  data: {
    totalLeads30d: number;
    leadsDelta: number;
    newSubscribers7d: number;
    subscribersDelta: number;
    hotLeads: number;
    discoveryCallsThisMonth: number;
    conversionRate: number;
    avgLeadScore: number;
  };
}

interface ChartsResponse {
  status: string;
  data: {
    leadTrend30d: Array<{ day: string; count: number }>;
    sourceBreakdown: Array<{ name: string; value: number }>;
    funnel: Array<{ stage: string; count: number }>;
  };
}

interface ActivityResponse {
  status: string;
  data: Array<{ id: string; type: string; subject: string; timestamp: string }>;
}

interface HealthResponse {
  status: string;
  data: {
    backend: 'ok' | 'degraded' | 'down';
    db: 'ok' | 'degraded' | 'down';
    queue: 'ok' | 'degraded' | 'down';
    errorRate: number;
    uptime: number;
  };
}

const PIE_COLORS = ['#F59E0B', '#2563EB', '#7C3AED', '#10B981', '#EF4444', '#64748B'];

function fmtDelta(value: number): { value: string; direction: 'up' | 'down' | 'flat' } {
  if (value > 0) return { value: `+${value}%`, direction: 'up' };
  if (value < 0) return { value: `${value}%`, direction: 'down' };
  return { value: '0%', direction: 'flat' };
}

export const AdminOverviewPage: React.FC = () => {
  const kpi = useQuery<KpiResponse>({
    queryKey: ['admin-overview-kpi'],
    queryFn: () => apiClient.get('/admin/dashboard/kpi').then((r) => r.data as KpiResponse),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const charts = useQuery<ChartsResponse>({
    queryKey: ['admin-overview-charts'],
    queryFn: () => apiClient.get('/admin/dashboard/charts').then((r) => r.data as ChartsResponse),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const activity = useQuery<ActivityResponse>({
    queryKey: ['admin-overview-activity'],
    queryFn: () => apiClient.get('/admin/dashboard/activity').then((r) => r.data as ActivityResponse),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const health = useQuery<HealthResponse>({
    queryKey: ['admin-overview-health'],
    queryFn: () => apiClient.get('/admin/dashboard/health').then((r) => r.data as HealthResponse),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const k = kpi.data?.data;
  const c = charts.data?.data;
  const a = activity.data?.data ?? [];
  const h = health.data?.data;

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white">Operatör Panosu</h1>
          <p className="text-sm text-slate-400 mt-1">
            Son 30 günün özeti — 60 saniyede bir otomatik yenilenir.
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Lead (30g)"
          value={kpi.isLoading ? '—' : k?.totalLeads30d ?? 0}
          delta={k ? fmtDelta(k.leadsDelta) : undefined}
          icon={<Users size={14} />}
        />
        <StatCard
          label="Yeni Abone (7g)"
          value={kpi.isLoading ? '—' : k?.newSubscribers7d ?? 0}
          delta={k ? fmtDelta(k.subscribersDelta) : undefined}
          icon={<Mail size={14} />}
        />
        <StatCard
          label="Hot Lead"
          value={kpi.isLoading ? '—' : k?.hotLeads ?? 0}
          icon={<Flame size={14} />}
          tone={k && k.hotLeads > 0 ? 'positive' : 'default'}
        />
        <StatCard
          label="Disc. Call (Ay)"
          value={kpi.isLoading ? '—' : k?.discoveryCallsThisMonth ?? 0}
          icon={<CalendarCheck size={14} />}
        />
        <StatCard
          label="Conversion"
          value={kpi.isLoading ? '—' : `${k?.conversionRate?.toFixed(1) ?? 0}%`}
          icon={<Percent size={14} />}
        />
        <StatCard
          label="Avg Score"
          value={kpi.isLoading ? '—' : k?.avgLeadScore ?? 0}
          icon={<Gauge size={14} />}
        />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <article className="lg:col-span-2 bg-white/[0.02] border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Lead Trendi — 30 gün</h2>
          {charts.isLoading || !c ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">Yükleniyor…</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={c.leadTrend30d}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#F59E0B" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
        <article className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Kaynak Dağılımı</h2>
          {charts.isLoading || !c ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">Yükleniyor…</div>
          ) : c.sourceBreakdown.length === 0 ? (
            <EmptyState title="Veri yok" description="Henüz lead kaynağı verisi yok." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={c.sourceBreakdown} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>
                    {c.sourceBreakdown.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
      </section>

      {/* Funnel + Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <article className="lg:col-span-2 bg-white/[0.02] border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Dönüşüm Hunisi</h2>
          {charts.isLoading || !c ? (
            <div className="h-56 flex items-center justify-center text-slate-500 text-sm">Yükleniyor…</div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={c.funnel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis type="category" dataKey="stage" stroke="#64748b" fontSize={11} width={90} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#7C3AED" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
        <article className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Son Aktivite</h2>
            <Activity size={14} className="text-slate-500" aria-hidden="true" />
          </div>
          {activity.isLoading ? (
            <p className="text-slate-500 text-sm">Yükleniyor…</p>
          ) : a.length === 0 ? (
            <p className="text-slate-500 text-sm">Henüz aktivite yok.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {a.slice(0, 10).map((evt) => (
                <li key={evt.id} className="flex items-start gap-2 pb-2 border-b border-white/5 last:border-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 flex-shrink-0" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-200 truncate">{evt.subject}</p>
                    <p className="text-xs text-slate-500">
                      {evt.type} · {new Date(evt.timestamp).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      {/* Quick actions + Health */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <article className="lg:col-span-2 bg-white/[0.02] border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Hızlı Eylemler</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <QuickAction to="/admin/leads" icon={<Users size={16} />} label="Lead Listesi" />
            <QuickAction to="/admin/newsletter/campaigns" icon={<Send size={16} />} label="Yeni Kampanya" />
            <QuickAction to="/admin/blog" icon={<FileText size={16} />} label="Yeni Blog" />
            <QuickAction to="/admin/newsletter" icon={<Mail size={16} />} label="Newsletter" />
            <QuickAction to="/admin/contacts" icon={<PlusCircle size={16} />} label="İletişim" />
            <QuickAction to="/admin/settings" icon={<Settings size={16} />} label="Ayarlar" />
          </div>
        </article>
        <article className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Sistem Sağlığı</h2>
          {!h ? (
            <p className="text-slate-500 text-sm">Yükleniyor…</p>
          ) : (
            <ul className="space-y-2 text-sm">
              <HealthRow label="Backend" status={h.backend} />
              <HealthRow label="Veritabanı" status={h.db} />
              <HealthRow label="Queue" status={h.queue} />
              <li className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-slate-400 text-xs">Hata oranı</span>
                <span className="text-white text-xs font-semibold">{h.errorRate.toFixed(2)}%</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">Uptime</span>
                <span className="text-white text-xs font-semibold">
                  {Math.floor(h.uptime / 3600)}s {Math.floor((h.uptime % 3600) / 60)}d
                </span>
              </li>
            </ul>
          )}
        </article>
      </section>
    </div>
  );
};

const QuickAction: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => (
  <Link
    to={to}
    className="flex items-center gap-2 px-3 py-3 rounded-lg bg-white/[0.03] border border-white/10 hover:border-secondary/30 hover:bg-white/5 transition-colors text-sm text-white"
  >
    <span className="text-secondary">{icon}</span>
    <span className="flex-1">{label}</span>
    <ArrowRight size={12} className="text-slate-500" aria-hidden="true" />
  </Link>
);

const HealthRow: React.FC<{ label: string; status: 'ok' | 'degraded' | 'down' }> = ({ label, status }) => {
  const colorClass =
    status === 'ok' ? 'text-secondary' : status === 'degraded' ? 'text-amber-400' : 'text-red-400';
  const Icon = status === 'ok' ? CheckCircle2 : XCircle;
  return (
    <li className="flex items-center justify-between">
      <span className="text-slate-300">{label}</span>
      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${colorClass}`}>
        <Icon size={12} aria-hidden="true" />
        {status === 'ok' ? 'OK' : status === 'degraded' ? 'Yavaş' : 'Hata'}
      </span>
    </li>
  );
};

export default AdminOverviewPage;
