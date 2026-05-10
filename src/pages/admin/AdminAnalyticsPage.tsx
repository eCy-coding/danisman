import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Mail,
  Calendar,
  Users,
  Eye,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { apiClient } from '../../lib/api';

interface StatsData {
  unreadContacts: number;
  totalContacts: number;
  activeSubscribers: number;
  pendingBookings: number;
  weeklyInteractions: number;
}

interface ApiStatsResponse {
  status: string;
  data: StatsData;
}

// ─── P37-T09: Booking Analytics Types ──────────────────────────

interface BookingAnalyticsData {
  status: string;
  data: {
    summary: {
      total: number;
      confirmed: number;
      completed: number;
      cancelled: number;
      noShow: number;
      cancelRate: number;
      noShowRate: number;
    };
    last30: { total: number; byStatus: Record<string, number> };
    trend: { day: string; count: number }[];
    byService: { serviceId: string | null; count: number }[];
  };
}

// ─── Booking Analytics Widget ───────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: '#22c55e',
  COMPLETED: '#3b82f6',
  CANCELLED: '#ef4444',
  NO_SHOW: '#f59e0b',
  PENDING: '#64748b',
};

const BookingAnalyticsWidget: React.FC = () => {
  const { data, isLoading } = useQuery<BookingAnalyticsData>({
    queryKey: ['admin-booking-analytics'],
    queryFn: () => apiClient.get<BookingAnalyticsData>('/bookings/analytics').then((r) => r.data),
    staleTime: 60_000,
  });

  const analytics = data?.data;

  // Pie chart data from last 30d byStatus
  const pieData = analytics
    ? Object.entries(analytics.last30.byStatus).map(([k, v]) => ({ name: k, value: v }))
    : [];

  return (
    <div className="bg-white/3 border border-white/5 rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Calendar size={16} className="text-secondary" />
        <h3 className="text-sm font-semibold text-white">Booking Analytics</h3>
        <span className="text-xs text-slate-500 ml-auto">Son 90 gün trend</span>
      </div>

      {isLoading ? (
        <div className="text-slate-500 text-sm text-center py-6">Yükleniyor...</div>
      ) : !analytics ? (
        <div className="text-slate-500 text-sm text-center py-6">Veri yok</div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: 'Toplam',
                value: analytics.summary.total,
                icon: Calendar,
                color: 'text-slate-400',
              },
              {
                label: 'Tamamlandı',
                value: analytics.summary.completed,
                icon: CheckCircle,
                color: 'text-green-400',
              },
              {
                label: 'İptal Oranı',
                value: `%${analytics.summary.cancelRate}`,
                icon: XCircle,
                color: 'text-red-400',
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white/3 rounded-xl p-3 text-center">
                <Icon size={14} className={`${color} mx-auto mb-1`} />
                <p className="text-lg font-bold text-white">{value}</p>
                <p className="text-[10px] text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Trend sparkline */}
          {analytics.trend.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Günlük booking trendi</p>
              <ResponsiveContainer width="100%" height={80}>
                <LineChart
                  data={analytics.trend}
                  margin={{ top: 2, bottom: 2, left: -35, right: 5 }}
                >
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 9, fill: '#475569' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(d) => d.slice(5)}
                    interval={Math.floor(analytics.trend.length / 4)}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: '#475569' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                    labelFormatter={(d) => String(d)}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#2563eb"
                    strokeWidth={1.5}
                    dot={false}
                    name="Bookings"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Status pie (last 30d) */}
          {pieData.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Son 30 gün — durum dağılımı</p>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="40%"
                    cy="50%"
                    outerRadius={50}
                    paddingAngle={2}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#64748b'} />
                    ))}
                  </Pie>
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    formatter={(v: string) => (
                      <span style={{ fontSize: 10, color: '#94a3b8' }}>{v}</span>
                    )}
                    wrapperStyle={{ fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* No-show alert */}
          {analytics.summary.noShowRate > 20 && (
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2">
              <AlertCircle size={13} />
              No-show oranı yüksek (%{analytics.summary.noShowRate}) — reminder e-postası aktif mi?
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Simulated weekly trend (replace with real GA4 API in Phase 34-T03)
const MOCK_TREND = [
  { day: 'Pzt', visits: 312, conversions: 8 },
  { day: 'Sal', visits: 285, conversions: 5 },
  { day: 'Çar', visits: 401, conversions: 12 },
  { day: 'Per', visits: 367, conversions: 9 },
  { day: 'Cum', visits: 430, conversions: 15 },
  { day: 'Cmt', visits: 198, conversions: 4 },
  { day: 'Paz', visits: 145, conversions: 3 },
];

const MOCK_SOURCES = [
  { source: 'Organic', value: 45 },
  { source: 'Direct', value: 28 },
  { source: 'Social', value: 15 },
  { source: 'Referral', value: 8 },
  { source: 'Email', value: 4 },
];

interface KPICardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  sub?: string;
}
const KPICard: React.FC<KPICardProps> = ({ label, value, icon: Icon, color, sub }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/3 border border-white/5 rounded-2xl p-5"
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon size={16} />
      </div>
      <TrendingUp size={12} className="text-green-400 opacity-60" />
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-xs text-slate-400 mt-1">{label}</p>
    {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
  </motion.div>
);

export const AdminAnalyticsPage: React.FC = () => {
  const { data, isLoading, refetch, isFetching } = useQuery<ApiStatsResponse>({
    queryKey: ['admin-analytics-stats'],
    queryFn: () => apiClient.get<ApiStatsResponse>('/admin/stats').then((r) => r.data),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const stats = data?.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="text-secondary" size={24} />
            Analytics Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time platform metrics • Auto-refresh 30s
          </p>
        </div>
        <button
          onClick={() => void refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white text-sm transition-colors"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Unread Contacts"
          value={isLoading ? '…' : (stats?.unreadContacts ?? 0)}
          icon={Mail}
          color="bg-red-500/10 text-red-400"
          sub={`${stats?.totalContacts ?? 0} total`}
        />
        <KPICard
          label="Active Subscribers"
          value={isLoading ? '…' : (stats?.activeSubscribers ?? 0)}
          icon={Users}
          color="bg-blue-500/10 text-blue-400"
        />
        <KPICard
          label="Pending Bookings"
          value={isLoading ? '…' : (stats?.pendingBookings ?? 0)}
          icon={Calendar}
          color="bg-yellow-500/10 text-yellow-400"
        />
        <KPICard
          label="Weekly Interactions"
          value={isLoading ? '…' : (stats?.weeklyInteractions ?? 0)}
          icon={Eye}
          color="bg-green-500/10 text-green-400"
          sub="Last 7 days"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Traffic trend */}
        <div className="xl:col-span-2 bg-white/3 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Weekly Visits &amp; Conversions</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MOCK_TREND} margin={{ top: 5, right: 10, bottom: 5, left: -30 }}>
              <defs>
                <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  color: '#e2e8f0',
                }}
              />
              <Area
                type="monotone"
                dataKey="visits"
                stroke="#2563eb"
                fill="url(#visitGrad)"
                strokeWidth={2}
                dot={false}
                name="Visits"
              />
              <Area
                type="monotone"
                dataKey="conversions"
                stroke="#10b981"
                fill="url(#convGrad)"
                strokeWidth={2}
                dot={false}
                name="Conversions"
              />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Connect GA4 API for real-time data (P34-T03)
          </p>
        </div>

        {/* Traffic sources */}
        <div className="bg-white/3 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Traffic Sources</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MOCK_SOURCES} layout="vertical" margin={{ left: 20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="source"
                type="category"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  color: '#e2e8f0',
                }}
              />
              <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} name="% Share" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* P37-T09: Booking Analytics Widget */}
      <BookingAnalyticsWidget />

      {/* GA4 Integration Notice */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 text-sm text-blue-300">
        <strong>📊 GA4 Integration:</strong> Gerçek zamanlı trafik verisi için GA4 Data API
        entegrasyonu gereklidir.
        <code className="ml-2 text-xs bg-blue-500/10 px-1.5 py-0.5 rounded font-mono">
          VITE_GA_TRACKING_ID
        </code>{' '}
        env değişkenini ayarlayın.
      </div>
    </div>
  );
};
