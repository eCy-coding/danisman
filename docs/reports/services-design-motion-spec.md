# Services Design & Motion Spec (P3 gate)

Doctrine: AI Studio Tech (CLAUDE.md A9) — solid opaque surfaces, no backdrop-blur
(verified 0 in scope), Inter/Playfair, golden type + Fibonacci spacing, motion
150–400 ms transform/opacity-only, `prefers-reduced-motion` everywhere.

## 1. Token inventory (verified in `index.css`)

- Spacing: `--spacing-fib-{1,2,3,5,8,13,21,34,55}` = 4/8/12/20/32/52/84/136/220 px
  (+ explicit utilities `.p-fib-*`, `.m-fib-*`, `.gap-fib-*`, `.rounded-fib-3`,
  incl. fib-4/6/9 utility classes used by `EmptyState`).
- Type: `--text-golden-{sm,base,lg,xl,2xl,3xl}` (φ scale, 16 px anchor).
- Color: `--color-brand-*` (warm slate), `--color-accent-*` (amber gold),
  `--color-neutral-*` (tokens.css).

## 2. Magic numbers in scope → replacement plan (target: 0 unjustified)

| File:line | Today | Plan |
|---|---|---|
| ServiceDetailLayout.tsx:279,285,781,787 | `min-h-[52px]` | `min-h-fib-13` (52 px exact token) |
| ServiceDetailLayout.tsx:169 | `min-h-[44px] min-w-[44px]` | keep — WCAG 2.5.8 touch-target constant (justified, comment added) |
| ServiceDetailLayout.tsx:131 | `duration-700` | `duration-300` (in-view reveal; opacity+translate only) |
| ServiceDetailLayout.tsx:157 | toast `duration-500` | `duration-300` (overlay band 240–360) |
| ServiceCard.tsx:31,60 | `duration-500` | `duration-300` |
| ServiceCard.tsx:35,40 | `duration-700` | `duration-400` (decorative underline/glow) |
| ServiceCard.tsx:35 | blob `-top-20 -right-20 w-40 h-40` | decorative geometry → `w-fib-34 h-fib-34` (136 px) offsets `-top-fib-21 -right-fib-21` |

Color-only `transition-colors duration-300` is allowed (no layout/paint storm);
movement strictly transform/opacity.

## 3. Motion budget table (every animation, with reduced-motion path)

| Element | Property | Timing | Reduced-motion |
|---|---|---|---|
| Mega menu open | opacity + translateY(-4px→0) | 200 ms ease-out, hover-intent delay 120 ms | instant show |
| Mega menu close | opacity | 240 ms | instant hide |
| Menu item hover | background-color | 150 ms | same (color ok) |
| Chip select | background/border color | 150 ms | same |
| ServiceCard hover lift | translateY(-2px) + shadow | 180 ms | none |
| ServiceCard 3D tilt | rotateX/rotateY ≤ 6°, perspective 800 px | pointer-driven (no duration), rAF-throttled, snap-back 200 ms | disabled (static) |
| Card underline sweep | scaleX 0→1 | 400 ms ease-out | none |
| Lifecycle stepper reveal | opacity + translateY(8px) stagger 60 ms/step | 300 ms/step | all visible static |
| Detail in-view reveals | opacity + translateY | 300 ms | visible static |
| Pillar illustration | GSAP timeline (strokes/float), transform/opacity only, loop ≤ 6 s gentle | intro 400 ms | static final frame (CSS `@media (prefers-reduced-motion)` + `gsap.matchMedia`) |
| Sticky section-nav highlight | color | 150 ms | same |
| CTA buttons | hover:scale(1.02)/active:scale(0.98) | 120–180 ms | color only |

INP target < 200 ms: tilt handler = passive pointermove + rAF write; search
debounce ≥ 150 ms; no animation on the search-results re-render path.

## 4. Component plan

- **ServiceCard v2** (scan-first): icon · dept tag · title · 2-line clamped
  description · lifecycle hint ("Adım 2/5") · arrow. Optional `tilt` prop
  (default on desktop pointer:fine only).
- **ServiceFilter v2**: chips from taxonomy registry (8 incl. HEPSİ),
  `aria-pressed`, result count via `aria-live="polite"`.
- **ServicesClusterSection v2**: department lifecycle stepper (numbered flow,
  ordered by `lifecycleStep`).
- **ServiceDetailLayout v2**: sticky in-page nav, lifecycle position indicator,
  related rail (same dept ≤ 3), founder-proof block, CTA variants
  (`cta-variants.ts`), JSON-LD Service.
- **ServiceIllustration v2**: per-pillar animated SVG scene (GSAP timeline from
  existing `gsap@3.15`), `aria-hidden`, static frame fallback.
- **MegaMenu v2**: APG Disclosure Navigation (button + `aria-expanded` +
  `aria-controls` region), opaque `bg-[#1E1F20]`-family surface, golden/fib
  spacing.

## 5. Dependency gate

3D = CSS `perspective` transforms + SVG + GSAP timelines ONLY.
**No three.js / @react-three/fiber** (absent from package.json — verified);
adding one requires a written justification + `React.lazy` + static fallback.
Existing motion deps: `gsap@^3.15.0`, `motion@^12.23.26` (division: GSAP =
illustration timelines; CSS = micro-interactions; `motion` not introduced into
services scope to keep one animation idiom per surface).
