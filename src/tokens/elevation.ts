/**
 * eCyPro Design Token System — Elevation / Shadow Ramp
 * 0-5 levels + inner. Dark-mode tuned (higher opacity for visibility).
 */

export const elevation = {
  0: 'none',
  1: '0 1px 2px 0 rgb(0 0 0 / 0.5)', // subtle lift
  2: '0 1px 3px 0 rgb(0 0 0 / 0.5), 0 1px 2px -1px rgb(0 0 0 / 0.4)', // card
  3: '0 4px 6px -1px rgb(0 0 0 / 0.45), 0 2px 4px -2px rgb(0 0 0 / 0.4)', // dropdown
  4: '0 10px 15px -3px rgb(0 0 0 / 0.45), 0 4px 6px -4px rgb(0 0 0 / 0.4)', // modal
  5: '0 20px 25px -5px rgb(0 0 0 / 0.45), 0 8px 10px -6px rgb(0 0 0 / 0.4)', // dialog
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.4)',

  // Brand glow — amber accent (replaces old indigo glow)
  glowSm: '0 0 15px rgb(245 158 11 / 0.2)',
  glowMd: '0 0 30px rgb(245 158 11 / 0.3)',
  glowLg: '0 0 60px rgb(245 158 11 / 0.35)',
} as const;

export type ElevationTokens = typeof elevation;
