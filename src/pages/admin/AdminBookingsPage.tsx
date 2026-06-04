import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Building2,
  MessageSquare,
  Check,
  X,
  Search,
  Filter,
  ChevronDown,
  Eye,
} from 'lucide-react';
import {
  useAdminBookings,
  useUpdateBookingStatus,
  type AdminBookingRow,
  type AdminBookingStatus,
} from '../../hooks/useAdminBookings';

/**
 * P44-T07 (extension) — AdminBookingsPage rewired to real backend.
 *
 * Previous `MOCK_BOOKINGS` (Ahmet/Sarah/Mehmet/Emma/Can/Lisa placeholder
 * entries) is gone. Data now flows from `useAdminBookings` →
 * `GET /api/bookings` with the existing admin scope (ADMIN/CONSULTANT see all
 * bookings, controller `listBookings`). Status updates go through
 * `useUpdateBookingStatus` → `PATCH /api/bookings/:id/status` (server-side
 * `requireRole('ADMIN')`). No silent fallback to mock data — KVKK launch
 * discipline requires explicit loading / error / empty states.
 */

type Status = AdminBookingStatus;
type Booking = AdminBookingRow;

const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string; dot: string }> = {
  pending: {
    label: 'Bekliyor',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    dot: 'bg-yellow-400',
  },
  confirmed: {
    label: 'Onaylandı',
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    dot: 'bg-green-400',
  },
  cancelled: { label: 'İptal', bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  completed: {
    label: 'Tamamlandı',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
  },
};

export const AdminBookingsPage: React.FC = () => {
  const { data: bookings = [], isLoading, isError, error, refetch } = useAdminBookings();
  const updateMutation = useUpdateBookingStatus();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  // R8-P4 — temporal scope tab: all / upcoming / past. Upcoming is scheduledAt
  // > now; past is everything else. Cancelled is excluded from upcoming.
  const [scope, setScope] = useState<'all' | 'upcoming' | 'past'>('all');
  // R8-P4 — sort by scheduledAt. desc default (newest / soonest first).
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selected, setSelected] = useState<Booking | null>(null);

  const todayMidnight = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  const filtered = bookings
    .filter((b) => {
      const matchSearch =
        !search ||
        [b.name, b.email, b.company].some((f) =>
          (f ?? '').toLowerCase().includes(search.toLowerCase()),
        );
      const matchStatus = filterStatus === 'all' || b.status === filterStatus;
      if (!matchSearch || !matchStatus) return false;
      if (scope === 'all') return true;
      const dt = new Date(`${b.date}T${b.time || '00:00'}:00`);
      const isUpcoming = dt >= todayMidnight && b.status !== 'cancelled';
      return scope === 'upcoming' ? isUpcoming : !isUpcoming;
    })
    .sort((a, b) => {
      const ka = new Date(`${a.date}T${a.time || '00:00'}:00`).getTime();
      const kb = new Date(`${b.date}T${b.time || '00:00'}:00`).getTime();
      return sortDir === 'desc' ? kb - ka : ka - kb;
    });

  const updateStatus = (id: string, status: Status) => {
    // Optimistic UI: keep the detail-panel echo while the mutation flies.
    if (selected?.id === id) setSelected((prev) => (prev ? { ...prev, status } : null));
    updateMutation.mutate({ id, status });
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Görüşme Talepleri</h1>
          <p className="text-sm text-slate-400 mt-1">Gelen keşif görüşmesi talepleri</p>
        </div>
      </div>

      {/* P44-T07: loading / error banners replace the silent MOCK fallback. */}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-white/8 bg-white/3 p-4 text-sm text-slate-400"
        >
          Görüşmeler yükleniyor…
        </div>
      )}
      {isError && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          <div className="font-semibold mb-1">Görüşme listesi yüklenemedi.</div>
          <div className="text-red-200 mb-2">
            {error instanceof Error ? error.message : 'Bilinmeyen hata'}
          </div>
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-semibold hover:bg-red-500/20"
          >
            Tekrar dene
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Toplam', value: stats.total, color: 'text-white' },
          { label: 'Bekliyor', value: stats.pending, color: 'text-yellow-400' },
          { label: 'Onaylı', value: stats.confirmed, color: 'text-green-400' },
          { label: 'Tamamlandı', value: stats.completed, color: 'text-blue-400' },
        ].map((s) => (
          <div key={s.label} className="bg-white/3 border border-white/8 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* R8-P4 — temporal scope tabs */}
      <div className="flex gap-2" role="tablist" aria-label="Görüşme Zaman Kapsamı">
        {(['all', 'upcoming', 'past'] as const).map((s) => {
          const label = s === 'all' ? 'Tümü' : s === 'upcoming' ? 'Yaklaşan' : 'Geçmiş';
          return (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={scope === s}
              onClick={() => setScope(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                scope === s
                  ? 'bg-blue-500/25 border-blue-400 text-blue-100'
                  : 'border-white/10 text-slate-400 hover:bg-white/5'
              }`}
            >
              {label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
          className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 text-slate-300 hover:bg-white/5"
          aria-label="Sıralama yönü"
        >
          Tarih: {sortDir === 'desc' ? '↓ Yeni' : '↑ Eski'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ad, e-posta veya şirket ara..."
            className="w-full bg-white/4 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-primary/50"
          />
        </div>
        <div className="relative">
          <Filter
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as Status | 'all')}
            className="bg-white/4 border border-white/10 rounded-xl pl-9 pr-8 py-2.5 text-sm text-white outline-none focus:border-primary/50 appearance-none cursor-pointer"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="pending">Bekliyor</option>
            <option value="confirmed">Onaylandı</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">İptal</option>
          </select>
        </div>
      </div>

      <div className={`grid gap-6 ${selected ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Table */}
        <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[10px] text-slate-500 uppercase tracking-widest">
                <th className="px-4 py-3 text-left">Kişi</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Tarih / Saat</th>
                <th className="px-4 py-3 text-left">Durum</th>
                <th className="px-4 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((b) => {
                const st = STATUS_CONFIG[b.status];
                return (
                  <tr
                    key={b.id}
                    className={`hover:bg-white/3 transition-colors ${selected?.id === b.id ? 'bg-white/5' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{b.name}</p>
                      <p className="text-xs text-slate-500">{b.company}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-slate-300">{b.date}</p>
                      <p className="text-xs text-slate-500">{b.time}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st.bg} ${st.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {b.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => updateStatus(b.id, 'confirmed')}
                              className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                              title="Onayla"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStatus(b.id, 'cancelled')}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                              title="İptal"
                            >
                              <X size={13} />
                            </button>
                          </>
                        )}
                        {b.status === 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => updateStatus(b.id, 'completed')}
                            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                            title="Tamamlandı"
                          >
                            <Check size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelected(selected?.id === b.id ? null : b)}
                          className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                          title="Detay"
                        >
                          <Eye size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-sm">Sonuç bulunamadı.</div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6 space-y-4 h-fit">
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-white">Detay</h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { icon: <User size={14} />, label: selected.name },
                { icon: <Mail size={14} />, label: selected.email },
                { icon: <Building2 size={14} />, label: selected.company },
                { icon: <Calendar size={14} />, label: selected.date },
                { icon: <Clock size={14} />, label: selected.time },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-slate-500">{row.icon}</span>
                  <span className="text-slate-300">{row.label}</span>
                </div>
              ))}
              {selected.message && (
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-slate-500 mt-0.5">
                    <MessageSquare size={14} />
                  </span>
                  <p className="text-slate-400 text-xs leading-relaxed">{selected.message}</p>
                </div>
              )}
            </div>
            <div className="pt-3 border-t border-white/5 space-y-2">
              <p className="text-[10px] text-slate-600 uppercase tracking-widest">Durum Güncelle</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STATUS_CONFIG) as Status[]).map((s) => {
                  const st = STATUS_CONFIG[s];
                  return (
                    <button
                      type="button"
                      key={s}
                      onClick={() => updateStatus(selected.id, s)}
                      disabled={selected.status === s}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selected.status === s ? `${st.bg} ${st.text} opacity-100` : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-white'} disabled:cursor-default`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
