/**
 * get-card-context.ts — Card hover lift orchestration utilities.
 *
 * WHY: Consistent premium card hover across all 21 service cards, case study cards,
 * and insight cards. One source = one feel.
 *
 * Usage (Motion v12):
 *   import { cardHoverVariants, getCardTransition } from '@/lib/motion/get-card-context';
 *   <motion.div variants={cardHoverVariants} whileHover="hover" whileTap="tap" transition={getCardTransition()}>
 */

/** Card animation variants for Motion v12 `variants` prop */
export const cardHoverVariants = {
  rest: {
    scale: 1.0,
    y: 0,
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.2)',
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.3)',
  },
  tap: {
    scale: 0.99,
    y: -2,
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.2)',
  },
};

/** Transition for card hover. Prefers-reduced-motion check is caller responsibility. */
export function getCardTransition(variant: 'default' | 'subtle' | 'strong' = 'default') {
  const configs = {
    default: { type: 'spring', stiffness: 300, damping: 20, mass: 0.8 },
    subtle: { type: 'spring', stiffness: 200, damping: 25, mass: 1 },
    strong: { type: 'spring', stiffness: 400, damping: 15, mass: 0.6 },
  } as const;
  return configs[variant];
}

/**
 * GSAP-based card hover handler.
 * Use when Motion v12 is not available or for complex stagger orchestration.
 *
 * Usage:
 *   import { gsap } from '@/lib/motion/gsap-config';
 *   el.addEventListener('mouseenter', () => gsapCardEnter(el));
 *   el.addEventListener('mouseleave', () => gsapCardLeave(el));
 */
export function gsapCardEnter(el: HTMLElement): void {
  // Lazy import to avoid bundling GSAP when card-context is used standalone
  import('./gsap-config').then(({ gsap }) => {
    gsap.to(el, {
      scale: 1.02,
      y: -4,
      duration: 0.25,
      ease: 'power2.out',
    });
  });
}

export function gsapCardLeave(el: HTMLElement): void {
  import('./gsap-config').then(({ gsap }) => {
    gsap.to(el, {
      scale: 1.0,
      y: 0,
      duration: 0.2,
      ease: 'power2.inOut',
    });
  });
}

/** Stagger config for service grid card entrance (8-item grid, 4-col) */
export const CARD_STAGGER_CONFIG = {
  stagger: 0.06,
  duration: 0.5,
  ease: 'power2.out',
  y: 24,
  opacity: 0,
};
