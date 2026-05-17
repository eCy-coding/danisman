import React from 'react';
import { FadeIn } from '../components/common/FadeIn';
import { useTranslation, getLang, MultiLang } from '../lib/i18n';
import { FAQ_COPY } from '@/data/copy/pages';
import { SEO } from '../components/common/SEO';
import { JsonLd } from '../components/seo/JsonLd';
import { Link } from 'react-router-dom';

// P45 C3: Q1/Q2/Q3 placeholder içerikleri gerçek consulting odaklı 7 SSS ile
// değiştirildi. TR + EN, ortalama 80-120 kelime / cevap. Emre Can Yalçın
// imzalı conservative ton, P42 doktrini ile sync.
type FaqItem = {
  id: string;
  question: MultiLang;
  answer: MultiLang;
};

const FAQS: FaqItem[] = [
  {
    id: 'who-do-you-work-with',
    question: {
      tr: 'EcyPro hangi tür şirketlerle çalışıyor?',
      en: 'What kind of companies does EcyPro work with?',
    },
    answer: {
      tr: 'Genellikle 50-500 çalışanlı, karar mercii erişilebilir orta ve büyük ölçekli işletmelerle pratik yürütüyoruz. Üretim, finans, perakende, teknoloji ve aile şirketi yapısındaki holdinglerle deneyimli olsak da, metodolojimiz sektörden bağımsız çalıştığı için yeni sektörlere kapalı değiliz. Engagement boyutu kararlıdır: küçük ekip, üst yönetim katılımlı, ölçülebilir hedefli.',
      en: 'We typically engage with mid-to-large organizations of 50-500 employees where decision-makers are accessible. We have deep experience in manufacturing, finance, retail, technology, and family-owned holdings — but because our methodology is sector-agnostic, we welcome engagements in new industries. Engagement format is consistent: small team, executive-sponsored, measurable outcomes.',
    },
  },
  {
    id: 'engagement-length',
    question: {
      tr: 'Bir engagement ne kadar sürer?',
      en: 'How long does an engagement typically last?',
    },
    answer: {
      tr: 'Üç standart formatımız var. Strateji Oturumu yaklaşık bir hafta sürer ve net bir karar ya da yol haritası üretir. Çeyreklik Engagement 12 hafta boyunca tek bir dönüşüm temasına odaklanır. Yıllık Ortaklık 12 ay boyunca üç aylık döngülerle ilerler, stratejiden uygulamaya kadar sorumluluk paylaşır. Hangisinin uygun olduğunu Discovery Call sonrasında birlikte belirleriz.',
      en: 'We offer three standard formats. A Strategy Sprint runs about one week and delivers a clear decision or roadmap. A Quarterly Engagement focuses on a single transformation theme over 12 weeks. An Annual Partnership runs 12 months with quarterly cycles, sharing accountability from strategy through execution. We choose the right shape together after the Discovery Call.',
    },
  },
  {
    id: 'pricing',
    question: {
      tr: 'Fiyatlandırma nasıl çalışıyor?',
      en: 'How does pricing work?',
    },
    answer: {
      tr: 'Üç tier üzerinden şeffaf bir model kullanıyoruz. Strateji Oturumu ₺12.000\'den başlar, Çeyreklik Engagement ₺75.000\'den başlar, Yıllık Ortaklık ₺350.000\'den başlar (KDV hariç). Engagement kapsamı netleştikten sonra sabit fiyat anlaşması yapıyoruz — saat bazlı faturalama yok. Ödeme planı esnek: aylık taksit, milestone bazlı veya peşin %5 indirimle. Detayları /pricing sayfasında bulabilirsiniz.',
      en: 'We use a transparent three-tier model. A Strategy Sprint starts at ₺12,000, a Quarterly Engagement at ₺75,000, and an Annual Partnership at ₺350,000 (VAT excluded). Once scope is defined we work on fixed-price agreements — no hourly billing. Payment plans are flexible: monthly installments, milestone-based, or 5% discount on full upfront payment. See /pricing for details.',
    },
  },
  {
    id: 'measuring-results',
    question: {
      tr: 'Sonuçları nasıl ölçüyorsunuz?',
      en: 'How do you measure results?',
    },
    answer: {
      tr: "Her engagement KPI baseline ile başlar. İlk haftada mevcut metrikleri (gelir, marj, çevrim süresi, NPS, OEE, vb.) ölçeriz ve bunlardan engagement\'in temel başarı göstergelerini birlikte seçeriz. 90 günlük retrospektif raporlarda bu KPI\'ların gelişimini şeffaf paylaşırız. Engagement\'lar tamamlandıktan 6 ay sonra anonim takip görüşmesi yaparız; bu sonuçlar (yine anonim) gelecekteki müşterilere referans olur.",
      en: 'Every engagement starts with a KPI baseline. In the first week we measure current metrics (revenue, margin, cycle time, NPS, OEE, etc.) and jointly select the engagement\'s success indicators. We share progress transparently in 90-day retrospective reports. Six months after an engagement closes we run an anonymous follow-up review; those results (still anonymized) inform future client conversations.',
    },
  },
  {
    id: 'sector-expertise',
    question: {
      tr: 'Sektörel uzmanlığınız var mı?',
      en: 'Do you specialize in specific sectors?',
    },
    answer: {
      tr: 'En derin pratiğimiz finansal hizmetler, üretim, teknoloji ve aile şirketi yapılarında. Bunun yanında perakende, profesyonel hizmetler ve sağlıkta engagement deneyimimiz var. Ancak biz sektör değil metodoloji firmasıyız — Vizyon Mimarı, Strateji Köprüsü ve Sonuç Mühendisliği yaklaşımlarımız her sektörde işliyor. Sektör bilgi açığı varsa, engagement öncesi araştırma fazı planlıyoruz.',
      en: 'Our deepest practice is in financial services, manufacturing, technology, and family-owned holdings. We also have engagement experience in retail, professional services, and healthcare. But we are a methodology firm, not a sector firm — our Vision Architecture, Strategy Bridge, and Result Engineering approaches work across industries. Where sector context is missing, we plan a research phase before the engagement starts.',
    },
  },
  {
    id: 'confidentiality',
    question: {
      tr: 'Anonim çalışıyor musunuz? Müşteri referansı veriyor musunuz?',
      en: 'Do you operate confidentially? Do you share client references?',
    },
    answer: {
      tr: "Standart engagement\'larda NDA imzalanır ve müşteri kimliği yazılı izin olmadan açıklanmaz. Vaka analizlerimiz anonim — sektör, ölçek, sonuç paylaşılır ama isim paylaşılmaz. Müşteri referansı isteyen potansiyel müşteriler için mevcut müşterilerle bire bir görüşme ayarlayabiliyoruz; bu kararı her zaman müşteri verir, bizim referans listemiz yoktur.",
      en: 'Standard engagements include an NDA; client identity is never disclosed without written consent. Our case studies are anonymized — we share sector, scale, and outcomes but not names. For prospects who request references, we can arrange one-on-one conversations with existing clients on a case-by-case basis; the decision always rests with the client. We do not maintain a public reference list.',
    },
  },
  {
    id: 'how-to-start',
    question: {
      tr: 'Başlangıç süreci nasıl işliyor?',
      en: 'What does the onboarding process look like?',
    },
    answer: {
      tr: 'Üç adım: (1) Discovery Call — 45 dakika ücretsiz keşif görüşmesi, ihtiyacı anlamak ve uyumu doğrulamak için. (2) Önerge — 5-7 gün içinde kapsam, süre, fiyat ve KPI\'ların yazılı önerisi. (3) Engagement — kontrat imzasından sonra kickoff haftası, baseline ölçümü ve haftalık ritmin başlatılması. /contact sayfasından veya hello@ecypro.com adresinden Discovery Call talep edebilirsiniz.',
      en: 'Three steps: (1) Discovery Call — a free 45-minute exploratory conversation to understand the need and confirm fit. (2) Proposal — within 5-7 days, a written scope, timeline, price, and KPI proposal. (3) Engagement — after contract signature, the kickoff week starts with baseline measurement and the establishment of weekly cadence. Request a Discovery Call via /contact or hello@ecypro.com.',
    },
  },
];

