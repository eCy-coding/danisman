# ADR-009 — Motion Architecture

**Status:** Accepted  
**Date:** 2026-05-27  
**Track:** B — Phase B4 (Motion Library)  
**Author:** Track B orchestrator  
**Supersedes:** ADR-009 stub (Phase B2)

---

## Context

eCyPro Premium Consulting UI targets "premium boutique advisory" feel. Before Phase B4, the codebase had:

- **Motion v12** (Framer Motion rebranded) — micro-interactions only
- **No smooth scroll** — native browser scroll (abrupt, commoditized)
- **No scroll choreography** — section reveals absent
- **13 prototype stubs** tagged `// B4:` waiting for motion wiring

Phase B1 research and Phase B3 design spec both identified a three-layer motion system as the differentiator between "clean SaaS" and "premium advisory." The stub ADR deferred the decision pending:
1. GSAP license evaluation ✅ (standard free tier sufficient — no Club-only features required)
2. Motion v12 vs GSAP hybrid benchmark ✅ (hybrid wins: GSAP for scroll, Motion for hover)
3. Lenis + React Router v7 integration test ✅ (startLenis/stopLenis pattern works)

---

## Decision

**Adopt a three-layer motion architecture.**

```
Layer 1 — Lenis (smooth scroll physics)
  └── wraps native scroll → physics inertia → perceived premium quality
  └── feeds ScrollTrigger.update() via lenis.on('scroll', ...)

Layer 2 — GSAP + ScrollTrigger (scroll choreography)
  └── section reveals (useScrollReveal)
  └── parallax depth (useParallax)
  └── magnetic hover effects (useMagneticCursor)
  └── lazy-loaded via dynamic import('./gsap-config')

Layer 3 — Motion v12 / Framer Motion (component animations)
  └── hover lift variants (cardHoverVariants)
  └── mount/unmount transitions (PageTransition, AnimatePresence)
  └── reduced-motion-aware (useReducedMotion())
```

---

## Implementation Files

| File | Layer | Purpose |
|------|-------|---------|
| `src/lib/motion/useReducedMotion.ts` | Cross-cutting | Reads `prefers-reduced-motion`; wraps Motion v12 hook; returns `true` on SSR |
| `src/lib/motion/gsap-config.ts` | L2 | One-time `registerPlugin(ScrollTrigger)`, `gsap.defaults`, export helpers |
| `src/lib/motion/lenis-config.ts` | L1 | Singleton Lenis + RAF loop + ScrollTrigger bridge |
| `src/lib/motion/get-card-context.ts` | L3 | `cardHoverVariants`, `getCardTransition`, `CARD_STAGGER_CONFIG` |
| `src/lib/motion/page-transition.tsx` | L3 | `PageTransition` component (AnimatePresence + View Transitions API) |
| `src/lib/motion/useScrollReveal.ts` | L2 | GSAP ScrollTrigger stagger reveal; lazy GSAP import |
| `src/lib/motion/useParallax.ts` | L2 | GSAP scrub parallax; `speed` prop 0–1 |
| `src/lib/motion/useMagneticCursor.ts` | L2 | Mouse-tracking GSAP translate; elastic restore |
| `src/lib/motion/index.ts` | Barrel | Re-exports all public symbols |

---

## Reduced Motion Policy

All animations check `useReducedMotion()` before running. Three patterns:

```typescript
// Pattern A — GSAP hooks: early return
const shouldReduce = useReducedMotion();
useEffect(() => {
  if (shouldReduce) return; // skip entirely
  import('./gsap-config').then(({ gsap }) => { ... });
}, [shouldReduce]);

// Pattern B — Motion v12 variants: conditional spread
const motionProps = shouldReduce
  ? {}
  : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
<motion.div {...motionProps} />

// Pattern C — PageTransition: render children directly
if (shouldReduce) return <>{children}</>;
return <AnimatePresence>...</AnimatePresence>;
```

Lenis is **not** started when `prefers-reduced-motion` is set (smooth scroll itself can cause vestibular discomfort).

---

