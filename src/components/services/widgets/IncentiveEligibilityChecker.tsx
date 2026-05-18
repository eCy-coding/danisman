/**
 * P49 S12 — Investment Incentives Eligibility Checker.
 *
 * Industry + Size + Region + Investment Amount → eligible Türk teşvik programları.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const INDUSTRIES = ['Üretim', 'Tarım', 'Hizmet', 'Bilişim/AI', 'Sağlık', 'Enerji', 'İhracat'];
const SIZES = ['Mikro (1-9)', 'Küçük (10-49)', 'Orta (50-249)', 'Büyük (250+)'];
const REGIONS = ['1. Bölge (İst/Ank/İzm)', '2-3. Bölge', '4-5. Bölge', '6. Bölge'];

interface Program { name: string; valueRange: string; eligible: (i: string, s: string, r: string, amt: number) => boolean; }

const PROGRAMS: Program[] = [
  { name: 'Yatırım Teşvik Belgesi (Genel)', valueRange: '₺500k+ vergi indirimi', eligible: (_, __, ___, amt) => amt >= 1_000_000 },
  { name: 'Yatırım Teşvik (Stratejik)', valueRange: '₺50M+ vergi muafiyeti', eligible: (_, __, ___, amt) => amt >= 50_000_000 },
  { name: 'TÜBİTAK 1501 (Ar-Ge)', valueRange: '%75 hibe, max ₺3M', eligible: (i) => ['Bilişim/AI', 'Üretim', 'Sağlık'].includes(i) },
  { name: 'TÜBİTAK 1507 (KOBİ Ar-Ge)', valueRange: '%75 hibe, max ₺900k', eligible: (_, s) => ['Küçük (10-49)', 'Orta (50-249)'].includes(s) },
  { name: 'KOSGEB Stratejik Ürün', valueRange: 'max ₺6M hibe', eligible: (_, s) => ['Mikro (1-9)', 'Küçük (10-49)', 'Orta (50-249)'].includes(s) },
  { name: '6. Bölge SGK Teşviki', valueRange: 'SGK primi devlet karşılar', eligible: (_, __, r) => r === '6. Bölge' },
  { name: 'İhracat Destek (TURQUALITY)', valueRange: '%50 destek, marka için', eligible: (i) => i === 'İhracat' },
  { name: 'EU Horizon Europe', valueRange: '€100k-2M Ar-Ge', eligible: (i) => ['Bilişim/AI', 'Sağlık', 'Enerji'].includes(i) },
  { name: 'Ar-Ge Merkezi Statüsü', valueRange: '%80 vergi indirimi + SGK', eligible: (i, s) => ['Bilişim/AI', 'Üretim', 'Sağlık'].includes(i) && ['Orta (50-249)', 'Büyük (250+)'].includes(s) },
];

export const IncentiveEligibilityChecker: React.FC = () => {
  const [ind, setInd] = useState(INDUSTRIES[0]);
  const [size, setSize] = useState(SIZES[0]);
  const [region, setRegion] = useState(REGIONS[0]);
  const [amount, setAmount] = useState(5_000_000);

  const eligible = useMemo(() => PROGRAMS.filter((p) => ind && size && region && p.eligible(ind, size, region, amount)), [ind, size, region, amount]);

  return (
    <section className="py-16 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent via-secondary/[0.03] to-transparent" aria-labelledby="incentive-heading" data-testid="incentive-eligibility-checker">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">Teşvik Uygunluk Kontrol</div>
          <h2 id="incentive-heading" className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">Türk Teşvik Programı Eligibility</h2>
          <p className="text-slate-400">Sektör + büyüklük + bölge + yatırım tutarınızı seçin — uygun olduğunuz programları görün.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-5">
            <div>
              <label htmlFor="inc-ind" className="block text-sm font-semibold text-white mb-2">Sektör</label>
              <select id="inc-ind" value={ind} onChange={(e) => setInd(e.target.value)} className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-white">
                {INDUSTRIES.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="inc-size" className="block text-sm font-semibold text-white mb-2">İşletme Büyüklüğü</label>
              <select id="inc-size" value={size} onChange={(e) => setSize(e.target.value)} className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-white">
                {SIZES.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="inc-region" className="block text-sm font-semibold text-white mb-2">Bölge</label>
              <select id="inc-region" value={region} onChange={(e) => setRegion(e.target.value)} className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-white">
                {REGIONS.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="inc-amt" className="block text-sm font-semibold text-white mb-2">Yatırım Tutarı (₺)</label>
              <input id="inc-amt" type="range" min="500000" max="100000000" step="500000" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full accent-secondary" />
              <p className="mt-2 text-xl font-serif font-bold text-white">₺{(amount / 1_000_000).toFixed(1)}M</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-secondary/15 to-primary/10 border border-secondary/30 rounded-2xl p-6 md:p-8">
            <div className="text-xs uppercase tracking-widest text-secondary mb-3">Uygun Programlar ({eligible.length})</div>
            {eligible.length === 0 ? (
              <p className="text-slate-300 text-sm">Seçimlerinize uygun program bulunamadı. Discovery Call ile özel değerlendirme.</p>
            ) : (
              <ul className="space-y-3 mb-6">
                {eligible.map((p) => (
                  <li key={p.name} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                    <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.valueRange}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors">Detaylı Başvuru Görüşmesi <ArrowRight size={16} /></Link>
          </div>
        </div>
      </div>
    </section>
  );
};
