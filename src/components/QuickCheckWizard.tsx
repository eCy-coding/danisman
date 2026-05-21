/**
 * KVKK Quick-Check — 10-soruluk lead magnet wizard.
 *
 * SPEC: ~/Documents/eCyPro-memory/KVKK_QUICK_CHECK_ASSESSMENT.md
 * Backend: POST /api/v1/quick-check-submit (Track 1 PR #13)
 *
 * UX guardrails:
 *  - localStorage cache (24h TTL) so visitors can resume.
 *  - KVKK consent gate enforced client-side AND server-side.
 *  - Graceful degradation: on network failure the result page still renders
 *    so the visitor keeps the value (the score) even if the lead doesn't
 *    reach Notion.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import {
  submitQuickCheck,
  RateLimitError,
  type QuickCheckPayload,
  type RiskTier,
} from '../lib/api-client';

type Choice = 'A' | 'B' | 'C' | 'D';

interface Question {
  id: number;
  topic: string;
  prompt: string;
  legal: string;
  options: { key: Choice; label: string; points: number }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    topic: 'Veri Envanteri',
    legal: 'KVKK md.10 + GDPR Art.30',
    prompt: 'Şirketinizde işlenen kişisel veri kategorilerinin yazılı bir envanteri var mı?',
    options: [
      { key: 'A', label: 'Var, son 6 ay içinde güncellendi', points: 3 },
      { key: 'B', label: 'Var ama 1+ yıl güncellenmemiş', points: 2 },
      { key: 'C', label: 'Kısmi — bazı departmanların var', points: 1 },
      { key: 'D', label: 'Yok / Bilmiyorum', points: 0 },
    ],
  },
  {
    id: 2,
    topic: 'Aydınlatma Metni',
    legal: 'KVKK md.10',
    prompt:
      'Web sitenizde, müşteri sözleşmelerinizde ve çalışan sözleşmelerinizde aydınlatma metni mevcut mu?',
    options: [
      { key: 'A', label: 'Hepsinde var, son 12 ayda güncellendi', points: 3 },
      { key: 'B', label: 'Web sitemde var, sözleşmelerde eksik', points: 2 },
      { key: 'C', label: 'Kısmi — sadece ana sayfada', points: 1 },
      { key: 'D', label: 'Yok / Belirsiz', points: 0 },
    ],
  },
  {
    id: 3,
    topic: 'Veri İşleyici Sözleşmeleri',
    legal: 'KVKK md.8 + GDPR Art.28',
    prompt:
      'Üçüncü taraflara (bulut sağlayıcı, danışman, kargo) veri aktarımları için imzalı veri işleyici sözleşmeniz (DPA) var mı?',
    options: [
      { key: 'A', label: "Tüm 3rd party'ler için imzalı", points: 3 },
      { key: 'B', label: 'Büyük sağlayıcılar için var, küçükler eksik', points: 2 },
      { key: 'C', label: 'Sadece 1-2 sözleşme', points: 1 },
      { key: 'D', label: 'Yok', points: 0 },
    ],
  },
  {
    id: 4,
    topic: 'Yurtdışı Veri Aktarımı',
    legal: 'KVKK md.9 — 7499 sayılı Kanun (12.03.2024)',
    prompt:
      'EU/USA/Asya bulut sağlayıcılarına (Vercel, AWS, Google) veri aktarımının hukuki dayanağı belgelenmiş mi?',
    options: [
      { key: 'A', label: 'SCC + Transfer Etki Değerlendirmesi (TIA) hazır', points: 3 },
      { key: 'B', label: 'SCC var ama TIA eksik', points: 2 },
      { key: 'C', label: 'Sözleşme var ama formal değil', points: 1 },
      { key: 'D', label: 'Belirsiz / Yok', points: 0 },
    ],
  },
  {
    id: 5,
    topic: 'Veri Sahibi Hakları',
    legal: 'KVKK md.11',
    prompt:
      'Veri sahibi hakları için yazılı başvuru prosedürünüz ve dedicated kanal (örn. kvkk@sirket.com) var mı?',
    options: [
      { key: 'A', label: 'Var, 30 günlük yanıt SLA tutuluyor', points: 3 },
      { key: 'B', label: 'Var ama düzenli takip edilmiyor', points: 2 },
      { key: 'C', label: 'İletişim adresi var, prosedür yok', points: 1 },
      { key: 'D', label: 'Yok', points: 0 },
    ],
  },
  {
    id: 6,
    topic: 'Veri Güvenliği',
    legal: 'KVKK md.12 + GDPR Art.32',
    prompt:
      'Şifreleme (transit + rest), erişim kontrolü ve log tutma gibi teknik veri güvenliği önlemleriniz uygulanıyor mu?',
    options: [
      { key: 'A', label: 'Hepsi var, yıllık penetration test yapılıyor', points: 3 },
      { key: 'B', label: 'Çoğu var, formal test yok', points: 2 },
      { key: 'C', label: 'Bazıları var, eksiklikler biliniyor', points: 1 },
      { key: 'D', label: 'Belirsiz', points: 0 },
    ],
  },
  {
    id: 7,
    topic: 'Veri İhlali Bildirim',
    legal: 'KVKK md.12/5 — 72 saat',
    prompt:
      "Bir veri ihlalinde KVKK Kurumu'na 72 saat içinde bildirim yapacak iç prosedürünüz hazır mı?",
    options: [
      { key: 'A', label: 'Yazılı prosedür + sorumlu kişi + simulation yapıldı', points: 3 },
      { key: 'B', label: 'Yazılı prosedür var, simulation yapılmadı', points: 2 },
      { key: 'C', label: 'Düşünüldü ama formal değil', points: 1 },
      { key: 'D', label: 'Yok', points: 0 },
    ],
  },
  {
    id: 8,
    topic: 'EU AI Act Madde 5/6',
    legal: '01.02.2025 + 02.08.2025',
    prompt:
      'Şirketinizde yüksek-riskli AI sistemleri (Annex III — kredi skorlama, işe alım, biyometrik, kritik altyapı) kullanılıyor mu?',
    options: [
      { key: 'A', label: 'Hiç kullanmıyoruz', points: 3 },
      { key: 'B', label: 'Kullanıyoruz, EU AI Act compliance audit tamamlandı', points: 3 },
      { key: 'C', label: 'Kullanıyoruz, henüz audit yok', points: 1 },
      { key: 'D', label: 'Belirsiz / Bilmiyorum', points: 0 },
    ],
  },
  {
    id: 9,
    topic: 'CSRD / CBAM / NIS2',
    legal: 'Sektörel EU yükümlülükleri',
    prompt:
      "Şirketinizin EU'ya ihracat veya EU müşteri/iştiraki var mı, ve CSRD/CBAM/NIS2 uyum süreçleri başlatıldı mı?",
    options: [
      { key: 'A', label: 'EU exposure yok (N/A)', points: 3 },
      { key: 'B', label: 'Var, uyum tamamlandı', points: 3 },
      { key: 'C', label: 'Var, uyum başlatıldı', points: 2 },
      { key: 'D', label: 'Var ama uyum yok', points: 0 },
    ],
  },
  {
    id: 10,
    topic: 'Çıkar Çatışması & Bağımsız Danışmanlık',
    legal: 'ICC bağımsızlık ilkesi',
    prompt:
      'Mevcut hukuk + IT + denetim danışmanlarınız arasında çıkar çatışması (örn. audit firmasının consulting de yapması) var mı?',
    options: [
      { key: 'A', label: 'Bağımsız danışmanlarla çalışıyoruz', points: 3 },
      { key: 'B', label: 'Aynı firmadan birden fazla hizmet, farklı ekipler', points: 2 },
      { key: 'C', label: 'Aynı firmadan hepsini alıyoruz', points: 1 },
      { key: 'D', label: 'Belirsiz', points: 0 },
    ],
  },
];

const TOTAL_STEPS = QUESTIONS.length;
const CACHE_KEY = 'ecypro-quick-check-state-v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const SECTORS = [
  'Finans / Bankacılık',
  'Enerji',
  'Sağlık',
  'Teknoloji / SaaS',
  'Sanayi / İmalat',
  'Kamu / Düzenleyici',
  'Eğitim',
  'Perakende / E-ticaret',
  'Lojistik',
  'Diğer',
];

interface Contact {
  name: string;
  email: string;
  company: string;
  sector: string;
  position?: string;
}

interface CachedState {
  step: number;
  answers: Record<number, Choice>;
  contact: Contact;
  consent: boolean;
  startedAt: string;
  savedAt: number;
}

const EMPTY_CONTACT: Contact = {
  name: '',
  email: '',
  company: '',
  sector: '',
  position: '',
};

function tierFromScore(score: number): RiskTier {
  if (score <= 12) return 'high';
  if (score <= 21) return 'medium';
  return 'mature';
}

function tierLabel(tier: RiskTier): { emoji: string; level: string; tone: string } {
  if (tier === 'high')
    return { emoji: '🔴', level: 'Yüksek', tone: 'kritik eksiklikler tespit edildi' };
  if (tier === 'medium')
    return { emoji: '🟡', level: 'Orta', tone: 'temel uyum var, 2025-2026 boşlukları kapatılmalı' };
  return { emoji: '🟢', level: 'Olgun', tone: 'stratejik bir sonraki aşamaya hazır' };
}

function recommendationText(tier: RiskTier): string {
  if (tier === 'high')
    return 'Şirketinizde KVKK + EU regulatory compliance konusunda kritik açıklar var. 2026 Compliance Cliff etkisi nedeniyle önümüzdeki 6 ay içinde yapısal aksiyon almazsanız denetim cezası ve EU pazar erişim kaybı riskleri yüksektir. Önerilen aksiyon: eCyPro Engagement Audit (€8.000, 4-6 hafta).';
  if (tier === 'medium')
    return 'Şirketinizde temel KVKK uyumu mevcut ancak 2025-2026 değişiklikleri (KVKK m.9 — 7499 sayılı Kanun, EU AI Act Madde 5, CSRD, NIS2) için boşluklar var. Önerilen aksiyon: Engagement Audit ile risk haritası → sonra Quarterly Retainer (€24.000/çeyrek).';
  return 'Olgun bir altyapınız var. Bu seviyede çalışan şirketler genellikle stratejik danışmanlık (M&A due diligence, EU expansion, ICC bağımsızlık denetimi) veya eğitim danışmanlığı ile ilerler. Önerilen aksiyon: Quarterly Retainer veya Custom Engagement — founder direkt erişim.';
}

function readCache(): CachedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedState;
    if (!parsed || typeof parsed.savedAt !== 'number') return null;
    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) {
      window.localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(state: Omit<CachedState, 'savedAt'>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ...state, savedAt: Date.now() } satisfies CachedState),
    );
  } catch {
    // localStorage may be disabled (private mode, quota) — silently drop the
    // cache; the wizard still works without resume.
  }
}

function clearCache(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}

const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div
      className="w-full"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current + 1}
      aria-label={`Soru ${current + 1} / ${total}`}
    >
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <span className="font-medium uppercase tracking-widest">
          Soru {current + 1} / {total}
        </span>
        <span className="font-mono">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full bg-secondary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const LoadingSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-6" aria-hidden="true">
    <div className="h-1.5 w-full bg-white/5 rounded-full" />
    <div className="h-6 w-1/3 bg-white/5 rounded" />
    <div className="h-10 w-full bg-white/5 rounded" />
    <div className="space-y-3">
      <div className="h-14 w-full bg-white/5 rounded-xl" />
      <div className="h-14 w-full bg-white/5 rounded-xl" />
      <div className="h-14 w-full bg-white/5 rounded-xl" />
      <div className="h-14 w-full bg-white/5 rounded-xl" />
    </div>
  </div>
);

export const QuickCheckWizard: React.FC = () => {
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Choice>>({});
  const [contact, setContact] = useState<Contact>(EMPTY_CONTACT);
  const [consent, setConsent] = useState(false);
  const [startedAt, setStartedAt] = useState<string>(() => new Date().toISOString());
  const [phase, setPhase] = useState<'wizard' | 'lead' | 'result'>('wizard');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resumed, setResumed] = useState(false);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setStep(cached.step);
      setAnswers(cached.answers || {});
      setContact({ ...EMPTY_CONTACT, ...cached.contact });
      setConsent(Boolean(cached.consent));
      setStartedAt(cached.startedAt || new Date().toISOString());
      setResumed(true);
    } else {
      trackEvent('QuickCheck', 'Started', 'Q1');
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (phase !== 'wizard') return;
    writeCache({ step, answers, contact, consent, startedAt });
  }, [hydrated, phase, step, answers, contact, consent, startedAt]);

  const score = useMemo(() => {
    let total = 0;
    for (const q of QUESTIONS) {
      const choice = answers[q.id];
      if (!choice) continue;
      const opt = q.options.find((o) => o.key === choice);
      if (opt) total += opt.points;
    }
    return total;
  }, [answers]);

  const redFlagReasons = useMemo(() => {
    const reasons: string[] = [];
    if (answers[8] === 'D') reasons.push('EU AI Act Madde 5/6 — blind spot');
    if (answers[9] === 'D') reasons.push('CSRD/CBAM/NIS2 — uyum başlatılmamış');
    return reasons;
  }, [answers]);

  const tier = useMemo(() => tierFromScore(score), [score]);
  const currentQuestion = QUESTIONS[step];
  const currentChoice = currentQuestion ? answers[currentQuestion.id] : undefined;
  const canAdvance = Boolean(currentChoice);

  const handleSelect = (choice: Choice) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: choice }));
  };

  const handleNext = () => {
    if (!canAdvance || !currentQuestion) return;
    trackEvent('QuickCheck', 'AnswerStep', `Q${currentQuestion.id}:${currentChoice}`);
    if (step + 1 < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      trackEvent('QuickCheck', 'Completed', `Score:${score}`);
      setPhase('lead');
    }
  };

  const handleBack = () => {
    if (step === 0) return;
    setStep(step - 1);
  };

  const handleContactChange = (patch: Partial<Contact>) => {
    setContact((prev) => ({ ...prev, ...patch }));
  };

  const handleReset = () => {
    clearCache();
    setStep(0);
    setAnswers({});
    setContact(EMPTY_CONTACT);
    setConsent(false);
    setStartedAt(new Date().toISOString());
    setPhase('wizard');
    setResumed(false);
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) return;
    setSubmitting(true);
    setSubmitError(null);

    const payload: QuickCheckPayload = {
      answers: QUESTIONS.map((q) => {
        const choice: Choice = answers[q.id] ?? 'D';
        const opt = q.options.find((o) => o.key === choice);
        return { questionId: q.id, choice, points: opt ? opt.points : 0 };
      }),
      score,
      tier,
      redFlag: redFlagReasons.length > 0,
      redFlagReasons,
      contact: {
        name: contact.name.trim(),
        email: contact.email.trim(),
        company: contact.company.trim(),
        sector: contact.sector,
        position: contact.position?.trim() || undefined,
      },
      kvkkConsent: true,
      source: 'quick-check',
      startedAt,
      completedAt: new Date().toISOString(),
    };

    try {
      await submitQuickCheck(payload);
      trackEvent('QuickCheck', 'EmailProvided', `Tier:${tier}`);
      clearCache();
      navigate('/thank-you?source=quick-check');
    } catch (err) {
      if (err instanceof RateLimitError) {
        setSubmitError(
          'Çok fazla istek aldık. Bir dakika sonra tekrar göndermeyi deneyin — bilgileriniz kaybolmadı.',
        );
      } else {
        setSubmitError(
          'Gönderim sırasında bir aksaklık oldu. Bilgileriniz tarayıcıda kayıtlı kaldı — birazdan tekrar deneyebilir ya da doğrudan Discovery Call rezerve edebilirsiniz.',
        );
      }
      setPhase('result');
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="bg-[#0A0F1C]/80 border border-white/5 rounded-2xl p-8 md:p-10">
        <LoadingSkeleton />
      </div>
    );
  }

  if (phase === 'lead') {
    const meta = tierLabel(tier);
    return (
      <div className="bg-[#0A0F1C]/80 border border-white/5 rounded-2xl p-8 md:p-10 space-y-8">
        <div className="text-center space-y-3">
          <p className="text-xs uppercase tracking-widest text-slate-400">Ön sonucunuz hazır</p>
          <p className="text-2xl md:text-3xl font-serif font-bold text-white">
            {meta.emoji} Risk seviyesi: {meta.level}
          </p>
          <p className="text-slate-300 max-w-2xl mx-auto">
            <strong>{score}/30 puan</strong> — {meta.tone}. Detaylı raporu ve şirketinize özel
            aksiyon önerilerini almak için iletişim bilgilerinizi paylaşın.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Ad Soyad"
              id="qc-name"
              required
              value={contact.name}
              onChange={(v) => handleContactChange({ name: v })}
              autoComplete="name"
            />
            <Field
              label="Kurumsal e-posta"
              id="qc-email"
              required
              type="email"
              value={contact.email}
              onChange={(v) => handleContactChange({ email: v })}
              autoComplete="email"
            />
            <Field
              label="Şirket adı"
              id="qc-company"
              required
              value={contact.company}
              onChange={(v) => handleContactChange({ company: v })}
              autoComplete="organization"
            />
            <SelectField
              label="Sektör"
              id="qc-sector"
              required
              value={contact.sector}
              onChange={(v) => handleContactChange({ sector: v })}
              options={SECTORS}
            />
            <Field
              label="Pozisyon (opsiyonel)"
              id="qc-position"
              value={contact.position || ''}
              onChange={(v) => handleContactChange({ position: v })}
              autoComplete="organization-title"
            />
          </div>

          <label className="flex items-start gap-3 text-sm text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consent}
              aria-required="true"
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 accent-secondary w-5 h-5 shrink-0"
            />
            <span>
              <strong className="text-white">KVKK m.5/2-f</strong> kapsamında, eCyPro’nun bu
              değerlendirmeyi saklamasına ve şirketime özel risk özetini iletmesine onay veriyorum.
              Aydınlatma metni için{' '}
              <a className="text-secondary hover:underline" href="/privacy">
                gizlilik politikası
              </a>{' '}
              sayfasına bakabilirim.
            </span>
          </label>

          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100"
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPhase('wizard')}
              className="px-5 py-3 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm font-bold uppercase tracking-widest"
            >
              <ArrowLeft size={14} className="inline mr-2" /> Cevaplara dön
            </button>
            <button
              type="submit"
              disabled={!consent || submitting}
              data-cta="quick-check-submit"
              data-track="cta-click"
              className="flex-1 px-6 py-3 rounded-xl bg-secondary text-neutral text-sm font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Gönderiliyor…
                </>
              ) : (
                <>
                  Sonucumu Görmek İçin Devam Et <ArrowRight size={14} aria-hidden="true" />
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Verilerinizi KVKK m.5/2-f çerçevesinde işliyoruz. Tek tıkla iletişimi sonlandırabilir ve
            KVKK m.11 kapsamındaki haklarınızı{' '}
            <a className="text-slate-300 hover:underline" href="/privacy/data-rights">
              veri hakları
            </a>{' '}
            sayfasından kullanabilirsiniz.
          </p>
        </form>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <ResultPanel
        score={score}
        tier={tier}
        redFlagReasons={redFlagReasons}
        submitError={submitError}
        onRestart={handleReset}
      />
    );
  }

  if (!currentQuestion) {
    return (
      <div className="bg-[#0A0F1C]/80 border border-white/5 rounded-2xl p-8 md:p-10">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="bg-[#0A0F1C]/80 border border-white/5 rounded-2xl p-8 md:p-10 space-y-8">
      <ProgressBar current={step} total={TOTAL_STEPS} />

      {resumed && step > 0 && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-secondary/30 bg-secondary/5 p-3 text-sm text-slate-200"
        >
          <CheckCircle2 className="w-4 h-4 text-secondary" aria-hidden="true" />
          <span>
            Önceki oturumunuzdan kaldığınız yerden devam ediyorsunuz. Baştan başlamak isterseniz{' '}
            <button
              type="button"
              onClick={handleReset}
              className="text-secondary hover:underline font-semibold"
            >
              sıfırlayın
            </button>
            .
          </span>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-widest text-secondary font-bold">
            {currentQuestion.topic} · {currentQuestion.legal}
          </span>
          <h2 className="text-xl md:text-2xl font-serif font-bold text-white leading-snug">
            {currentQuestion.prompt}
          </h2>
        </div>

        <fieldset className="space-y-3">
          <legend className="sr-only">{currentQuestion.prompt}</legend>
          {currentQuestion.options.map((opt) => {
            const selected = currentChoice === opt.key;
            return (
              <label
                key={opt.key}
                className={`flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-colors ${
                  selected
                    ? 'border-secondary bg-secondary/10 text-white'
                    : 'border-white/10 bg-white/2 text-slate-200 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <input
                  type="radio"
                  name={`q-${currentQuestion.id}`}
                  value={opt.key}
                  checked={selected}
                  onChange={() => handleSelect(opt.key)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`inline-flex items-center justify-center w-9 h-9 rounded-full border text-sm font-bold ${
                    selected
                      ? 'border-secondary bg-secondary text-neutral'
                      : 'border-white/15 text-slate-300'
                  }`}
                >
                  {opt.key}
                </span>
                <span className="text-sm md:text-base leading-snug">{opt.label}</span>
              </label>
            );
          })}
        </fieldset>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 0}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-slate-300 text-sm font-bold uppercase tracking-widest hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={14} aria-hidden="true" /> Önceki
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canAdvance}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-secondary text-neutral text-sm font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {step + 1 === TOTAL_STEPS ? 'Sonuca Geç' : 'Sonraki Soru'}{' '}
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>

      <p className="text-xs text-slate-500 pt-2 border-t border-white/5">
        Verilerinizi KVKK m.5/2-f çerçevesinde işliyoruz. Bu test {TOTAL_STEPS} sorudan oluşur ve
        ortalama 5 dakika sürer; yarım kalan oturumunuz tarayıcınızda 24 saat saklanır.
      </p>
    </div>
  );
};

const Field: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  autoComplete?: string;
}> = ({ id, label, value, onChange, required, type = 'text', autoComplete }) => (
  <label htmlFor={id} className="flex flex-col gap-1.5 text-sm">
    <span className="text-slate-300">
      {label}
      {required && <span className="text-secondary"> *</span>}
    </span>
    <input
      id={id}
      type={type}
      required={required}
      aria-required={required ? 'true' : undefined}
      value={value}
      autoComplete={autoComplete}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary text-sm transition-all placeholder:text-slate-400"
    />
  </label>
);

const SelectField: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
}> = ({ id, label, value, onChange, options, required }) => (
  <label htmlFor={id} className="flex flex-col gap-1.5 text-sm">
    <span className="text-slate-300">
      {label}
      {required && <span className="text-secondary"> *</span>}
    </span>
    <select
      id={id}
      required={required}
      aria-required={required ? 'true' : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary text-sm transition-all"
    >
      <option value="" disabled>
        Seçin…
      </option>
      {options.map((opt) => (
        <option key={opt} value={opt} className="bg-neutral text-white">
          {opt}
        </option>
      ))}
    </select>
  </label>
);

const ResultPanel: React.FC<{
  score: number;
  tier: RiskTier;
  redFlagReasons: string[];
  submitError: string | null;
  onRestart: () => void;
}> = ({ score, tier, redFlagReasons, submitError, onRestart }) => {
  const meta = tierLabel(tier);
  const recommendation = recommendationText(tier);
  return (
    <div className="bg-[#0A0F1C]/80 border border-white/5 rounded-2xl p-8 md:p-10 space-y-6">
      <div className="text-center space-y-2">
        <p className="text-xs uppercase tracking-widest text-slate-400">Quick-Check Sonucunuz</p>
        <p className="text-3xl md:text-4xl font-serif font-bold text-white">
          {meta.emoji} Risk seviyesi: {meta.level}
        </p>
        <p className="text-slate-300">
          <strong>{score}/30 puan</strong> — {meta.tone}.
        </p>
      </div>

      {submitError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100"
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{submitError}</span>
        </div>
      )}

      <div className="rounded-xl border border-white/5 bg-white/5 p-5 text-sm text-slate-200 leading-relaxed">
        {recommendation}
      </div>

      {redFlagReasons.length > 0 && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-5 space-y-2">
          <p className="flex items-center gap-2 text-rose-100 font-bold uppercase tracking-widest text-xs">
            <ShieldAlert className="w-4 h-4" aria-hidden="true" /> Kritik bulgular
          </p>
          <ul className="list-disc pl-5 text-sm text-rose-50 space-y-1">
            {redFlagReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <p className="text-sm text-rose-50">
            Bu noktalar 2026 itibariyle bağlayıcı yaptırım riskini doğurur (EU AI Act: 35M EUR / %7
            ciro). Discovery Call’da bu özel noktayı önceliklendirelim.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <a
          href="https://calendly.com/ecypro/discovery"
          target="_blank"
          rel="noopener noreferrer"
          data-cta="quick-check-calendly"
          data-track="cta-click"
          onClick={() => trackEvent('QuickCheck', 'CalendlyClicked', `Tier:${tier}`)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-secondary text-neutral text-sm font-bold uppercase tracking-widest hover:bg-white transition-colors"
        >
          30 dk Discovery Call rezerve et <ArrowRight size={14} aria-hidden="true" />
        </a>
        <button
          type="button"
          onClick={onRestart}
          className="px-5 py-3 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm font-bold uppercase tracking-widest"
        >
          Testi tekrar yap
        </button>
      </div>
    </div>
  );
};

export default QuickCheckWizard;
