/**
 * Ecypro Premium Consulting - Design System & Theme Tokens
 *
 * This file centralizes the design tokens (colors, typography, animations, breakpoints)
 * used across the frontend. These tokens correspond to the Tailwind configuration
 * and are used by Framer Motion and styled components.
 */

export const colors = {
  // Brand Colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Base Brand Color
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },
  // Accent/Secondary Colors (e.g., for call-to-actions, highlights)
  accent: {
    50: '#fdf4ff',
    100: '#fae8ff',
    500: '#d946ef', // Magenta-like accent
    600: '#c026d3',
    900: '#701a75',
  },
  // Neutrals (for backgrounds, text, and borders in Light/Dark mode)
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617', // Very dark for true dark mode backgrounds
  },
  // Semantic Colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    serif: ['Playfair Display', 'Georgia', 'serif'],
    mono: ['JetBrains Mono', 'Menlo', 'monospace'],
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

/**
 * Standard Framer Motion variants for consistent micro-animations.
 */
export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  // Standardized transition timings
  transition: {
    spring: { type: 'spring', stiffness: 300, damping: 30 },
    smooth: { type: 'tween', ease: 'easeInOut', duration: 0.3 },
  },
};

/**
 * Phase 102: AI Studio Tech surface tokens.
 * Replaces the previous `classes.glass` / `classes.glassDark` (glassmorphism
 * is forbidden by the design doctrine in CLAUDE.md). All four `surfaces`
 * variants are opaque, blur-free, and use a thin border + subtle shadow
 * for depth — matching the Linear / Vercel / M3 reference set.
 */
export const surfaces = {
  /** Page background — flat, no border, no shadow. */
  base: 'bg-surface',
  /** Card / panel — slightly raised on the surface stack. */
  flat: 'bg-surface border border-white/5',
  /** Default card — clear separation from the page background. */
  elevated: 'bg-surface-high border border-white/10 shadow-2xl',
  /** Modals + popovers — sits above everything else. */
  overlay: 'bg-neutral-950/95 border border-white/15 shadow-2xl',
};

/**
 * Common CSS classes for reuse.
 * Note: `classes.glass` / `glassDark` were removed in Phase 102 — use
 * `surfaces.elevated` / `surfaces.overlay` instead.
 */
export const classes = {
  cardHover: 'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
  focusRing:
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-neutral-900',
};

export const theme = {
  colors,
  typography,
  breakpoints,
  animations,
  classes,
  surfaces,
};

export default theme;
