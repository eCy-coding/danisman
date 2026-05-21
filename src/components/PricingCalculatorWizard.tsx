/**
 * Pricing Calculator — 4-soruluk paket öneri wizard'ı.
 *
 * Canonical decision tree 8 paket üretir; aynı `recommendPaket()` logic'i
 * Track 1 PR #13 backend tarafında da kullanılır, böylece widget'ın gösterdiği
 * paket ile CRM kaydına düşen paket birbirinden ayrışmaz.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import { submitPricingCalc, RateLimitError, type PricingPayload } from '../lib/api-client';

type StepId = 'sectors' | 'size' | 'needs' | 'urgency';

interface Option {
  id: string;
  label: string;
  hint?: string;
}

const SECTOR_OPTIONS: Option[] = [
  { id: 'finance', label: 'Finans / Bankacılık' },
  { id: 'energy', label: 'Enerji' },
  { id: 'health', label: 'Sağlık' },
  { id: 'tech', label: 'Teknoloji / SaaS' },
  { id: 'industry', label: 'Sanayi / İmalat' },
  { id: 'public', label: 'Kamu / Düzenleyici' },
  { id: 'retail', label: 'Perakende / E-ticaret' },
  { id: 'other', label: 'Diğer' },
];

const SIZE_OPTIONS: Option[] = [
  { id: 'micro', label: '1-10 çalışan', hint: 'Solopreneur / mikro işletme' },
  { id: 'small', label: '11-50 çalışan', hint: 'Küçük ölçek' },
  { id: 'mid', label: '51-250 çalışan', hint: 'Orta ölçek' },
  { id: 'large', label: '251-1000 çalışan', hint: 'Büyük ölçek' },
  { id: 'enterprise', label: '1000+ çalışan', hint: 'Kurumsal / holding' },
];

const NEED_OPTIONS: Option[] = [
  { id: 'kvkk_audit', label: 'KVKK Audit / Aydınlatma Yenileme' },
  { id: 'eu_ai_act', label: 'EU AI Act Madde 5/6 Uyumu' },
  { id: 'csrd_nis2', label: 'CSRD / CBAM / NIS2 Uyumu' },
  { id: 'ma_dd', label: 'M&A Due Diligence' },
  { id: 'icc_audit', label: 'ICC Bağımsızlık Denetimi' },
  { id: 'roadmap', label: 'Stratejik Yol Haritası' },
  { id: 'training', label: 'Yönetim / Ekip Eğitimi' },
  { id: 'counsel', label: 'Board-Level Stratejik Counsel' },
];

const URGENCY_OPTIONS: Option[] = [
  { id: 'urgent', label: 'Acil — 4 hafta içinde başlamalı' },
  { id: 'quarter', label: 'Çeyrek içinde — 1-3 ay' },
  { id: 'half', label: 'Yarım yıl içinde — 3-6 ay' },
  { id: 'open', label: 'Belirsiz / araştırma aşamasında' },
];

const SECTORS_LIST_FOR_CONTACT = SECTOR_OPTIONS.map((s) => s.label);

interface Paket {
  id: string;
  label: string;
  price: string;
  cadence: string;
  bullets: string[];
  detail: string;
  cta: string;
}

const PAKETS = {
  quickCheckPro: {
    id: 'quickCheckPro',
    label: 'Quick-Check Pro',
    price: '€1.500',
    cadence: 'Tek seferlik',
    bullets: [
      '1 günlük yoğun KVKK + aydınlatma metni denetimi',
      '8-12 sayfa bulgu raporu + 30 günlük asenkron destek',
      'Solopreneur / küçük ekipler için ideal başlangıç',
    ],
    detail:
      'En küçük ölçek için tek seferlik, derinlikli kontrol. KVKK aydınlatma + envanter + DPA tarama; sektörel risklere kısa not.',
    cta: 'Bu paketle Discovery Call başlat',
  },
  strategySession: {
    id: 'strategySession',
    label: 'Strateji Oturumu',
    price: '€3.000',
    cadence: '2 saat workshop + rapor',
    bullets: [
      '2 saatlik yönetici workshop’u (premium audit + roadmap)',
      'Stratejik yol haritası (özet rapor)',
      '30 gün asenkron e-posta desteği',
    ],
    detail:
      'Tek bir konuya odaklı, hızlı stratejik karar oturumu. KVKK + EU AI Act gibi bir noktada netleşmek isteyen yönetim ekipleri için.',
    cta: 'Bu paketle Discovery Call başlat',
  },
  engagementAudit: {
    id: 'engagementAudit',
    label: 'Engagement Audit',
    price: '€8.000',
    cadence: '4-6 hafta proje',
    bullets: [
      '50-80 sayfa bulgu raporu + cerrahi remediation queue',
      '12-aylık compliance roadmap + KPI seti',
      'Kıdemli danışman + founder oversight',
    ],
    detail:
      'Multi-domain compliance riskinin haritalandığı temel audit. KVKK + EU AI Act + CSRD/NIS2 boyutlarını birlikte değerlendirir.',
    cta: 'Bu paketle Discovery Call başlat',
  },
  quarterlyRetainer: {
    id: 'quarterlyRetainer',
    label: 'Quarterly Retainer',
    price: '€24.000',
    cadence: 'Çeyreklik (3 ay)',
    bullets: [
      'Haftalık çalışma oturumu (yönetim ekibiyle)',
      'Aylık karar raporu + OKR ritmi',
      'Slack + e-posta üzerinden direkt danışman erişimi',
    ],
    detail:
      'Aktif compliance pulse + stratejik counsel. Engagement Audit sonrası sürdürülebilir yürütme için tercih edilir.',
    cta: 'Bu paketle Discovery Call başlat',
  },
  annualPartnership: {
    id: 'annualPartnership',
    label: 'Annual Partnership',
    price: '€80.000',
    cadence: 'Yıllık',
    bullets: [
      'Sürdürülebilir transformasyon ortaklığı',
      'Board-level stratejik counsel + founder direkt erişim',
      'Yıllık 2 derin audit + sınırsız ad-hoc danışmanlık',
    ],
    detail:
      'Büyük ölçek + sürekli regülatif değişim takibi gereken kurumsal yapı için. Holding / 1000+ ölçek standardı.',
    cta: 'Bu paketle Discovery Call başlat',
  },
  maDdSprint: {
    id: 'maDdSprint',
    label: 'M&A DD Sprint',
    price: '€15.000 — €30.000',
    cadence: '2-4 hafta sprint',
    bullets: [
      'Hedef şirket için KVKK + EU regulatory due diligence',
      'Risk raporu + post-close remediation queue',
      'Hızlı timeline’a uyumlu founder oversight',
    ],
    detail:
      'M&A süreçleri için sıkıştırılmış DD. Sektör ve scope’a göre fiyat aralığı; Discovery Call’da netleştirilir.',
    cta: 'Bu paketle Discovery Call başlat',
  },
  iccIndependentAudit: {
    id: 'iccIndependentAudit',
    label: 'ICC Bağımsızlık Denetimi',
    price: '€18.000',
    cadence: 'Tek seferlik',
    bullets: [
      'Mevcut danışman portföyünüzde çıkar çatışması haritası',
      'Bağımsız bulgu raporu + remediation önerileri',
      'ICC ilkeleri ile uyumlu denetim metodolojisi',
    ],
    detail:
      'Audit + consulting + IT tek elden alınan yapılarda bağımsızlık riskini denetler. Yönetim kuruluna sunuma hazır rapor.',
    cta: 'Bu paketle Discovery Call başlat',
  },
  customEngagement: {
    id: 'customEngagement',
    label: 'Custom Engagement',
    price: 'Özel teklif',
    cadence: 'Scope’a göre',
    bullets: [
      'Çoklu domain + acil takvim + 250+ ölçek için özelleştirilmiş yapı',
      'Founder + senior danışman + sektör uzmanı ekip',
      'Discovery Call sonrası 5 iş günü içinde detaylı teklif',
    ],
    detail:
      'Mevcut paketlerden hiçbiri kapsamı tam karşılamadığında scope’a göre özelleştirilmiş engagement.',
    cta: 'Discovery Call ile teklif al',
  },
} satisfies Record<string, Paket>;

interface Answers {
  sectors: string[];
  size: string;
  needs: string[];
  urgency: string;
}

const EMPTY_ANSWERS: Answers = { sectors: [], size: '', needs: [], urgency: '' };

const STEP_ORDER: StepId[] = ['sectors', 'size', 'needs', 'urgency'];

function recommendPaket(a: Answers): Paket {
  const needsSet = new Set(a.needs);
  const multiNeed = a.needs.length >= 2;

  if (needsSet.has('ma_dd')) return PAKETS.maDdSprint;
  if (needsSet.has('icc_audit')) return PAKETS.iccIndependentAudit;

  const isUrgent = a.urgency === 'urgent';
  const isMidPlus = a.size === 'mid' || a.size === 'large' || a.size === 'enterprise';

  if (isUrgent && isMidPlus && a.needs.length >= 3) return PAKETS.customEngagement;
  if (a.size === 'enterprise') return PAKETS.annualPartnership;
  if (needsSet.has('counsel')) return PAKETS.annualPartnership;
  if (a.size === 'large' && multiNeed) return PAKETS.annualPartnership;

  if (isMidPlus && multiNeed) return PAKETS.quarterlyRetainer;
  if (isMidPlus) return PAKETS.engagementAudit;

  if (a.size === 'small') {
    if (multiNeed) return PAKETS.engagementAudit;
    if (a.needs.length === 1 && (isUrgent || a.urgency === 'quarter'))
      return PAKETS.strategySession;
    return PAKETS.engagementAudit;
  }

  if (a.needs.length <= 1) return PAKETS.quickCheckPro;
  return PAKETS.strategySession;
}

interface Contact {
  name: string;
  email: string;
  company: string;
  sector: string;
}

const EMPTY_CONTACT: Contact = { name: '', email: '', company: '', sector: '' };

const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div
      className="w-full"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current + 1}
      aria-label={`Adım ${current + 1} / ${total}`}
    >
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <span className="font-medium uppercase tracking-widest">
          Adım {current + 1} / {total}
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

export const PricingCalculatorWizard: React.FC = () => {
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [contact, setContact] = useState<Contact>(EMPTY_CONTACT);
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<'wizard' | 'lead' | 'submitted-fallback'>('wizard');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    trackEvent('PricingCalc', 'Started', 'Step1');
  }, []);

  const stepId = STEP_ORDER[stepIdx];
  const recommended = useMemo(() => recommendPaket(answers), [answers]);

  const canAdvance = (() => {
    if (stepId === 'sectors') return answers.sectors.length > 0;
    if (stepId === 'size') return answers.size !== '';
    if (stepId === 'needs') return answers.needs.length > 0;
    if (stepId === 'urgency') return answers.urgency !== '';
    return false;
  })();

  const toggleMulti = (field: 'sectors' | 'needs', id: string) => {
    setAnswers((prev) => {
      const current = prev[field];
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      return { ...prev, [field]: next };
    });
  };

  const setSingle = (field: 'size' | 'urgency', id: string) => {
    setAnswers((prev) => ({ ...prev, [field]: id }));
  };

  const handleNext = () => {
    if (!canAdvance) return;
    trackEvent('PricingCalc', 'AnswerStep', `${stepId}`);
    if (stepIdx + 1 < STEP_ORDER.length) {
      setStepIdx(stepIdx + 1);
    } else {
      trackEvent('PricingCalc', 'Completed', recommended.id);
      setPhase('lead');
    }
  };

  const handleBack = () => {
    if (stepIdx === 0) return;
    setStepIdx(stepIdx - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) return;
    setSubmitting(true);
    setSubmitError(null);

    const payload: PricingPayload = {
      answers,
      recommendedPaket: recommended.id,
      paketLabel: recommended.label,
      paketPrice: recommended.price,
      contact: {
        name: contact.name.trim(),
        email: contact.email.trim(),
        company: contact.company.trim(),
        sector: contact.sector,
      },
      kvkkConsent: true,
      source: 'pricing-calculator',
      completedAt: new Date().toISOString(),
    };

    try {
      await submitPricingCalc(payload);
      trackEvent('PricingCalc', 'EmailProvided', recommended.id);
      navigate('/thank-you?source=pricing');
    } catch (err) {
      if (err instanceof RateLimitError) {
        setSubmitError('Çok fazla istek aldık. Bir dakika sonra tekrar deneyin.');
      } else {
        setSubmitError(
          'Gönderim sırasında bir aksaklık oldu. Bilgileriniz kaybolmadı — doğrudan Discovery Call üzerinden de devam edebilirsiniz.',
        );
      }
      setPhase('submitted-fallback');
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === 'lead' || phase === 'submitted-fallback') {
    return (
      <div className="bg-[#0A0F1C]/80 border border-white/5 rounded-2xl p-8 md:p-10 space-y-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-secondary font-bold">Önerimiz</p>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-white">
            {recommended.label}
          </h2>
          <p className="text-slate-300">
            <span className="text-white font-bold text-lg">{recommended.price}</span>{' '}
            <span className="text-slate-400">· {recommended.cadence}</span>
          </p>
        </div>

        <ul className="space-y-2 text-sm text-slate-200">
          {recommended.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2">
              <span className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          aria-expanded={detailOpen}
          onClick={() => setDetailOpen((v) => !v)}
          className="inline-flex items-center gap-2 text-sm text-secondary hover:underline"
        >
          {detailOpen ? (
            <>
              <ChevronUp size={14} aria-hidden="true" /> Detaylı teklif gerekçesini gizle
            </>
          ) : (
            <>
              <ChevronDown size={14} aria-hidden="true" /> Detaylı teklif gerekçesi
            </>
          )}
        </button>
        {detailOpen && (
          <div className="rounded-xl border border-white/5 bg-white/5 p-5 text-sm text-slate-200 leading-relaxed">
            {recommended.detail}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Ad Soyad"
              id="pc-name"
              required
              value={contact.name}
              onChange={(v) => setContact((p) => ({ ...p, name: v }))}
              autoComplete="name"
            />
            <Field
              label="Kurumsal e-posta"
              id="pc-email"
              required
              type="email"
              value={contact.email}
              onChange={(v) => setContact((p) => ({ ...p, email: v }))}
              autoComplete="email"
            />
            <Field
              label="Şirket"
              id="pc-company"
              required
              value={contact.company}
              onChange={(v) => setContact((p) => ({ ...p, company: v }))}
              autoComplete="organization"
            />
            <SelectField
              label="Sektör"
              id="pc-sector"
              required
              value={contact.sector}
              onChange={(v) => setContact((p) => ({ ...p, sector: v }))}
              options={SECTORS_LIST_FOR_CONTACT}
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
              <strong className="text-white">KVKK m.5/2-f</strong> kapsamında bu paket önerisini ve
              detaylı teklifi tarafıma iletmenize onay veriyorum.{' '}
              <a className="text-secondary hover:underline" href="/privacy">
                Aydınlatma metni
              </a>
              .
            </span>
          </label>

          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100"
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
              <ArrowLeft size={14} className="inline mr-2" /> Cevapları düzenle
            </button>
            <button
              type="submit"
              disabled={!consent || submitting}
              data-cta="pricing-calc-submit"
              data-track="cta-click"
              className="flex-1 px-6 py-3 rounded-xl bg-secondary text-neutral text-sm font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Gönderiliyor…
                </>
              ) : (
                <>
                  Detaylı Teklif İçin Devam Et <ArrowRight size={14} aria-hidden="true" />
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Verilerinizi KVKK m.5/2-f çerçevesinde işliyoruz. KVKK m.11 kapsamında haklarınızı{' '}
            <a className="text-slate-300 hover:underline" href="/privacy/data-rights">
              veri hakları
            </a>{' '}
            sayfasından kullanabilirsiniz.
          </p>

          <div className="border-t border-white/5 pt-5">
            <a
              href="https://calendly.com/ecypro/discovery"
              target="_blank"
              rel="noopener noreferrer"
              data-cta="pricing-calc-calendly"
              data-track="cta-click"
              onClick={() => trackEvent('PricingCalc', 'CalendlyClicked', recommended.id)}
              className="inline-flex items-center gap-2 text-sm text-secondary hover:underline"
            >
              ya da doğrudan Discovery Call rezerve et <ArrowRight size={14} aria-hidden="true" />
            </a>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-[#0A0F1C]/80 border border-white/5 rounded-2xl p-8 md:p-10 space-y-8">
      <ProgressBar current={stepIdx} total={STEP_ORDER.length} />

      {stepId === 'sectors' && (
        <MultiSelectStep
          title="Hangi sektörlerde faaliyet gösteriyorsunuz?"
          subtitle="Birden fazla seçim yapabilirsiniz. Sektör bilgisi paket önerisinin regülatif ağırlığını belirler."
          options={SECTOR_OPTIONS}
          selected={answers.sectors}
          onToggle={(id) => toggleMulti('sectors', id)}
        />
      )}

      {stepId === 'size' && (
        <SingleSelectStep
          title="Şirket ölçeğiniz nedir?"
          subtitle="Çalışan sayısı, danışmanlık temposunu ve teklif yapısını şekillendirir."
          options={SIZE_OPTIONS}
          selected={answers.size}
          onSelect={(id) => setSingle('size', id)}
        />
      )}

      {stepId === 'needs' && (
        <MultiSelectStep
          title="Hangi konularda destek arıyorsunuz?"
          subtitle="Birden fazla seçenek işaretleyebilirsiniz. Çoklu domain seçiminiz, paket önerisini agresifleştirir."
          options={NEED_OPTIONS}
          selected={answers.needs}
          onToggle={(id) => toggleMulti('needs', id)}
        />
      )}

      {stepId === 'urgency' && (
        <SingleSelectStep
          title="Hangi zaman aralığında ilerlemek istersiniz?"
          subtitle="Aciliyet seviyesi, paket yoğunluğunu ve founder katılım oranını belirler."
          options={URGENCY_OPTIONS}
          selected={answers.urgency}
          onSelect={(id) => setSingle('urgency', id)}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleBack}
          disabled={stepIdx === 0}
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
          {stepIdx + 1 === STEP_ORDER.length ? 'Önerimi Gör' : 'Sonraki'}{' '}
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>

      <p className="text-xs text-slate-500 pt-2 border-t border-white/5">
        Verilerinizi KVKK m.5/2-f çerçevesinde işliyoruz. Bu hesaplama yalnızca tarayıcınızda
        çalışır; iletişim bilgilerinizi paylaşana kadar sunucumuza hiçbir şey gönderilmez.
      </p>
    </div>
  );
};

const MultiSelectStep: React.FC<{
  title: string;
  subtitle: string;
  options: Option[];
  selected: string[];
  onToggle: (id: string) => void;
}> = ({ title, subtitle, options, selected, onToggle }) => (
  <div className="space-y-4">
    <div>
      <h2 className="text-xl md:text-2xl font-serif font-bold text-white leading-snug">{title}</h2>
      <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
    </div>
    <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <legend className="sr-only">{title}</legend>
      {options.map((opt) => {
        const isSelected = selected.includes(opt.id);
        return (
          <label
            key={opt.id}
            className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
              isSelected
                ? 'border-secondary bg-secondary/10 text-white'
                : 'border-white/10 bg-white/2 text-slate-200 hover:border-white/20 hover:bg-white/5'
            }`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggle(opt.id)}
              className="mt-0.5 accent-secondary w-5 h-5 shrink-0"
            />
            <span className="text-sm leading-snug">
              <span className="block font-medium">{opt.label}</span>
              {opt.hint && <span className="text-xs text-slate-400 mt-0.5 block">{opt.hint}</span>}
            </span>
          </label>
        );
      })}
    </fieldset>
  </div>
);

const SingleSelectStep: React.FC<{
  title: string;
  subtitle: string;
  options: Option[];
  selected: string;
  onSelect: (id: string) => void;
}> = ({ title, subtitle, options, selected, onSelect }) => (
  <div className="space-y-4">
    <div>
      <h2 className="text-xl md:text-2xl font-serif font-bold text-white leading-snug">{title}</h2>
      <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
    </div>
    <fieldset className="space-y-3">
      <legend className="sr-only">{title}</legend>
      {options.map((opt) => {
        const isSelected = selected === opt.id;
        return (
          <label
            key={opt.id}
            className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
              isSelected
                ? 'border-secondary bg-secondary/10 text-white'
                : 'border-white/10 bg-white/2 text-slate-200 hover:border-white/20 hover:bg-white/5'
            }`}
          >
            <input
              type="radio"
              name="single-step"
              value={opt.id}
              checked={isSelected}
              onChange={() => onSelect(opt.id)}
              className="mt-0.5 accent-secondary w-5 h-5 shrink-0"
            />
            <span className="text-sm leading-snug">
              <span className="block font-medium">{opt.label}</span>
              {opt.hint && <span className="text-xs text-slate-400 mt-0.5 block">{opt.hint}</span>}
            </span>
          </label>
        );
      })}
    </fieldset>
  </div>
);

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

export default PricingCalculatorWizard;
