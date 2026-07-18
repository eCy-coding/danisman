import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { JsonLd } from '../components/seo/JsonLd';
import { buildBreadcrumbSchema } from '../lib/structured-data';
import { FadeIn } from '../components/common/FadeIn';
import { useTranslation } from '@/lib/i18n';
import { getPostHog } from '@/lib/posthog';

type LikertValue = 0 | 1 | 2 | 3;

interface Question {
  id: string;
  text: { tr: string; en: string };
  labels: { tr: [string, string, string, string]; en: [string, string, string, string] };
}

interface Category {
  id: string;
  title: { tr: string; en: string };
  questions: Question[];
}

const CATEGORIES: Category[] = [
  {
    id: 'yonetisim',
    title: { tr: 'Yönetişim', en: 'Governance' },
    questions: [
      {
        id: 'yonetisim_1',
        text: {
          tr: 'Yazılı kurumsal politikalar güncel mi?',
          en: 'Are written corporate policies up to date?',
        },
        labels: {
          tr: ['Yok', 'Var ama eski', 'Kısmen güncel', 'Tam ve güncel'],
          en: ['None', 'Exists but outdated', 'Partially current', 'Fully current'],
        },
      },
      {
        id: 'yonetisim_2',
        text: {
          tr: 'Denetim komitesi veya eşdeğeri aktif mi?',
          en: 'Is an audit committee or equivalent active?',
        },
        labels: {
          tr: ['Yok', 'Var ama pasif', 'Kısmen aktif', 'Tam aktif'],
          en: ['None', 'Exists but passive', 'Partially active', 'Fully active'],
        },
      },
      {
        id: 'yonetisim_3',
        text: {
          tr: 'Risk komitesi veya risk yönetimi çerçevesi var mı?',
          en: 'Is there a risk committee or risk management framework?',
        },
        labels: {
          tr: ['Yok', 'Planlama aşamasında', 'Kısmen uygulanmış', 'Tam uygulama'],
          en: ['None', 'Planning stage', 'Partially implemented', 'Fully implemented'],
        },
      },
    ],
  },
  {
    id: 'finansal_kapanis',
    title: { tr: 'Finansal Kapanış', en: 'Financial Close' },
    questions: [
      {
        id: 'fin_1',
        text: {
          tr: 'Ay sonu kapanış süreci kaç iş günü sürmekte?',
          en: 'How many business days does month-end close take?',
        },
        labels: {
          tr: ['5+ gün', '4–5 gün', '2–3 gün', '≤1 gün'],
          en: ['5+ days', '4–5 days', '2–3 days', '≤1 day'],
        },
      },
      {
        id: 'fin_2',
        text: {
          tr: 'Reconciliation süreci belgelenmiş ve otomatize mi?',
          en: 'Is the reconciliation process documented and automated?',
        },
        labels: {
          tr: ['Manuel + belgesiz', 'Manuel + belgelenmiş', 'Kısmen otomatik', 'Tam otomatik'],
          en: [
            'Manual + undocumented',
            'Manual + documented',
            'Partially automated',
            'Fully automated',
          ],
        },
      },
      {
        id: 'fin_3',
        text: {
          tr: 'Materiality eşiği yazılı politikada tanımlı mı?',
          en: 'Is the materiality threshold defined in written policy?',
        },
        labels: {
          tr: ['Yok', 'Gayri resmî', 'Belgelenmiş', 'Belgelenmiş + onaylı'],
          en: ['None', 'Informal', 'Documented', 'Documented + approved'],
        },
      },
    ],
  },
  {
    id: 'kvkk_veri',
    title: { tr: 'KVKK & Veri', en: 'KVKK & Data' },
    questions: [
      {
        id: 'kvkk_1',
        text: {
          tr: 'VERBİS kaydınız güncel mi?',
          en: 'Is your VERBİS registration current?',
        },
        labels: {
          tr: ['Kayıt yok', 'Kayıtlı ama eski', 'Kısmen güncel', 'Kayıtlı ve tam güncel'],
          en: [
            'Not registered',
            'Registered but outdated',
            'Partially current',
            'Registered & fully current',
          ],
        },
      },
      {
        id: 'kvkk_2',
        text: {
          tr: 'Aydınlatma metinleriniz yasal gerekliliklere uygun mu?',
          en: 'Are your disclosure texts compliant with legal requirements?',
        },
        labels: {
          tr: ['Yok', 'Genel / eksik', 'Kısmen uygun', 'Tam uygun + güncel'],
          en: ['None', 'General / incomplete', 'Partially compliant', 'Fully compliant + current'],
        },
      },
      {
        id: 'kvkk_3',
        text: {
          tr: 'Kişisel veri envanteri ve veri akış haritası var mı?',
          en: 'Do you have a personal data inventory and data flow map?',
        },
        labels: {
          tr: ['Yok', 'Kısmi', 'Var ama güncellenmemiş', 'Tam ve güncel'],
          en: ['None', 'Partial', 'Exists but not updated', 'Complete & current'],
        },
      },
    ],
  },
  {
    id: 'bt_ic_kontrol',
    title: { tr: 'BT & İç Kontrol', en: 'IT & Internal Control' },
    questions: [
      {
        id: 'bt_1',
        text: {
          tr: 'Change management prosedürü belgelenmiş mi?',
          en: 'Is the change management procedure documented?',
        },
        labels: {
          tr: ['Yok', 'Gayri resmî', 'Belgelenmiş ama uygulanmıyor', 'Belgelenmiş + uygulanan'],
          en: ['None', 'Informal', 'Documented but not followed', 'Documented + enforced'],
        },
      },
      {
        id: 'bt_2',
        text: {
          tr: 'Kullanıcı erişim gözden geçirmesi periyodik yapılıyor mu?',
          en: 'Are user access reviews performed periodically?',
        },
        labels: {
          tr: ['Hiçbir zaman', 'Yılda bir', 'Altı ayda bir', 'Çeyreklik veya daha sık'],
          en: ['Never', 'Annually', 'Semi-annually', 'Quarterly or more often'],
        },
      },
      {
        id: 'bt_3',
        text: {
          tr: 'BCP/DR testi son 12 ay içinde yapıldı mı?',
          en: 'Has a BCP/DR test been conducted in the last 12 months?',
        },
        labels: {
          tr: [
            'Hiçbir zaman',
            'Belge var, test yok',
            'Test edilmiş, belge eksik',
            'Test + belge + onaylı',
          ],
          en: [
            'Never',
            'Document exists, no test',
            'Tested, documentation incomplete',
            'Tested + documented + approved',
          ],
        },
      },
    ],
  },
];

