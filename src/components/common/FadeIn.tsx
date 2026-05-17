import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useInView } from 'motion/react';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
  once?: boolean;
  scale?: boolean;
  /**
   * P31-T02: LCP optimization — skip opacity:0 → 1 animation for above-fold
   * LCP candidates. Renders children inside a plain <div> with no motion,
   * letting Lighthouse register LCP at initial paint instead of after the
   * variant transition completes. Use on hero <p>/<h1> blocks above the fold.
   */
  immediate?: boolean;
}

const directionOffsets = {
  up: { y: 24 },
  down: { y: -24 },
  left: { x: 24 },
  right: { x: -24 },
  none: {},
};

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 0.6,
  direction = 'up',
  className = '',
  once = true,
  scale = false,
  immediate = false,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: '-10% 0px -10% 0px' });

  // P31-T02: above-fold LCP candidates render plain (no opacity:0 initial state).
  // Framer Motion's variant scheduling otherwise defers LCP until the
  // "visible" state lands, costing ~1100ms element render delay on mobile.
  if (prefersReducedMotion || immediate) {
    return <div className={className}>{children}</div>;
  }

  const offset = directionOffsets[direction];

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        ...offset,
        ...(scale ? { scale: 0.95 } : {}),
      }}
      animate={isInView ? {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
      } : {}}
      transition={{
        duration,
        delay: delay / 1000, // Convert ms to seconds for framer-motion
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
      }}
    >
      {children}
    </motion.div>
  );
};

// ─── Stagger Children Container ──────────────────────────

interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const StaggerContainer: React.FC<StaggerProps> = ({
  children,
  className = '',
  staggerDelay = 0.1,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-5% 0px -5% 0px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
      },
    }}
  >
    {children}
  </motion.div>
);

// ─── Floating Animation (for cards, badges) ──────────────

interface FloatingProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  amplitude?: number;
}

export const FloatingElement: React.FC<FloatingProps> = ({
  children,
  className = '',
  delay = 0,
  amplitude = 8,
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{
        y: [-amplitude, amplitude, -amplitude],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: delay / 1000,
      }}
    >
      {children}
    </motion.div>
  );
};

// ─── Pulse Glow (for badges, indicators) ─────────────────

export const PulseGlow: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <motion.div
    className={className}
    animate={{
      boxShadow: [
        '0 0 0 0 rgba(37, 99, 235, 0)',
        '0 0 0 8px rgba(37, 99, 235, 0.15)',
        '0 0 0 0 rgba(37, 99, 235, 0)',
      ],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  >
    {children}
  </motion.div>
);
