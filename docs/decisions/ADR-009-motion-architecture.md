# ADR-009 — Motion Architecture (Stub)

**Status:** Draft  
**Date:** 2026-05-27  
**Track:** B — Phase B4 (Motion + GSAP Architecture)  
**Author:** Track B orchestrator

---

## Context

Current motion stack: Motion v12 (Framer Motion rebranded). No GSAP. No Lenis smooth scroll.

Phase B1 research identified that Lenis + GSAP ScrollTrigger are the key differentiators for "premium feel" in boutique advisory UI:
- Lenis: physics-based smooth scroll inertia (5 lines of code, massive perceived quality jump)
- GSAP ScrollTrigger: scroll-choreographed section reveals, parallax, stagger sequences
- Motion v12: component-level animations (hover, mount/unmount, micro-interactions)

## Decision (Deferred to Phase B4)

This ADR is a **stub**. Full decision will be formalized in Phase B4 after:
1. Evaluating GSAP license (Club GreenSock vs standard — needed for premium easing functions)
2. Benchmarking Motion v12 alone vs Motion v12 + GSAP hybrid
3. Testing Lenis integration with React Router v7 navigation events

## Preliminary Direction

**Three-layer approach:**
1. **Lenis** — smooth scroll physics (layout effect in root layout)
2. **GSAP + ScrollTrigger** — scroll-triggered sequences (section reveals, hero parallax, service card stagger)
3. **Motion v12** — component-level (hover lift, mount animations, page transitions)

`src/tokens/motion.ts` already defines GSAP defaults. B4 will implement:
- `lib/motion/gsap-config.ts` — GSAP register + ScrollTrigger + reducedMotion matchMedia
- `lib/motion/lenis-config.ts` — Lenis instance + React Router integration
- `lib/motion/hooks.ts` — `useScrollReveal`, `useParallax`, `useMagneticCursor`
- `lib/motion/page-transition.tsx` — View Transitions API + Motion fallback

## Consequences

**Positive:** Premium scroll feel, sophisticated scroll choreography, type-safe motion tokens
**Negative:** +~50KB bundle (GSAP core + ScrollTrigger). Mitigated by code splitting.
**Reduced motion:** `prefers-reduced-motion` handled at token level (`motion.reducedMotion`) and enforced in GSAP matchMedia.
