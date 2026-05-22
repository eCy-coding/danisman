/**
 * P49 S1 — Strategic Maturity Ladder (custom widget for /services/strategic-transformation).
 *
 * Capability Maturity Model (CMM) variant: 5-level ladder. User kendi
 * şirketinin stratejik olgunluk seviyesini seçer; matching engagement tier
 * öneri kartı highlight olur + Discovery Call CTA.
 *
 * UX:
 *   - 5 vertical radio steps (Reaktif → Visioner)
 *   - Her step'te: pain + outcome miniözet
 *   - Seçim sonrası: matching engagement card vurgulanır
 *   - LocalStorage save (kullanıcı sayfaya geri gelirse durum korunur)
 *   - Keyboard accessible (radio group)
 *   - prefers-reduced-motion aware
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface Level {
  id: 1 | 2 | 3 | 4 | 5;
  name: string;
  tagline: string;
  pain: string;
  recommendedTier: 'session' | 'quarterly' | 'annual';
}

const LEVELS: Level[] = [
  {
    id: 1,
    name: 'Reaktif',
    tagline: 'Kriz yönetimi modunda, yazılı strateji yok.',
    pain: 'Günü kurtarma kararları; uzun vade planı belirsiz.',
    recommendedTier: 'session',
  },
  {
    id: 2,
    name: 'Planlı',
    tagline: 'Yıllık bütçe + temel hedefler var, uygulamada kopukluk.',
    pain: 'Plan kağıt üstünde; ekibin günlük operasyonu uyumsuz.',
    recommendedTier: 'session',
  },
  {
    id: 3,
    name: 'Stratejik',
    tagline: '3 yıllık plan var; OKR/KPI ritmi yok.',
    pain: 'Yıllık plan revize edilse de çeyreklik takip eksik.',
    recommendedTier: 'quarterly',
  },
  {
    id: 4,
    name: 'Çevik',
    tagline: 'Çeyreklik OKR cadence + RACI matrisi işliyor.',
    pain: 'Uygulama iyi ama 3-5 yıllık ufuk netliği henüz yok.',
    recommendedTier: 'quarterly',
  },
  {
    id: 5,
    name: 'Vizyoner',
    tagline: '5+ yıl ufuk + vizyon-uygulama köprüsü tam.',
    pain: 'Sürdürülebilirlik için "Yıllık Ortaklık" amplifier önerilir.',
    recommendedTier: 'annual',
  },
];

const TIERS = {
  session: {
    name: 'Strateji Oturumu',
    duration: '1 hafta',
    price: "₺12.000'den başlayan",
    description: 'Kuzey yıldızı + kısa yol haritası için 2 saatlik premium audit.',
  },
  quarterly: {
    name: 'Çeyreklik Engagement',
    duration: '12 hafta',
    price: "₺75.000'den başlayan",
    description: 'OKR cadence + RACI + haftalık ritim implementasyonu.',
  },
  annual: {
    name: 'Yıllık Partnerlik',
    duration: '12 ay',
    price: "₺350.000'den başlayan",
    description: 'Sürekli stratejik partnerlik; çeyreklik döngülerle 5+ yıllık ufuk.',
  },
} as const;

const STORAGE_KEY = 'p49_strategic_maturity_level';

export const StrategicMaturityLadder: React.FC = () => {
  const [selected, setSelected] = useState<Level['id'] | null>(null);

  // Restore from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const n = parseInt(stored, 10);
        if (n >= 1 && n <= 5) setSelected(n as Level['id']);
      }
    } catch {
      /* localStorage may be blocked — silent fallback */
    }
  }, []);

  const handleSelect = (id: Level['id']) => {
    setSelected(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(id));
    } catch {
      /* ignore */
    }
  };

  const selectedLevel = selected ? LEVELS.find((l) => l.id === selected) : null;
  const recommendedTier = selectedLevel ? TIERS[selectedLevel.recommendedTier] : null;

  return (
    <section
      className="py-16 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent via-secondary/[0.03] to-transparent"
      aria-labelledby="maturity-ladder-heading"
      data-testid="strategic-maturity-ladder"
    >
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">
            İnteraktif Teşhis
          </div>
          <h2
            id="maturity-ladder-heading"
            className="text-3xl md:text-4xl font-serif font-bold text-white mb-3"
          >
            Stratejik Olgunluk Asansörü
          </h2>
          <p className="text-slate-400 max-w-2xl">
            Şirketinizin bugün hangi seviyede olduğunu seçin — size uygun engagement formatını
            birlikte belirleyelim.
          </p>
        </div>

        <fieldset className="space-y-3" role="radiogroup" aria-labelledby="maturity-ladder-heading">
          <legend className="sr-only">Stratejik olgunluk seviyenizi seçin</legend>
          {LEVELS.map((level) => {
            const isSelected = selected === level.id;
            return (
              <label
                key={level.id}
                className={`block relative cursor-pointer rounded-2xl border transition-all duration-300 ${
                  isSelected
                    ? 'bg-secondary/10 border-secondary/50 shadow-lg shadow-secondary/10'
                    : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
                }`}
              >
                <input
                  type="radio"
                  name="maturity-level"
                  value={level.id}
                  checked={isSelected}
                  onChange={() => handleSelect(level.id)}
                  className="sr-only"
                  aria-describedby={`level-${level.id}-desc`}
                />
                <div className="flex items-start gap-5 p-5 md:p-6">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold transition-colors ${
                      isSelected
                        ? 'bg-secondary text-neutral'
                        : 'bg-white/10 text-secondary border border-white/10'
                    }`}
                    aria-hidden="true"
                  >
                    {level.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-3 mb-1">
                      <h3 className="text-lg font-bold text-white">{level.name}</h3>
                      <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
                        Seviye {level.id}/5
                      </span>
                    </div>
                    <p
                      id={`level-${level.id}-desc`}
                      className="text-slate-300 text-sm md:text-base leading-relaxed"
                    >
                      {level.tagline}
                    </p>
                    <p className="text-slate-400 text-xs md:text-sm mt-2 italic">
                      Tipik durum: {level.pain}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle2
                      size={22}
                      className="text-secondary flex-shrink-0 mt-2"
                      aria-label="Seçildi"
                    />
                  )}
                </div>
              </label>
            );
          })}
        </fieldset>

        {/* Recommendation panel — fade in after selection */}
        {recommendedTier && (
          <div
            className="mt-10 p-6 md:p-8 bg-gradient-to-br from-secondary/15 to-primary/10 border border-secondary/30 rounded-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500"
            role="status"
            aria-live="polite"
          >
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">
                Size Önerilen Engagement
              </div>
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-3">
                {recommendedTier.name}
              </h3>
              <p className="text-slate-200 leading-relaxed mb-4">{recommendedTier.description}</p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-300 mb-6">
                <span>
                  <strong className="text-white">Süre:</strong> {recommendedTier.duration}
                </span>
                <span>
                  <strong className="text-white">Yatırım:</strong> {recommendedTier.price}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors"
                >
                  Discovery Call Planla <ArrowRight size={16} />
                </Link>
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 transition-colors"
                >
                  Tüm Paketler
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
