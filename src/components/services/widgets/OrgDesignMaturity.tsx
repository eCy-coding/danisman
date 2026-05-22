/**
 * P49 S6 — HR Transformation Org Design Maturity Scorecard.
 *
 * 5 dimension self-rating (1-5 slider): Roles, RACI, Perf Mgmt, L&D, Comp.
 * SVG radar-like polygon + total maturity score + recommendation.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface Dim {
  id: string;
  label: string;
  desc: string;
}
const DIMS: Dim[] = [
  { id: 'roles', label: 'Roller & Yetkiler', desc: 'Pozisyon tanımları + karar hakları açıklığı' },
  { id: 'raci', label: 'RACI / Süreç', desc: 'Cross-functional işbirliğinde rol netliği' },
  { id: 'perf', label: 'Performans Yönetimi', desc: 'OKR/KPI cadence + 360° geri bildirim' },
  { id: 'ld', label: 'L&D / Yetenek', desc: 'Eğitim planlaması + kariyer çerçevesi' },
  { id: 'comp', label: 'Ücret & Reward', desc: 'Tazminat çerçevesi + reward stratejisi' },
];

export const OrgDesignMaturity: React.FC = () => {
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(DIMS.map((d) => [d.id, 3])),
  );
  const total = useMemo(() => Object.values(scores).reduce((a, b) => a + b, 0), [scores]);
  const avg = total / DIMS.length;
  const recommendation =
    avg < 2.5
      ? 'Strateji Oturumu (gap-mapping)'
      : avg < 3.8
        ? 'Çeyreklik Engagement (re-design)'
        : 'Yıllık Partnerlik (amplifier)';

  // Compute radar polygon points
  const cx = 150,
    cy = 150,
    r = 100;
  const points = DIMS.map((d, i) => {
    const angle = (Math.PI * 2 * i) / DIMS.length - Math.PI / 2;
    const score = scores[d.id] ?? 0;
    const len = (r * score) / 5;
    return `${cx + Math.cos(angle) * len},${cy + Math.sin(angle) * len}`;
  }).join(' ');
  const axes = DIMS.map((_, i) => {
    const angle = (Math.PI * 2 * i) / DIMS.length - Math.PI / 2;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });

  return (
    <section
      className="py-16 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent via-secondary/[0.03] to-transparent"
      aria-labelledby="org-maturity-heading"
      data-testid="org-design-maturity"
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">
            Org Olgunluk Skoru
          </div>
          <h2
            id="org-maturity-heading"
            className="text-3xl md:text-4xl font-serif font-bold text-white mb-3"
          >
            5 Boyutlu Organizasyon Tasarımı Teşhisi
          </h2>
          <p className="text-slate-400 max-w-2xl">
            Her boyutu 1-5 arası değerlendirin. Radar harita + toplam olgunluk skoru + engagement
            önerisi.
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-5 bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
            {DIMS.map((d) => (
              <div key={d.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <label htmlFor={`dim-${d.id}`} className="text-sm font-semibold text-white">
                    {d.label}
                  </label>
                  <span className="text-xl font-serif font-bold text-secondary">
                    {scores[d.id]}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2">{d.desc}</p>
                <input
                  id={`dim-${d.id}`}
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={scores[d.id]}
                  onChange={(e) => setScores({ ...scores, [d.id]: Number(e.target.value) })}
                  className="w-full accent-secondary"
                />
              </div>
            ))}
          </div>
          <div className="bg-gradient-to-br from-secondary/15 to-primary/10 border border-secondary/30 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center">
            <svg
              viewBox="0 0 300 300"
              className="w-full max-w-sm"
              aria-label="Organization design maturity radar"
            >
              <defs>
                <radialGradient id="orgRadarGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.2" />
                </radialGradient>
              </defs>
              {/* Concentric circles */}
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
              {/* Axes */}
              {axes.map((a, i) => (
                <line
                  key={i}
                  x1={cx}
                  y1={cy}
                  x2={a.x}
                  y2={a.y}
                  stroke="#475569"
                  strokeWidth="0.5"
                  opacity="0.3"
                />
              ))}
              {/* Polygon */}
              <polygon points={points} fill="url(#orgRadarGrad)" stroke="#7C3AED" strokeWidth="2" />
              {/* Labels */}
              {DIMS.map((d, i) => {
                const angle = (Math.PI * 2 * i) / DIMS.length - Math.PI / 2;
                const lx = cx + Math.cos(angle) * (r + 18);
                const ly = cy + Math.sin(angle) * (r + 18);
                return (
                  <text
                    key={d.id}
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fontFamily="Inter"
                    fill="#94A3B8"
                    fontWeight="600"
                  >
                    {d.label.split(' ')[0]}
                  </text>
                );
              })}
            </svg>
            <div className="mt-6 w-full pt-6 border-t border-white/10">
              <div className="text-xs font-bold uppercase tracking-widest text-secondary mb-2">
                Toplam Skor
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-serif font-bold text-white">{avg.toFixed(1)}</span>
                <span className="text-slate-400 text-sm">/ 5.0</span>
              </div>
              <p className="text-slate-200 text-sm mb-4">
                Önerilen engagement: <strong className="text-white">{recommendation}</strong>
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors"
              >
                Discovery Call <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
