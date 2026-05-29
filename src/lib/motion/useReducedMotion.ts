/**
 * useReducedMotion — prefers-reduced-motion aware hook.
 *
 * WHY: Centralised so every prototype + component uses same source of truth.
 * Falls back to `true` (no motion) when window is undefined (SSR).
 * Motion v12 also exports this; we wrap it to allow per-app overrides.
 */

import { useReducedMotion as _useReducedMotion } from 'motion/react';

/**
 * Returns `true` if the user prefers reduced motion OR if called during SSR.
 * Pass to animation configs: `shouldReduce ? {} : fadeUp`
 */
export function useReducedMotion(): boolean {
  // motion/react hook returns null when SSR; treat as reduce=true
  const prefersReduce = _useReducedMotion();
  if (typeof window === 'undefined') return true;
  return prefersReduce ?? false;
}
