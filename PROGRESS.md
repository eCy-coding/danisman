# PROGRESS — Perspektifler rebuild decision log

Spec: `~/Desktop/istek.md` v2 · Plan: approved 2026-06-11 · Branch: `claude/cranky-bassi-9bd8b1`

## Gate-0 (in progress)
**Done:** premise validation (3 false premises in v1 corrected — see istek.md v2 §CHANGELOG); istek.md v2 written; SCOPE.md + allowlist + scope_guard.py hook created; OUT_OF_SCOPE.md seeded.
**Decisions:** Option B architecture (evolve live /blog, harvest+delete mock prototype); zero-dep Turkish-folded search; benchmark phase replaced by encoded consensus; CSS-only motion (no WebGL).
**Next:** tasks JSON · CLAUDE.md contract section · content inventory CSV · baseline runs (typecheck/unit/e2e smoke).

**Blocked (owner action needed):** wiring `scope_guard.py` into `.claude/settings.json` was denied by the permission classifier (agent may not modify its own permission machinery). The hook script is tested (block=2/allow=0). Owner can activate by adding to `.claude/settings.json`:

```json
"hooks": {
  "PreToolUse": [
    {
      "matcher": "Edit|Write|MultiEdit|NotebookEdit",
      "hooks": [{ "type": "command", "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/scope_guard.py\"" }]
    }
  ]
}
```
Until then the fence is enforced procedurally (SCOPE.md discipline).

## Gate-1 (2026-06-11)
**Done:** `src/lib/slugify.ts` (TR fold) · `src/data/taxonomy.ts` (10 categories, 46/60 vocab, 108-tag + 28-category merge maps) · generator rewritten (fail-on-unmapped, emits search-index.json, read_time 200wpm, featured≤4) · 49 MDX frontmatter migrated (13 synthesized from body meta, dates from git history) · case studies unified (categorySlug+format) · `scripts/check-taxonomy.ts` PASS.
**Evidence:** brain/perspektifler/gate1-check-taxonomy.txt · baselines: brain/perspektifler/gate0-baseline-e2e.txt (prerender 149/149, sanity 6/6).
**Premise note:** vitest "2 failed | 1132 passed" pre-exists on clean tree (canonical hreflang tr-prefix expectation + IMG_NO_ALT static rule) — not a regression; revisit in Gate-6 a11y sweep if in-scope.
**Decisions:** excerpt 140–160 enforced as WARN not FAIL (49 legacy excerpts; editorial pass later) · featured = 4 newest across distinct categories.

## Gate-2 (2026-06-11)
**Done:** BUG-02 (icon box conditional) · BUG-01 (open-intent 220ms, close on route change/outside/scroll>100px/ESC; backdrop) · BUG-03/04 (panel insights-only: Kategoriler 8+live counts, Formatlar+counts, Öne Çıkanlar 3, promo, hub footer; SEKTÖRLER+HAKKIMIZDA removed) · keyboard path (focus-open + aria-controls) · mobile children realigned.
**Evidence:** e2e/menu.spec.ts 36/36 (3 browsers) → brain/perspektifler/gate2-menu-spec.txt + after-screenshots (panel-open, closed-case-studies).
**Found during debugging (real product issues, logged):** (1) UrgencyBanner late-mount shifts navbar → hover-cancel UX glitch; (2) ExitIntentModal top-20px trigger swallows first nav hover with z-60 backdrop — both feed Phase-6 float governance. 
**Test-isolation decisions:** exit_intent_shown seeded; layout-stability wait; locale-agnostic assertions (firefox boots EN); webkit Tab semantics handled.
