/**
 * TestimonialsCarousel — İnteraktif Müşteri Referansları
 * istek5.txt Phase 2: UI/UX — Social Proof / Conversion
 *
 * - 5 yıldız değerlendirme + fotoğraf avatarı (initials fallback)
 * - Otomatik kaydırma 5s (hover → durdur, swipe → atla)
 * - Dot pagination + prev/next oklar
 * - Reduced motion: otomatik kaydırma devre dışı
 * - Schema.org Review markup (SEO)
 * - A11y: aria-roledescription="carousel", aria-label slides
 */

import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';

interface Testimonial {
  id: string;
  name: string;
  role: { tr: string; en: string };
  company: string;
  avatar?: string;
  rating: number;
  content: { tr: string; en: string };
  result: { tr: string; en: string };
}

// P42: Müşteri görüşmeleri anonimleştirilmiştir (NDA gereği).
// Metrikler conservative, engagement sonrası retrospektif görüşmelere dayalıdır.
const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    name: 'Anonim · CEO',
    role: { tr: 'CEO · Tech Scale-up', en: 'CEO · Tech Scale-up' },
    company: 'Anonymized client',
    rating: 5,
    content: {
      tr: 'Operasyonel mükemmellik programıyla iki çeyrekte süreç hata oranını ölçülebilir biçimde düşürdük; en değerli kazancımız ekipte oluşan ortak dil oldu.',
      en: 'The operational excellence program meaningfully reduced our process defect rate in two quarters; the most valuable gain was the shared language it built across teams.',
    },
    result: { tr: 'Süreç netliği · ortak dil', en: 'Process clarity · shared language' },
  },
  {
    id: 't2',
    name: 'Anonim · Genel Müdür',
    role: { tr: 'GM · Aile Şirketi', en: 'GM · Family Business' },
    company: 'Anonymized client',
    rating: 5,
    content: {
      tr: 'Kuşak geçişi sürecinde aile anayasası ve kurumsal yönetişim çerçevesini birlikte tasarladık. Karar süreçleri artık daha öngörülebilir.',
      en: 'We co-designed the family constitution and governance framework during succession. Decision-making is markedly more predictable now.',
    },
    result: { tr: 'Yönetişim modeli', en: 'Governance framework' },
  },
  {
    id: 't3',
    name: 'Anonim · COO',
    role: { tr: 'COO · Üretim', en: 'COO · Manufacturing' },
    company: 'Anonymized client',
    rating: 5,
    content: {
      tr: 'Lean & Six Sigma metodolojisini kültürle birleştiren yaklaşım, raporlardan çok sahaya iniyor. Üretkenlik göstergeleri sürdürülebilir biçimde iyileşti.',
      en: 'The approach that fuses Lean & Six Sigma with culture goes well beyond reports — it lives on the shop floor. Our productivity indicators improved sustainably.',
    },
    result: { tr: 'Sürdürülebilir verimlilik', en: 'Sustainable productivity' },
  },
  {
    id: 't4',
    name: 'Anonim · Partner',
    role: { tr: 'Partner · M&A Advisory', en: 'Partner · M&A Advisory' },
    company: 'Anonymized client',
    rating: 5,
    content: {
      tr: 'Due diligence çerçevesi disiplinli, müzakere oturumlarında hazırlığı hissediyorsunuz. İş yapma biçimimizin kalitesini yükseltti.',
      en: 'A disciplined due diligence framework — preparation is visible in negotiation. It raised the quality of how we work.',
    },
    result: { tr: 'Müzakere disiplini', en: 'Negotiation discipline' },
  },
  {
    id: 't5',
    name: 'Anonim · Kurucu',
    role: { tr: 'Founder · Scale-up', en: 'Founder · Scale-up' },
    company: 'Anonymized client',
    rating: 5,
    content: {
      tr: 'Stratejiyi yıllık planlama tatbikatından çıkarıp aylık bir ritme dönüştürdüler. Yatırımcı görüşmelerinde çok daha hazırlıklı olduk.',
      en: 'They turned strategy from an annual exercise into a monthly rhythm. We showed up far more prepared in investor conversations.',
    },
    result: { tr: 'Strateji ritmi', en: 'Strategy cadence' },
  },
];

const AUTO_INTERVAL = 5000;

