/**
 * page-transition.tsx — View Transitions API + Motion v12 fallback.
 *
 * WHY: Smooth route-to-route transitions without janky full-page repaints.
 * View Transitions API is progressive enhancement — if not supported, falls back
 * to Motion v12 opacity transition.
 *
 * Usage:
 *   import { PageTransition } from '@/lib/motion/page-transition';
 *   // Wrap route outlet:
 *   <PageTransition key={location.pathname}>
 *     <Outlet />
 *   </PageTransition>
 */

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from './useReducedMotion';
import { scrollToTop } from './lenis-config';
import { refreshScrollTriggers } from './gsap-config';

interface PageTransitionProps {
  children: React.ReactNode;
  /** Key must change on route change (e.g. location.pathname) */
  pageKey?: string;
}

/** Fade+slide transition variants */
const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const PAGE_TRANSITION = {
  duration: 0.35,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

/**
 * Wraps route content with smooth page enter/exit animation.
 * Respects prefers-reduced-motion.
 */
export function PageTransition({ children, pageKey }: PageTransitionProps) {
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    // Scroll to top on route change + refresh GSAP triggers
    scrollToTop(true);
    refreshScrollTriggers();
  }, [pageKey]);

  if (shouldReduce) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={PAGE_VARIANTS}
        transition={PAGE_TRANSITION}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * View Transitions API wrapper.
 * Usage: wrap navigation calls with startViewTransition for native browser transitions.
 *
 * const navigate = useNavigate();
 * navigateWithTransition(navigate, '/services');
 */
// eslint-disable-next-line react-refresh/only-export-components
export function navigateWithTransition(navigateFn: (to: string) => void, to: string): void {
  if (typeof document !== 'undefined' && 'startViewTransition' in document) {
    (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(
      () => navigateFn(to),
    );
  } else {
    navigateFn(to);
  }
}
