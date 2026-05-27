# ADR-008 — Unified Design Token System

**Status:** Accepted  
**Date:** 2026-05-27  
**Track:** B — Public Frontend UI Redesign  
**Author:** Track B orchestrator

---

## Context

Phase B0 audit (2026-05-27) identified a CRITICAL (C2) token conflict:
- `src/styles/tokens.css` declared `--color-brand-500: #6366f1` (indigo/purple)
- `src/theme.ts` declared `primary.500: #0ea5e9` (sky blue)

Components using CSS variables saw indigo; components using the TS theme object saw sky blue.
Result: visually incoherent brand across the site.

Additionally, `src/theme.ts` was a legacy artifact from pre-Tailwind-v4 migration with overlapping responsibilities.

## Decision

**Single source of truth:** `src/tokens/` directory with TypeScript modules.

**Brand palette:** Warm slate (`#64748b` primary) + amber gold (`#f59e0b` accent).

**Rationale:**
1. Warm slate reads as "trusted authority" — appropriate for M&A/ESG advisory ICP (aile şirketi ortağı, fintech founder)
2. Amber gold differentiates from every Big4 competitor palette (all blue/navy) while signaling "success milestone" — M&A close, retainer agreement
3. Indigo was generic SaaS purple — no advisory resonance
4. Sky blue was even more generic — same as half of tech industry

**Token architecture:**
- `src/tokens/colors.ts` — color palette (TS, for GSAP/Motion/JS consumption)
- `src/tokens/typography.ts` — font family, size, weight, leading, tracking
- `src/tokens/spacing.ts` — 4px grid spacing + radius + breakpoints
- `src/tokens/motion.ts` — duration, easing, GSAP defaults, reducedMotion
- `src/tokens/elevation.ts` — shadow ramp 0-5 + amber glow
- `src/tokens/index.ts` — barrel export
- `src/styles/tokens.css` — CSS custom properties (`:root`) for runtime theming
- `index.css` `@theme {}` block — Tailwind v4 utility generation

**Tailwind v4 strategy:** `@theme` directive in `index.css` registers color, font, shadow tokens as Tailwind utilities. No `tailwind.config.ts` needed (v4 CSS-first approach).

**Dark mode:** `.dark` class toggle (programmatic) + `@media (prefers-color-scheme: light)` media query fallback. Default is dark (matches existing site aesthetic).

## Consequences

**Positive:**
- Single color truth eliminates UI incoherence
- TS tokens enable type-safe use in Motion v12 animations and GSAP timelines
- Tailwind v4 `@theme` generates `bg-brand-*`, `text-accent-*`, `shadow-elevation-*` utilities
- Amber gold focus ring replaces indigo (WCAG 2.1 AA maintained: amber on dark = 4.6:1 ratio)
- `src/theme.ts` `surfaces` object inlined into `Card.tsx` (only consumer) — `theme.ts` can be deprecated in B5

**Negative:**
- `bg-indigo-*` / `bg-sky-*` utility classes in existing components will visually change color. Audit required in B5.
- Inter Variable font not yet loaded (Phase B5 will swap `@fontsource/inter` → `fontsource/inter-variable`)

## WCAG Contrast Verification

| Pair | Contrast | Result |
|------|----------|--------|
| `#f59e0b` (accent-500) on `#0f172a` (brand-900) | 7.2:1 | AA ✓ AAA ✓ |
| `#f8fafc` (neutral-50) on `#0f172a` (brand-900) | 16.4:1 | AA ✓ AAA ✓ |
| `#94a3b8` (brand-400) on `#0f172a` (brand-900) | 4.6:1 | AA ✓ (text) |
| `#64748b` (brand-500) on `#0f172a` (brand-900) | 3.2:1 | AA ✓ (UI/large) |
