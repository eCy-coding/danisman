/**
 * FAQSection — Sık Sorulan Sorular Accordionu
 * istek5.txt Phase 2: UI/UX + SEO — FAQ Schema / Conversion
 *
 * - 8 kritik soru (fiyat, süre, sonuç, garanti, yöntem...)
 * - Radix-stili accordion: tek veya çoklu açık
 * - Smooth height animation (motion/react layout)
 * - Schema.org FAQPage markup (SEO snippet'ı)
 * - Bölümde CTA: "Başka sorunuz mu var? → /contact"
 * - i18n (tr/en), A11y: aria-expanded, aria-controls
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../lib/i18n';

interface FAQItem {
  id: string;
  q: { tr: string; en: string };
  a: { tr: string; en: string };
}

const FAQS: FAQItem[] = [
  {
    id: 'f1',
    q: {
      tr: 'Danışmanlık süreci ne kadar sürer?',
      en: 'How long does the consulting process take?',
    },
    a: {
      tr: 'Projenin kapsamına bağlı olarak başlangıç değerlendirmesi 1–2 haftada tamamlanır. Tam dönüşüm programları genellikle 3–6 ay sürer. İlk keşif görüşmesinde size özel bir süre tahmini sunarız.',
      en: 'Depending on scope, the initial assessment takes 1–2 weeks. Full transformation programs typically span 3–6 months. We provide a custom timeline estimate in the first discovery call.',
    },
  },
  {
    id: 'f2',
    q: { tr: 'Hangi sektörlerde hizmet veriyorsunuz?', en: 'Which industries do you serve?' },
    a: {
      tr: 'Fintech, e-ticaret, SaaS, perakende, üretim, sağlık ve lojistik başta olmak üzere 12+ sektörde aktif portföyümüz bulunmaktadır. Sektörünüze özgü vaka çalışmalarımızı görmek için bize ulaşın.',
      en: 'We have active portfolios in 12+ sectors including fintech, e-commerce, SaaS, retail, manufacturing, healthcare, and logistics. Contact us to see case studies specific to your industry.',
    },
  },
  {
    id: 'f3',
    q: {
      tr: 'Yatırım getirisi (ROI) ne zaman görülür?',
      en: 'When will I see return on investment?',
    },
    a: {
      tr: "Müşterilerimizin %78'i ilk 90 günde ölçülebilir iyileşme raporluyor. Ortalama ROI, birinci yılda yatırımın 3–5 katı olarak gerçekleşiyor. Başlangıçta size özel ROI projeksiyonu hazırlıyoruz.",
      en: '78% of our clients report measurable improvement in the first 90 days. Average ROI is 3–5x investment in year one. We prepare a custom ROI projection at the start.',
    },
  },
  {
    id: 'f4',
    q: { tr: 'Uzaktan hizmet veriyor musunuz?', en: 'Do you offer remote services?' },
    a: {
      tr: "Evet, tüm hizmetlerimiz uzaktan sunulabilir. Türkiye, Avrupa ve Orta Doğu'da fiziksel ofis ziyaretleri de planlayabiliyoruz. Tercihlerinizi ilk görüşmede belirliyoruz.",
      en: 'Yes, all services can be delivered remotely. We can also arrange physical office visits in Turkey, Europe, and the Middle East. We define your preferences in the first session.',
    },
  },
  {
    id: 'f5',
    q: { tr: 'Paketler arasındaki fark nedir?', en: 'What is the difference between packages?' },
    a: {
      tr: 'Başlangıç paketi hızlı bir değerlendirme ve yol haritası sunar. Büyüme paketi haftalık uzman desteği ve OKR kurulumu içerir. Kurumsal paket sınırsız erişim, özel ekip ve özel entegrasyonları kapsar.',
      en: 'The Starter package offers a rapid assessment and roadmap. The Growth package includes weekly expert support and OKR setup. The Enterprise package covers unlimited access, dedicated team, and custom integrations.',
    },
  },
  {
    id: 'f6',
    q: { tr: 'Sonuçlar garanti ediliyor mu?', en: 'Are results guaranteed?' },
    a: {
      tr: "Her projenin başında ölçülebilir hedefler ve KPI'lar belirliyoruz. 90 gün sonunda belirlenen hedeflere ulaşılamaması durumunda ek destek ücretsiz sunulur. Taahhütlerimiz sözleşmeye yansıtılır.",
      en: "We define measurable goals and KPIs at the start of each project. If defined targets aren't met after 90 days, additional support is provided at no cost. Commitments are reflected in the contract.",
    },
  },
  {
    id: 'f7',
    q: { tr: 'Veri gizliliği nasıl sağlanıyor?', en: 'How is data privacy ensured?' },
    a: {
      tr: 'Tüm proje verileri KVKK ve GDPR kapsamında işlenir. Müşteri verileri şifreli sunucularda saklanır, üçüncü taraflarla paylaşılmaz. NDA (Gizlilik Sözleşmesi) proje başlangıcında imzalanır.',
      en: 'All project data is processed under KVKK and GDPR. Client data is stored on encrypted servers and not shared with third parties. An NDA is signed at project initiation.',
    },
  },
  {
    id: 'f8',
    q: { tr: 'İlk görüşme ücretsiz mi?', en: 'Is the first consultation free?' },
    a: {
      tr: 'Evet, 30 dakikalık ilk keşif görüşmesi tamamen ücretsiz ve taahhütsüzdür. Bu görüşmede işletmenizi tanıyoruz, hedeflerinizi dinliyoruz ve size uygun yaklaşımı belirliyoruz.',
      en: 'Yes, the 30-minute initial discovery session is completely free and non-committal. In this session, we get to know your business, listen to your goals, and determine the right approach for you.',
    },
  },
];

export const FAQSection: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string): void => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      className="py-20 sm:py-28 px-4 sm:px-6"
      aria-label={lang === 'tr' ? 'Sık sorulan sorular' : 'Frequently asked questions'}
      data-testid="faq-section"
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-3">
            {lang === 'tr' ? 'SSS' : 'FAQ'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-serif text-white">
            {lang === 'tr' ? 'Sık Sorulan Sorular' : 'Frequently Asked Questions'}
          </h2>
        </div>

        {/* Accordion */}
        <dl className="space-y-3">
          {FAQS.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                itemScope
                itemProp="mainEntity"
                itemType="https://schema.org/Question"
                className={`rounded-2xl border transition-colors ${
                  isOpen
                    ? 'border-secondary/20 bg-secondary/5'
                    : 'border-white/8 bg-white/3 hover:border-white/15'
                }`}
              >
                <dt>
                  <button
                    type="button"
                    onClick={() => toggle(faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                    id={`faq-btn-${faq.id}`}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-2xl"
                    itemProp="name"
                  >
                    <span
                      className={`text-sm sm:text-base font-medium ${isOpen ? 'text-white' : 'text-slate-200'}`}
                    >
                      {lang === 'tr' ? faq.q.tr : faq.q.en}
                    </span>
                    <span
                      className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                        isOpen
                          ? 'border-secondary/40 text-secondary bg-secondary/10'
                          : 'border-white/15 text-slate-500'
                      }`}
                      aria-hidden="true"
                    >
                      {isOpen ? <Minus size={12} /> : <Plus size={12} />}
                    </span>
                  </button>
                </dt>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.dd
                      id={`faq-answer-${faq.id}`}
                      role="region"
                      aria-labelledby={`faq-btn-${faq.id}`}
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                      itemScope
                      itemProp="acceptedAnswer"
                      itemType="https://schema.org/Answer"
                    >
                      <div className="px-5 pb-5 pt-1">
                        <p className="text-sm text-slate-400 leading-relaxed" itemProp="text">
                          {lang === 'tr' ? faq.a.tr : faq.a.en}
                        </p>
                      </div>
                    </motion.dd>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </dl>

        {/* CTA */}
        <div className="mt-10 text-center">
          <p className="text-sm text-slate-500 mb-4">
            {lang === 'tr' ? 'Başka sorunuz var mı?' : 'Have more questions?'}
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 text-secondary text-sm font-semibold hover:text-secondary/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            {lang === 'tr' ? 'Bize Sorun' : 'Ask Us Directly'}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
};
