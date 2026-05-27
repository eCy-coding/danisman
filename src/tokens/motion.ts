/**
 * eCyPro Design Token System — Motion
 * GSAP-aware + Motion v12 compatible.
 * Respects prefers-reduced-motion at the token level.
 */

export const motion = {
  duration: {
    instant: '50ms',
    fast: '150ms',
    base: '300ms',
    slow: '500ms',
    deliberate: '800ms',
  },

  // CSS cubic-bezier strings (use in Tailwind + CSS transitions)
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)', // Material standard
    enter: 'cubic-bezier(0, 0, 0.2, 1)', // ease-out — elements entering
    exit: 'cubic-bezier(0.4, 0, 1, 1)', // ease-in — elements leaving
    emphasized: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // overshoot/spring
    linear: 'linear',
  },

  // GSAP defaults (seconds, not ms — GSAP convention)
  gsap: {
    defaults: { duration: 0.6, ease: 'power2.out' },
    hover: { duration: 0.25, ease: 'power2.out' },
    reveal: { duration: 0.7, ease: 'power3.out' },
    stagger: { amount: 0.4, from: 'start' as const },
    pageEnter: { duration: 0.8, ease: 'power3.out' },
    pageExit: { duration: 0.35, ease: 'power2.in' },
    scrollTrigger: {
      start: 'top 85%',
      end: 'top 20%',
      scrub: false,
    },
  },

  // Motion v12 (Framer Motion) variants helpers
  framer: {
    fadeUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.5, ease: [0, 0, 0.2, 1] },
    },
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.4, ease: [0, 0, 0.2, 1] },
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] },
    },
  },

  // prefers-reduced-motion overrides — pass to GSAP matchMedia
  reducedMotion: {
    duration: { all: '0.01ms' },
    gsapDefaults: { duration: 0.001, ease: 'none' },
  },
} as const;

export type MotionTokens = typeof motion;