export const FaqPage: React.FC = () => {
  const { language: lang } = useTranslation();
  const l = (m: MultiLang) => getLang(m, lang);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: l(f.question),
      acceptedAnswer: {
        '@type': 'Answer',
        text: l(f.answer),
      },
    })),
  };

  return (
    <div className="min-h-screen bg-neutral">
      <SEO
        title={getLang(FAQ_COPY.title as MultiLang, lang)}
        description={getLang(FAQ_COPY.subtitle as MultiLang, lang)}
        canonical="/faq"
      />
      <JsonLd data={faqSchema} />
      <FadeIn>
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-20">
          <span className="inline-block text-xs font-bold tracking-[0.2em] text-secondary uppercase mb-6 border border-secondary/30 px-4 py-1.5 rounded-full bg-secondary/5">
            {lang === 'tr' ? 'Sıkça Sorulan Sorular' : 'Frequently Asked Questions'}
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
            {getLang(FAQ_COPY.title as MultiLang, lang)}
          </h1>
          <p className="text-lg text-slate-400 mb-12 max-w-2xl leading-relaxed">
            {getLang(FAQ_COPY.subtitle as MultiLang, lang)}
          </p>

          <div className="space-y-fib-4">
            {FAQS.map((faq) => (
              <details
                key={faq.id}
                className="group bg-white/5 border border-white/10 hover:border-white/20 rounded-xl p-fib-5 cursor-pointer transition-colors"
              >
                <summary className="font-semibold text-white flex justify-between items-start gap-4 list-none">
                  <span className="text-lg">{l(faq.question)}</span>
                  <span className="text-secondary text-sm flex-shrink-0 mt-1 transform group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <p className="mt-fib-4 text-slate-400 leading-relaxed">{l(faq.answer)}</p>
              </details>
            ))}
          </div>

          <div className="mt-fib-8 p-fib-6 border border-white/10 rounded-2xl bg-white/3 text-center">
            <h2 className="text-2xl font-serif font-bold text-white mb-fib-3">
              {lang === 'tr' ? 'Sorunuzun cevabı yok mu?' : "Didn't find your answer?"}
            </h2>
            <p className="text-slate-400 mb-fib-5 max-w-xl mx-auto">
              {lang === 'tr'
                ? 'Discovery Call ile 45 dakikalık ücretsiz bir keşif görüşmesi planlayabiliriz.'
                : 'We can schedule a free 45-minute Discovery Call to explore your needs.'}
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-xl bg-secondary px-fib-6 py-fib-3 font-semibold text-neutral hover:bg-secondary/90 transition-colors"
            >
              {lang === 'tr' ? 'İletişime Geçin' : 'Get in Touch'}
            </Link>
          </div>
        </div>
      </FadeIn>
    </div>
  );
};

export default FaqPage;
