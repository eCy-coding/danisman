#!/usr/bin/env bash
# commit_track_b_phase_4.sh — Track B Phase B4: Motion Library
# Worktree: .claude/worktrees/track-b-ui-redesign  branch: feat/track-b-ui-redesign
# Run from worktree root.
set -euo pipefail

WORKTREE="/Users/emrecnyngmail.com/Desktop/ecypro/.claude/worktrees/track-b-ui-redesign"
cd "$WORKTREE"

echo "=== Track B Phase B4 commit sequence ==="
echo "Branch: $(git branch --show-current)"
echo "Worktree: $WORKTREE"
echo ""

# ── BATCH 1: deps + motion library core ────────────────────────────────────────
echo "--- Batch 1: deps + motion library ---"
git add package.json package-lock.json
git add src/lib/motion/useReducedMotion.ts
git add src/lib/motion/gsap-config.ts
git add src/lib/motion/lenis-config.ts
git add src/lib/motion/get-card-context.ts
git add src/lib/motion/page-transition.tsx
git add src/lib/motion/useScrollReveal.ts
git add src/lib/motion/useParallax.ts
git add src/lib/motion/useMagneticCursor.ts
git add src/lib/motion/index.ts

git commit -m "feat(motion): add three-layer motion library (Lenis + GSAP + Motion v12)

- useReducedMotion: wraps motion/react hook, SSR-safe
- gsap-config: registerPlugin(ScrollTrigger), defaults, refresh/kill helpers
- lenis-config: singleton Lenis + RAF + ScrollTrigger bridge, scrollToTop
- get-card-context: cardHoverVariants (rest/hover/tap), getCardTransition (spring), CARD_STAGGER_CONFIG
- page-transition: AnimatePresence page fade + View Transitions API + scrollToTop on route
- useScrollReveal: GSAP ScrollTrigger stagger reveal, lazy GSAP import
- useParallax: GSAP scrub parallax, configurable speed
- useMagneticCursor: mousemove GSAP translate + elastic restore
- index: barrel export of all public symbols
- deps: gsap@3.15.0, lenis@1.3.23

All hooks skip animation when prefers-reduced-motion is set."

echo "Batch 1 done."
echo ""

# ── BATCH 2: tests + ADR-009 ───────────────────────────────────────────────────
echo "--- Batch 2: tests + ADR-009 ---"
git add src/lib/motion/motion.test.ts
git add docs/decisions/ADR-009-motion-architecture.md

git commit -m "test(motion): 18 unit tests for motion library

- useReducedMotion: SSR path + export shape
- gsap-config: all 5 exports, idempotent initGSAP
- lenis-config: 3 lifecycle tests (getLenis null, scrollToTop fallback, exports)
- get-card-context: cardHoverVariants scales, getCardTransition spring, CARD_STAGGER_CONFIG
- motion/index barrel: 9 symbol exports verified

docs(adr): complete ADR-009 motion architecture decision
- Three-layer diagram (Lenis L1, GSAP L2, Motion v12 L3)
- Reduced motion policy (3 patterns)
- Bundle budget table (+40KB gz lazy)
- Hook architecture table
- Card variant spec (scale 1.02 rationale)
- Alternatives considered
- Post-MVP improvements"

echo "Batch 2 done."
echo ""

# ── BATCH 3: prototype motion wiring ──────────────────────────────────────────
echo "--- Batch 3: prototype motion wiring ---"
git add src/prototype/home.tsx
git add src/prototype/services.tsx
git add src/prototype/case-studies.tsx
git add src/prototype/insights.tsx
git add src/prototype/about.tsx
git add src/prototype/founder.tsx
git add src/prototype/contact.tsx
git add src/prototype/discovery.tsx
git add src/prototype/pricing.tsx
git add src/prototype/service-detail.tsx
git add src/prototype/insight-detail.tsx
git add src/prototype/legal.tsx
git add src/prototype/error-pages.tsx

git commit -m "feat(prototype): wire motion library into all 13 prototype pages

- home: useScrollReveal on services cluster grid + card hover variants
- services: useScrollReveal on service grid + motion.article hover lift
- case-studies: hero motion.div fade-in + useScrollReveal on cases list
- insights: hero motion.div fade-in + useScrollReveal on article grid
- about/founder/contact/discovery/pricing/service-detail/insight-detail/legal/error-pages:
  ESLint fixes (role='list' removed, unused imports removed, href='#' → button)
- insight-detail: social share <a href='#'> → <button type='button'> (x4)
- home: ease tuple cast to [number,number,number,number] for Motion v12

All B4: stubs resolved. prefers-reduced-motion respected on all pages."

echo "Batch 3 done."
echo ""

# ── BATCH 4: commit script + report ───────────────────────────────────────────
echo "--- Batch 4: script + report ---"
git add scripts/commit_track_b_phase_4.sh

# Report will be added if it exists
if [ -f "archive/phase-reports/REPORT_TRACK_B_PHASE_B4.md" ]; then
  git add archive/phase-reports/REPORT_TRACK_B_PHASE_B4.md
fi

git commit -m "chore(track-b): Phase B4 commit script + completion report

scripts/commit_track_b_phase_4.sh: 4-batch commit sequence
archive/phase-reports/REPORT_TRACK_B_PHASE_B4.md: Layer C summary, test matrix, ADR-009 link"

echo "Batch 4 done."
echo ""

# ── PUSH ─────────────────────────────────────────────────────────────────────
echo "--- Push ---"
git push origin feat/track-b-ui-redesign

echo ""
echo "=== Track B Phase B4 COMPLETE ==="
git log --oneline -8