## Bundle Size Budget

| Asset | Raw | Gzipped | Strategy |
|-------|-----|---------|----------|
| Motion v12 (already in bundle) | ~140KB | ~47KB | pre-existing |
| GSAP core | ~70KB | ~22KB | lazy import |
| GSAP ScrollTrigger | ~40KB | ~13KB | lazy import (same chunk as core) |
| Lenis | ~15KB | ~5KB | imported at root layout |
| **Total new B4 cost** | **+125KB** | **+~40KB** | |

GSAP is loaded only when a motion hook first mounts (dynamic `import('./gsap-config')`). Initial bundle impact: **0KB**. First scroll-reveal fires: **+35KB gzipped** (GSAP core + ScrollTrigger in one chunk).

---

## Hook Architecture

| Hook | Trigger | GSAP usage | Motion v12 usage |
|------|---------|-----------|-----------------|
| `useScrollReveal` | ScrollTrigger enter viewport | `gsap.timeline + stagger` | none |
| `useParallax` | ScrollTrigger scrub | `gsap.to + scrub` | none |
| `useMagneticCursor` | `mousemove` event | `gsap.to translate` | none |
| Card hover | User hover | none | `motion.div whileHover/whileTap` |
| `PageTransition` | Route change | none | `AnimatePresence + motion.div` |

**Rule:** GSAP handles scroll-driven animation. Motion v12 handles user-gesture animation. No mixing per component.

---

## Card Hover Variant Spec

```typescript
cardHoverVariants = {
  rest:  { scale: 1.00, y:  0, boxShadow: '0 4px 6px ...' },
  hover: { scale: 1.02, y: -4, boxShadow: '0 20px 25px ...' },   // 2% premium lift
  tap:   { scale: 0.99, y: -2, boxShadow: '0 10px 15px ...' },   // press feedback
}
```

`scale: 1.02` chosen per B1 research: sub-3% scale imperceptible on 4K, satisfying on Retina. Above 1.03 reads "game UI."

---

## Alternatives Considered

| Alternative | Rejected Because |
|------------|-----------------|
| Motion v12 scroll animations only | No scroll scrub, no stagger timeline. "Nice" not "premium." |
| GSAP only (no Motion v12) | More verbose for mount/unmount. AnimatePresence superior for page transitions. |
| CSS scroll-driven animations | Insufficient browser support (2026: ~78% global). No JS-driven stagger. |
| Locomotive Scroll | Heavier (~45KB gz), less React-idiomatic, ScrollTrigger integration weaker than Lenis. |
| react-spring | Spring physics only. No scroll choreography without additional library. |

---

## Consequences

**Positive:**
- Smooth scroll physics immediate perceived-quality lift
- Scroll-choreographed section reveals (B5 hero, B6 service grid)
- Hover interactions type-safe via Motion v12 variant system
- Full SSR safety (`typeof window === 'undefined'` guards in all hooks)
- `prefers-reduced-motion` respected at every layer

**Negative:**
- +40KB gzipped lazy bundle (first scroll interaction only)
- Two motion systems to maintain (GSAP + Motion v12); mitigated by strict layer separation
- GSAP cleanup discipline required (`ScrollTrigger.kill()` on unmount)

**Neutral:**
- `lenis` singleton; React context not used — `getLenis()` export for rare direct access

---

## Post-MVP Improvements

- [ ] Shared GSAP context (React context) to avoid repeated `import('./gsap-config')` per hook
- [ ] `useScrollReveal` `once: false` variant for looping reveals
- [ ] Lenis virtual scroll for modal overlay trap
- [ ] GSAP SplitText for hero headline character-by-character reveal (Club GreenSock)
- [ ] View Transitions API full adoption once browser support reaches 90%+

---

## References

- [Motion v12 docs](https://motion.dev)
- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [Lenis GitHub](https://github.com/darkroomengineering/lenis)
- `src/lib/motion/motion.test.ts` — 18 unit tests covering all exported symbols
- `brain/PUBLISH_MASTER_PLAN.md` — Phase B context
