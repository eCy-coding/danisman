import React, { useState, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Activity, Users, Eye, ArrowUpRight, Wifi, WifiOff, RefreshCw, Star } from 'lucide-react';
import { useSSE, type DashboardMetrics } from '../../hooks/useSSE';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { motion } from 'motion/react';
import { PromptTaskBoard } from '../../components/admin/PromptTaskBoard';
import { SystemHealthWidget } from '../../components/dashboard/widgets/SystemHealthWidget';
import { HotLeadsWidget } from '../../components/dashboard/widgets/HotLeadsWidget';
import { PipelineWidget } from '../../components/dashboard/widgets/PipelineWidget';
import { useT } from '../../hooks/useT';

// ─── Default Data (before SSE connects) ──────────────────

const DEFAULT_TRAFFIC_DATA = [
  { name: 'Mon', visitors: 4000, pageviews: 2400 },
  { name: 'Tue', visitors: 3000, pageviews: 1398 },
  { name: 'Wed', visitors: 2000, pageviews: 9800 },
  { name: 'Thu', visitors: 2780, pageviews: 3908 },
  { name: 'Fri', visitors: 1890, pageviews: 4800 },
  { name: 'Sat', visitors: 2390, pageviews: 3800 },
  { name: 'Sun', visitors: 3490, pageviews: 4300 },
];

const SERVICE_PERFORMANCE = [
  { name: 'M&A', value: 85 },
  { name: 'AI', value: 65 },
  { name: 'ESG', value: 45 },
  { name: 'Crypto', value: 30 },
  { name: 'Audit', value: 55 },
];

// ─── KPI Card Component ──────────────────────────────────

interface KPIData {
  label: string;
  value: string;
  icon: React.ElementType;
  trend: string;
  color: string;
}

const KPICard: React.FC<{ stat: KPIData; index: number }> = ({ stat, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1, duration: 0.5 }}
    className="bg-[#0A101F]/80 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all group"
  >
    <div className="flex justify-between items-start mb-4">
      <div
        className={`p-3 rounded-lg bg-white/5 ${stat.color} group-hover:bg-white/10 transition-colors`}
      >
        <stat.icon size={20} />
      </div>
      <span className="text-xs font-mono text-green-400 bg-green-900/20 px-2 py-0.5 rounded border border-green-900/30">
        {stat.trend}
      </span>
    </div>
    <p className="text-3xl font-serif text-white mb-1">{stat.value}</p>
    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{stat.label}</p>
  </motion.div>
);

// ─── Connection Status Badge ──────────────────────────────

const ConnectionBadge: React.FC<{ isConnected: boolean; onReconnect: () => void }> = ({
  isConnected,
  onReconnect,
}) => (
  <div className="flex gap-2 items-center">
    {isConnected ? (
      <div className="flex gap-2 text-xs font-mono text-secondary bg-secondary/10 px-3 py-1 rounded border border-secondary/20">
        <span className="relative flex h-2 w-2 items-center justify-center top-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-secondary" />
        </span>
        <Wifi size={12} className="mt-0.5" />
        LIVE
      </div>
    ) : (
      <div className="flex gap-2 items-center">
        <div className="flex gap-2 text-xs font-mono text-orange-400 bg-orange-900/10 px-3 py-1 rounded border border-orange-900/20">
          <WifiOff size={12} className="mt-0.5" />
          OFFLINE
        </div>
        <button
          type="button"
          onClick={onReconnect}
          className="p-1 text-slate-400 hover:text-white transition-colors"
          title="Reconnect SSE"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    )}
  </div>
);

// ─── Admin Dashboard ─────────────────────────────────────

