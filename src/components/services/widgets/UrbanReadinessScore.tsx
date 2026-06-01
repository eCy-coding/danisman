/**
 * P49 S20 — Smart Cities Urban Readiness Score.
 *
 * Belediye için olgunluk + 3-yıllık roadmap öneri.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2 } from 'lucide-react';

const SIZES = ['Küçük (< 100k)', 'Orta (100k-500k)', 'Büyük (500k-1.5M)', 'Mega (> 1.5M)'];

export const UrbanReadinessScore: React.FC = () => {
  const [size, setSize] = useState(SIZES[1]);
  const [population, setPopulation] = useState(350_000);
  const [techInfra, setTechInfra] = useState(2); // 1-5
  const [initiatives, setInitiatives] = useState(3); // current smart city projects count
  const [openData, setOpenData] = useState(2); // open data portal maturity
  const [budget, setBudget] = useState(50); // % of IT budget dedicated to smart city

  const score = useMemo(() => {
    return Math.round(
      ((techInfra + Math.min(initiatives / 2, 5) + openData + budget / 20) / 4) * 20,
    );
  }, [techInfra, initiatives, openData, budget]);

  const roadmap = useMemo(() => {
    if (score < 35)
      return {
        phase: 'Foundation Year 1',
        desc: 'Veri envanteri + omnichannel vatandaş portalı + IT operating model. Y1 hedef: maturity score 50+.',
      };
    if (score < 65)
      return {
        phase: 'Scale Year 2',
        desc: 'IoT pilotları (akıllı atık, hava kalitesi) + AI use-case portfolio + AB hibe başvurusu. Y2 hedef: 75+.',
      };
    return {
      phase: 'Optimize Year 3',
      desc: 'Cross-domain entegrasyon (mobility + energy + safety) + data marketplace + smart city ekosistemi. Y3 hedef: 90+.',
    };
  }, [score]);

  return (
    <section
      className="py-16 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent via-secondary/[0.03] to-transparent"
      aria-labelledby="urban-heading"
      data-testid="urban-readiness-score"
    >
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3 flex items-center gap-2">
            <Building2 size={14} /> Akıllı Şehir Hazırlığı
          </div>
          <h2
            id="urban-heading"
            className="text-3xl md:text-4xl font-serif font-bold text-white mb-3"
          >
            Urban Readiness Score
          </h2>
          <p className="text-slate-400">
            Belediye profilinizi girin — olgunluk skoru + 3-yıllık roadmap önerisi.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-5">
            <div>
              <label
                htmlFor="urs-city-size"
                className="block text-sm font-semibold text-white mb-2"
              >
                Şehir Boyutu
              </label>
              <select
                id="urs-city-size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-white"
              >
                {SIZES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Nüfus:{' '}
                <span className="text-secondary font-serif">{(population / 1000).toFixed(0)}k</span>
              </label>
              <input
                type="range"
                min="20000"
                max="5000000"
                step="10000"
                value={population}
                onChange={(e) => setPopulation(Number(e.target.value))}
                className="w-full accent-secondary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Tech Altyapı (1-5): <span className="text-secondary font-serif">{techInfra}</span>
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={techInfra}
                onChange={(e) => setTechInfra(Number(e.target.value))}
                className="w-full accent-secondary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Mevcut Smart City Projeleri:{' '}
                <span className="text-secondary font-serif">{initiatives}</span>
              </label>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={initiatives}
                onChange={(e) => setInitiatives(Number(e.target.value))}
                className="w-full accent-secondary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Açık Veri Portalı (1-5):{' '}
                <span className="text-secondary font-serif">{openData}</span>
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={openData}
                onChange={(e) => setOpenData(Number(e.target.value))}
                className="w-full accent-secondary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Smart City IT Bütçe Payı:{' '}
                <span className="text-secondary font-serif">%{budget}</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-secondary"
              />
            </div>
          </div>
          <div className="bg-gradient-to-br from-secondary/15 to-primary/10 border border-secondary/30 rounded-2xl p-6 md:p-8">
            <div className="text-xs uppercase tracking-widest text-secondary mb-3">
              Olgunluk Skoru
            </div>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-serif font-bold text-white">{score}</span>
              <span className="text-slate-400">/100</span>
            </div>
            <div className="text-xs uppercase tracking-widest text-secondary mb-2">
              3-Yıllık Roadmap
            </div>
            <h3 className="text-xl font-serif font-bold text-white mb-3">{roadmap.phase}</h3>
            <p className="text-slate-200 leading-relaxed mb-6 text-sm">{roadmap.desc}</p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors"
            >
              Smart City Audit <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
