/**
 * P49 S5 — Neuromarketing Customer Segment Quiz.
 *
 * 5 davranışsal soru → customer archetype + messaging strategy.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

type Archetype = 'analytical' | 'emotional' | 'social' | 'fast' | 'risk-averse';

interface Question {
  id: number;
  text: string;
  options: { label: string; archetype: Archetype }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: 'Karar verirken en çok neye güveniyorsunuz?',
    options: [
      { label: 'Veri ve tablolar', archetype: 'analytical' },
      { label: 'İçgüdü ve duygu', archetype: 'emotional' },
      { label: 'Referans ve önerilere', archetype: 'social' },
      { label: 'Hız — fırsat kaçmasın', archetype: 'fast' },
      { label: 'Risksiz ve test edilmiş seçenek', archetype: 'risk-averse' },
    ],
  },
  {
    id: 2,
    text: 'En sevdiğiniz reklam türü hangisi?',
    options: [
      { label: 'Karşılaştırma + spec sheet', archetype: 'analytical' },
      { label: 'Hikaye anlatımı + dramatik', archetype: 'emotional' },
      { label: 'Influencer / kullanıcı yorumu', archetype: 'social' },
      { label: 'Flash sale + countdown', archetype: 'fast' },
      { label: 'Garanti + para iade', archetype: 'risk-averse' },
    ],
  },
  {
    id: 3,
    text: 'Alışveriş öncesi ne kadar araştırma yaparsınız?',
    options: [
      { label: 'Saatlerce, tüm seçenekleri', archetype: 'analytical' },
      { label: 'Beni heyecanlandıran ürünü alırım', archetype: 'emotional' },
      { label: 'Çevremin tavsiyesi yeterli', archetype: 'social' },
      { label: 'Hızlıca alırım, sonra düzelirim', archetype: 'fast' },
      { label: 'Sadece marka + garanti varsa', archetype: 'risk-averse' },
    ],
  },
  {
    id: 4,
    text: 'Bir CTA size en çok ne der?',
    options: [
      { label: '"Detaylı karşılaştırma indir"', archetype: 'analytical' },
      { label: '"Hayalinizdeki ... için"', archetype: 'emotional' },
      { label: '"5000+ kişi tercih etti"', archetype: 'social' },
      { label: '"Sadece bugün %50 indirim"', archetype: 'fast' },
      { label: '"30 gün ücretsiz iade"', archetype: 'risk-averse' },
    ],
  },
  {
    id: 5,
    text: 'Hangisi sizi en çok mutlu eder?',
    options: [
      { label: 'Tüm verileri kontrol etmiş olmak', archetype: 'analytical' },
      { label: 'Hayal kurduğum şeyi yaşamak', archetype: 'emotional' },
      { label: 'Topluluğumda saygı görmek', archetype: 'social' },
      { label: 'Kararı çabuk verip ilerlemek', archetype: 'fast' },
      { label: 'Riskten korunmuş olmak', archetype: 'risk-averse' },
    ],
  },
];

const ARCHETYPE_INFO: Record<Archetype, { name: string; strategy: string }> = {
  analytical: {
    name: 'Analitik',
    strategy: 'Detaylı ürün spec, comparison tablo, white paper. Mesaj: "Veri konuşur."',
  },
  emotional: {
    name: 'Duygusal',
    strategy: 'Hikaye, görsel zenginlik, deneyim odaklı CTA. Mesaj: "Hayalinizi gerçekleştirin."',
  },
  social: {
    name: 'Sosyal Etki',
    strategy: 'Influencer/UGC, social proof badge, müşteri yorumu. Mesaj: "5000+ kişi seçti."',
  },
  fast: {
    name: 'Hızlı Karar',
    strategy: 'Urgency cue, countdown, scarcity (gerçek!). Mesaj: "Bugün fırsat."',
  },
  'risk-averse': {
    name: 'Riskten Kaçınan',
    strategy: 'Garanti, iade politikası, sertifikasyon. Mesaj: "Risksiz başlayın."',
  },
};

export const CustomerSegmentQuiz: React.FC = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Archetype[]>([]);

  const submit = (a: Archetype) => {
    const next = [...answers, a];
    setAnswers(next);
    if (step + 1 < QUESTIONS.length) setStep(step + 1);
    else setStep(QUESTIONS.length);
  };

  const result: Archetype | null =
    answers.length === QUESTIONS.length
      ? ((Object.entries(
          answers.reduce<Record<string, number>>(
            (acc, a) => ({ ...acc, [a]: (acc[a] ?? 0) + 1 }),
            {},
          ),
        ).sort(([, a], [, b]) => b - a)[0]?.[0] as Archetype | undefined) ?? null)
      : null;
  const archetype = result ? ARCHETYPE_INFO[result] : null;
  const q = QUESTIONS[step];

  return (
    <section
      className="py-16 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent via-secondary/[0.03] to-transparent"
      aria-labelledby="cs-quiz-heading"
      data-testid="customer-segment-quiz"
    >
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">
            5 Soruluk Davranışsal Teşhis
          </div>
          <h2
            id="cs-quiz-heading"
            className="text-3xl md:text-4xl font-serif font-bold text-white mb-3"
          >
            Müşteri Davranışı Sınıflandırıcı
          </h2>
          <p className="text-slate-400 max-w-2xl">
            Hedef segmentinizin tipik karar mekanizmasını anlayın — messaging stratejinizi ona göre
            tasarlayın.
          </p>
        </div>
        {!archetype && q && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
            <div className="text-xs font-bold uppercase tracking-widest text-secondary mb-4">
              Soru {step + 1} / {QUESTIONS.length}
            </div>
            <h3 className="text-xl md:text-2xl font-serif font-bold text-white mb-6">{q.text}</h3>
            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => submit(opt.archetype)}
                  className="w-full text-left px-5 py-4 min-h-[52px] rounded-xl border border-white/10 bg-white/5 hover:border-secondary/40 hover:bg-secondary/10 transition-all text-slate-200 font-medium"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {step > 0 && (
              <button
                type="button"
                onClick={() => {
                  setStep(step - 1);
                  setAnswers(answers.slice(0, -1));
                }}
                className="mt-6 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-secondary transition-colors"
              >
                <ChevronLeft size={14} /> Önceki soru
              </button>
            )}
          </div>
        )}
        {archetype && (
          <div
            className="bg-gradient-to-br from-secondary/15 to-primary/10 border border-secondary/30 rounded-2xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
            role="status"
            aria-live="polite"
          >
            <div className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">
              Hedef Segment Arketipiniz
            </div>
            <h3 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
              {archetype.name}
            </h3>
            <p className="text-slate-200 leading-relaxed mb-6">{archetype.strategy}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors"
              >
                Detaylı Audit <ArrowRight size={16} />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setStep(0);
                  setAnswers([]);
                }}
                className="inline-flex items-center gap-1 px-6 py-3 min-h-[44px] rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 transition-colors"
              >
                Tekrar Yap <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
