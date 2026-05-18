/**
 * P49 S15 — Industrial Relations Union Engagement Matrix.
 *
 * Workforce + union membership + strike history + sector → strategy matrix.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const SECTORS = ['Üretim', 'Hizmet', 'Madencilik', 'Lojistik/Ulaşım', 'Sağlık', 'Bankacılık'];
const STRIKE_HISTORY = ['Yok', 'Son 5 yıl 1x', 'Son 5 yıl 2+'];

export const UnionEngagementMatrix: React.FC = () => {
  const [workforce, setWorkforce] = useState(500);
  const [unionPct, setUnionPct] = useState(60);
  const [strike, setStrike] = useState(STRIKE_HISTORY[0]);
  const [sector, setSector] = useState(SECTORS[0]);

  const strategy = useMemo(() => {
    const risk = unionPct >= 70 || strike !== 'Yok' ? 'high' : unionPct >= 40 ? 'medium' : 'low';
    const labels = {
      high: { name: 'Stratejik Müzakere + Pre-emptive', desc: 'Yıllık ortaklık modu — sürekli sendika diyaloğu, pre-emptive issue resolution, çalışma barışı KPI dashboard.' },
      medium: { name: 'Çeyreklik Müzakere Hazırlık', desc: 'TİS dönemleri için BATNA + mali kapasite analizi + senaryo tatbikatı.' },
      low: { name: 'Audit + Compliance', desc: 'Reaktif değil proactive — yıllık İSG audit, sözleşme review.' },
    };
    return labels[risk];
  }, [unionPct, strike]);

  return (
    <section className="py-16 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent via-secondary/[0.03] to-transparent" aria-labelledby="union-heading" data-testid="union-engagement-matrix">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">Endüstriyel İlişkiler Profili</div>
          <h2 id="union-heading" className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">Sendika Müzakere Stratejisi</h2>
          <p className="text-slate-400">Sektör + çalışan sayısı + sendikalaşma oranı + grev geçmişi → uygun müzakere stratejisi.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-5">
            <div><label htmlFor="ir-sector" className="block text-sm font-semibold text-white mb-2">Sektör</label>
              <select id="ir-sector" value={sector} onChange={(e) => setSector(e.target.value)} className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-white">
                {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div><label htmlFor="ir-wf" className="block text-sm font-semibold text-white mb-2">Çalışan Sayısı: <span className="text-secondary font-serif">{workforce}</span></label>
              <input id="ir-wf" type="range" min="50" max="5000" step="50" value={workforce} onChange={(e) => setWorkforce(Number(e.target.value))} className="w-full accent-secondary" /></div>
            <div><label htmlFor="ir-union" className="block text-sm font-semibold text-white mb-2">Sendikalaşma Oranı: <span className="text-secondary font-serif">%{unionPct}</span></label>
              <input id="ir-union" type="range" min="0" max="100" step="5" value={unionPct} onChange={(e) => setUnionPct(Number(e.target.value))} className="w-full accent-secondary" /></div>
            <div><label htmlFor="ir-strike" className="block text-sm font-semibold text-white mb-2">Grev Geçmişi</label>
              <select id="ir-strike" value={strike} onChange={(e) => setStrike(e.target.value)} className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-white">
                {STRIKE_HISTORY.map((s) => <option key={s} value={s}>{s}</option>)}
              </select></div>
          </div>
          <div className="bg-gradient-to-br from-secondary/15 to-primary/10 border border-secondary/30 rounded-2xl p-6 md:p-8">
            <div className="text-xs uppercase tracking-widest text-secondary mb-3">Önerilen Strateji</div>
            <h3 className="text-2xl font-serif font-bold text-white mb-4">{strategy.name}</h3>
            <p className="text-slate-200 leading-relaxed mb-6">{strategy.desc}</p>
            <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors">TİS Hazırlık Görüşmesi <ArrowRight size={16} /></Link>
          </div>
        </div>
      </div>
    </section>
  );
};
