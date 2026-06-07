import React, { useState, useRef, useEffect } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  Variants,
} from 'motion/react';
import {
  ArrowRight,
  TrendingUp,
  Users,
  BarChart3,
  Code2,
  Cpu,
  Clock3,
  Handshake,
  Clock,
  Globe,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useScrollToSection } from '../common/useScrollToSection';
import { trackEvent } from '../../lib/analytics';
import { getCalendlyCta } from '../../lib/cta/calendly';
import { useTranslation } from 'react-i18next';
import { FloatingElement } from '../common/FadeIn';
import { MouseGlow } from '../ui/MouseGlow';
import { MagneticButton } from '../ui/MagneticButton';
import { Spotlight } from '../ui/spotlight';
import { TextReveal } from '../ui/TextReveal';
import { useFeatureValue } from '@growthbook/growthbook-react';

// Persona content
const PERSONA_CONTENT = {
  executive: {
    badge: { tr: 'Premium Consulting · eCyPro', en: 'Premium Consulting · eCyPro' },
    title: {
      line1: { tr: 'Vizyon. Strateji.', en: 'Vision. Strategy.' },
      highlight: { tr: 'Sürdürülebilir', en: 'Sustainable' },
      line2: { tr: 'Sonuç.', en: 'Outcomes.' },
    },
    description: {
      tr: "Türkiye'nin Big4-alternatif boutique danışmanlık firması. Organizasyonel dönüşüm, stratejik danışmanlık ve kültür mühendisliği ile lider organizasyonların yanındayız.",
      en: "Turkey's Big4-alternative boutique advisory firm. We partner with leading organizations on organizational transformation, strategic advisory, and culture engineering.",
    },
    stats: [
      {
        icon: <TrendingUp size={20} />,
        value: '5+',
        label: { tr: 'Yıl Deneyim', en: 'Years of Practice' },
      },
      {
        icon: <Users size={20} />,
        value: '120+',
        label: { tr: 'Stratejik Karar', en: 'Strategic Decisions' },
      },
      {
        icon: <BarChart3 size={20} />,
        value: 'TR · AB',
        label: { tr: 'Pazar Erişimi', en: 'Market Reach' },
      },
    ],
  },
  developer: {
    badge: { tr: 'Operasyonel Mükemmellik', en: 'Operational Excellence' },
    title: {
      line1: { tr: 'Daha Net Süreç,', en: 'Cleaner Process,' },
      highlight: { tr: 'Daha Güçlü', en: 'Stronger' },
      line2: { tr: 'Operasyon.', en: 'Operations.' },
    },
    description: {
      tr: 'Lean & Six Sigma metodolojisi, veri odaklı süreç mühendisliği ve kültürel disiplin ile sürdürülebilir operasyonel iyileşme.',
      en: 'Lean & Six Sigma methodology, data-driven process engineering, and cultural discipline for sustainable operational improvement.',
    },
    stats: [
      { icon: <Code2 size={20} />, value: '12+', label: { tr: 'Sektör', en: 'Sectors' } },
      {
        icon: <Clock3 size={20} />,
        value: '95%',
        label: { tr: 'Memnuniyet*', en: 'Satisfaction*' },
      },
      {
        icon: <Cpu size={20} />,
        value: '6 ay',
        label: { tr: 'Ort. Engagement', en: 'Avg. Engagement' },
      },
    ],
  },
};
// * Müşteri görüşmelerine dayalı, bağımsız doğrulamaya açık gösterge.

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

// P28-T01: LCP optimization — removed `filter: blur(8px)` from initial state.
// Lighthouse's LCP detector excludes elements with active CSS filters from
// "largest paint" candidacy until the filter clears. With blur on hidden
// state, LCP fired ~800ms late on mobile (after Framer Motion JS loaded,
// hydrated, and ran the animation). Plain opacity + y-translate preserves
// the reveal aesthetic while letting LCP register at first paint of the <p>.
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

