/**
 * Motion library barrel export.
 *
 * Import from '@/lib/motion' for consistent tree-shaking.
 * Each hook lazy-imports GSAP — zero bundle cost until hook is used.
 */

// Core setup
export {
  initGSAP,
  refreshScrollTriggers,
  killScrollTriggers,
  gsap,
  ScrollTrigger,
} from './gsap-config';
export { startLenis, stopLenis, getLenis, scrollToTop } from './lenis-config';

// Hooks
export { useReducedMotion } from './useReducedMotion';
export { useScrollReveal } from './useScrollReveal';
export type { ScrollRevealOptions } from './useScrollReveal';
export { useParallax } from './useParallax';
export type { ParallaxOptions } from './useParallax';
export { useMagneticCursor } from './useMagneticCursor';
export type { MagneticCursorOptions } from './useMagneticCursor';

// Components
export { PageTransition, navigateWithTransition } from './page-transition';

// Card utilities
export {
  cardHoverVariants,
  getCardTransition,
  gsapCardEnter,
  gsapCardLeave,
  CARD_STAGGER_CONFIG,
} from './get-card-context';
