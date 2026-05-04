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
  Bar
} from 'recharts';
import { Activity, Users, Eye, ArrowUpRight, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useSSE, type DashboardMetrics } from '../../hooks/useSSE';
import { motion } from 'motion/react';
import { PromptTaskBoard } from '../../components/admin/PromptTaskBoard';

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
    className="bg-[#0A101F]/80 border border-white/5 rounded-2xl p-6 backdrop-blur-sm hover:border-white/10 transition-all group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-lg bg-white/5 ${stat.color} group-hover:bg-white/10 transition-colors`}>
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

const ConnectionBadge: React.FC<{ isConnected: boolean; onReconnect: () => void }> = ({ isConnected, onReconnect }) => (
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
        { label: 'Total Page Views', value: formatNumber(metrics.totalPageViews), icon: Eye, trend: '+24%', color: 'text-purple-400' },
        { label: 'Unique Visitors', value: formatNumber(metrics.uniqueVisitors), icon: Users, trend: '+12%', color: 'text-blue-400' },
        { label: 'Active Sessions', value: Math.round(metrics.avgSessionDuration).toString() + 's', icon: Activity, trend: '+5%', color: 'text-green-400' },
        { label: 'Conversion', value: metrics.conversionRate.toFixed(1) + '%', icon: ArrowUpRight, trend: '+1.2%', color: 'text-secondary' },
      ]
    : [
        { label: 'Total Visitors', value: '124.5K', icon: Users, trend: '+12%', color: 'text-blue-400' },
        { label: 'Active Sessions', value: '843', icon: Activity, trend: '+5%', color: 'text-green-400' },
        { label: 'Page Views', value: '1.2M', icon: Eye, trend: '+24%', color: 'text-purple-400' },
        { label: 'Conversion', value: '3.2%', icon: ArrowUpRight, trend: '+1.2%', color: 'text-secondary' },
      ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif text-white mb-2">Command Center</h1>
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
          className="bg-[#0A101F]/80 border border-white/5 rounded-2xl p-6 backdrop-blur-sm"
        >
          <h3 className="text-lg font-serif text-white mb-4">Top Pages (Live)</h3>
          <div className="space-y-3">
            {metrics.topPages.slice(0, 5).map((page, i) => (
              <div key={page.page} className="flex items-center gap-4">
                <span className="text-xs font-mono text-slate-400 w-6">{i + 1}.</span>
                <span className="text-sm text-slate-300 flex-1 font-mono">{page.page}</span>
                <span className="text-sm font-semibold text-secondary">{formatNumber(page.views)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-[#0A101F]/80 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-serif text-white mb-6">Traffic Analysis</h3>
          <div className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <AreaChart data={DEFAULT_TRAFFIC_DATA}>
                <defs>
                  <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#CCA43B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#CCA43B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050810', border: '1px solid #ffffff20', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="visitors" stroke="#CCA43B" strokeWidth={2} fillOpacity={1} fill="url(#colorVis)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Chart */}
        <div className="bg-[#0A101F]/80 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-serif text-white mb-6">Service Demand</h3>
          <div className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={SERVICE_PERFORMANCE} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff10" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={50} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: '#050810', border: '1px solid #ffffff20', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Prompt Optimization Board */}
      <div className="mt-8">
        <PromptTaskBoard />
      </div>
    </div>
  );
};

// ─── Utilities ───────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}
