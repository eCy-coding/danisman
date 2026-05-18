/**
 * P49 S18 — Market Entry Feasibility Matrix.
 *
 * 4-axis assessment (Market Size, Competition, Regulation, Cultural Match)
 * for selected target country → entry mode recommendation.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const COUNTRIES = [
  { code: 'DE', name: 'Almanya', preset: { size: 5, comp: 4, reg: 4, culture: 3 } },
  { code: 'UK', name: 'Birleşik Krallık', preset: { size: 4, comp: 5, reg: 4, culture: 3 } },
  { code: 'NL', name: 'Hollanda', preset: { size: 3, comp: 4, reg: 3, culture: 3 } },
  { code: 'AE', name: 'BAE', preset: { size: 3, comp: 3, reg: 2, culture: 4 } },
  { code: 'SA', name: 'Suudi Arabistan', preset: { size: 4, comp: 3, reg: 4, culture: 3 } },
  { code: 'EG', name: 'Mısır', preset: { size: 4, comp: 3, reg: 4, culture: 4 } },
  { code: 'MA', name: 'Fas', preset: { size: 3, comp: 2, reg: 3, culture: 3 } },
  { code: 'UZ', name: 'Özbekistan', preset: { size: 2, comp: 2, reg: 3, culture: 4 } },
  { code: 'KZ', name: 'Kazakistan', preset: { size: 3, comp: 2, reg: 3, culture: 3 } },
];

const DEFAULT_COUNTRY = COUNTRIES[0]!;

export const MarketFeasibilityMatrix: React.FC = () => {
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [size, setSize] = useState(DEFAULT_COUNTRY.preset.size);
  const [comp, setComp] = useState(DEFAULT_COUNTRY.preset.comp);
  const [reg, setReg] = useState(DEFAULT_COUNTRY.preset.reg);
  const [culture, setCulture] = useState(DEFAULT_COUNTRY.preset.culture);

  const score = useMemo(() => {
    // High size + low comp + low reg + high culture = ideal
    return Math.round(((size + (6 - comp) + (6 - reg) + culture) / 20) * 100);
  }, [size, comp, reg, culture]);

  const mode = useMemo(() => {
    if (score >= 70) return { name: 'Direct Export + Distributor', desc: 'Pazar açık, hızlı giriş mümkün. 3-6 ay distribütör seçimi + go-to-market.' };
    if (score >= 50) return { name: 'JV / Strategic Partner', desc: 'Yerel partner ile risk paylaşımı önerilir. 6-12 ay due diligence + JV strüktürü.' };
    if (score >= 30) return { name: 'Pilot Market Test', desc: 'Düşük volume pilot ile pazar testi. 12 ay sonra full-scale entry kararı.' };
    return { name: 'Daha Sonra / Alternatif Pazar', desc: 'Mevcut kapasiteyle ROI zor. Alternatif pazar tarama önerilir.' };
  }, [score]);

  const onCountryChange = (code: string) => {
    const c = COUNTRIES.find((x) => x.code === code);
    if (!c) return;
    setCountry(c);
    setSize(c.preset.size); setComp(c.preset.comp); setReg(c.preset.reg); setCulture(c.preset.culture);
  };

  return (
    <section className="py-16 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent via-secondary/[0.03] to-transparent" aria-labelledby="market-heading" data-testid="market-feasibility-matrix">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">Pazar Fizibilite Analizi</div>
          <h2 id="market-heading" className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">Hedef Pazar Değerlendirme</h2>
          <p className="text-slate-400">Hedef ülke seçin; 4 kriter üzerinden fizibilite skoru + giriş modu önerisi.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-5">
            <div><label className="block text-sm font-semibold text-white mb-2">Hedef Ülke</label>
              <select value={country.code} onChange={(e) => onCountryChange(e.target.value)} className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-white">
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
              <p className="text-xs text-slate-400 mt-2">Ülke seçimi default kriterleri set eder; ihtiyaca göre düzenleyin.</p></div>
            {[
              { label: 'Pazar Büyüklüğü', val: size, set: setSize },
              { label: 'Rekabet Yoğunluğu', val: comp, set: setComp },
              { label: 'Regülasyon Karmaşıklığı', val: reg, set: setReg },
              { label: 'Kültürel Uyum', val: culture, set: setCulture },
            ].map((x) => (
              <div key={x.label}>
                <label className="block text-sm font-semibold text-white mb-2">{x.label}: <span className="text-secondary font-serif">{x.val}/5</span></label>
                <input type="range" min="1" max="5" step="1" value={x.val} onChange={(e) => x.set(Number(e.target.value))} className="w-full accent-secondary" />
              </div>
            ))}
          </div>
          <div className="bg-gradient-to-br from-secondary/15 to-primary/10 border border-secondary/30 rounded-2xl p-6 md:p-8">
            <div className="text-xs uppercase tracking-widest text-secondary mb-3">Fizibilite Skoru</div>
            <div className="flex items-baseline gap-2 mb-6"><span className="text-5xl font-serif font-bold text-white">{score}</span><span className="text-slate-400">/100</span></div>
            <div className="text-xs uppercase tracking-widest text-secondary mb-2">Önerilen Giriş Modu</div>
            <h3 className="text-2xl font-serif font-bold text-white mb-3">{mode.name}</h3>
            <p className="text-slate-200 leading-relaxed mb-6 text-sm">{mode.desc}</p>
            <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors">Pazar Giriş Görüşmesi <ArrowRight size={16} /></Link>
          </div>
        </div>
      </div>
    </section>
  );
};
