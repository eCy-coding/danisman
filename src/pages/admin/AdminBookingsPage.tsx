import React, { useState } from 'react';
import { Calendar, Clock, User, Mail, Building2, MessageSquare, Check, X, Search, Filter, ChevronDown, Eye } from 'lucide-react';

type Status = 'pending' | 'confirmed' | 'cancelled' | 'completed';

interface Booking {
  id: string;
  name: string;
  email: string;
  company: string;
  date: string;
  time: string;
  message: string;
  status: Status;
  createdAt: string;
}

const MOCK_BOOKINGS: Booking[] = [
  { id: 'bk-001', name: 'Ahmet Yılmaz', email: 'ahmet@teknoloji.com', company: 'Teknoloji A.Ş.', date: '2026-05-15', time: '10:00', message: 'Yapay zeka stratejimizi tartışmak istiyoruz.', status: 'pending', createdAt: '2026-05-04' },
  { id: 'bk-002', name: 'Sarah Johnson', email: 'sarah@globalcorp.com', company: 'GlobalCorp Ltd.', date: '2026-05-16', time: '14:30', message: 'M&A advisory for our European expansion.', status: 'confirmed', createdAt: '2026-05-03' },
  { id: 'bk-003', name: 'Mehmet Demir', email: 'mdemir@fintech.io', company: 'FinTech Solutions', date: '2026-05-12', time: '11:00', message: 'Dijital dönüşüm projesini değerlendirmek istiyoruz.', status: 'completed', createdAt: '2026-05-01' },
  { id: 'bk-004', name: 'Emma Schmidt', email: 'eschmidt@eu-energy.de', company: 'EU Energy GmbH', date: '2026-05-18', time: '09:30', message: 'Net zero roadmap consultation.', status: 'pending', createdAt: '2026-05-04' },
  { id: 'bk-005', name: 'Can Öztürk', email: 'coztürk@saas.co', company: 'SaaS Platform Inc.', date: '2026-05-08', time: '15:00', message: 'PLG stratejimiz için danışmanlık.', status: 'cancelled', createdAt: '2026-04-30' },
  { id: 'bk-006', name: 'Lisa Chen', email: 'lchen@healthnet.org', company: 'Regional Health Network', date: '2026-05-20', time: '10:30', message: 'AI platform implementation review.', status: 'confirmed', createdAt: '2026-05-02' },
];

const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: 'Bekliyor', bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  confirmed: { label: 'Onaylandı', bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
  cancelled: { label: 'İptal', bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  completed: { label: 'Tamamlandı', bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
};

export const AdminBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const [selected, setSelected] = useState<Booking | null>(null);

  const filtered = bookings.filter(b => {
    const matchSearch = !search || [b.name, b.email, b.company].some(f => f.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const updateStatus = (id: string, status: Status) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Toplam', value: stats.total, color: 'text-white' },
          { label: 'Bekliyor', value: stats.pending, color: 'text-yellow-400' },
          { label: 'Onaylı', value: stats.confirmed, color: 'text-green-400' },
          { label: 'Tamamlandı', value: stats.completed, color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/3 border border-white/8 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ad, e-posta veya şirket ara..."
            className="w-full bg-white/4 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-primary/50"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as Status | 'all')}
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
              {filtered.map(b => {
                const st = STATUS_CONFIG[b.status];
                return (
                  <tr key={b.id} className={`hover:bg-white/3 transition-colors ${selected?.id === b.id ? 'bg-white/5' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{b.name}</p>
                      <p className="text-xs text-slate-500">{b.company}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-slate-300">{b.date}</p>
                      <p className="text-xs text-slate-500">{b.time}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st.bg} ${st.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {b.status === 'pending' && (
                          <>
                            <button type="button" onClick={() => updateStatus(b.id, 'confirmed')} className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors" title="Onayla">
                              <Check size={13} />
                            </button>
                            <button type="button" onClick={() => updateStatus(b.id, 'cancelled')} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="İptal">
                              <X size={13} />
                            </button>
                          </>
                        )}
                        {b.status === 'confirmed' && (
                          <button type="button" onClick={() => updateStatus(b.id, 'completed')} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors" title="Tamamlandı">
                            <Check size={13} />
                          </button>
                        )}
                        <button type="button" onClick={() => setSelected(selected?.id === b.id ? null : b)} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors" title="Detay">
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
              <button type="button" onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
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
                  <span className="text-slate-500 mt-0.5"><MessageSquare size={14} /></span>
                  <p className="text-slate-400 text-xs leading-relaxed">{selected.message}</p>
                </div>
              )}
            </div>
            <div className="pt-3 border-t border-white/5 space-y-2">
              <p className="text-[10px] text-slate-600 uppercase tracking-widest">Durum Güncelle</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STATUS_CONFIG) as Status[]).map(s => {
                  const st = STATUS_CONFIG[s];
                  return (
                    <button type="button"
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
