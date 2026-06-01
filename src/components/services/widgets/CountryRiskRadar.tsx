/**
 * P49 S19 — Global Intelligence Country Risk Radar.
 *
 * Select country → 6 dimension risk scoring (Political, Economic, Operational,
 * Security, Cyber, Reputational) + comparative radar.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const COUNTRIES: Record<string, { name: string; risks: Record<string, number> }> = {
  TR: {
    name: 'Türkiye',
    risks: { Political: 3, Economic: 4, Operational: 2, Security: 3, Cyber: 3, Reputational: 3 },
  },
  DE: {
    name: 'Almanya',
    risks: { Political: 1, Economic: 2, Operational: 1, Security: 1, Cyber: 2, Reputational: 1 },
  },
  UK: {
    name: 'Birleşik Krallık',
    risks: { Political: 2, Economic: 3, Operational: 1, Security: 2, Cyber: 2, Reputational: 1 },
  },
  US: {
    name: 'ABD',
    risks: { Political: 3, Economic: 2, Operational: 1, Security: 2, Cyber: 3, Reputational: 2 },
  },
  RU: {
    name: 'Rusya',
    risks: { Political: 5, Economic: 5, Operational: 4, Security: 5, Cyber: 5, Reputational: 5 },
  },
  CN: {
    name: 'Çin',
    risks: { Political: 4, Economic: 3, Operational: 3, Security: 4, Cyber: 5, Reputational: 4 },
  },
  AE: {
    name: 'BAE',
    risks: { Political: 2, Economic: 2, Operational: 1, Security: 1, Cyber: 2, Reputational: 2 },
  },
  SA: {
    name: 'Suudi Arabistan',
    risks: { Political: 3, Economic: 2, Operational: 2, Security: 2, Cyber: 3, Reputational: 3 },
  },
  EG: {
    name: 'Mısır',
    risks: { Political: 4, Economic: 4, Operational: 3, Security: 3, Cyber: 3, Reputational: 3 },
  },
  IR: {
    name: 'İran',
    risks: { Political: 5, Economic: 5, Operational: 4, Security: 4, Cyber: 4, Reputational: 5 },
  },
  UZ: {
    name: 'Özbekistan',
    risks: { Political: 3, Economic: 3, Operational: 3, Security: 2, Cyber: 3, Reputational: 2 },
  },
  KZ: {
    name: 'Kazakistan',
    risks: { Political: 3, Economic: 3, Operational: 2, Security: 2, Cyber: 3, Reputational: 2 },
  },
};

const DIMS = ['Political', 'Economic', 'Operational', 'Security', 'Cyber', 'Reputational'];

export const CountryRiskRadar: React.FC = () => {
  const [selected, setSelected] = useState('TR');
  const country = COUNTRIES[selected] ?? COUNTRIES['TR']!;
  const totalRisk = useMemo(
    () => Object.values(country.risks).reduce((a, b) => a + b, 0),
    [country],
  );
  const cx = 150,
    cy = 150,
    r = 100;
  const points = DIMS.map((d, i) => {
    const angle = (Math.PI * 2 * i) / DIMS.length - Math.PI / 2;
    const score = country.risks[d] ?? 0;
    const len = (r * score) / 5;
    return `${cx + Math.cos(angle) * len},${cy + Math.sin(angle) * len}`;
  }).join(' ');

  return (
    <section
      className="py-16 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent via-secondary/[0.03] to-transparent"
      aria-labelledby="risk-radar-heading"
      data-testid="country-risk-radar"
    >
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">
            Geopolitik Risk Radarı
          </div>
          <h2
            id="risk-radar-heading"
            className="text-3xl md:text-4xl font-serif font-bold text-white mb-3"
          >
            Ülke Risk Profili
          </h2>
          <p className="text-slate-400">
            Hedef ülke seçin — 6 boyutta risk profili + quarterly briefing önerisi.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
            <label
              htmlFor="country-risk-radar-country"
              className="block text-sm font-semibold text-white mb-2"
            >
              Ülke
            </label>
            <select
              id="country-risk-radar-country"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-white mb-6"
            >
              {Object.entries(COUNTRIES).map(([code, c]) => (
                <option key={code} value={code}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="space-y-3">
              {DIMS.map((d) => {
                const score = country.risks[d];
                if (score === undefined) return null;
                return (
                  <div key={d} className="flex items-center gap-3">
                    <span className="text-sm text-slate-200 flex-1">{d}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          className={`w-3 h-5 rounded-sm ${n <= score ? (score >= 4 ? 'bg-red-400' : score >= 3 ? 'bg-amber-400' : 'bg-emerald-400') : 'bg-white/10'}`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-gradient-to-br from-secondary/15 to-primary/10 border border-secondary/30 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center">
            <svg viewBox="0 0 300 300" className="w-full max-w-sm" aria-label="Country risk radar">
              <defs>
                <radialGradient id="riskGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#DC2626" stopOpacity="0.2" />
                </radialGradient>
              </defs>
              {[20, 40, 60, 80, 100].map((rr) => (
                <circle
                  key={rr}
                  cx={cx}
                  cy={cy}
                  r={rr}
                  stroke="#475569"
                  strokeWidth="0.5"
                  fill="none"
                  opacity="0.3"
                />
              ))}
              {DIMS.map((_, i) => {
                const a = (Math.PI * 2 * i) / DIMS.length - Math.PI / 2;
                return (
                  <line
                    key={i}
                    x1={cx}
                    y1={cy}
                    x2={cx + Math.cos(a) * r}
                    y2={cy + Math.sin(a) * r}
                    stroke="#475569"
                    strokeWidth="0.5"
                    opacity="0.3"
                  />
                );
              })}
              <polygon points={points} fill="url(#riskGrad)" stroke="#F59E0B" strokeWidth="2" />
              {DIMS.map((d, i) => {
                const a = (Math.PI * 2 * i) / DIMS.length - Math.PI / 2;
                return (
                  <text
                    key={d}
                    x={cx + Math.cos(a) * (r + 18)}
                    y={cy + Math.sin(a) * (r + 18)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fontFamily="Inter"
                    fill="#94A3B8"
                    fontWeight="600"
                  >
                    {d}
                  </text>
                );
              })}
            </svg>
            <div className="mt-4 w-full pt-4 border-t border-white/10">
              <div className="text-xs uppercase tracking-widest text-secondary mb-1">
                Toplam Risk Skoru
              </div>
              <div className="text-3xl font-serif font-bold text-white mb-3">{totalRisk}/30</div>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors"
              >
                Quarterly Briefing <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