export const AdminDashboard: React.FC = () => {
  const { t } = useT();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  const handleMetrics = useCallback((m: DashboardMetrics) => {
    setMetrics(m);
  }, []);

  const { isConnected, reconnect } = useSSE({
    onMetrics: handleMetrics,
  });

  // Build KPIs from SSE data or fallback to defaults
  const kpis: KPIData[] = metrics
    ? [
        {
          label: 'Total Page Views',
          value: formatNumber(metrics.totalPageViews),
          icon: Eye,
          trend: '+24%',
          color: 'text-purple-400',
        },
        {
          label: 'Unique Visitors',
          value: formatNumber(metrics.uniqueVisitors),
          icon: Users,
          trend: '+12%',
          color: 'text-blue-400',
        },
        {
          label: 'Active Sessions',
          value: Math.round(metrics.avgSessionDuration).toString() + 's',
          icon: Activity,
          trend: '+5%',
          color: 'text-green-400',
        },
        {
          label: 'Conversion',
          value: metrics.conversionRate.toFixed(1) + '%',
          icon: ArrowUpRight,
          trend: '+1.2%',
          color: 'text-secondary',
        },
      ]
    : [
        {
          label: 'Total Visitors',
          value: '124.5K',
          icon: Users,
          trend: '+12%',
          color: 'text-blue-400',
        },
        {
          label: 'Active Sessions',
          value: '843',
          icon: Activity,
          trend: '+5%',
          color: 'text-green-400',
        },
        { label: 'Page Views', value: '1.2M', icon: Eye, trend: '+24%', color: 'text-purple-400' },
        {
          label: 'Conversion',
          value: '3.2%',
          icon: ArrowUpRight,
          trend: '+1.2%',
          color: 'text-secondary',
        },
      ];

  return (
    <div
      data-testid="admin-dashboard"
      className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
    >
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif text-white mb-2">{t('dashboard.title')}</h1>
          <p className="text-slate-400 font-light">Real-time system telemetry</p>
        </div>
        <ConnectionBadge isConnected={isConnected} onReconnect={reconnect} />
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpis.map((stat, i) => (
          <KPICard key={stat.label} stat={stat} index={i} />
        ))}
      </div>

      {/* Top Pages (from SSE) */}
      {metrics?.topPages && metrics.topPages.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#0A101F]/80 border border-white/5 rounded-2xl p-6"
        >
          <h2 className="text-lg font-serif text-white mb-4">Top Pages (Live)</h2>
          <div className="space-y-3">
            {metrics.topPages.slice(0, 5).map((page, i) => (
              <div key={page.page} className="flex items-center gap-4">
                <span className="text-xs font-mono text-slate-400 w-6">{i + 1}.</span>
                <span className="text-sm text-slate-300 flex-1 font-mono">{page.page}</span>
                <span className="text-sm font-semibold text-secondary">
                  {formatNumber(page.views)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-[#0A101F]/80 border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-serif text-white mb-6">Traffic Analysis</h2>
          <div className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <AreaChart data={DEFAULT_TRAFFIC_DATA}>
                <defs>
                  <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#CCA43B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#CCA43B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#050810',
                    border: '1px solid #ffffff20',
                    borderRadius: '8px',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="#CCA43B"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorVis)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Chart */}
        <div className="bg-[#0A101F]/80 border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-serif text-white mb-6">Service Demand</h2>
          <div className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={SERVICE_PERFORMANCE} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff10" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    backgroundColor: '#050810',
                    border: '1px solid #ffffff20',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* P37-T10: NPS Widget + P34-T10: Lead Score Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <NPSSummaryWidget />
        <LeadTierWidget />
      </div>

      {/* System Health + Hot Leads + Pipeline widgets */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <SystemHealthWidget />
        <HotLeadsWidget />
        <PipelineWidget />
      </div>

      {/* Prompt Optimization Board */}
      <div className="mt-8">
        <PromptTaskBoard />
      </div>
    </div>
  );
};

// ─── NPS Summary Widget (P37-T10) ──────────────────────────────────

interface NpsSummary {
  status: string;
  data: {
    nps: number | null;
    total: number;
    promoters: number;
    passives: number;
    detractors: number;
    promoterPct: number;
    detractorPct: number;
    avgScore: number;
  };
}

const NPSSummaryWidget: React.FC = () => {
  const { data, isLoading } = useQuery<NpsSummary>({
    queryKey: ['admin-nps-summary'],
    queryFn: () => apiClient.get<NpsSummary>('/feedback/nps-summary').then((r) => r.data),
    staleTime: 300_000,
  });

  const nps = data?.data;
  const npsScore = nps?.nps;

  const npsColor =
    npsScore === null || npsScore === undefined
      ? '#64748b'
      : npsScore >= 50
        ? '#22c55e'
        : npsScore >= 0
          ? '#f59e0b'
          : '#ef4444';

  return (
    <div className="bg-[#0A101F]/80 border border-white/5 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Star size={16} className="text-amber-400 fill-amber-400" />
        <h2 className="text-sm font-semibold text-white">NPS Skoru</h2>
        <span className="text-xs text-slate-500 ml-auto">Son görüşmeler</span>
      </div>
      {isLoading ? (
        <div className="text-slate-500 text-sm text-center py-4">Yükleniyor...</div>
      ) : !nps || nps.total === 0 ? (
        <div className="text-slate-500 text-sm text-center py-4">Henüz değerlendirme yok</div>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <span className="text-5xl font-bold" style={{ color: npsColor }}>
              {npsScore !== null && npsScore !== undefined
                ? npsScore >= 0
                  ? `+${npsScore}`
                  : npsScore
                : '—'}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              {nps.total} değerlendirme · Ort. {nps.avgScore}/10
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Destekçi', value: nps.promoters, pct: nps.promoterPct, color: '#22c55e' },
              {
                label: 'Pasif',
                value: nps.passives,
                pct: 100 - nps.promoterPct - nps.detractorPct,
                color: '#f59e0b',
              },
              {
                label: 'Eleştirmen',
                value: nps.detractors,
                pct: nps.detractorPct,
                color: '#ef4444',
              },
            ].map(({ label, value, pct, color }) => (
              <div key={label} className="bg-white/3 rounded-lg px-2 py-2.5">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-lg font-bold text-white">{value}</p>
                <p className="text-xs font-medium" style={{ color }}>
                  %{pct}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Lead Tier Widget (P34-T10) ────────────────────────────────────

interface ContactsResponse {
  status: string;
  data: { items: { email: string }[] };
}

const LeadTierWidget: React.FC = () => {
  const { data } = useQuery<ContactsResponse>({
    queryKey: ['admin-contacts-leads'],
    queryFn: () => apiClient.get<ContactsResponse>('/admin/contacts?limit=100').then((r) => r.data),
    staleTime: 300_000,
  });

  const FREE_DOMAINS = new Set([
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'yandex.com',
    'icloud.com',
  ]);
  const contacts = data?.data.items ?? [];
  const corporate = contacts.filter((c) => !FREE_DOMAINS.has(c.email.split('@')[1] ?? '')).length;
  const personal = contacts.length - corporate;
  const warmPct = contacts.length > 0 ? Math.round((corporate / contacts.length) * 100) : 0;

  return (
    <div className="bg-[#0A101F]/80 border border-white/5 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users size={16} className="text-secondary" />
        <h2 className="text-sm font-semibold text-white">Lead Kalitesi</h2>
        <span className="text-xs text-slate-500 ml-auto">{contacts.length} toplam</span>
      </div>
      {contacts.length === 0 ? (
        <div className="text-slate-500 text-sm text-center py-4">Henüz lead yok</div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Kurumsal e-posta</span>
            <span className="text-sm font-semibold text-amber-400">
              {corporate} Warm (%{warmPct})
            </span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all"
              style={{ width: `${warmPct}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Kişisel e-posta</span>
            <span className="text-sm font-semibold text-slate-400">
              {personal} Cold (%{100 - warmPct})
            </span>
          </div>
          <p className="text-xs text-slate-600 pt-2 border-t border-white/5">
            Tam lead skoru için: Admin → Contacts → sunucu taraflı skorlama
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Utilities ───────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}
