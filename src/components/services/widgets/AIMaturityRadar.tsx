/**
 * P49 S8 — AI Analytics Maturity Radar.
 *
 * 6 axis self-scoring (0-5): Data Quality, Tech Stack, Talent, Governance,
 * Use Cases, ROI Measurement. SVG radar polygon + recommendation.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const AXES = [
  { id: 'data', label: 'Veri Kalitesi', desc: 'Veri envanteri + kalite + governance' },
  { id: 'tech', label: 'Tech Stack', desc: 'Cloud + ML platform + MLOps olgunluk' },
  { id: 'talent', label: 'Yetenek', desc: 'Data scientist + ML eng kapasite' },
  { id: 'gov', label: 'AI Governance', desc: 'Etik + KVKK + model risk' },
  { id: 'usecase', label: 'Use Cases', desc: 'Production AI use case sayısı' },
  { id: 'roi', label: 'ROI Ölçümü', desc: 'AI yatırım ROI tracking' },
];

export const AIMaturityRadar: React.FC = () => {
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(AXES.map((a) => [a.id, 2])),
  );
  const total = useMemo(() => Object.values(scores).reduce((a, b) => a + b, 0), [scores]);
  const avg = total / AXES.length;
  const rec =
    avg < 1.5
      ? 'AI Maturity Audit (2 hafta)'
      : avg < 3
        ? 'Use-case Portfolio + Pilot'
        : 'Scaling & MLOps Build';

  const cx = 150,
    cy = 150,
    r = 100;
  const points = AXES.map((a, i) => {
    const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
    const len = (r * (scores[a.id] ?? 0)) / 5;
    return `${cx + Math.cos(angle) * len},${cy + Math.sin(angle) * len}`;
  }).join(' ');

  return (
    <section
      className="py-16 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent via-secondary/[0.03] to-transparent"
      aria-labelledby="ai-radar-heading"
      data-testid="ai-maturity-radar"
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">
            AI Olgunluk Skoru
          </div>
          <h2
            id="ai-radar-heading"
            className="text-3xl md:text-4xl font-serif font-bold text-white mb-3"
          >
            6 Boyutlu AI Maturity Radar
          </h2>
          <p className="text-slate-400 max-w-2xl">
            Her boyutu 0-5 arası değerlendirin. Toplam skoru ve yola çıkış noktanızı görün.
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-5 bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
            {AXES.map((a) => (
              <div key={a.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <label htmlFor={`ai-${a.id}`} className="text-sm font-semibold text-white">
                    {a.label}
                  </label>
                  <span className="text-xl font-serif font-bold text-secondary">
                    {scores[a.id]}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2">{a.desc}</p>
                <input
                  id={`ai-${a.id}`}
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={scores[a.id]}
                  onChange={(e) => setScores({ ...scores, [a.id]: Number(e.target.value) })}
                  className="w-full accent-secondary"
                />
              </div>
            ))}
          </div>
          <div className="bg-gradient-to-br from-secondary/15 to-primary/10 border border-secondary/30 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center">
            <svg viewBox="0 0 300 300" className="w-full max-w-sm" aria-label="AI maturity radar">
              <defs>
                <radialGradient id="aiRadarGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.2" />
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
              {AXES.map((_, i) => {
                const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
                return (
                  <line
                    key={i}
                    x1={cx}
                    y1={cy}
                    x2={cx + Math.cos(angle) * r}
                    y2={cy + Math.sin(angle) * r}
                    stroke="#475569"
                    strokeWidth="0.5"
                    opacity="0.3"
                  />
                );
              })}
              <polygon points={points} fill="url(#aiRadarGrad)" stroke="#7C3AED" strokeWidth="2" />
              {AXES.map((a, i) => {
                const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
                return (
                  <text
                    key={a.id}
                    x={cx + Math.cos(angle) * (r + 18)}
                    y={cy + Math.sin(angle) * (r + 18)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fontFamily="Inter"
                    fill="#94A3B8"
                    fontWeight="600"
                  >
                    {a.label.split(' ')[0]}
                  </text>
                );
              })}
            </svg>
            <div className="mt-6 w-full pt-6 border-t border-white/10">
              <div className="text-xs uppercase tracking-widest text-secondary mb-2">
                Toplam Skor
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-serif font-bold text-white">{avg.toFixed(1)}</span>
                <span className="text-slate-400 text-sm">/ 5.0</span>
              </div>
              <p className="text-slate-200 text-sm mb-4">
                Önerilen: <strong className="text-white">{rec}</strong>
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors"
              >
                AI Audit Görüşmesi <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
