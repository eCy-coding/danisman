/**
 * P49 S9 — Digital Strategy Readiness Scorecard.
 *
 * 10 dimension Yes/No quick audit → score + gap recommendation.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, X } from 'lucide-react';

const ITEMS = [
  'Cloud-native altyapı (AWS/Azure/GCP %50+)',
  'ERP sistemimiz son 3 yılda upgrade edildi',
  'CRM müşteri 360° view sağlıyor',
  'Veri ambarı / lake (Snowflake/BigQuery) aktif',
  'BI dashboard çalışıyor; karar mercii günlük bakıyor',
  'API-first mimari (entegrasyonlar standart)',
  'RPA / iş süreç otomasyonu pilotlar aşıldı',
  'Dijital adoption metric track ediliyor',
  'IT operating model federated / hybrid',
  "CTO/CDO C-level decision table'da",
];

export const DigitalReadinessScorecard: React.FC = () => {
  const [answers, setAnswers] = useState<(boolean | null)[]>(Array(ITEMS.length).fill(null));
  const score = answers.filter(Boolean).length;
  const completed = !answers.includes(null);
  const rec =
    score < 4
      ? 'Dijital Olgunluk Audit (2 hafta)'
      : score < 7
        ? 'ERP/RPA + Tech Strategy'
        : 'Operating Model + Scaling';

  return (
    <section
      className="py-16 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent via-secondary/[0.03] to-transparent"
      aria-labelledby="dig-readiness-heading"
      data-testid="digital-readiness-scorecard"
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">
            Dijital Hazırlık Skoru
          </div>
          <h2
            id="dig-readiness-heading"
            className="text-3xl md:text-4xl font-serif font-bold text-white mb-3"
          >
            10 Maddelik Hızlı Audit
          </h2>
          <p className="text-slate-400">
            Her madde için Evet/Hayır seçin — toplam skor + gap önerisi.
          </p>
        </div>
        <div className="space-y-2 mb-8">
          {ITEMS.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl"
            >
              <span className="text-sm font-bold text-slate-500 w-6 flex-shrink-0">{i + 1}</span>
              <span className="flex-1 text-slate-200 text-sm">{item}</span>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const next = [...answers];
                    next[i] = true;
                    setAnswers(next);
                  }}
                  className={`min-h-[40px] min-w-[40px] px-3 rounded-lg border text-sm font-semibold transition-colors ${answers[i] === true ? 'bg-emerald-500 text-neutral border-emerald-400' : 'bg-white/5 border-white/10 text-slate-400 hover:border-emerald-500/50'}`}
                  aria-pressed={answers[i] === true}
                  aria-label={`${item}: Evet`}
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = [...answers];
                    next[i] = false;
                    setAnswers(next);
                  }}
                  className={`min-h-[40px] min-w-[40px] px-3 rounded-lg border text-sm font-semibold transition-colors ${answers[i] === false ? 'bg-slate-600 text-white border-slate-500' : 'bg-white/5 border-white/10 text-slate-400 hover:border-slate-500/50'}`}
                  aria-pressed={answers[i] === false}
                  aria-label={`${item}: Hayır`}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {completed && (
          <div
            className="bg-gradient-to-br from-secondary/15 to-primary/10 border border-secondary/30 rounded-2xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
            role="status"
            aria-live="polite"
          >
            <div className="text-xs uppercase tracking-widest text-secondary mb-2">Toplam Skor</div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-5xl font-serif font-bold text-white">{score}</span>
              <span className="text-slate-400">/ 10</span>
            </div>
            <p className="text-slate-200 leading-relaxed mb-6">
              Önerilen engagement: <strong className="text-white">{rec}</strong>
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors"
            >
              Detaylı Audit <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
