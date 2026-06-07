import React, { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CASE_STUDIES } from '../../constants';
import { FadeIn } from '../common/FadeIn';
import { useTranslation } from 'react-i18next';
import { MouseGlow } from '../ui/MouseGlow';
import { ResponsiveImage } from '../ui/ResponsiveImage';

const SUCCESS_STORIES_COPY = {
  badge: { tr: 'Başarı Hikayeleri', en: 'Success Stories' },
  title: { tr: 'Gerçekleşen Dönüşümler', en: 'Realized Transformations' },
  description: {
    tr: 'Müşterilerimizle birlikte elde ettiğimiz ölçülebilir başarılar ve büyüme hikayeleri.',
    en: 'Measurable successes and growth stories we achieved together with our clients.',
  },
  viewAll: { tr: 'Tümünü Gör', en: 'View All' },
  details: { tr: 'Detaylar', en: 'Details' },
};

export const SuccessStories: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';

  const targetRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-65%']);

  const scrollToIndex = useCallback((idx: number) => {
    const el = cardsRef.current[idx];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      el.focus({ preventScroll: true });
    }
  }, []);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => {
      const next = Math.max(0, i - 1);
      scrollToIndex(next);
      return next;
    });
  }, [scrollToIndex]);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => {
      const next = Math.min(CASE_STUDIES.length - 1, i + 1);
      scrollToIndex(next);
      return next;
    });
  }, [scrollToIndex]);

  // S14 R8 — keyboard carousel control. Wired to the prev/next buttons below
  // (focusable native <button>), satisfies WCAG 2.1.1 without putting keydown
  // on the non-interactive <section> wrapper (lint flagged).
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    },
    [goNext, goPrev],
  );

  if (!CASE_STUDIES || CASE_STUDIES.length === 0) {
    return null;
  }

  return (
    // S14 R8 — semantic <section> + native ARIA: aria-label gives region semantics.
    // Section-level onKeyDown removed (lint correctly flags non-interactive element
    // event listeners). Keyboard nav lives on inner prev/next buttons which are
    // already focusable (button[type='button']) — that satisfies WCAG 2.1.1.
    // R5-F intent (ArrowLeft/ArrowRight carousel scroll) preserved by binding the
    // handler to the focusable carousel buttons themselves below.
    <section
      className="bg-neutral relative"
      ref={targetRef}
      aria-label={lang === 'tr' ? 'Başarı hikayeleri karuseli' : 'Success stories carousel'}
    >
      {/* Desktop Horizontal Scroll Container (Sticky) */}
      <div className="hidden lg:block h-[300vh] relative">
        <div className="sticky top-0 h-screen flex items-center overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(30,58,138,0.1),transparent_50%)] pointer-events-none" />

          <div className="absolute left-12 xl:left-24 top-1/2 -translate-y-1/2 z-10 w-1/4 pr-8">
            <span className="text-secondary font-bold uppercase tracking-widest text-xs mb-4 block">
              {SUCCESS_STORIES_COPY.badge[lang]}
            </span>
            <h2 className="text-h2-d font-sans font-light text-white mb-6 tracking-tight">
              {SUCCESS_STORIES_COPY.title[lang]}
            </h2>
            <p className="text-slate-400 font-light text-lg mb-8 leading-relaxed">
              {SUCCESS_STORIES_COPY.description[lang]}
            </p>
            <Link
              to="/case-studies"
              className="text-secondary font-bold hover:text-white transition-colors uppercase tracking-widest text-xs border-b border-slate-700 pb-1 hover:border-white"
            >
              {SUCCESS_STORIES_COPY.viewAll[lang]}
            </Link>
          </div>

          {/* Keyboard / SR navigation controls (overlay, visible for sighted keyboard users) */}
          {/* S14 R8 — onKeyDown bound to focusable buttons (interactive). When */}
          {/* a button has focus, ArrowLeft/Right also drive prev/next (carousel UX). */}
          <button
            type="button"
            onClick={goPrev}
            onKeyDown={handleKeyDown}
            disabled={currentIndex === 0}
            aria-label={lang === 'tr' ? 'Önceki vaka çalışması' : 'Previous case study'}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={goNext}
            onKeyDown={handleKeyDown}
            disabled={currentIndex === CASE_STUDIES.length - 1}
            aria-label={lang === 'tr' ? 'Sonraki vaka çalışması' : 'Next case study'}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>

          <motion.div
            style={{ x }}
            className="flex gap-10 pl-[35vw] xl:pl-[30vw] pr-24 h-[600px] items-center"
          >
            {CASE_STUDIES.map((study, index) => (
              <Link
                to={`/case-studies/${study.slug}`}
                key={study.id}
                ref={(el) => {
                  cardsRef.current[index] = el;
                }}
                className="w-[500px] xl:w-[600px] h-[500px] block outline-none group shrink-0"
              >
                <article className="relative bg-white/5 rounded-3xl overflow-hidden h-full border border-white/10 shadow-2xl hover:border-secondary/30 transition-all duration-500 flex flex-col group">
                  <MouseGlow />
                  {/* Image */}
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={study.image}
                      alt=""
                      aria-hidden="true"
                      width={1200}
                      height={800}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-neutral/60 group-hover:bg-neutral/30 transition-colors duration-500"></div>
                    <div className="absolute top-6 left-6">
                      <span className="bg-white/10 border border-white/20 text-white px-4 py-1.5 rounded-full text-xs font-medium tracking-wide">
                        {study.sector[lang]}
                      </span>
                    </div>
                  </div>

                  <div className="p-8 flex flex-col flex-grow bg-transparent relative z-10">
                    <div className="text-4xl font-sans font-light text-white mb-2 group-hover:text-secondary transition-colors duration-300">
                      {study.result[lang]}
                    </div>
                    <h3 className="text-xl font-medium text-slate-200 mb-2">{study.client}</h3>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                      {study.category[lang]}
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6 font-light line-clamp-2">
                      {study.description[lang]}
                    </p>
                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center">
                      <span className="text-xs font-medium text-white uppercase tracking-wider group-hover:text-secondary transition-colors duration-300">
                        {SUCCESS_STORIES_COPY.details[lang]}
                      </span>
                      <span className="ml-2 text-secondary group-hover:translate-x-2 transition-transform duration-300">
                        →
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Mobile/Tablet Fallback Layout (Standard Grid) */}
      <div className="block lg:hidden py-24 px-6 md:px-12 relative border-t border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(30,58,138,0.1),transparent_50%)] pointer-events-none" />
        <div className="mb-16 relative z-10">
          <span className="text-secondary font-bold uppercase tracking-widest text-xs mb-4 block">
            {SUCCESS_STORIES_COPY.badge[lang]}
          </span>
          <h2 className="text-h2-m font-sans font-light text-white mb-4 tracking-tight">
            {SUCCESS_STORIES_COPY.title[lang]}
          </h2>
          <p className="text-slate-400 font-light text-lg mb-8">
            {SUCCESS_STORIES_COPY.description[lang]}
          </p>
          <Link
            to="/case-studies"
            className="text-secondary font-bold hover:text-white transition-colors uppercase tracking-widest text-xs border-b border-slate-700 pb-1 hover:border-white"
          >
            {SUCCESS_STORIES_COPY.viewAll[lang]}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          {CASE_STUDIES.map((study, idx) => (
            <FadeIn key={study.id} delay={idx * 150} className="h-full">
              <Link to={`/case-studies/${study.slug}`} className="block h-full outline-none group">
                <article className="relative bg-white/5 rounded-3xl overflow-hidden h-full border border-white/10 flex flex-col">
                  <div className="relative h-48 overflow-hidden">
                    {/* P15 — width/height CLS=0; loading=lazy below-fold gallery için. */}
                    <ResponsiveImage
                      src={study.image}
                      alt=""
                      aria-hidden="true"
                      width={640}
                      height={384}
                      loading="lazy"
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-neutral/60 group-hover:bg-neutral/30 transition-colors duration-500"></div>
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-xs font-medium tracking-wide">
                        {study.sector[lang]}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="text-3xl font-sans font-light text-white mb-2 group-hover:text-secondary transition-colors">
                      {study.result[lang]}
                    </div>
                    <h3 className="text-lg font-medium text-slate-200 mb-2">{study.client}</h3>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                      {study.category[lang]}
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6 font-light line-clamp-3">
                      {study.description[lang]}
                    </p>
                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center">
                      <span className="text-xs font-medium text-white uppercase tracking-wider group-hover:text-secondary">
                        {SUCCESS_STORIES_COPY.details[lang]}
                      </span>
                      <span className="ml-2 text-secondary">→</span>
                    </div>
                  </div>
                </article>
              </Link>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