const scaleInVariants: Variants = {
  hidden: { scale: 0.9, rotateX: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    rotateX: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

const DataFlowBackground = () => {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-40" aria-hidden="true">
      <svg
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        className="absolute inset-0"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0" />
            <stop offset="50%" stopColor="#2563EB" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="flow-gradient-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Network Lines */}
        <path
          d="M 0 200 Q 300 100 600 300 T 1200 200 T 1800 400"
          fill="none"
          stroke="url(#flow-gradient)"
          strokeWidth="1"
          strokeDasharray="5 5"
        />
        <path
          d="M 0 600 Q 400 800 800 500 T 1500 700 T 2000 500"
          fill="none"
          stroke="url(#flow-gradient-2)"
          strokeWidth="1"
          strokeDasharray="5 5"
        />
        <path
          d="M 300 0 L 600 300 L 800 500 L 1200 200"
          fill="none"
          stroke="url(#flow-gradient)"
          strokeWidth="0.5"
          opacity="0.5"
        />

        {/* Animated Particles along paths */}
        <motion.circle
          r="3"
          fill="#38BDF8"
          filter="url(#glow)"
          initial={{ cx: 0, cy: 200 }}
          animate={{
            cx: [0, 300, 600, 900, 1200, 1500, 1800],
            cy: [200, 150, 300, 250, 200, 300, 400],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />
        <motion.circle
          r="3"
          fill="#2563EB"
          filter="url(#glow)"
          initial={{ cx: 0, cy: 600 }}
          animate={{
            cx: [0, 400, 800, 1150, 1500, 2000],
            cy: [600, 700, 500, 600, 700, 500],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear', delay: 2 }}
        />
      </svg>
      {/* Node Points */}
      <div className="absolute top-50 left-0 w-2 h-2 rounded-full bg-primary/50 shadow-[0_0_10px_#2563EB]" />
      <div className="absolute top-75 left-150 w-3 h-3 rounded-full bg-secondary/80 shadow-[0_0_15px_#38BDF8] animate-pulse" />
      <div className="absolute top-50 left-300 w-2 h-2 rounded-full bg-primary/50 shadow-[0_0_10px_#2563EB]" />
      <div className="absolute top-125 left-200 w-4 h-4 rounded-full bg-blue-400/80 shadow-[0_0_20px_#60A5FA] animate-pulse" />
    </div>
  );
};

// Audience toggle (Executive / Developer) is a UX experiment, not finalized
// product surface. In production builds it's off by default — opt in with
// `VITE_DEV_AUDIENCE_TOGGLE=1` for staging or A/B test windows.
const AUDIENCE_TOGGLE_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_DEV_AUDIENCE_TOGGLE === '1';

export const Hero: React.FC = () => {
  const scrollToSection = useScrollToSection();
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';
  const prefersReducedMotion = useReducedMotion();
  const [persona, setPersona] = useState<'executive' | 'developer'>('executive');
  // S14 R2.1 — Founder ribbon img src state gate (re-render-safe).
  // Önceki pattern `(e.currentTarget).src = fallback` DOM mutation idi: React her
  // re-render'da src="/founder.jpg" üzerine yazıp 30+ fetch döngüsü tetikliyordu
  // (canlı production: ecypro.com network 30× founder-fallback.svg 200 OK). useState
  // ile gate edilince single-fetch garanti + re-render-safe.
  const [founderSrc, setFounderSrc] = useState<string>('/founder.jpg');

  // Mobile LCP: the decorative background (MouseGlow pointer tracking, Spotlight,
  // and DataFlowBackground's infinite animated SVG with glow filters) ran at mount
  // and starved the main thread, delaying the LCP <p> paint. Defer it to idle so
  // the hero text hydrates first; skip it entirely under reduced-motion.
  const [bgReady, setBgReady] = useState(false);
  useEffect(() => {
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const id = ric(() => setBgReady(true));
    return () => cancel(id as number);
  }, []);

  // A/B test: hero-cta-variant — 'book' (default) | 'explore'
  const ctaVariant = useFeatureValue<string>('hero-cta-variant', 'book');
  const primaryCtaLabel =
    ctaVariant === 'explore'
      ? lang === 'tr'
        ? 'Hizmetleri Keşfet'
        : 'Explore Services'
      : lang === 'tr'
        ? 'Tanışma Toplantısı Planla'
        : 'Book a Discovery Call';

  // For Scroll Triggered Feature Reveals
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const featureY = useTransform(scrollYProgress, [0, 0.5], [100, 0]);
  const featureOpacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);

  const handleCtaClick = (
    e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    href: string,
    label: string,
  ) => {
    trackEvent('Hero', 'Click', label);
    scrollToSection(e, href);
  };

  const currentContent = PERSONA_CONTENT[persona];
  const MotionOrDiv = prefersReducedMotion ? 'div' : motion.div;

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative min-h-[140vh] bg-[#050810] pt-28 pb-32"
    >
      {/* Sticky Hero Container to keep it visible while scrolling the background */}
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        {/* Background Architecture */}
        <div className="absolute inset-0 z-0">
          {bgReady && !prefersReducedMotion && (
            <>
              <MouseGlow color="rgba(37, 99, 235, 0.15)" size={1000} />
              <Spotlight fill="rgba(37, 99, 235, 0.08)" />
            </>
          )}

          <div
            className="absolute inset-0 opacity-[0.1]"
            style={{
              backgroundImage: `linear-gradient(to right, #1e3a8a 1px, transparent 1px), linear-gradient(to bottom, #1e3a8a 1px, transparent 1px)`,
              backgroundSize: '4rem 4rem',
              maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, #000 30%, transparent 100%)',
            }}
          />

          {bgReady && !prefersReducedMotion && <DataFlowBackground />}

          <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#050810]/60 to-[#050810] pointer-events-none" />
        </div>

        {/* Persona Switcher — env-gated, off in production by default. */}
        {AUDIENCE_TOGGLE_ENABLED && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 z-30 flex items-center bg-white/5 border border-white/10 rounded-full p-1 shadow-2xl">
            <button
              type="button"
              onClick={() => setPersona('executive')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${persona === 'executive' ? 'bg-primary text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-slate-400 hover:text-white'}`}
            >
              Executive
            </button>
            <button
              type="button"
              onClick={() => setPersona('developer')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${persona === 'developer' ? 'bg-secondary text-neutral shadow-[0_0_20px_rgba(56,189,248,0.4)]' : 'text-slate-400 hover:text-white'}`}
            >
              Developer
            </button>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center mt-8">
          {/* Left Content */}
          <MotionOrDiv
            key={persona} // Force re-animation on persona change
            {...(!prefersReducedMotion
              ? { variants: containerVariants, initial: 'hidden', animate: 'visible' }
              : {})}
            className="col-span-1 lg:col-span-7 flex flex-col justify-center"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/5 mb-8 w-fit"
            >
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-80" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary" />
              </span>
              <span className="text-xs font-bold tracking-[0.25em] text-blue-100 uppercase font-sans">
                {currentContent.badge[lang]}
              </span>
            </motion.div>

            <h1 className="font-serif-display text-5xl md:text-6xl lg:text-[5.5rem] font-bold text-white leading-[1.05] mb-8 tracking-tight">
              <span className="block overflow-hidden pb-1 drop-shadow-sm">
                <TextReveal immediate delay={0.05} text={currentContent.title.line1[lang]} />
              </span>
              <span className="block overflow-hidden pb-2">
                {/* S14 R2.2 — .shimmer class kaldırıldı. CSS specificity nedeniyle
                    .shimmer'ın background-image: linear-gradient(transparent → white sweep)
                    Tailwind brand gradient'ini (bg-linear-to-r from-blue-400 via-primary to-secondary)
                    eziyordu. Sonuç: text-transparent + bg-clip-text + transparent shimmer = "Sürdürülebilir"
                    INVISIBLE production'da. Brand gradient saf hali zaten premium görsel veriyor;
                    shimmer animation isteniyorsa ::after pseudo-element'le mix-blend-mode overlay olarak
                    eklenmeli. */}
                <span className="bg-linear-to-r from-blue-400 via-primary to-secondary bg-clip-text text-transparent inline-block">
                  <TextReveal immediate delay={0.15} text={currentContent.title.highlight[lang]} />
                </span>
              </span>
              <span className="block overflow-hidden pt-1 drop-shadow-sm">
                <TextReveal immediate delay={0.25} text={currentContent.title.line2[lang]} />
              </span>
            </h1>

            {/*
              P31-T01: LCP optimization — this <p> is the LCP element on /
              (Lighthouse mobile run). Previously wrapped in motion.p with
              variants={itemVariants} which starts at `opacity: 0`. Per LCP
              spec, opacity:0 elements are NOT paint candidates, so LCP
              fires only after Framer Motion runs the "visible" transition
              (~1100ms element render delay on mobile, simulated ~5250ms).
              Rendering as a plain <p> with opacity:1 lets LCP register at
              first paint of the hydrated React tree (~300-400ms).
              Badge/h1/buttons still animate; only the LCP <p> is plain.
            */}
            <p className="text-lg md:text-xl text-slate-300/90 leading-relaxed max-w-2xl mb-12 font-light border-l-4 border-secondary/50 pl-6 bg-white/2 py-2 rounded-r-lg min-h-20">
              {currentContent.description[lang]}
            </p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-5 items-center"
            >
              {(() => {
                // CTA variant 'explore' keeps the legacy scroll-to-contact;
                // default 'book' variant routes to the Calendly funnel.
                const isBookVariant = ctaVariant !== 'explore';
                const cta = getCalendlyCta('hero-primary', {
                  'data-variant': ctaVariant ?? 'book',
                });
                return (
                  <MagneticButton strength={40}>
                    <a
                      href={isBookVariant ? cta.href : '#contact'}
                      target={isBookVariant ? cta.target : undefined}
                      rel={isBookVariant ? cta.rel : undefined}
                      data-testid="hero-cta-primary"
                      {...(isBookVariant ? cta.dataAttrs : {})}
                      onClick={
                        isBookVariant
                          ? () => trackEvent('Hero', 'Click', 'Hero Primary Discovery')
                          : (e) => handleCtaClick(e, '#contact', 'Hero Primary')
                      }
                      className="group relative px-8 py-4 bg-secondary hover:bg-amber-400 text-neutral font-bold uppercase tracking-widest rounded-xl shadow-[0_0_40px_rgba(250,204,21,0.3)] hover:shadow-[0_0_60px_rgba(250,204,21,0.5)] transition-all duration-300 flex items-center justify-center gap-3 min-w-50 w-full sm:w-auto overflow-hidden border border-secondary/20"
                    >
                      <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                      <span className="relative z-10">{primaryCtaLabel}</span>
                      <ArrowRight
                        size={18}
                        className="relative z-10 group-hover:translate-x-1 transition-transform"
                      />
                    </a>
                  </MagneticButton>
                );
              })()}

              <MagneticButton strength={20}>
                <Link
                  to="/services"
                  data-testid="hero-cta-secondary"
                  onClick={() => trackEvent('Hero', 'Click', 'Hero Services')}
                  className="group px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-sm font-bold uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-3 min-w-50 w-full sm:w-auto"
                >
                  {lang === 'tr' ? 'Hizmetlerimizi İncele' : 'Explore Our Services'}
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                    aria-hidden="true"
                  />
                </Link>
              </MagneticButton>
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400"
            >
              <Link
                to="/quick-check"
                data-testid="hero-cta-quick-check"
                data-cta="quick-check"
                data-track="cta-click"
                data-cta-source="hero"
                onClick={() => trackEvent('Hero', 'Click', 'Hero Quick-Check')}
                className="inline-flex items-center gap-2 text-secondary hover:text-white transition-colors font-semibold"
              >
                {lang === 'tr'
                  ? 'KVKK Risk Skorunuzu Öğrenin — 5 dk'
                  : 'See your KVKK risk score — 5 min'}
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
              <Link
                to="/pricing-calculator"
                data-testid="hero-cta-pricing-calc"
                data-cta="pricing-calc"
                data-track="cta-click"
                data-cta-source="hero"
                onClick={() => trackEvent('Hero', 'Click', 'Hero Pricing Calc')}
                className="inline-flex items-center gap-2 hover:text-secondary transition-colors"
              >
                {lang === 'tr' ? 'Hangi paket size uygun?' : 'Which package fits?'}
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </motion.div>
            {/* Fix 4: Founder ribbon */}
            <motion.div
              variants={itemVariants}
              className="mt-8 flex items-center gap-3 text-sm text-slate-400"
            >
              <img
                src={founderSrc}
                alt="Emre Can Yalçın — eCyPro Kurucu Ortak, Stratejik Danışman"
                width={40}
                height={40}
                loading="lazy"
                decoding="async"
                className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                onError={() => setFounderSrc('/brand/founder-fallback.svg')}
              />
              <span className="leading-snug">
                {lang === 'tr' ? (
                  <>
                    Founder{' '}
                    <a
                      href="https://linkedin.com/in/emrecanyalcin"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary hover:text-white transition-colors font-semibold"
                    >
                      Emre Can Yalçın
                    </a>{' '}
                    doğrudan size eşlik eder — 48 saat içinde NDA, junior delegasyon yok.
                  </>
                ) : (
                  <>
                    Founder{' '}
                    <a
                      href="https://linkedin.com/in/emrecanyalcin"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary hover:text-white transition-colors font-semibold"
                    >
                      Emre Can Yalçın
                    </a>{' '}
                    works directly with you — NDA within 48 hours, no junior delegation.
                  </>
                )}
              </span>
            </motion.div>
          </MotionOrDiv>

          {/* Right Content - Stats Widgets */}
          <motion.div
            key={`${persona}-stats`}
            className="col-span-1 lg:col-span-5 hidden lg:flex relative h-full min-h-150 w-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="relative w-full h-full">
              {currentContent.stats.map((stat, i) => (
                <StatCard
                  key={i}
                  icon={stat.icon}
                  value={stat.value}
                  label={stat.label[lang]}
                  delay={0.2 + i * 0.3}
                  className={`absolute z-${30 - i * 10} ${i === 0 ? 'top-[15%] right-[10%]' : i === 1 ? 'top-[45%] left-[-10%]' : 'bottom-[15%] right-[5%]'}`}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400 opacity-50"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-xs tracking-[0.2em] uppercase font-bold">Scroll</span>
          <div className="w-px h-12 bg-linear-to-b from-slate-500 to-transparent" />
        </motion.div>
      </div>

      {/* Scroll Triggered Feature Reveals (Scroll into view as user scrolls down from Hero) */}
      <motion.div
        style={{ y: featureY, opacity: featureOpacity }}
        className="relative z-20 max-w-7xl mx-auto px-6 md:px-12 mt-[10vh] grid grid-cols-1 md:grid-cols-3 gap-8 pb-32"
      >
        {[
          {
            icon: <Handshake size={24} />,
            title: { tr: 'Partner-Led', en: 'Partner-Led' },
            desc: {
              tr: 'Junior delegasyon yok. Founder Emre Can Yalçın size doğrudan eşlik eder.',
              en: 'No junior delegation. Founder Emre Can Yalçın works directly with you.',
            },
          },
          {
            icon: <Clock size={24} />,
            title: { tr: '48 Saat Hız', en: '48-Hour Speed' },
            desc: {
              tr: 'NDA imzasından sahaya inişe 48 saat. WhatsApp ile her an erişim.',
              en: 'From NDA to deployment in 48 hours. WhatsApp access at any time.',
            },
          },
          {
            icon: <Globe size={24} />,
            title: { tr: 'Türkiye-AB Köprüsü', en: 'Turkey-EU Bridge' },
            desc: {
              tr: 'İki regülasyon hemisferinde uzmanız: KVKK + GDPR + CSRD.',
              en: 'Expertise across two regulatory hemispheres: KVKK + GDPR + CSRD.',
            },
          },
        ].map((feature, i) => (
          <div
            key={i}
            className="bg-[#0A0F1C]/80 border border-white/5 p-8 rounded-2xl shadow-2xl hover:border-primary/30 transition-colors duration-500 group"
          >
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
              {feature.icon}
            </div>
            <h2 className="text-xl font-bold text-white mb-3 tracking-tight">
              {feature.title[lang]}
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">{feature.desc[lang]}</p>
          </div>
        ))}
      </motion.div>
    </section>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  value: string;
  label: string;
  delay?: number;
  className?: string;
}> = ({ icon, value, label, delay = 0, className = '' }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['15deg', '-15deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-15deg', '15deg']);

  return (
    <FloatingElement delay={delay} amplitude={8} className={className}>
      <motion.div
        variants={scaleInVariants}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          x.set((e.clientX - rect.left) / rect.width - 0.5);
          y.set((e.clientY - rect.top) / rect.height - 0.5);
        }}
        onMouseLeave={() => {
          x.set(0);
          y.set(0);
        }}
        className="bg-[#0A0F1C]/70 border border-white/5 rounded-2xl p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] flex flex-col gap-4 min-w-60 cursor-default hover:border-primary/40 hover:bg-[#0A0F1C]/90 transition-colors duration-500 relative group overflow-hidden"
      >
        <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div
          className="flex items-center justify-between"
          style={{ transform: 'translateZ(20px)' }}
        >
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:text-white group-hover:bg-primary transition-all duration-300 shadow-inner">
            {icon}
          </div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '45%' }}
            transition={{ duration: 1.5, delay: delay + 0.5, ease: 'easeInOut' }}
            className="h-1.5 bg-linear-to-r from-primary/80 to-secondary/80 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"
          />
        </div>
        <div style={{ transform: 'translateZ(30px)' }}>
          <span className="block text-4xl font-extrabold text-white tracking-tight drop-shadow-md group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-linear-to-r group-hover:from-white group-hover:to-slate-300 transition-all duration-300">
            {value}
          </span>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2 block">
            {label}
          </span>
        </div>
      </motion.div>
    </FloatingElement>
  );
};