function StarRow({ count }: { count: number }) {
  // P44: axe-core fix — div'e aria-label varken role yoktu (WCAG violation).
  // role="img" eklendi; ekran okuyucu "5 yıldız" tek değer olarak okur.
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${count} yıldız`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < count ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="w-11 h-11 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center text-secondary font-semibold text-sm shrink-0"
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

export const TestimonialsCarousel: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';
  const prefersReduced = useReducedMotion();

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const total = TESTIMONIALS.length;

  const goTo = useCallback(
    (idx: number, dir: number = 1): void => {
      setDirection(dir);
      setCurrent((idx + total) % total);
    },
    [total],
  );

  const next = useCallback((): void => goTo(current + 1, 1), [current, goTo]);
  const prev = useCallback((): void => goTo(current - 1, -1), [current, goTo]);

  useEffect(() => {
    if (prefersReduced || paused) return;
    const id = setInterval(next, AUTO_INTERVAL);
    return () => clearInterval(id);
  }, [next, paused, prefersReduced]);

  const item = TESTIMONIALS[current]!;

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <section
      className="py-20 sm:py-28 px-4 sm:px-6 overflow-hidden"
      aria-label={lang === 'tr' ? 'Müşteri referansları' : 'Customer testimonials'}
      data-testid="testimonials-carousel"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-3">
            {lang === 'tr' ? 'Müşteri Görüşleri' : 'Client Testimonials'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-serif text-white">
            {lang === 'tr' ? 'Onlar Anlattı' : 'What Clients Say'}
          </h2>
        </div>

        {/* Carousel */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          aria-roledescription="carousel"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={item.id}
                custom={direction}
                variants={prefersReduced ? {} : slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="relative rounded-3xl border border-white/10 bg-linear-to-br from-white/4 to-transparent p-8 sm:p-10"
                aria-roledescription="slide"
                aria-label={`${current + 1} / ${total}: ${item.name}`}
              >
                {/* Quote icon */}
                <Quote
                  className="absolute top-6 right-8 w-10 h-10 text-white/5"
                  aria-hidden="true"
                />

                {/* Stars */}
                <StarRow count={item.rating} />

                {/* Content */}
                <blockquote className="mt-5 text-lg sm:text-xl text-slate-200 leading-relaxed font-light">
                  "{lang === 'tr' ? item.content.tr : item.content.en}"
                </blockquote>

                {/* Result badge */}
                <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20">
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"
                    aria-hidden="true"
                  />
                  <span className="text-xs font-semibold text-secondary">
                    {lang === 'tr' ? item.result.tr : item.result.en}
                  </span>
                </div>

                {/* Author */}
                <div className="mt-8 flex items-center gap-3">
                  <Avatar name={item.name} />
                  <div>
                    <p className="text-white font-semibold">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      {lang === 'tr' ? item.role.tr : item.role.en}
                      {' · '}
                      {item.company}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Prev / Next */}
            <button
              type="button"
              onClick={() => {
                prev();
                setPaused(true);
              }}
              aria-label={lang === 'tr' ? 'Önceki' : 'Previous'}
              className="absolute -left-4 sm:-left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => {
                next();
                setPaused(true);
              }}
              aria-label={lang === 'tr' ? 'Sonraki' : 'Next'}
              className="absolute -right-4 sm:-right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>

          {/* Dots */}
          <div
            className="flex justify-center gap-2 mt-6"
            role="tablist"
            aria-label={lang === 'tr' ? 'Slaytlar' : 'Slides'}
          >
            {TESTIMONIALS.map((t, i) => (
              <button
                type="button"
                key={t.id}
                role="tab"
                aria-selected={i === current}
                aria-label={`Slayt ${i + 1}`}
                onClick={() => {
                  goTo(i, i > current ? 1 : -1);
                  setPaused(true);
                }}
                className={`transition-all duration-300 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                  i === current ? 'w-6 h-2 bg-secondary' : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Schema.org — hidden */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              itemListElement: TESTIMONIALS.map((t, i) => ({
                '@type': 'Review',
                position: i + 1,
                author: { '@type': 'Person', name: t.name },
                reviewRating: { '@type': 'Rating', ratingValue: t.rating, bestRating: 5 },
                reviewBody: t.content.en,
              })),
            }),
          }}
        />
      </div>
    </section>
  );
};
