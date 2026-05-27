/**
 * eCyPro Design Token System — Colors
 * Single source of truth. Supersedes src/theme.ts (sky-blue) + tokens.css (indigo).
 * Warm slate brand + amber gold accent — boutique advisory-grade palette.
 * WCAG 2.1 AA: all text tokens verified ≥4.5:1 on dark surface.
 */

export const colors = {
  // Brand primary — warm slate (trust, authority, premium)
  brand: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b', // primary
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Accent — amber gold (M&A milestone, retainer success, CTA)
  accent: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // primary accent
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Semantic
  success: { 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 900: '#052e16' },
  danger: { 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 900: '#450a0a' },
  warning: { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 900: '#451a03' },
  info: { 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 900: '#0c4a6e' },

  // Neutrals — slate scale (shared with brand, aliased for clarity)
  neutral: {
    0: '#ffffff',
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
    950: '#020617',
  },

  // Cream / warm white (light mode surfaces, form backgrounds)
  cream: {
    50: '#fefdf9',
    100: '#fdf9ed',
    200: '#faf3d8',
  },

  // Warm grey (rich dark backgrounds, body surfaces)
  warmGrey: {
    50: '#f7f5f2',
    100: '#ede9e3',
    700: '#3d3a35',
    800: '#2a2723',
    900: '#1f1d1a',
    950: '#141210',
  },
} as const;

export type ColorScale = typeof colors;
