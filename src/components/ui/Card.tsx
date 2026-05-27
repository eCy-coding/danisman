import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

const surfaces = {
  base: 'bg-surface',
  flat: 'bg-surface border border-white/5',
  elevated: 'bg-surface-high border border-white/10 shadow-2xl',
  overlay: 'bg-neutral-950/95 border border-white/15 shadow-2xl',
} as const;

export type CardVariant = 'flat' | 'elevated' | 'overlay';

export interface CardProps extends HTMLMotionProps<'div'> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /**
   * Phase 102: opaque surface variant (no glassmorphism /).
   * Defaults to `elevated` to match the previous glass-on visual weight.
   */
  variant?: CardVariant;
  /**
   * @deprecated Phase 102 — use `variant` instead.
   * `glass={true}` (legacy default) maps to `variant="elevated"`.
   * `glass={false}` maps to `variant="flat"`.
   */
  glass?: boolean;
  interactive?: boolean;
}

const PADDINGS = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8 lg:p-10',
} as const;

function resolveVariant(variant: CardVariant | undefined, glass: boolean | undefined): CardVariant {
  if (variant) return variant;
  if (glass === false) return 'flat';
  return 'elevated';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { className = '', padding = 'md', variant, glass, interactive = false, children, ...props },
    ref,
  ) => {
    const resolved = resolveVariant(variant, glass);
    const surface = surfaces[resolved];
    const base = 'rounded-2xl transition-all duration-300';

    return (
      <motion.div
        ref={ref}
        className={`${base} ${surface} ${PADDINGS[padding]} ${className}`}
        whileHover={interactive ? { y: -5, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' } : {}}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`flex flex-col space-y-1.5 ${className || ''}`} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  // Heading content is provided by call sites via `children` (passed through
  // {...props}); jsx-a11y can't statically prove it for a forwardRef wrapper.
  // eslint-disable-next-line jsx-a11y/heading-has-content
  <h3
    ref={ref}
    className={`font-semibold leading-none tracking-tight ${className || ''}`}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`pt-0 ${className || ''}`} {...props} />
  ),
);
CardContent.displayName = 'CardContent';