const TIERS: Array<{
  min: number;
  max: number;
  label: { tr: string; en: string };
  color: string;
  bg: string;
}> = [
  {
    min: 0,
    max: 39,
    label: { tr: 'Başlangıç', en: 'Starter' },
    color: 'text-red-400',
    bg: 'border-red-400/40',
  },
  {
    min: 40,
    max: 59,
    label: { tr: 'Gelişen', en: 'Developing' },
    color: 'text-amber-400',
    bg: 'border-amber-400/40',
  },
  {
    min: 60,
    max: 79,
    label: { tr: 'Olgun', en: 'Mature' },
    color: 'text-blue-400',
    bg: 'border-blue-400/40',
  },
  {
    min: 80,
    max: 100,
    label: { tr: 'Mükemmel', en: 'Excellent' },
    color: 'text-emerald-400',
    bg: 'border-emerald-400/40',
  },
];

function getTier(score: number) {
  // TIERS covers 0-100 exhaustively; non-null cast is always valid
  return (TIERS.find((t) => score >= t.min && score <= t.max) ?? TIERS[0])!;
}

type Answers = Partial<Record<string, LikertValue>>;

export const DenetimHazirlikPage: React.FC = () => {
  const { language: lang } = useTranslation();
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);

  const allQuestions = CATEGORIES.flatMap((c) => c.questions);
  const answered = allQuestions.filter((q) => answers[q.id] !== undefined).length;
  const progress = Math.round((answered / allQuestions.length) * 100);

  const totalRaw = Object.values(answers).reduce<number>((acc, v) => acc + (v ?? 0), 0);
  const score = Math.round((totalRaw / (allQuestions.length * 3)) * 100);
  const tier = getTier(score);

  const handleSubmit = useCallback(async () => {
    setSubmitted(true);
    const ph = await getPostHog();
    ph?.capture('audit_readiness_score_calculated', {
      score,
      tier_tr: tier.label.tr,
      tier_en: tier.label.en,
      answered_questions: answered,
      total_questions: allQuestions.length,
    });
  }, [score, tier, answered, allQuestions.length]);

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  const webAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: lang === 'tr' ? 'Denetim Hazırlık Skoru Hesaplayıcı' : 'Audit Readiness Score Calculator',
    url: 'https://ecypro.com/araclar/denetim-hazirlik-skoru',
    description:
      lang === 'tr'
        ? '12 soruda şirketinizin denetim hazırlık seviyesini ölçün. Yönetişim, finansal kapanış, KVKK ve BT kontrolleri.'
        : "Measure your company's audit readiness in 12 questions. Governance, financial close, KVKK, and IT controls.",
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
    provider: {
      '@type': 'Organization',
      name: 'eCyPro Premium Consulting',
      url: 'https://ecypro.com',
    },
  };

  return (
    <div className="min-h-screen bg-neutral">
      <SEO
        title={
          lang === 'tr'
            ? 'Denetim Hazırlık Skoru | eCyPro Araçlar'
            : 'Audit Readiness Score | eCyPro Tools'
        }
        description={
          lang === 'tr'
            ? 'Ücretsiz: 12 soruda şirketinizin denetim hazırlık seviyesini ölçün. Yönetişim, finansal kapanış, KVKK uyumu ve BT kontrollerinizi değerlendirin.'
            : "Free: Measure your company's audit readiness in 12 questions. Assess governance, financial close, KVKK compliance, and IT controls."
        }
        canonical="/araclar/denetim-hazirlik-skoru"
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: lang === 'tr' ? 'Anasayfa' : 'Home', url: 'https://ecypro.com/' },
          { name: lang === 'tr' ? 'Araçlar' : 'Tools', url: 'https://ecypro.com/araclar' },
          {
            name: lang === 'tr' ? 'Denetim Hazırlık Skoru' : 'Audit Readiness Score',
            url: 'https://ecypro.com/araclar/denetim-hazirlik-skoru',
          },
        ])}
      />
      <JsonLd data={webAppJsonLd} />

      <div className="max-w-3xl mx-auto px-6 md:px-12 py-16 md:py-24">
        <FadeIn>
          <p className="text-secondary text-sm font-semibold tracking-widest uppercase mb-4">
            {lang === 'tr' ? 'Ücretsiz · 5 Dakika' : 'Free · 5 Minutes'}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4 leading-tight">
            {lang === 'tr' ? 'Denetim Hazırlık Skoru' : 'Audit Readiness Score'}
          </h1>
          <p className="text-lg text-slate-400 mb-8 leading-relaxed">
            {lang === 'tr'
              ? '12 soruda şirketinizin denetim seviyesini ölçün. Yönetişim, finansal kapanış, KVKK uyumu ve BT kontrollerinizi değerlendirin.'
              : "Measure your company's audit readiness in 12 questions covering governance, financial close, KVKK compliance, and IT controls."}
          </p>

          {!submitted && (
            <div className="flex items-center gap-4 mb-12">
              <div
                className="flex-1 bg-white/10 rounded-full h-2"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={lang === 'tr' ? `İlerleme: ${progress}%` : `Progress: ${progress}%`}
              >
                <div
                  className="bg-secondary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm text-slate-400 whitespace-nowrap">
                {answered}/{allQuestions.length}
              </span>
            </div>
          )}
        </FadeIn>

        {!submitted ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            noValidate
          >
            {CATEGORIES.map((category) => (
              <FadeIn key={category.id}>
                <fieldset className="glass-card p-8 rounded-xl mb-6">
                  <legend className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
                    <span
                      className="w-2 h-6 bg-secondary rounded-full inline-block"
                      aria-hidden="true"
                    />
                    {category.title[lang]}
                  </legend>
                  <div className="space-y-8">
                    {category.questions.map((question) => (
                      <div key={question.id} role="group" aria-labelledby={`q-${question.id}`}>
                        <p
                          id={`q-${question.id}`}
                          className="text-slate-300 text-sm mb-4 font-medium"
                        >
                          {question.text[lang]}
                        </p>
                        <div
                          className="grid grid-cols-2 md:grid-cols-4 gap-2"
                          role="radiogroup"
                          aria-labelledby={`q-${question.id}`}
                        >
                          {([0, 1, 2, 3] as LikertValue[]).map((val) => (
                            <label
                              key={val}
                              className={`cursor-pointer text-center p-3 rounded-lg border text-xs font-medium transition-all min-h-11 flex items-center justify-center outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-secondary ${
                                answers[question.id] === val
                                  ? 'border-secondary bg-secondary/10 text-secondary'
                                  : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-200'
                              }`}
                            >
                              <input
                                type="radio"
                                name={question.id}
                                value={val}
                                checked={answers[question.id] === val}
                                onChange={() =>
                                  setAnswers((prev) => ({ ...prev, [question.id]: val }))
                                }
                                className="sr-only"
                                aria-label={`${question.text[lang]} — ${question.labels[lang][val]}`}
                              />
                              <span>{question.labels[lang][val]}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </fieldset>
              </FadeIn>
            ))}

            <FadeIn>
              <button
                type="submit"
                disabled={answered < allQuestions.length}
                className="w-full bg-secondary text-neutral font-bold py-4 px-8 rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-11 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary"
                aria-disabled={answered < allQuestions.length}
              >
                {lang === 'tr'
                  ? answered < allQuestions.length
                    ? `Tüm Soruları Yanıtlayın (${allQuestions.length - answered} kaldı)`
                    : 'Skorumu Hesapla'
                  : answered < allQuestions.length
                    ? `Answer All Questions (${allQuestions.length - answered} remaining)`
                    : 'Calculate My Score'}
              </button>
              <p className="text-xs text-slate-500 text-center mt-3">
                {lang === 'tr'
                  ? 'Yanıtlarınız saklanmaz. KVKK uyumu için yerel depolama kullanılmaz.'
                  : 'Your answers are not stored. No local storage is used for KVKK compliance.'}
              </p>
            </FadeIn>
          </form>
        ) : (
          <FadeIn>
            <div className={`glass-card p-10 rounded-2xl text-center border ${tier.bg} mb-8`}>
              <p className="text-sm text-slate-400 mb-2">
                {lang === 'tr' ? 'Denetim Hazırlık Skorunuz' : 'Your Audit Readiness Score'}
              </p>
              <div className={`text-8xl font-bold ${tier.color} mb-2`} aria-live="polite">
                {score}
              </div>
              <p className="text-slate-400 text-sm mb-4">/100</p>
              <div
                className={`inline-block px-6 py-2 rounded-full border ${tier.bg} ${tier.color} font-bold text-lg mb-6`}
              >
                {tier.label[lang]}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed max-w-md mx-auto mb-8">
                {score < 40 &&
                  (lang === 'tr'
                    ? 'Temel altyapı kurulumu gerekiyor. Denetim öncesi kritik boşluklar mevcut. Acil aksiyon planı öneriyoruz.'
                    : 'Core infrastructure setup is needed. Critical gaps exist before audit. We recommend an urgent action plan.')}
                {score >= 40 &&
                  score < 60 &&
                  (lang === 'tr'
                    ? 'Temel süreçler mevcut ancak önemli iyileştirme alanları var. Yapılandırılmış bir hazırlık programı ile hızlı ilerleme mümkün.'
                    : 'Basic processes exist but significant improvement areas remain. Rapid progress is possible with a structured readiness program.')}
                {score >= 60 &&
                  score < 80 &&
                  (lang === 'tr'
                    ? 'Güçlü bir temel var. Seçili alanlarda derinleştirme ile denetim hazırlığınızı tamamlayabilirsiniz.'
                    : 'A strong foundation exists. You can complete audit readiness by deepening selected areas.')}
                {score >= 80 &&
                  (lang === 'tr'
                    ? 'Denetim için güçlü hazırlık seviyesi. Sürdürülebilirlik ve sürekli iyileştirme odaklanın.'
                    : 'Strong preparation level for audit. Focus on sustainability and continuous improvement.')}
              </p>
              <Link
                to="/discovery"
                className="inline-block bg-secondary text-neutral font-bold py-4 px-10 rounded-lg hover:bg-secondary/90 transition-colors min-h-11 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary"
              >
                {lang === 'tr' ? 'Discovery Çağrısı Al' : 'Book a Discovery Call'}
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {CATEGORIES.map((cat) => {
                const catScore = cat.questions.reduce((acc, q) => acc + (answers[q.id] ?? 0), 0);
                const catMax = cat.questions.length * 3;
                const catPct = Math.round((catScore / catMax) * 100);
                return (
                  <div key={cat.id} className="glass-card p-4 rounded-xl text-center">
                    <p className="text-xs text-slate-400 mb-1">{cat.title[lang]}</p>
                    <p className="text-2xl font-bold text-primary">{catPct}</p>
                    <p className="text-xs text-slate-500">/100</p>
                  </div>
                );
              })}
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-slate-400 hover:text-slate-200 transition-colors underline outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
              >
                {lang === 'tr' ? 'Tekrar Hesapla' : 'Recalculate'}
              </button>
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  );
};
